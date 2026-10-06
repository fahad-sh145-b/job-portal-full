const express = require('express');

const router = express.Router();

const { jwtAuthMiddleware, generateToken } = require('../jwt');

const Job = require('../models/job');

const Company = require('../models/company');


router.post('/apply', jwtAuthMiddleware, async (req, res) => {

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


router.get('/', jwtAuthMiddleware, async (req, res) => {

    try {

        const response = await Job.find()
            .populate('company')
            .populate('recruiter', 'name email');

        console.log('job fetched');

        return res.status(200).json({ response });



    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }

})




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

router.put('/:id', jwtAuthMiddleware, async (req, res) => {


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




router.delete('/:id', jwtAuthMiddleware, async (req, res) => {


    try {

        const job = req.params.id;

        const response = await Job.findByIdAndDelete(job);

        if (!response) {
            return res.status({ message: 'job not found' })
        }

        console.log('job deleted');

        return res.status(200).json('job deleted successfully')
    }

    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
})
module.exports = router;

