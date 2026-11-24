const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());

const { connectDB, db } = require('./db.js');


const bodyParser = require('body-parser');
app.use(bodyParser.json());

// Ensure MongoDB connection is ready before processing API requests (essential for Vercel serverless)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('Database connection failed:', err.message);
        return res.status(500).json({ message: 'Database connection failed: ' + err.message });
    }
});

const PORT = process.env.PORT || 4000


const userRoutes = require('./routes/userRoutes');

const companyRoutes = require('./routes/companyRoutes');

const jobRoutes = require('./routes/jobRoutes');

const applicationRoutes = require('./routes/applicationRoutes');

console.log("Application routes imported successfully");


// Routes middleware
app.use('/user', userRoutes);

app.use('/company', companyRoutes);

app.use('/job', jobRoutes);

app.use('/application', applicationRoutes);

// Automatically locate the frontend dist folder (works both inside Docker and locally)
const frontendDist = fs.existsSync(path.join(__dirname, 'dist', 'index.html'))
    ? path.join(__dirname, 'dist')
    : path.join(__dirname, '../frontend/dist');

// Serve uploaded resume files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(frontendDist));

// SPA Fallback for frontend
app.use((req, res) => {
    const indexPath = path.join(frontendDist, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send("Backend server is live.");
    }
});



if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is live on port ${PORT}`);
    });
}

module.exports = app;



