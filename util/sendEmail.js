import nodemailer from 'nodemailer';

if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
  throw new Error('EMAIL_USERNAME and EMAIL_PASSWORD must be set in .env');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Sends an email using Gmail SMTP
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text body
 * @param {string} [options.html] - HTML body
 * @param {Array} [options.attachments] - Optional attachments
 */
const sendEmail = async ({ to, subject, text, html, attachments }) => {
  if (!to || !subject || (!text && !html)) {
    throw new Error('Email must have a recipient, subject, and content (text or html)');
  }

  const mailOptions = {
    from: `"HokenHub" <${process.env.EMAIL_USERNAME}>`,
    to,
    subject,
    text,
    html,
    attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent to ${to}: ${info.response}`);
};

export { transporter };
export default sendEmail;
