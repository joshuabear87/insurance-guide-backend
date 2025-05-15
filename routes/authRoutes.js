import express from 'express';
import { registerUser, loginUser, forgotPassword, getUserProfile, updateUserProfile, refreshAccessToken, logoutUser, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', logoutUser);

// Private Routes (Logged in users only)
router.get('/me', protect, getUserProfile);
router.put('/update', protect, updateUserProfile);
router.post('/refresh', refreshAccessToken);

export default router;
