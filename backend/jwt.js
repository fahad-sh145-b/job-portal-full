const jwt = require('jsonwebtoken');

const jwtAuthMiddleware = (req, res, next) => {

    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({ error: 'Token not found' });
    }


    const token = req.headers.authorization.split(' ')[1];


    if (!token) {
        return res.status(401).json({ error: 'unauthorized' })
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();
    }

    catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' })
    }
}



const generatetoken = (userData) => {

    return jwt.sign(userData, process.env.JWT_SECRET);


}



module.exports = { jwtAuthMiddleware, generatetoken };