const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Serverless environments (like Vercel/AWS Lambda) have a strictly read-only filesystem except /tmp
const isVercel = Boolean(process.env.VERCEL);
const uploadDir = isVercel
    ? path.join('/tmp', 'uploads', 'resumes')
    : path.join(__dirname, 'uploads', 'resumes');

try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (err) {
    console.warn('⚠️ [UPLOAD] Could not create local upload directory:', err.message);
}

// 1. Storage engine: Saves file to disk with unique timestamp name
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        } catch (err) {
            cb(err, uploadDir);
        }
    },
    filename: (req, file, cb) => {
        // Sanitize filename and prepend timestamp
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueName = `${Date.now()}-${sanitized}`;
        cb(null, uniqueName);
    }
});

// 2. File validation filter: only accept PDF, DOC, DOCX
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
};

// 3. Multer middleware instance
const uploadResume = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

module.exports = uploadResume;
