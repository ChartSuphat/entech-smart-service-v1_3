import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as equipmentController from '../controllers/equipment.controller';
import * as probeController from '../controllers/probe.controller';

const router = express.Router();

// All routes need auth
router.get('/probes', authMiddleware, probeController.getAllProbes);
router.get('/probes/stats', authMiddleware, probeController.getProbeStats);
router.get('/probes/:id', authMiddleware, probeController.getProbeById);
router.post('/probes', authMiddleware, probeController.createProbe);
router.post('/probes/:id', authMiddleware, probeController.updateProbe);
router.delete('/probes/:id', authMiddleware, probeController.deleteProbe);

router.get('/', authMiddleware, equipmentController.getAllEquipment);
router.get('/stats', authMiddleware, equipmentController.getEquipmentStats);
router.get('/:id', authMiddleware, equipmentController.getEquipmentById);
router.post('/', authMiddleware, equipmentController.createEquipment);
router.post('/:id', authMiddleware, equipmentController.updateEquipment);
router.delete('/:id', authMiddleware, equipmentController.deleteEquipment);

export default router;