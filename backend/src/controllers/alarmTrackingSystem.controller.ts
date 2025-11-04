import {
  getPsiAlarms,
  getExpiredCylinders,
  getNearExpiryCylinders,
  getMonthlyCheckReminder,
  getRemainingValue
} from '../services/alarmTrackingSystem.service';
import { Request, Response } from 'express';

export const handleGetPsiAlarms = (req: Request, res: Response) => getPsiAlarms(req, res);
export const handleGetExpired = (req: Request, res: Response) => getExpiredCylinders(req, res);
export const handleGetNearExpiry = (req: Request, res: Response) => getNearExpiryCylinders(req, res);
export const handleMonthlyCheck = (req: Request, res: Response) => getMonthlyCheckReminder(req, res);
export const handleCostCalculation = (req: Request, res: Response) => getRemainingValue(req, res);
