import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { sendBroadcastEmail, approveFacilityAccess } from '../controllers/authController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // file stored in memory

const isAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  };  

router.post('/broadcast-email', protect, upload.single('attachment'), sendBroadcastEmail);
router.post('/approve-facility', protect, isAdmin, approveFacilityAccess);

export default router;
