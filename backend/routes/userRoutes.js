const express = require('express');

const router = express.Router();

const { jwtAuthMiddleware, generatetoken } = require('../jwt')

const User = require('../models/user');



router.post('/register', async (req, res) => {
    try {
        const data = req.body;

        const existinguser = await User.findOne({ email: data.email });

        if (existinguser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newuser = new User(data);
        const response = await newuser.save();


        console.log('data saved');


        const payload = {
            id: response.id,
            name: response.name,
            email: response.email,
            role: response.role
        };

        const token = generatetoken(payload);

        console.log('token is', token);
        res.status(201).json({ response: response, token: token });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        const token = generatetoken(payload);

        return res.status(200).json({ message: 'Login successful', user, token });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});



router.get('/', jwtAuthMiddleware, async (req, res) => {


    try {


        const response = await User.find();

        console.log('data fetched');

        return res.status(201).json(response);
    }

    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }

})




router.get('/profile/:id', jwtAuthMiddleware, async (req, res) => {


    try {
        const userId = req.params.id;

        const response = await User.findById(userId);

        if (!response) {
            return res.status(404).json({ message: 'user not found' });
        }

        return res.status(200).json(response);

    }

    catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' })
    }

})



router.put('/:id', async (req, res) => {

    try {
        const userId = req.params.id;

        const updatedPersonData = req.body;
        const response = await User.findByIdAndUpdate(userId, updatedPersonData, {

            new: true,
            runValidators: true
        });

        if (!response) {

            return res.status(404).json({ message: 'user not found' })
        }


        console.log('data updated');
        return res.status(200).json({ message: 'user updated successfully', response })
    }

    catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' })
    }

})




router.delete('/:id', async (req, res) => {

    try {
        const userId = req.params.id;

        const response = await User.findByIdAndDelete(userId);

        if (!response) {

            return res.status(404).json({ message: 'user not found' })
        }

        console.log('data deleted');
        return res.status(200).json({ message: 'user deleted successfully', response })
    }

    catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' })
    }


})

module.exports = router;