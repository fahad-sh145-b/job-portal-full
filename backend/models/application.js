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

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;