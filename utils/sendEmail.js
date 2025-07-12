// C:\Users\dipen\motofix-backend\utils\sendEmail.js
/**
 * @file utils/sendEmail.js
 * @description Email sending utility using Nodemailer.
 */

const nodemailer = require('nodemailer'); // Changed import to require

/**
 * Sends an email using Nodemailer with a Gmail account.
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The subject line of the email.
 * @param {string} html - The HTML body of the email.
 * @param {Array} [attachments=[]] - An array of attachment objects for Nodemailer.
 * @returns {Promise<boolean>} - A promise that resolves to true if the email is sent successfully, otherwise false.
 */
const sendEmail = async (to, subject, html, attachments = []) => {
  // Create a transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address from .env
      pass: process.env.EMAIL_PASS, // Your Gmail app password from .env
    },
  });

  // Set up email data
  const mailOptions = {
    from: `"MotoFix" <${process.env.EMAIL_USER}>`, // Sender address
    to: to, // List of receivers
    subject: subject, // Subject line
    html: html, // HTML body
    attachments: attachments, // Attachments (e.g., for the logo)
  };

  try {
    // Send mail with defined transport object
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = sendEmail; // Changed export default to module.exports