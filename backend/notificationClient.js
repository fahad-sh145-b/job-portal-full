const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5001';
const { sendApplicationEmail, sendRecruiterAlertEmail, sendStatusUpdateEmail } = require('./mailer');

/**
 * Sends notification event to the Notification Microservice.
 * SMART RESILIENT FALLBACK:
 * If the microservice on port 5001 is offline, it automatically falls back
 * to sending the email directly in the background so no email is ever lost!
 */
async function notifyApplicationSubmitted(payload) {
    try {
        const res = await fetch(`${NOTIFICATION_SERVICE_URL}/notify/application`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            console.log('✅ [MAIN SERVICE] Event dispatched to Notification Microservice');
            return;
        }
    } catch (err) {
        console.warn('⚠️ [MAIN SERVICE] Notification Microservice offline. Activating direct background fallback...');
    }

    // Direct background fallback
    try {
        if (payload.candidateEmail) {
            sendApplicationEmail({
                email: payload.candidateEmail,
                name: payload.candidateName,
                jobTitle: payload.jobTitle,
                company: payload.companyName
            }).catch(e => console.log('Candidate email fallback error:', e.message));
        }

        if (payload.recruiterEmail) {
            sendRecruiterAlertEmail({
                recruiterEmail: payload.recruiterEmail,
                recruiterName: payload.recruiterName,
                candidateName: payload.candidateName,
                candidateEmail: payload.candidateEmail,
                jobTitle: payload.jobTitle,
                company: payload.companyName
            }).catch(e => console.log('Recruiter email fallback error:', e.message));
        }
    } catch (e) {
        console.error('Fallback dispatch error:', e.message);
    }
}

/**
 * Sends status update event to the Notification Microservice.
 */
async function notifyStatusUpdated(payload) {
    try {
        const res = await fetch(`${NOTIFICATION_SERVICE_URL}/notify/status-update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            console.log('✅ [MAIN SERVICE] Status update dispatched to Notification Microservice');
            return;
        }
    } catch (err) {
        console.warn('⚠️ [MAIN SERVICE] Notification Microservice offline. Activating status update fallback...');
    }

    // Direct background fallback
    try {
        if (payload.email) {
            sendStatusUpdateEmail({
                email: payload.email,
                name: payload.name,
                jobTitle: payload.jobTitle,
                company: payload.company,
                status: payload.status
            }).catch(e => console.log('Status update email fallback error:', e.message));
        }
    } catch (e) {
        console.error('Fallback status error:', e.message);
    }
}

module.exports = { notifyApplicationSubmitted, notifyStatusUpdated };
