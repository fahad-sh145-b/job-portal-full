const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sendApplicationEmail, sendRecruiterAlertEmail, sendStatusUpdateEmail } = require('./mailer');
const { sendApplicationWhatsApp } = require('./whatsapp');

const app = express();
const PORT = process.env.PORT || 5001; // Runs on port 5001 (separate from main server 4000)

app.use(cors());
app.use(express.json());

// 1. Health check endpoint (Standard in microservices)
app.get('/health', (req, res) => {
    res.status(200).json({
        service: 'notification-service',
        status: 'online',
        uptime: `${Math.floor(process.uptime())}s`,
        timestamp: new Date().toISOString()
    });
});

// 2. Event Endpoint: Candidate applied to a job
app.post('/notify/application', async (req, res) => {
    const {
        candidateEmail,
        candidateName,
        candidatePhone,
        recruiterEmail,
        recruiterName,
        jobTitle,
        companyName
    } = req.body;

    console.log(`\n📬 [DISPATCH] Processing application notifications for "${jobTitle}" at "${companyName}"...`);

    // Respond immediately to the caller so they don't wait on slow external APIs
    res.status(202).json({
        message: 'Application notification received and queued for delivery.'
    });

    // Process notifications asynchronously in the background
    try {
        if (candidateEmail) {
            await sendApplicationEmail({
                email: candidateEmail,
                name: candidateName,
                jobTitle,
                company: companyName
            });
        }

        if (recruiterEmail) {
            await sendRecruiterAlertEmail({
                recruiterEmail,
                recruiterName,
                candidateName,
                candidateEmail,
                jobTitle,
                company: companyName
            });
        }

        if (candidatePhone) {
            await sendApplicationWhatsApp({
                phone: candidatePhone,
                name: candidateName,
                jobTitle,
                company: companyName
            });
        }
    } catch (err) {
        console.error('❌ [NOTIFICATION WORKER ERROR]:', err.message);
    }
});

// 3. Event Endpoint: Application status updated (shortlisted, accepted, etc.)
app.post('/notify/status-update', async (req, res) => {
    const { email, name, jobTitle, company, status } = req.body;

    console.log(`\n📢 [DISPATCH] Processing status update (${status}) for "${name}" on "${jobTitle}"...`);

    res.status(202).json({
        message: 'Status update notification received and queued for delivery.'
    });

    try {
        if (email) {
            await sendStatusUpdateEmail({ email, name, jobTitle, company, status });
        }
    } catch (err) {
        console.error('❌ [NOTIFICATION WORKER ERROR]:', err.message);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 [NOTIFICATION MICROSERVICE] Running independently on port ${PORT}`);
});

module.exports = app;
