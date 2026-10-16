require('dotenv').config();
const nodemailer = require('nodemailer');

const APP_URL = process.env.APP_URL || 'http://localhost:4000';
const LOGIN_URL = `${APP_URL}/login`;

function getTransporter() {
    const { EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT } = process.env;

    if (EMAIL_USER && EMAIL_PASS) {
        return nodemailer.createTransport({
            host: EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(EMAIL_PORT || '587'),
            secure: EMAIL_PORT === '465',
            auth: {
                user: EMAIL_USER.trim(),
                pass: EMAIL_PASS.replace(/\s+/g, '')
            }
        });
    }
    return null;
}

async function sendApplicationEmail({ email, name, jobTitle, company }) {
    console.log(`\n📧 [NOTIFICATION SERVICE] Sending application confirmation to candidate: ${email}...`);

    const transporter = getTransporter();
    if (!transporter) {
        console.log('⚠️ [NOTIFICATION SERVICE] Email credentials not configured.');
        return 'email-logged';
    }

    try {
        await transporter.sendMail({
            from: `"JobPortal" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Application Submitted: ${jobTitle} at ${company}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 24px; color: #333; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #0066cc; margin-top: 0;">Application Submitted Successfully! 🎉</h2>
                    <p>Hi <strong>${name}</strong>,</p>
                    <p>Your application for the position of <strong>${jobTitle}</strong> at <strong>${company}</strong> has been submitted successfully.</p>
                    <p>The recruiter will review your profile and update you on the status soon.</p>
                    <div style="margin: 25px 0;">
                        <a href="${LOGIN_URL}" target="_blank" style="background-color: #0066cc; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Log in to JobPortal</a>
                    </div>
                    <hr style="border: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 13px; color: #666;">Thank you for using <a href="${LOGIN_URL}" target="_blank" style="color: #0066cc; text-decoration: underline; font-weight: bold;">JobPortal</a>!</p>
                </div>
            `
        });
        console.log(`✅ [NOTIFICATION SERVICE] Candidate email delivered to ${email}`);
        return 'sent';
    } catch (err) {
        console.log('⚠️ [NOTIFICATION SERVICE] Candidate email error:', err.message);
        return 'failed';
    }
}

async function sendRecruiterAlertEmail({ recruiterEmail, recruiterName, candidateName, candidateEmail, jobTitle, company }) {
    console.log(`\n📧 [NOTIFICATION SERVICE] Sending new applicant alert to recruiter: ${recruiterEmail}...`);

    const transporter = getTransporter();
    if (!transporter) return 'email-logged';

    try {
        await transporter.sendMail({
            from: `"JobPortal" <${process.env.EMAIL_USER}>`,
            to: recruiterEmail,
            subject: `New Application Received for ${jobTitle}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 24px; color: #333; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #28a745; margin-top: 0;">New Applicant Alert! 📩</h2>
                    <p>Hi <strong>${recruiterName}</strong>,</p>
                    <p><strong>${candidateName}</strong> (${candidateEmail}) has just applied for your job opening: <strong>${jobTitle}</strong> (${company}).</p>
                    <div style="margin: 25px 0;">
                        <a href="${LOGIN_URL}" target="_blank" style="background-color: #28a745; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Open Hiring Dashboard</a>
                    </div>
                    <hr style="border: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 13px; color: #666;"><a href="${LOGIN_URL}" target="_blank" style="color: #0066cc; text-decoration: underline; font-weight: bold;">JobPortal</a> Hiring System</p>
                </div>
            `
        });
        console.log(`✅ [NOTIFICATION SERVICE] Recruiter alert sent to ${recruiterEmail}`);
        return 'sent';
    } catch (err) {
        console.log('⚠️ [NOTIFICATION SERVICE] Recruiter email error:', err.message);
        return 'failed';
    }
}

async function sendStatusUpdateEmail({ email, name, jobTitle, company, status }) {
    console.log(`\n📧 [NOTIFICATION SERVICE] Sending status update to ${email} (Status: ${status})...`);

    const transporter = getTransporter();
    if (!transporter) return 'email-logged';

    const statusColor = status === 'accepted' ? '#28a745' : status === 'shortlisted' ? '#0066cc' : status === 'rejected' ? '#dc3545' : '#ffc107';

    try {
        await transporter.sendMail({
            from: `"JobPortal" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Update on your application for ${jobTitle} at ${company}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 24px; color: #333; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #333; margin-top: 0;">Application Status Update 📢</h2>
                    <p>Hi <strong>${name}</strong>,</p>
                    <p>Your application status for <strong>${jobTitle}</strong> at <strong>${company}</strong> has been updated to:</p>
                    <div style="margin: 20px 0;">
                        <span style="background-color: ${statusColor}; color: #ffffff; padding: 8px 16px; border-radius: 20px; font-weight: bold; text-transform: uppercase; font-size: 14px; display: inline-block;">${status}</span>
                    </div>
                    <div style="margin: 25px 0;">
                        <a href="${LOGIN_URL}" target="_blank" style="background-color: #0066cc; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Log in to JobPortal to view details</a>
                    </div>
                    <hr style="border: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 13px; color: #666;">Click <a href="${LOGIN_URL}" target="_blank" style="color: #0066cc; text-decoration: underline; font-weight: bold;">JobPortal</a> to access your account.</p>
                </div>
            `
        });
        console.log(`✅ [NOTIFICATION SERVICE] Status email delivered to ${email}`);
        return 'sent';
    } catch (err) {
        console.log('⚠️ [NOTIFICATION SERVICE] Status email error:', err.message);
        return 'failed';
    }
}

module.exports = { sendApplicationEmail, sendRecruiterAlertEmail, sendStatusUpdateEmail };
