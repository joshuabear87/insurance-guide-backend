import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('🔒 Missing or malformed token');
    return res.status(401).json({ message: 'Unauthorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      facilityAccess: user.facilityAccess,
      requestedFacility: user.requestedFacility,
      activeFacility: decoded.activeFacility,
    };

    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }

    res.status(401).json({ message: 'Invalid token' });
  }
};

// ✅ Renamed for clarity
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    console.warn('⚠️ No user info attached to request');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.user.role !== 'admin') {
    console.warn(`🚫 Access denied: User ${req.user.email} is not admin`);
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};
