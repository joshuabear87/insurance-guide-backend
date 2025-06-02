import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      role: user.role,
      facilityAccess: user.facilityAccess,
      requestedFacility: user.requestedFacility,
      phoneNumber: user.phoneNumber,
      department: user.department,
      npi: user.npi,
      status: user.status,
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserProfile = async (req, res) => {
  console.log('🛬 PUT /auth/me hit by:', req.user);

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      console.warn('❌ No user found');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✍️ Updating user with:', req.body);

    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
    user.department = req.body.department || user.department;

    if (req.body.npi && req.body.npi !== user.npi) {
      if (!/^\d{10}$/.test(req.body.npi)) return res.status(400).json({ message: 'Invalid NPI' });
      user.npi = req.body.npi;
    }

    const updatedUser = await user.save();
    console.log('✅ User saved:', updatedUser);

    res.status(200).json({
      success: true,
      data: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        department: updatedUser.department,
        npi: updatedUser.npi,
      },
    });
  } catch (err) {
    console.error('💥 Update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
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
    if (Array.isArray(req.body.facilityAccess)) {
      user.facilityAccess = req.body.facilityAccess;
    }
    if (req.body.requestedFacility) {
      user.requestedFacility = req.body.requestedFacility;
    }
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
    user.department = req.body.department || user.department;

    if (req.body.npi && req.body.npi !== user.npi) {
      if (!/^\d{10}$/.test(req.body.npi)) return res.status(400).json({ message: 'Invalid NPI' });
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
