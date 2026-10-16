const express = require('express');

const router = express.Router();

const { jwtAuthMiddleware, checkRole } = require('../jwt');

const Job = require('../models/job');

const Company = require('../models/company');


// Only employers and admins can post jobs
router.post('/apply', jwtAuthMiddleware, checkRole(['employer', 'admin']), async (req, res) => {

    try {


        const job = req.body;


        // Find the company belonging to the logged-in recruiter
        const company = await Company.findOne({
            _id: job.company,
            recruiter: req.user.id
        });


        if (!company) {

            return res.status(404).json({ message: 'company not found' })
        }

        // Create the job
        const newjob = new Job({
            ...job,
            company: company._id,
            recruiter: req.user.id
        });

        const response = await newjob.save();

        console.log('job saved');


        return res.status(200).json({ response });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }

})


// PUBLIC ROUTE: Anyone (even logged out users) can view available jobs
// Supports search queries: ?q=developer&type=full-time&page=1&limit=10
router.get('/', async (req, res) => {
    try {
        const { q, type, page, limit } = req.query;

        const filter = {};
        if (type) {
            filter.jobType = type;
        }
        if (q) {
            filter.$or = [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { location: { $regex: q, $options: 'i' } }
            ];
        }

        // Optional Pagination support (for scaling to thousands of jobs)
        if (page || limit) {
            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.max(1, parseInt(limit) || 10);
            const total = await Job.countDocuments(filter);

            const jobs = await Job.find(filter)
                .populate('company')
                .populate('recruiter', 'name email')
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum);

            return res.status(200).json({
                response: jobs,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum)
            });
        }

        // Default: Fetch all matching jobs (backward-compatible)
        const response = await Job.find(filter)
            .populate('company')
            .populate('recruiter', 'name email')
            .sort({ createdAt: -1 });

        return res.status(200).json({ response });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});




router.get('/:id', jwtAuthMiddleware, async (req, res) => {

    const job = req.params.id;

    try {


        const response = await Job.findById(job).populate('company').populate('recruiter', 'name email');

        console.log('job fetched by Id');

        return res.status(200).json(response)
    }

    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
})

router.put('/:id', jwtAuthMiddleware, checkRole(['employer', 'admin']), async (req, res) => {


    try {
        const job = req.params.id;

        const updatedJob = req.body;

        const response = await Job.findByIdAndUpdate(job, updatedJob, {
            new: true,
            runValidators: true

        })

        console.log('job updated');

        return res.status(200).json({ message: 'job updated successfully', response });


    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
})




router.delete('/:id', jwtAuthMiddleware, checkRole(['employer', 'admin']), async (req, res) => {


    try {

        const job = req.params.id;

        const response = await Job.findByIdAndDelete(job);

        if (!response) {
            return res.status(404).json({ message: 'job not found' });
        }

        console.log('job deleted');

        return res.status(200).json({ message: 'job deleted successfully' });
    }

    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
})
module.exports = router;

