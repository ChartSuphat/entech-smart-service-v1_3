// routes/tool.routes.ts
import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  createTool,
  getTools,
  getToolById,
  updateTool,
  deleteTool,
  toggleBlockTool,
} from '../controllers/tools.controller';
import { requireRole } from '../middlewares/auth.middleware';

const router = express.Router();

// Protect all tool routes with authMiddleware
router.use(authMiddleware);

router.post('/', createTool);
router.get('/', getTools);
router.get('/:id', getToolById);
router.post('/:id', updateTool);
router.delete('/:id', deleteTool);
router.patch('/:id/block', requireRole('admin'), toggleBlockTool);

export default router;
