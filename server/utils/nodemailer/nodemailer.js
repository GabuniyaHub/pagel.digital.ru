const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'bebrikivan199@gmail.com', 
        pass: 'nqcq zhhj irek paiy'
    }
});

async function sendConfirmationCode(email, confirmationCode, subject = 'Код подтверждения', text = `Ваш код подтверждения: ${confirmationCode}`) {
    try {
        const mailOptions = {
            from: 'bebrikivan199@gmail.com',
            to: email,
            subject: subject,
            text: text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Код на email отправлен:", info.response);
        return { success: true, message: 'Код отправлен' };
    } catch (error) {
        console.error("❌ Ошибка при отправке кода.", error);
        return { success: false, message: 'Ошибка при отправке кода', error: error.message };
    }
}

module.exports = { sendConfirmationCode };