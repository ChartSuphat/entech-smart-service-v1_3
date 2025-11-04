// routes/tool.routes.ts
import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  createTool,
  getTools,
  getToolById,
  updateTool,
  deleteTool,
} from '../controllers/tools.controller';

const router = express.Router();

// Protect all tool routes with authMiddleware
router.use(authMiddleware);

router.post('/', createTool);
router.get('/', getTools);
router.get('/:id', getToolById);
router.post('/:id', updateTool);
router.delete('/:id', deleteTool);

export default router;
