// auth.routes.ts - ADD THIS LINE
import express from 'express';
import { register, login, logout, verifyEmail } from '../controllers/auth.controller';
import { getUserProfile } from '../controllers/user.controller'; // ADD THIS IMPORT
import { authMiddleware } from '../middlewares/auth.middleware'; // ADD THIS IMPORT

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/verify-email', verifyEmail);

// ADD THIS LINE - This is what your frontend is calling
router.get('/me', authMiddleware, getUserProfile);

export default router;