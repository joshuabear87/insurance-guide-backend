import express from 'express';
import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';

dotenv.config();
const router = express.Router();

router.post('/', async (req, res) => {
  console.log('📨 Starting PDF email process...');

  try {
    // Step 1: Fetch approved admin users
    console.log('🔍 Fetching approved admin users...');
    const admins = await User.find({ role: 'admin', isApproved: true });

    if (!admins || admins.length === 0) {
      console.warn('⚠️ No approved admin users found.');
      return res.status(404).json({ error: 'No approved admins found.' });
    }

    const admin = admins[0];
    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    const adminEmails = admins.map(user => user.email);
    console.log(`✅ Found ${adminEmails.length} approved admin(s): ${adminEmails.join(', ')}`);

    // Step 2: Generate PDF
    console.log('🧾 Launching Puppeteer to generate PDF...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Inject JWT token into localStorage
    await page.evaluateOnNewDocument((accessToken) => {
      localStorage.setItem('accessToken', accessToken);
    }, token);
    console.log('📦 JWT injected into localStorage');

    const targetUrl = `https://insurance-guide-frontend.vercel.app/printable-page?accessToken=${token}`;
    console.log(`🌐 Navigating to: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'networkidle0' });

    // Use screen CSS
    await page.emulateMediaType('screen');

    // Wait to ensure all content has rendered
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Let CSS define PDF size
    const pdfBuffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();
    console.log(`✅ PDF generated. Buffer size: ${pdfBuffer.length}`);

    // Step 3: Send email
    console.log('📧 Setting up Nodemailer transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"HokenHub" <${process.env.EMAIL_USERNAME}>`,
      to: adminEmails,
      subject: 'HokenHub Report PDF',
      text: 'Here is the latest report PDF.',
      attachments: [
        {
          filename: 'report.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    console.log('📤 Sending email with PDF attachment...');
    const emailResult = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${emailResult.response}`);

    res.status(200).json({ message: `Email sent to ${adminEmails.join(', ')}` });
  } catch (err) {
    console.error('❌ Error in send-pdf route:', err);
    res.status(500).json({ error: 'Failed to send PDF email' });
  }
});

export default router;
