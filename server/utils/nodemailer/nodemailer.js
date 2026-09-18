const nodemailer = require('nodemailer');

function getTransporter() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS?.replace(/\s/g, '');
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT || 465);
    const secure = String(process.env.SMTP_SECURE || 'true') === 'true';

    if (!user || !pass) {
        throw new Error('SMTP_USER and SMTP_PASS must be set');
    }

    return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

async function sendConfirmationCode(email, confirmationCode, subject = 'Код подтверждения', text = `Ваш код подтверждения: ${confirmationCode}`) {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject: subject,
            text: text
        };

        await getTransporter().sendMail(mailOptions);
        return { success: true, message: 'Код отправлен' };
    } catch (error) {
        console.error("❌ Ошибка при отправке кода.", error);
        return { success: false, message: 'Ошибка при отправке кода', error: error.message };
    }
}

module.exports = { sendConfirmationCode };
