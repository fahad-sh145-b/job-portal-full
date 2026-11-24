const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const mongodbURL = process.env.MONGODB_URL || process.env.mongodbURL || 'mongodb://127.0.0.1:27017/jobportal';

if (!process.env.MONGODB_URL && !process.env.mongodbURL) {
    console.warn('⚠️ [DB WARNING] MONGODB_URL is not set in backend/.env. Attempting local connection: mongodb://127.0.0.1:27017/jobportal');
}

mongoose.connect(mongodbURL, {
    serverSelectionTimeoutMS: 5000
}).catch(err => {
    console.log('❌ Initial MongoDB connection error:', err.message);
    console.log('👉 Tip: Add your MongoDB Atlas connection string to backend/.env: MONGODB_URL=mongodb+srv://...');
});

const db = mongoose.connection;

db.on('connected', () => {
    console.log('Connected to MongoDB database');
});

db.on('error', (err) => {
    console.log('MongoDB Connection Error:', err.message);
});

module.exports = db;
