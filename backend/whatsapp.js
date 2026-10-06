// Sends the "application submitted" WhatsApp message using Meta WhatsApp Cloud API.
// Needs Node 18+ (built-in fetch). Returns: 'sent' | 'failed' | 'no-phone' | 'not-configured'
function normalize(phone) {
    let d = String(phone || '').replace(/\D/g, '');
    if (d.length === 10) d = (process.env.WHATSAPP_DEFAULT_CC || '91') + d; // 10-digit Indian number
    return d.length >= 11 ? d : null;
}

async function sendApplicationWhatsApp({ phone, name, jobTitle, company }) {
    const { WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_TEMPLATE } = process.env;
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return 'not-configured';

    const to = normalize(phone);
    if (!to) return 'no-phone';

    const body = WHATSAPP_TEMPLATE
        ? {
            messaging_product: 'whatsapp', to, type: 'template',
            template: {
                name: WHATSAPP_TEMPLATE,
                language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
                components: [{ type: 'body', parameters: [name, jobTitle, company].map(text => ({ type: 'text', text })) }]
            }
        }
        : {
            messaging_product: 'whatsapp', to, type: 'text',
            text: { body: `Hi ${name}, you have successfully applied for ${jobTitle} at ${company}. We will notify you about updates.` }
        };

    const version = process.env.WHATSAPP_API_VERSION || 'v23.0';
    const res = await fetch(`https://graph.facebook.com/${version}/${WHATSAPP_PHONE_ID}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) { console.log('WhatsApp API error:', await res.text()); return 'failed'; }
    return 'sent';
}

module.exports = { sendApplicationWhatsApp };
