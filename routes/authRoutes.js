import express from 'express';
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  logoutUser
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { getUserProfile, updateUserProfile } from '../controllers/userController.js';
import { setActiveFacility } from '../controllers/authController.js';



const router = express.Router();

// Public Auth Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh', refreshAccessToken);
router.post('/set-facility', protect, setActiveFacility);

// Protected Self-Service Routes
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getUserProfile);
router.put('/me', protect, updateUserProfile);

// Health Check
router.get('/validate-token', protect, (req, res) => {
  res.status(200).json({ valid: true });
});

export default router;
