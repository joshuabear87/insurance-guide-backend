import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Use Gmail shortcut instead of custom host/port
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,   // hokenhub@gmail.com
    pass: process.env.EMAIL_PASSWORD,   // App password (16 characters from Google)
  },
});

/**
 * Send an email with optional PDF attachment
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {Buffer} [options.pdfBuffer] - Optional PDF buffer
 * @param {string} [options.pdfFilename] - Optional filename (default: 'attachment.pdf')
 */
const sendEmail = async ({ to, subject, html, pdfBuffer, pdfFilename = 'attachment.pdf' }) => {
  const mailOptions = {
    from: `"HokenHub" <${process.env.EMAIL_USERNAME}>`,
    to,
    subject,
    html,
    text: html.replace(/<[^>]+>/g, ''), 
    replyTo: process.env.EMAIL_USERNAME,
  };
  
  if (pdfBuffer) {
    mailOptions.attachments = [
      {
        filename: pdfFilename,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ];
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.response}`);
  } catch (err) {
    console.error('❌ Failed to send email:', err.message);
  }
};

export default sendEmail;
