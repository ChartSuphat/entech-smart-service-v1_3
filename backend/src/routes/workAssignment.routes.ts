import express from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';
import {
  getWorkAssignments,
  getWorkAssignmentStats,
  getWorkAssignmentById,
  createWorkAssignment,
  updateWorkAssignment,
  deleteWorkAssignment,
  generateWorkAssignmentPDF,
  previewWorkAssignmentPDF,
  signWorkAssignment
} from '../controllers/workAssignment.controller';

const router = express.Router();

router.use(authMiddleware);

router.get('/stats', getWorkAssignmentStats);
router.get('/', getWorkAssignments);
router.get('/:id/pdf', generateWorkAssignmentPDF);
router.get('/:id/preview', previewWorkAssignmentPDF);
router.post('/:id/sign', signWorkAssignment);
router.get('/:id', getWorkAssignmentById);
router.post('/', requireRole(['admin', 'technician']), createWorkAssignment);
router.put('/:id', requireRole(['admin', 'technician']), updateWorkAssignment);
router.delete('/:id', requireRole(['admin', 'technician']), deleteWorkAssignment);

export default router;
