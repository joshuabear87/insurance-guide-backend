import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

// Placeholder for password reset
export const forgotPassword = (req, res) => {
  res.json({ message: 'Forgot password functionality coming soon.' });
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
