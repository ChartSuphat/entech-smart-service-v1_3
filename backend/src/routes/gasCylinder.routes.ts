import express, { Request, Response } from 'express';
import { createGasCylinder, getGasCylinders } from '../controllers/gasCylinder.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  checkPsiAlarms,
  checkExpiredCylinders,
  checkNearExpiryCylinders,
  checkMonthlyPsiUpdate,
  calculateRemainingValue
} from '../services/alarmTrackingSystem.service';

// ✅ Create upload middleware directly here (temporary fix)
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

const router = express.Router();

router.post('/create', authMiddleware, createGasCylinder);
router.get('/', authMiddleware, getGasCylinders);

// Upload image
router.post('/uploadImage', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File;
  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
  res.json({ url: fileUrl });
});

// Upload certificate
router.post('/uploadCert', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File;
  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
  res.json({ url: fileUrl });
});

// For alarm tracking systems
router.get('/alarms/psi', authMiddleware, checkPsiAlarms);
router.get('/alarms/expired', authMiddleware, checkExpiredCylinders);
router.get('/alarms/near-expiry', authMiddleware, checkNearExpiryCylinders);
router.get('/alarms/monthly-check', authMiddleware, checkMonthlyPsiUpdate);
router.get('/alarms/cost', authMiddleware, calculateRemainingValue);

export default router;