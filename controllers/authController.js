import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { transporter } from '../util/sendEmail.js';

const isValidNPI = (npi) => /^\d{10}$/.test(npi);

const generateAccessToken = (user, activeFacility) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      activeFacility,
      facilityAccess: user.facilityAccess,
    },
    process.env.JWT_SECRET,
    { expiresIn: '3h' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      facilityAccess: user.facilityAccess,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

export const registerUser = async (req, res) => {
  const { firstName, lastName, email, password, requestedFacility, phoneNumber, department, npi } = req.body;

  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (!phoneNumber || !requestedFacility || !isValidNPI(npi)) {
      return res.status(400).json({ message: 'Missing or invalid required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      requestedFacility,
      facilityAccess: [],
      phoneNumber,
      department,
      npi,
      role: 'user',
      isApproved: false,
    });

    const adminUsers = await User.find({ role: 'admin', isApproved: true });
    const adminEmails = adminUsers.map(admin => admin.email).join(',');

    const mailOptions = {
      from: `"HokenHub Notifications" <${process.env.EMAIL_USERNAME}>`,
      to: adminEmails,
      subject: `🆕 New User Registration - ${firstName} ${lastName}`,
      html: `
        <p>A new user has registered:</p>
        <ul>
          <li><strong>Name:</strong> ${firstName} ${lastName}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Requested Facility:</strong> ${requestedFacility}</li>
          <li><strong>Phone:</strong> ${phoneNumber}</li>
          <li><strong>Department:</strong> ${department || 'Not provided'}</li>
          <li><strong>NPI:</strong> ${npi}</li>
        </ul>
        <p>Login to approve or review this user.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(201).json({ message: 'Registration successful. Awaiting approval.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password, activeFacility } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'Account pending approval' });
    }

    if (!user.facilityAccess.includes(activeFacility)) {
      return res.status(403).json({ message: 'Access denied to selected facility' });
    }

    const accessToken = generateAccessToken(user, activeFacility);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      facilityAccess: user.facilityAccess,
      requestedFacility: user.requestedFacility,
      phoneNumber: user.phoneNumber,
      department: user.department,
      npi: user.npi,
      activeFacility,
      accessToken,
    });
  } catch (err) {
    console.error('❗ Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: 'If your email exists, a password reset link has been sent.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const resetLink = `https://insurance-guide-frontend.vercel.app/reset-password/${token}`;

    const mailOptions = {
      from: `"HokenHub Support" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: 'Reset Your Password - HokenHub',
      html: `
        <p>Hello,</p>
        <p>You requested to reset your password. Please click the link below:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'If your email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('❌ Reset password error:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Reset link expired. Please request a new one.' });
    }
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

export const refreshAccessToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const { activeFacility } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (!activeFacility || !decoded.facilityAccess?.includes(activeFacility)) {
      return res.status(400).json({ message: 'Invalid or missing active facility' });
    }

    const newAccessToken = generateAccessToken(decoded, activeFacility);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

export const logoutUser = (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

export const setActiveFacility = async (req, res) => {
  const { activeFacility } = req.body;

  if (!req.user.facilityAccess.includes(activeFacility)) {
    return res.status(403).json({ message: 'Access to this facility is not granted.' });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const token = generateAccessToken(user, activeFacility);

  res.json({ token });
};
