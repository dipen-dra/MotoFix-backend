/**
 * @file utils/sendEmail.js
 * @description Email sending utility using Nodemailer.
 */

const nodemailer = require('nodemailer');

/**
 * Sends an email using Nodemailer with a Gmail account.
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The subject line of the email.
 * @param {string} html - The HTML body of the email.
 * @param {Array} [attachments=[]] - An array of attachment objects for Nodemailer.
 * @returns {Promise<boolean>} - A promise that resolves to true if the email is sent successfully, otherwise false.
 */
const sendEmail = async (to, subject, html, attachments = []) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"MotoFix" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: subject,
    html: html,
    attachments: attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = sendEmail;