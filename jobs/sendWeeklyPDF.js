import cron from 'node-cron';
import generatePDF from '../utils/generatePDF.js';
import sendEmail from '../utils/sendEmail.js';
import User from '../models/userModel.js';

const PDF_URL = process.env.FRONTEND_URL + '/printable-page';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const sendWeeklyPDF = async () => {
  try {
    console.log('🖨️ Generating weekly PDF...');
    const pdfBuffer = await generatePDF(PDF_URL);

    const admins = await User.find({
      role: 'admin',
      isApproved: true,
      email: { $ne: 'admin@example.com' },
    });

    const validAdmins = admins.filter((a) => isValidEmail(a.email));

    if (validAdmins.length === 0) {
      console.warn('⚠️ No valid admin recipients found. Aborting email.');
      return;
    }

    for (const admin of validAdmins) {
      await sendEmail({
        to: admin.email,
        subject: 'Weekly Insurance Plan Directory (PDF)',
        html: `
          <p>Hi ${admin.username},</p>
          <p>The latest version of the insurance plan directory is attached as a PDF.</p>
          <p>If you have any questions or need changes, please use the <strong>Request Update</strong> feature in the app.</p>
          <p>Thanks,<br/>HokenHub Team</p>
        `,
        pdfBuffer,
        pdfFilename: 'InsurancePlans.pdf',
      });
    }

    console.log('✅ Weekly PDF sent to all valid admins');
  } catch (err) {
    console.error('❌ Error sending weekly PDF:', err.message);
  }
};

// 🕒 Every Monday at 7 AM
cron.schedule('0 7 * * 1', sendWeeklyPDF);

export default sendWeeklyPDF;
