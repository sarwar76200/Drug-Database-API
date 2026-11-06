import mongoose from "mongoose";

const drugSchema = new mongoose.Schema(
    {
        brand_name: {
            type: String,
            maxlength: 50,
            trim: true
        },

        generic_name: {
            type: String,
            maxlength: 60,
            trim: true
        },

        dosage_type: {
            type: String,
            maxlength: 30,
            trim: true
        },

        strength: {
            type: String,
            maxlength: 30,
            trim: true
        },

        pharmaceutical: {
            type: String,
            maxlength: 50,
            trim: true
        },

        unit_price: {
            type: Number,
            min: 0,
            max: 999.99
        }
    },
    {
        timestamps: true
    }
);

drugSchema.index({ brand_name: 1 });
drugSchema.index({ generic_name: 1 });
drugSchema.index({
    generic_name: 1,
    strength: 1,
    dosage_type: 1
});

export default mongoose.model("Drug", drugSchema);