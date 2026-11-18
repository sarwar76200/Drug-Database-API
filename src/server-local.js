
import "dotenv/config";
import express from "express";
import cors from "cors";
import { parse } from "csv-parse/sync";
import fs from "fs/promises";
import path from "path";
import { marked } from "marked";


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --------------------------------------------------
// Load data
// --------------------------------------------------

const dataPath = path.join(process.cwd(), "data", "drugs.csv");

let drugs = [];

const loadDrugs = async () => {
    const ext = dataPath.split('.').pop().toLowerCase();
    if (ext === "csv") {
        await loadDrugsCSV()
        return
    }
    try {
        const data = await fs.readFile(dataPath, "utf-8");
        drugs = JSON.parse(data);

        console.log(`Loaded ${drugs.length} drugs`);
    } catch (error) {
        console.error("Failed to load drugs.json:", error.message);
        process.exit(1);
    }
};

const loadDrugsCSV = async () => {
    try {
        const data = await fs.readFile(dataPath, "utf-8");


        drugs = parse(data, {
            columns: true,
            skip_empty_lines: true,
            cast: (value, context) => {
                if (context.column === "unit_price") {
                    return Number(parseFloat(value).toFixed(2));
                }

                return value;
            }
        });

        console.log(`Loaded ${drugs.length} drugs`);
    } catch (error) {
        console.error("Failed to load drugs.csv:", error.message);
        process.exit(1);
    }
};

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const getPagination = (query) => {
    const page = Math.max(parseInt(query.page) || 1, 1);

    const limit = Math.min(
        Math.max(parseInt(query.limit) || 20, 1),
        100
    );

    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip
    };
};

const getPaginationMetadata = (page, limit, total) => {
    const totalPages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_previous_page: page > 1
    };
};

const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// --------------------------------------------------
// API documentation
// --------------------------------------------------

app.get("/", async (req, res) => {
    try {
        const filePath = path.join(
            process.cwd(),
            "drug_api_reference.md"
        );

        const markdown = await fs.readFile(filePath, "utf-8");
        const html = marked.parse(markdown);

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">

                <title>Drug API Documentation</title>

                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 1000px;
                        margin: 40px auto;
                        padding: 0 24px;
                        line-height: 1.6;
                        color: #24292f;
                    }

                    pre {
                        background: #f6f8fa;
                        padding: 16px;
                        border-radius: 8px;
                        overflow-x: auto;
                    }

                    code {
                        font-family: Consolas, monospace;
                    }

                    :not(pre) > code {
                        background: #f0f0f0;
                        padding: 3px 6px;
                        border-radius: 4px;
                    }

                    table {
                        border-collapse: collapse;
                        width: 100%;
                    }

                    th,
                    td {
                        border: 1px solid #ddd;
                        padding: 10px;
                        text-align: left;
                    }

                    th {
                        background: #f6f8fa;
                    }
                </style>
            </head>

            <body>
                ${html}
            </body>
            </html>
        `);
    } catch (error) {
        console.error(error);

        res.status(500).send(
            "Unable to load API documentation"
        );
    }
});

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        services: {
            api: "healthy",
            data: "loaded"
        }
    });
});

// --------------------------------------------------
// GET all drugs
// --------------------------------------------------

app.get("/api/drugs", (req, res) => {
    const { page, limit, skip } = getPagination(req.query);

    const total = drugs.length;

    const data = drugs.slice(skip, skip + limit);

    res.json({
        data,
        pagination: getPaginationMetadata(
            page,
            limit,
            total
        )
    });
});

// --------------------------------------------------
// Search drugs by brand name
// --------------------------------------------------

app.get("/api/drugs/search", (req, res) => {
    const { brand_name } = req.query;

    if (!brand_name) {
        return res.status(400).json({
            error: "brand_name query parameter is required"
        });
    }

    const searchTerm = escapeRegex(
        brand_name.trim()
    );

    const regex = new RegExp(searchTerm, "i");

    const filtered = drugs.filter((drug) =>
        regex.test(drug.brand_name || "")
    );

    const { page, limit, skip } = getPagination(
        req.query
    );

    const data = filtered.slice(
        skip,
        skip + limit
    );

    res.json({
        data,
        pagination: getPaginationMetadata(
            page,
            limit,
            filtered.length
        )
    });
});

// --------------------------------------------------
// GET alternatives by brand name
// --------------------------------------------------

app.get("/api/drugs/alternatives", (req, res) => {
    const { brand_name } = req.query;

    if (!brand_name) {
        return res.status(400).json({
            error: "brand_name query parameter is required"
        });
    }

    const searchTerm = brand_name.trim();

    const drugIndex = drugs.findIndex(
        (drug) =>
            drug.brand_name?.toLowerCase() ===
            searchTerm.toLowerCase()
    );

    if (drugIndex === -1) {
        return res.status(404).json({
            error: "Drug not found"
        });
    }

    const drug = drugs[drugIndex];

    const alternatives = drugs.filter(
        (item, index) =>
            index !== drugIndex &&
            item.generic_name?.toLowerCase() ===
            drug.generic_name?.toLowerCase()
    );

    const { page, limit, skip } = getPagination(
        req.query
    );

    const data = alternatives.slice(
        skip,
        skip + limit
    );

    res.json({
        drug: {
            ...drug,
            id: drugIndex
        },
        alternatives: data,
        pagination: getPaginationMetadata(
            page,
            limit,
            alternatives.length
        )
    });
});

// --------------------------------------------------
// GET drug by ID
// --------------------------------------------------

app.get("/api/drugs/:id", (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id < 0 || id >= drugs.length) {
        return res.status(404).json({
            error: "Drug not found"
        });
    }

    const drug = drugs[id];

    res.json({
        ...drug,
        id
    });
});

// --------------------------------------------------
// GET alternatives by drug ID
// --------------------------------------------------

app.get("/api/drugs/:id/alternatives", (req, res) => {
    const id = parseInt(req.params.id);
    const { strong_match } = req.query;

    if (isNaN(id) || id < 0 || id >= drugs.length) {
        return res.status(404).json({
            error: "Drug not found"
        });
    }

    const drug = drugs[id];

    const alternatives = drugs.filter(
        (item, index) =>
            index !== id &&
            item.generic_name?.toLowerCase() ===
            drug.generic_name?.toLowerCase() &&
            ((strong_match == 1 ? 0 : 1) || (
                item.dosage_type?.toLowerCase() ===
                drug.dosage_type?.toLowerCase() &&
                item.strength?.toLowerCase() ===
                drug.strength?.toLowerCase()))
    );

    const { page, limit, skip } = getPagination(
        req.query
    );

    const data = alternatives.slice(
        skip,
        skip + limit
    );

    res.json({
        drug: {
            ...drug,
            id
        },
        alternatives: data,
        pagination: getPaginationMetadata(
            page,
            limit,
            alternatives.length
        )
    });
});


// --------------------------------------------------
// Start server
// --------------------------------------------------

const startServer = async () => {
    await loadDrugs();

    app.listen(PORT, () => {
        console.log(
            `Server running on http://localhost:${PORT}`
        );
    });
};

startServer();