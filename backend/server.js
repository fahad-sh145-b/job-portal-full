const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());

require('dotenv').config();

const db = require('./db.js');


const bodyParser = require('body-parser');
app.use(bodyParser.json());

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

const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// SPA Fallback for frontend
app.use((req, res) => {
    const indexPath = path.join(__dirname, '../frontend/dist/index.html');
    const fs = require('fs');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send("Backend server is live.");
    }
});



app.listen(PORT, () => {
    console.log('Server is live')
})



