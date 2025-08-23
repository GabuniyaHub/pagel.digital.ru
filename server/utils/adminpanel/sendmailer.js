const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "bebrikivan199@gmail.com",
    pass: "nqcq zhhj irek paiy", // ⚠️ лучше вынести в .env
  },
});

module.exports = transporter;
