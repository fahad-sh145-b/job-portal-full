const express = require('express');

const router = express.Router();

const { jwtAuthMiddleware, generatetoken } = require('../jwt')

const Company = require('../models/company');


router.post('/register', jwtAuthMiddleware, async (req, res) => {
    try {
        const company = req.body;

        company.recruiter = req.user.id;

        const existingcompany = await Company.findOne({
            name: company.name,
            recruiter: req.user.id
        });

        if (existingcompany) {
            return res.status(409).json({
                message: 'You already registered this company'
            });
        }

        const newcompany = new Company(company);

        const response = await newcompany.save();

        console.log('company saved');

        return res.status(201).json({
            message: 'Company registered successfully',
            response
        });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
});





router.get('/', jwtAuthMiddleware, async (req, res) => {
    try {

        const company = await Company.find().populate('recruiter', 'name email');

        return res.status(200).json({ company });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }


})




router.get('/:id', jwtAuthMiddleware, async (req, res) => {

    try {

        const companyId = req.params.id;

        const response = await Company.findById(companyId).populate('recruiter', 'name email');


        if (!response) {
            return res.status(404).json({ message: 'company not found' });

        }

        return res.status(200).json(response)

    }

    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
})


router.put('/:id', jwtAuthMiddleware, async (req, res) => {
    try {

        const companyId = req.params.id;

        const updatedCompanyData = req.body;


        const response = await Company.findByIdAndUpdate(companyId, updatedCompanyData, {

            new: true,
            runValidators: true
        });

        if (!response) {
            return res.status(401).json({ message: 'company not found' })
        }

        console.log('company updated');

        return res.status(200).json({ message: 'company updated successfully', response });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }

})




router.delete('/:id', jwtAuthMiddleware, async (req, res) => {
    try {

        const companyId = req.params.id;



        const response = await Company.findByIdAndDelete(companyId)

        if (!response) {
            return res.status(401).json({ message: 'company not found' })
        }

        console.log('company deleted');

        return res.status(200).json({ message: 'company deleted successfully' });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }

})







module.exports = router;
