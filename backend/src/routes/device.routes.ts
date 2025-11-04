import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  createDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
} from '../controllers/device.controller';

const router = express.Router();

// Protect all device routes with authMiddleware
router.use(authMiddleware);

router.post('/', createDevice);
router.get('/', getDevices);
router.get('/:id', getDeviceById);
router.post('/:id', updateDevice);
router.delete('/:id', deleteDevice);

export default router;