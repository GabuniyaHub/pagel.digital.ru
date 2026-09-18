const nodemailer = require("nodemailer");

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASS must be set");
  }

  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
}

module.exports = {
  sendMail(...args) {
    return getTransporter().sendMail(...args);
  },
};
