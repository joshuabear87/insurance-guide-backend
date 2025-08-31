import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import { PORT } from './config.js'; // removed mongoDBURL import
import booksRoute from './routes/booksRoute.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import requestUpdateRoute from './routes/requestUpdateRoute.js';
import facilityRoutes from './routes/facilityRoutes.js';
import sendEmail from './util/sendEmail.js';
import User from './models/userModel.js';

import { connectDB, mongoose } from './util/db.js'; // <- shared connector

dotenv.config();

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = [
  'https://insurance-guide-frontend.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

/* ---------- KEEPALIVE / HEALTH CHECK ---------- */
// optional tiny shared-secret so randoms can't ping it
function checkToken(req, res, next) {
  const need = process.env.KEEPALIVE_TOKEN;
  if (!need) return next();
  if (req.get('x-keepalive-token') === need) return next();
  return res.status(403).json({ ok: false });
}

// pings MongoDB to keep the connection pool warm
app.get('/healthz', checkToken, async (_req, res) => {
  try {
    await connectDB(); // ensure connection exists
    await mongoose.connection.db.admin().command({ ping: 1 });
    res.json({ ok: true, ts: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});
/* --------------------------------------------- */

app.use('/facilities', facilityRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/books', booksRoute);
app.use('/admin', adminRoutes);
app.use('/request-update', requestUpdateRoute);

app.get('/send-test-email', async (_req, res) => {
  try {
    const admins = await User.find({ role: 'admin', isApproved: true });
    const toList = admins.map((admin) => admin.email);

    for (const email of toList) {
      await sendEmail({
        to: email,
        subject: 'HokenHub SMTP Test Email',
        html: '<p>This is a test email to all admins.</p>',
      });
    }

    res.send(`✅ Test email sent to: ${toList.join(', ')}`);
  } catch (err) {
    console.error('❌ Test failed:', err);
    res.status(500).send('❌ Email send failed');
  }
});

/* ---------- START SERVER AFTER DB CONNECT ---------- */
const port = process.env.PORT || PORT;

(async () => {
  try {
    // util/db.js reads MONGODB_URI from env; make sure it's set in Render
    await connectDB();
    console.log('✅ App connected to database');
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 API listening on port ${port}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  }
})();
