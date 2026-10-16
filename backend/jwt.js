const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_12345';

// 1. Authentication Middleware: Checks if user is logged in
const jwtAuthMiddleware = (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({ error: 'Token not found. Please log in.' });
    }

    // Expecting format: "Bearer <token>"
    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Invalid token format. Format must be: Bearer <token>' });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Contains id, name, email, role
        next();
    } catch (err) {
        // Return 401 instead of 500 when token verification fails
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// 2. Authorization Middleware: Checks if user has the right role
const checkRole = (allowedRoles = []) => {
    return (req, res, next) => {
        // req.user was set by jwtAuthMiddleware
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Access forbidden: requires one of the following roles: [${allowedRoles.join(', ')}]` 
            });
        }
        next();
    };
};

// 3. Helper to generate token
const generatetoken = (userData) => {
    // Optional: Add expiration time so stolen tokens don't work forever
    return jwt.sign(userData, JWT_SECRET, { expiresIn: '7d' });
};

module.exports = { jwtAuthMiddleware, checkRole, generatetoken };