// authMiddleware.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Middleware: Protect Routes
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('🔒 Missing or malformed token');
    return res.status(401).json({ message: 'Unauthorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware: Admin Check
export const admin = (req, res, next) => {
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
