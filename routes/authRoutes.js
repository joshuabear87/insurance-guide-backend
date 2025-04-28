import express from 'express';
import { registerUser, loginUser, forgotPassword, getUserProfile, updateUserProfile, refreshAccessToken, logoutUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);

// Private Routes (Logged in users only)
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logoutUser);

export default router;
