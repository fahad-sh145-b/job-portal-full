
const express = require('express');
const router = express.Router();

console.log("Application route file loaded");

const { jwtAuthMiddleware } = require('../jwt');
const Application = require('../models/application');
const Job = require('../models/job');
const User = require('../models/user');
const Company = require('../models/company');
const { sendApplicationWhatsApp } = require('../whatsapp');
const { sendApplicationEmail, sendRecruiterAlertEmail, sendStatusUpdateEmail } = require('../mailer');


// 1. Apply for a job
router.post('/apply/:jobId', jwtAuthMiddleware, async (req, res) => {
    try {
        const jobId = req.params.jobId;

        const job = await Job.findById(jobId).populate('company', 'name');

        if (!job) {
            return res.status(404).json({
                message: 'Job not found'
            });
        }

        const existingApplication = await Application.findOne({
            job: job._id,
            applicant: req.user.id
        });

        if (existingApplication) {
            return res.status(409).json({
                message: 'You have already applied for this job'
            });
        }

        const application = new Application({
            job: job._id,
            applicant: req.user.id,
            resume: req.body.resume || '',
            coverletter: req.body.coverletter || ''
        });

        const response = await application.save();

        // Get user & recruiter details for notifications
        const user = await User.findById(req.user.id);
        const recruiter = await User.findById(job.recruiter);
        const companyName = job.company?.name || 'the company';

        // 1. Send Email Notification to Candidate
        try {
            if (user?.email) {
                await sendApplicationEmail({
                    email: user.email,
                    name: user.name,
                    jobTitle: job.title,
                    company: companyName
                });
            }
        } catch (e) { console.log('Candidate Email error:', e.message); }

        // 2. Send Email Notification to Recruiter
        try {
            if (recruiter?.email) {
                await sendRecruiterAlertEmail({
                    recruiterEmail: recruiter.email,
                    recruiterName: recruiter.name,
                    candidateName: user.name,
                    candidateEmail: user.email,
                    jobTitle: job.title,
                    company: companyName
                });
            }
        } catch (e) { console.log('Recruiter Email error:', e.message); }

        // 2. WhatsApp confirmation
        let whatsapp = 'failed';
        try {
            if (user?.phone) {
                whatsapp = await sendApplicationWhatsApp({
                    phone: user.phone,
                    name: user.name,
                    jobTitle: job.title,
                    company: companyName
                });
            }
        } catch (e) { console.log('WhatsApp error:', e.message); }

        return res.status(201).json({
            message: `You have successfully applied to ${job.title} at ${companyName}! Confirmation notification sent.`,
            data: response,
            whatsapp
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: err.message
        });
    }
});


// 2. Get applications submitted by the logged-in user
router.get('/my', jwtAuthMiddleware, async (req, res) => {
    try {
        const applications = await Application.find({
            applicant: req.user.id
        })
            .populate('job')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: 'Applications fetched successfully',
            data: applications
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: err.message
        });
    }
});


// 3. Get applications received for the recruiter's jobs
router.get('/received', jwtAuthMiddleware, async (req, res) => {
    try {
        const jobs = await Job.find({
            recruiter: req.user.id
        }).select('_id');

        const jobIds = jobs.map(job => job._id);

        const applications = await Application.find({
            job: { $in: jobIds }
        })
            .populate('applicant', 'name email phone')
            .populate('job')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: 'Applications fetched successfully',
            data: applications
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: err.message
        });
    }
});


// 4. Update application status
router.put('/:id/status', jwtAuthMiddleware, async (req, res) => {
    try {
        const allowedStatuses = [
            'pending',
            'shortlisted',
            'rejected',
            'accepted'
        ];

        const { status } = req.body || {};

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: 'Invalid application status'
            });
        }

        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                message: 'Application not found'
            });
        }

        const job = await Job.findOne({
            _id: application.job,
            recruiter: req.user.id
        });

        if (!job) {
            return res.status(403).json({
                message: 'You are not authorized to update this application'
            });
        }

        application.status = status;
        await application.save();

        // Send Email notification for status update
        try {
            const applicant = await User.findById(application.applicant);
            const populatedJob = await Job.findById(application.job).populate('company', 'name');
            if (applicant?.email) {
                await sendStatusUpdateEmail({
                    email: applicant.email,
                    name: applicant.name,
                    jobTitle: populatedJob?.title || 'Job',
                    company: populatedJob?.company?.name || 'Company',
                    status: status
                });
            }
        } catch (e) { console.log('Status update notification error:', e.message); }

        return res.status(200).json({
            message: 'Application status updated successfully',
            data: application
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: err.message
        });
    }
});

module.exports = router;