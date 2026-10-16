const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({

    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
        required: true
    },

    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    resume: {
        type: String,
        default: ""
    },

    coverletter: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        enum: ["pending", "shortlisted", "rejected", "accepted"],
        default: "pending"
    }

},
    {
        timestamps: true
    }
);

// Compound unique index: Guarantees at the database level that
// a user can only apply to the same job once (prevents double-click bugs)
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;