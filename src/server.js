// import "dotenv/config";
// import { marked } from "marked";
// import fs from "fs/promises";
// import path from "path";
// import express, { json } from "express";
// import cors from "cors";
// import mongoose from "mongoose";
// import connectDB from "./config/database.js";
// import Drug from "./models/Drug.js";

// const app = express();

// app.use(cors());
// app.use(json({ limit: "10mb" }));

// const getPagination = (query) => {
//     const page = Math.max(parseInt(query.page) || 1, 1);

//     const limit = Math.min(
//         Math.max(parseInt(query.limit) || 20, 1),
//         100
//     );

//     return {
//         page,
//         limit,
//         skip: (page - 1) * limit
//     };
// };


// const getPaginationMetadata = (page, limit, total) => {
//     const totalPages = Math.ceil(total / limit);

//     return {
//         page,
//         limit,
//         total,
//         total_pages: totalPages,
//         has_next_page: page < totalPages,
//         has_previous_page: page > 1
//     };
// };

// app.get("/", async (req, res) => {
//     try {
//         const filePath = path.join(
//             process.cwd(),
//             "drug_api_reference.md"
//         );

//         const markdown = await fs.readFile(filePath, "utf-8");
//         const html = marked.parse(markdown);

//         res.send(`
//             <!DOCTYPE html>
//             <html lang="en">
//             <head>
//                 <meta charset="UTF-8">
//                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                 <title>Drug API Documentation</title>
//                 <style>
//                     body {
//                         font-family: Arial, sans-serif;
//                         max-width: 1000px;
//                         margin: 40px auto;
//                         padding: 0 24px;
//                         line-height: 1.6;
//                         color: #24292f;
//                     }

//                     pre {
//                         background: #f6f8fa;
//                         padding: 16px;
//                         border-radius: 8px;
//                         overflow-x: auto;
//                     }

//                     code {
//                         font-family: Consolas, monospace;
//                     }

//                     :not(pre) > code {
//                         background: #f0f0f0;
//                         padding: 3px 6px;
//                         border-radius: 4px;
//                     }

//                     table {
//                         border-collapse: collapse;
//                         width: 100%;
//                     }

//                     th, td {
//                         border: 1px solid #ddd;
//                         padding: 10px;
//                         text-align: left;
//                     }

//                     th {
//                         background: #f6f8fa;
//                     }

//                     img {
//                         max-width: 100%;
//                     }
//                 </style>
//             </head>
//             <body>
//                 ${html}
//             </body>
//             </html>
//         `);
//     } catch (error) {
//         console.error(error);

//         res.status(500).send("Unable to load API documentation");
//     }
// });


// app.get("/health", async (req, res) => {
//     const mongoStatus =
//         mongoose.connection.readyState === 1
//             ? "connected"
//             : "disconnected";

//     const isHealthy = mongoStatus === "connected";

//     res.status(isHealthy ? 200 : 503).json({
//         status: isHealthy ? "healthy" : "unhealthy",
//         uptime: process.uptime(),
//         timestamp: new Date().toISOString(),
//         services: {
//             api: "healthy",
//             mongodb: mongoStatus
//         }
//     });
// });


// // GET /api/drugs?page=1&limit=20
// app.get("/api/drugs", async (req, res) => {
//     try {
//         const { page, limit, skip } = getPagination(req.query);

//         const [data, total] = await Promise.all([
//             Drug.find()
//                 .sort({ brand_name: 1, _id: 1 })
//                 .skip(skip)
//                 .limit(limit),

//             Drug.countDocuments()
//         ]);

//         res.json({
//             data,
//             pagination: getPaginationMetadata(page, limit, total)
//         });

//     } catch (error) {
//         console.error(error);

//         res.status(500).json({
//             error: "Internal server error"
//         });
//     }
// });


// // GET /api/drugs/:id
// app.get("/api/drugs/:id", async (req, res) => {
//     try {
//         const { id } = req.params;

//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             return res.status(400).json({
//                 error: "Invalid drug ID"
//             });
//         }

//         const drug = await Drug.findById(id);

//         if (!drug) {
//             return res.status(404).json({
//                 error: "Drug not found"
//             });
//         }

//         res.json(drug);
//     } catch (error) {
//         console.error(error);

//         res.status(500).json({
//             error: "Failed to retrieve drug"
//         });
//     }
// });


// // GET /api/drugs/search?brand_name=napa&page=1&limit=20
// app.get("/api/drugs/search", async (req, res) => {
//     try {
//         const { brand_name } = req.query;

//         if (!brand_name || !brand_name.trim()) {
//             return res.status(400).json({
//                 error: "brand_name is required"
//             });
//         }

//         const { page, limit, skip } = getPagination(req.query);

//         const filter = {
//             brand_name: {
//                 $regex: brand_name.trim().replace(
//                     /[.*+?^${}()|[\]\\]/g,
//                     "\\$&"
//                 ),
//                 $options: "i"
//             }
//         };

//         const [data, total] = await Promise.all([
//             Drug.find(filter)
//                 .sort({ brand_name: 1, _id: 1 })
//                 .skip(skip)
//                 .limit(limit),

//             Drug.countDocuments(filter)
//         ]);

//         res.json({
//             data,
//             pagination: getPaginationMetadata(page, limit, total)
//         });

//     } catch (error) {
//         console.error(error);

//         res.status(500).json({
//             error: "Internal server error"
//         });
//     }
// });



// // POST /api/drugs
// app.post("/api/drugs", async (req, res) => {
//     try {
//         const drug = await Drug.create(req.body);

//         res.status(201).json(drug);

//     } catch (error) {
//         if (error.name === "ValidationError") {
//             return res.status(400).json({
//                 error: error.message
//             });
//         }

//         console.error(error);

//         res.status(500).json({
//             error: "Internal server error"
//         });
//     }
// });



// // POST /api/drugs/bulk
// app.post("/api/drugs/bulk", async (req, res) => {
//     try {
//         const drugs = req.body;

//         if (!Array.isArray(drugs) || drugs.length === 0) {
//             return res.status(400).json({
//                 error: "Request body must be a non-empty array"
//             });
//         }

//         const BATCH_SIZE = 500;
//         let inserted = 0;

//         for (let i = 0; i < drugs.length; i += BATCH_SIZE) {
//             const batch = drugs.slice(i, i + BATCH_SIZE);

//             const result = await Drug.insertMany(batch, {
//                 ordered: true
//             });

//             inserted += result.length;
//         }

//         res.status(201).json({
//             message: `${inserted} drugs added successfully`,
//             inserted
//         });

//     } catch (error) {
//         console.error(error);

//         res.status(500).json({
//             error: error.message,
//             message: "Bulk insertion failed"
//         });
//     }
// });



// // GET /api/drugs/:id/alternatives?page=1&limit=20
// app.get("/api/drugs/:id/alternatives", async (req, res) => {
//     try {
//         const { id } = req.params;

//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             return res.status(400).json({
//                 error: "Invalid drug ID"
//             });
//         }

//         const { page, limit, skip } = getPagination(req.query);

//         const drug = await Drug.findById(id);

//         if (!drug) {
//             return res.status(404).json({
//                 error: "Drug not found"
//             });
//         }

//         if (!drug.generic_name) {
//             return res.json({
//                 drug,
//                 alternatives: [],
//                 pagination: getPaginationMetadata(page, limit, 0)
//             });
//         }

//         // Find other drugs with the same generic name
//         const filter = {
//             generic_name: drug.generic_name,
//             _id: { $ne: drug._id }
//         };

//         const [alternatives, total] = await Promise.all([
//             Drug.find(filter)
//                 .sort({ brand_name: 1, _id: 1 })
//                 .skip(skip)
//                 .limit(limit),

//             Drug.countDocuments(filter)
//         ]);

//         res.json({
//             drug,
//             alternatives,
//             pagination: getPaginationMetadata(page, limit, total)
//         });

//     } catch (error) {
//         console.error(error);

//         res.status(500).json({
//             error: "Internal server error"
//         });
//     }
// });


// // FIND ALTERNATIVES BY BRAND NAME
// // GET /api/drugs/alternatives?brand_name=Napa&page=1&limit=20
// app.get("/api/drugs/alternatives", async (req, res) => {
//     try {
//         const { brand_name } = req.query;

//         if (!brand_name || !brand_name.trim()) {
//             return res.status(400).json({
//                 error: "brand_name is required"
//             });
//         }

//         const { page, limit, skip } = getPagination(req.query);

//         const drug = await Drug.findOne({
//             brand_name: {
//                 $regex: `^${brand_name.trim().replace(
//                     /[.*+?^${}()|[\]\\]/g,
//                     "\\$&"
//                 )}$`,
//                 $options: "i"
//             }
//         });

//         if (!drug) {
//             return res.status(404).json({
//                 error: "Drug not found"
//             });
//         }

//         if (!drug.generic_name) {
//             return res.json({
//                 drug,
//                 alternatives: [],
//                 pagination: getPaginationMetadata(page, limit, 0)
//             });
//         }

//         const filter = {
//             generic_name: drug.generic_name,
//             _id: { $ne: drug._id }
//         };

//         const [alternatives, total] = await Promise.all([
//             Drug.find(filter)
//                 .sort({ brand_name: 1, _id: 1 })
//                 .skip(skip)
//                 .limit(limit),

//             Drug.countDocuments(filter)
//         ]);

//         res.json({
//             drug,
//             alternatives,
//             pagination: getPaginationMetadata(page, limit, total)
//         });

//     } catch (error) {
//         console.error(error);

//         res.status(500).json({
//             error: "Internal server error"
//         });
//     }
// });



// // FIND BRAND NAMES BY GENERIC NAME
// // GET /api/drugs/brands?generic_name=Paracetamol&page=1&limit=20
// app.get("/api/drugs/brands", async (req, res) => {
//     try {
//         const { generic_name } = req.query;

//         if (!generic_name || !generic_name.trim()) {
//             return res.status(400).json({
//                 error: "generic_name is required"
//             });
//         }

//         const { page, limit, skip } = getPagination(req.query);


//         const filter = {
//             generic_name
//         };

//         const [brands_names, total] = await Promise.all([
//             Drug.find(filter)
//                 .sort({ brand_name: 1, _id: 1 })
//                 .skip(skip)
//                 .limit(limit),

//             Drug.countDocuments(filter)
//         ]);

//         res.json({
//             generic_name,
//             brands_names,
//             pagination: getPaginationMetadata(page, limit, total)
//         });

//     } catch (error) {
//         console.error(error);

//         res.status(500).json({
//             error: "Internal server error"
//         });
//     }
// });

// const PORT = process.env.PORT || 3000;
// const startServer = async () => {
//     await connectDB();
//     app.listen(PORT, () => {
//         console.log(`Server running on http://localhost:${PORT}`);
//     });
// };

// startServer();



import "dotenv/config";
import express from "express";
import cors from "cors";
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

const dataPath = path.join(process.cwd(), "data", "drugs.json");

let drugs = [];

const loadDrugs = async () => {
    try {
        const data = await fs.readFile(dataPath, "utf-8");
        drugs = JSON.parse(data);

        console.log(`Loaded ${drugs.length} drugs`);
    } catch (error) {
        console.error("Failed to load drugs.json:", error.message);
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
