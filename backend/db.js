const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const mongodbURL = process.env.MONGODB_URL || process.env.mongodbURL || 'mongodb://127.0.0.1:27017/jobportal';

if (!process.env.MONGODB_URL && !process.env.mongodbURL) {
    console.warn('⚠️ [DB WARNING] MONGODB_URL is not set in backend/.env. Attempting local connection: mongodb://127.0.0.1:27017/jobportal');
}

/**
 * Global cache for serverless environments (Vercel Lambda)
 * Ensures DB connection is reused across warm function invocations
 */
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Prevents 10s hanging buffers on disconnected instances
            serverSelectionTimeoutMS: 8000,
            maxPoolSize: 10,
        };

        cached.promise = mongoose.connect(mongodbURL, opts).then((mongooseInstance) => {
            console.log('Connected to MongoDB database');
            return mongooseInstance;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error('MongoDB Connection Error:', e.message);
        throw e;
    }

    return cached.conn;
}

// Initial connect for local development or Docker (non-serverless)
if (!process.env.VERCEL) {
    connectDB().catch(err => {
        console.log('❌ Initial MongoDB connection error:', err.message);
    });
}

const db = mongoose.connection;

module.exports = { connectDB, db };
