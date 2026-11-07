import "dotenv/config";
import express, { json } from "express";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/database.js";
import Drug from "./models/Drug.js";

const app = express();

app.use(cors());
app.use(json({ limit: "10mb" }));

const getPagination = (query) => {
    const page = Math.max(parseInt(query.page) || 1, 1);

    const limit = Math.min(
        Math.max(parseInt(query.limit) || 20, 1),
        100
    );

    return {
        page,
        limit,
        skip: (page - 1) * limit
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



// GET /api/drugs?page=1&limit=20
app.get("/api/drugs", async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req.query);

        const [data, total] = await Promise.all([
            Drug.find()
                .sort({ brand_name: 1, _id: 1 })
                .skip(skip)
                .limit(limit),

            Drug.countDocuments()
        ]);

        res.json({
            data,
            pagination: getPaginationMetadata(page, limit, total)
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Internal server error"
        });
    }
});



// GET /api/drugs/search?brand_name=napa&page=1&limit=20
app.get("/api/drugs/search", async (req, res) => {
    try {
        const { brand_name } = req.query;

        if (!brand_name || !brand_name.trim()) {
            return res.status(400).json({
                error: "brand_name is required"
            });
        }

        const { page, limit, skip } = getPagination(req.query);

        const filter = {
            brand_name: {
                $regex: brand_name.trim().replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                ),
                $options: "i"
            }
        };

        const [data, total] = await Promise.all([
            Drug.find(filter)
                .sort({ brand_name: 1, _id: 1 })
                .skip(skip)
                .limit(limit),

            Drug.countDocuments(filter)
        ]);

        res.json({
            data,
            pagination: getPaginationMetadata(page, limit, total)
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Internal server error"
        });
    }
});



// POST /api/drugs
app.post("/api/drugs", async (req, res) => {
    try {
        const drug = await Drug.create(req.body);

        res.status(201).json(drug);

    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                error: error.message
            });
        }

        console.error(error);

        res.status(500).json({
            error: "Internal server error"
        });
    }
});



// POST /api/drugs/bulk
app.post("/api/drugs/bulk", async (req, res) => {
    try {
        const drugs = req.body;

        if (!Array.isArray(drugs) || drugs.length === 0) {
            return res.status(400).json({
                error: "Request body must be a non-empty array"
            });
        }

        const BATCH_SIZE = 500;
        let inserted = 0;

        for (let i = 0; i < drugs.length; i += BATCH_SIZE) {
            const batch = drugs.slice(i, i + BATCH_SIZE);

            const result = await Drug.insertMany(batch, {
                ordered: true
            });

            inserted += result.length;
        }

        res.status(201).json({
            message: `${inserted} drugs added successfully`,
            inserted
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: error.message,
            message: "Bulk insertion failed"
        });
    }
});



// GET /api/drugs/:id/alternatives?page=1&limit=20
app.get("/api/drugs/:id/alternatives", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                error: "Invalid drug ID"
            });
        }

        const { page, limit, skip } = getPagination(req.query);

        const drug = await Drug.findById(id);

        if (!drug) {
            return res.status(404).json({
                error: "Drug not found"
            });
        }

        if (!drug.generic_name) {
            return res.json({
                drug,
                alternatives: [],
                pagination: getPaginationMetadata(page, limit, 0)
            });
        }

        // Find other drugs with the same generic name
        const filter = {
            generic_name: drug.generic_name,
            _id: { $ne: drug._id }
        };

        const [alternatives, total] = await Promise.all([
            Drug.find(filter)
                .sort({ brand_name: 1, _id: 1 })
                .skip(skip)
                .limit(limit),

            Drug.countDocuments(filter)
        ]);

        res.json({
            drug,
            alternatives,
            pagination: getPaginationMetadata(page, limit, total)
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Internal server error"
        });
    }
});


// FIND ALTERNATIVES BY BRAND NAME
// GET /api/drugs/alternatives?brand_name=Napa&page=1&limit=20
app.get("/api/drugs/alternatives", async (req, res) => {
    try {
        const { brand_name } = req.query;

        if (!brand_name || !brand_name.trim()) {
            return res.status(400).json({
                error: "brand_name is required"
            });
        }

        const { page, limit, skip } = getPagination(req.query);

        const drug = await Drug.findOne({
            brand_name: {
                $regex: `^${brand_name.trim().replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                )}$`,
                $options: "i"
            }
        });

        if (!drug) {
            return res.status(404).json({
                error: "Drug not found"
            });
        }

        if (!drug.generic_name) {
            return res.json({
                drug,
                alternatives: [],
                pagination: getPaginationMetadata(page, limit, 0)
            });
        }

        const filter = {
            generic_name: drug.generic_name,
            _id: { $ne: drug._id }
        };

        const [alternatives, total] = await Promise.all([
            Drug.find(filter)
                .sort({ brand_name: 1, _id: 1 })
                .skip(skip)
                .limit(limit),

            Drug.countDocuments(filter)
        ]);

        res.json({
            drug,
            alternatives,
            pagination: getPaginationMetadata(page, limit, total)
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Internal server error"
        });
    }
});


const PORT = process.env.PORT || 3000;
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

startServer();