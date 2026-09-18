const nodemailer = require("nodemailer");

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s/g, "");
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || "true") === "true";

  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASS must be set");
  }

  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

module.exports = {
  sendMail(...args) {
    return getTransporter().sendMail(...args);
  },
};
