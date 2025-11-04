import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  handleGetPsiAlarms,
  handleGetExpired,
  handleGetNearExpiry,
  handleMonthlyCheck,
  handleCostCalculation
} from '../controllers/alarmTrackingSystem.controller';

const router = express.Router();

router.get('/psi', authMiddleware, handleGetPsiAlarms);
router.get('/expired', authMiddleware, handleGetExpired);
router.get('/near-expiry', authMiddleware, handleGetNearExpiry);
router.get('/monthly-check', authMiddleware, handleMonthlyCheck);
router.get('/cost', authMiddleware, handleCostCalculation);

export default router;
