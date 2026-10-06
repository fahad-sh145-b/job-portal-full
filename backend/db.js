const mongoose = require('mongoose');

require('dotenv').config();

const mongodbURL = process.env.MONGODB_URL || process.env.mongodbURL;
mongoose.connect(mongodbURL).catch(err => {
    console.log('Initial MongoDB connection error:', err.message);
});

const db = mongoose.connection;

db.on('connected', () => {
    console.log('Connected to MongoDB Atlas');
});

db.on('error', (err) => {
    console.log('MongoDB Connection Error:', err);
});

module.exports = db;