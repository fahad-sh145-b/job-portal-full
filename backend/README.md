# Job Portal

A backend REST API for a Job Portal application built with Node.js, Express.js, MongoDB, Mongoose, and JWT authentication.

The application allows users to register and log in, companies to be managed by recruiters, recruiters to create jobs, candidates to apply for jobs, and recruiters to manage job applications.

## Features

- User registration and login
- JWT-based authentication
- User profile management
- Company creation and management
- Recruiter-based company authorization
- Job creation and management
- Job search and retrieval
- Apply for jobs
- Prevent duplicate applications
- View applications submitted by a candidate
- View applications received by recruiters
- Update application status
- MongoDB database integration
- Password authentication
- Protected API routes

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcrypt
- dotenv
- Postman

## Project Structure

```text
job portal/
│
├── models/
│   ├── application.js
│   ├── company.js
│   ├── job.js
│   └── user.js
│
├── routes/
│   ├── applicationRoutes.js
│   ├── companyRoutes.js
│   ├── jobRoutes.js
│   └── userRoutes.js
│
├── db.js
├── jwt.js
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
