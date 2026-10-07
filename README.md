# 💼 Full-Stack Job Portal Application

A modern, responsive, full-stack MERN (MongoDB, Express, React, Node.js) Job Portal application that connects **Recruiters (Employers)** and **Job Seekers (Candidates)** with real-time automated email notifications and streamlined hiring dashboards.

### 🌐 **Live Production Link:**
🔗 **[https://job-portal-full-ckl8.vercel.app](https://job-portal-full-ckl8.vercel.app)**

---

## 🌟 Key Features

### 👤 **For Job Seekers (Candidates)**
- **Job Search & Filters:** Browse open job listings filtered by title, company, location, or job type (Full-time, Part-time, Remote, Internship).
- **One-Click Application:** Apply for jobs instantly with custom resume and cover letter links.
- **Application Tracker:** View status of submitted applications (`Pending`, `Shortlisted`, `Accepted`, `Rejected`).
- **Automated Gmail Notifications:** Receive instant confirmation emails when applying and when application status is updated by recruiters.

### 🏢 **For Recruiters (Employers)**
- **Company Management:** Create and manage company profiles.
- **Job Posting:** Post new job openings with custom titles, salary ranges, experience criteria, and application deadlines.
- **Hiring Dashboard:** Comprehensive applicant management panel to review candidates and update application statuses.
- **Recruiter Alerts:** Receive automated email notifications whenever a candidate applies to your job listing.

### ⚡ **Architecture & System Highlights**
- **Single-Port Unified Server:** Frontend UI (React + Vite) and Backend API (Node + Express) run seamlessly together.
- **Real-Time SMTP Email System:** Automated HTML emails via Nodemailer with direct clickable login links.
- **Cloud Database:** Powered by MongoDB Atlas.
- **Responsive Design:** 100% responsive across Mobile, Tablet, and Desktop screens.
- **Vercel Deployed:** Live production serverless architecture.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, React Router DOM, CSS Grid & Flexbox
- **Backend:** Node.js, Express.js, Mongoose, JWT Authentication, Nodemailer
- **Database:** MongoDB Atlas (Cloud Database)
- **Deployment:** Vercel

---

## 🚀 Local Quick Start Guide

### 1️⃣ **Clone the Repository**
```bash
git clone https://github.com/fahad-sh145-b/job-portal-full.git
cd job-portal-full
```

### 2️⃣ **Environment Setup**
Create a `.env` file inside the `backend/` directory:

```env
PORT=4000
MONGODB_URL=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
APP_URL=https://job-portal-full-ckl8.vercel.app

# Gmail SMTP Email Notifications
EMAIL_USER=shaikhbashiruddinmohdhajishaik@gmail.com
EMAIL_PASS=your_gmail_app_password
```

Create a `.env` file inside the `frontend/` directory:

```env
VITE_API_URL=https://job-portal-full-ckl8.vercel.app
```

### 3️⃣ **Install & Run Application**
Run a single command from the root folder to launch locally:

```bash
# Install all dependencies (Root, Backend & Frontend)
npm run postinstall

# Build Frontend Bundle
npm run build

# Start Full Application
npm start
```

Open **`http://localhost:4000`** in your browser!

---

## 🌐 Live Production Deployment

This project is deployed live on Vercel:

- **Live Application:** [https://job-portal-full-ckl8.vercel.app](https://job-portal-full-ckl8.vercel.app)

---

## 📄 License
This project is licensed under the MIT License.
