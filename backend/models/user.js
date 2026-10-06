const mongoose = require('mongoose');

const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {

        type: String,
        required: true,
        unique: true
    },

    password: {

        type: String,
        required: true,
        minlength: 5
    },

    role: {

        type: String,
        enum: ['jobseeker', 'employer', 'admin'],
        default: 'jobseeker'

    },

    phone: {

        type: String,
        default: ""
    },


    location: {

        type: String,
        default: ""
    },

    skills: {

        type: [String],
        default: []

    },


    resume: {

        type: String,
        default: ""
    },

    profileImage: {

        type: String,
        default: ""
    },


},
    {
        timestamps: true
    }
);


userSchema.pre('save', async function () {
    const user = this;

    if (!user.isModified('password')) return;

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        user.password = hashedPassword;
    } catch (err) {
        throw err;
    }
});

userSchema.methods.comparePassword = async function (comparePassword) {
    try {
        const isMatch = await bcrypt.compare(comparePassword, this.password);
        return isMatch;
    } catch (err) {
        throw err;
    }
};

const User = mongoose.model("User", userSchema);

module.exports = User;


