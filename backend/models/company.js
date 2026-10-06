const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    website: {
        type: String,
        default: ""
    },

    location: {
        type: String,
        required: true
    },

    logo: {
        type: String,
        default: ""
    },

    recruiter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }

},
    {
        timestamps: true
    }
);


const Company = mongoose.model("Company", companySchema);

module.exports = Company;