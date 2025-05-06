import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// Validate NPI
const isValidNPI = (npi) => /^\d{10}$/.test(npi);

// Token Generators
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Register
export const registerUser = async (req, res) => {
  const { username, email, password, facilityName, phoneNumber, department, npi } = req.body;

  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (!phoneNumber) return res.status(400).json({ message: 'Phone number is required' });
    if (!isValidNPI(npi)) return res.status(400).json({ message: 'Invalid NPI' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      facilityName,
      phoneNumber,
      department,
      npi,
      role: 'user',
      isApproved: false,
    });

    res.status(201).json({ message: 'Registration successful. Awaiting approval.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isApproved) return res.status(403).json({ message: 'Account pending approval' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      facilityName: user.facilityName,
      phoneNumber: user.phoneNumber,
      department: user.department,
      npi: user.npi,
      accessToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Refresh
export const refreshAccessToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = generateAccessToken(decoded);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

// Logout
export const logoutUser = (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    // Always respond with generic message to prevent user enumeration
    if (!user) {
      return res.status(200).json({ message: 'If your email exists, a password reset link has been sent.' });
    }

    // Generate a short-lived JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    // Construct frontend URL with token
    const resetLink = `https://insurance-guide-frontend.vercel.app/reset-password/${token}`;

    // Setup mail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"HokenHub Support" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: 'Reset Your Password - HokenHub',
      text: `Click the link to reset your password: ${resetLink}`,
      html: `
        <p>Hello,</p>
        <p>You requested to reset your password. Please click the link below:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}: ${info.response}`);

    res.status(200).json({ message: 'If your email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Missing token or password' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

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

// Get own profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) res.json(user);
    else res.status(404).json({ message: 'User not found' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update own profile
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
    user.department = req.body.department || user.department;

    if (req.body.npi && req.body.npi !== user.npi) {
      if (!isValidNPI(req.body.npi)) return res.status(400).json({ message: 'Invalid NPI' });
      user.npi = req.body.npi;
    }

    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      facilityName: updatedUser.facilityName,
      phoneNumber: updatedUser.phoneNumber,
      department: updatedUser.department,
      npi: updatedUser.npi,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin actions
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isApproved = true;
    user.status = 'approved';
    await user.save();

    res.json({ message: 'User approved successfully' });
  } catch (err) {
    console.error('Error approving user:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const makeAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = 'admin';
    await user.save();
    res.json({ message: 'User promoted to admin' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const demoteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'admin') return res.status(400).json({ message: 'User is not an admin' });

    user.role = 'user';
    await user.save();
    res.json({ message: 'User demoted to regular user' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserByAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.facilityName = req.body.facilityName || user.facilityName;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
    user.department = req.body.department || user.department;

    if (req.body.npi && req.body.npi !== user.npi) {
      if (!isValidNPI(req.body.npi)) return res.status(400).json({ message: 'Invalid NPI' });
      user.npi = req.body.npi;
    }

    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      facilityName: updatedUser.facilityName,
      phoneNumber: updatedUser.phoneNumber,
      department: updatedUser.department,
      npi: updatedUser.npi,
    });
  } catch (err) {
    console.error('Admin update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.email === 'admin@example.com') return res.status(403).json({ message: 'Cannot delete Super Admin account.' });

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendBroadcastEmail = async (req, res) => {
  try {
    // Must be admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const { subject, message } = req.body;
    const file = req.file;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    const users = await User.find({ isApproved: true });
    const recipients = users.map(user => user.email);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"HokenHub" <${process.env.EMAIL_USERNAME}>`,
      to: recipients,
      subject,
      html: `<p>${message}</p>`,
      attachments: file
        ? [{
            filename: file.originalname,
            content: file.buffer,
          }]
        : [],
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Broadcast email sent to all users.' });

  } catch (err) {
    console.error('❌ Broadcast error:', err);
    res.status(500).json({ message: 'Failed to send broadcast email.' });
  }
};
