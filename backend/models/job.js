const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true

    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },

    recruiter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    location: {
        type: String,
        required: true
    },

    salarymin: {
        type: Number,
        default: 0
    },

    salarymax: {
        type: Number,
        default: 0

    },

    jobType: {
        type: String,
        enum: ["full-time", "part-time", "internship", "remote"],
        required: true
    },

    experience: {
        type: String,
        required: true
    },

    deadline: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ["open", "closed"],
        default: "open",
    }


},
    {
        timestamps: true
    }

);





const Job = mongoose.model("Job", jobSchema);

module.exports = Job;