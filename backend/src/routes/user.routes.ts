// routes/user.routes.ts - COMPLETE VERSION WITH ADMIN USER MANAGEMENT

import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  updateFullName,
  deleteUserAvatar,
  deleteUserSignature,
  changePassword,
  adminResetPassword,
  getAllUsers,
  deleteUser,
  updateUserRole,
  toggleUserStatus,
  getUserStats,
  manualVerifyUser,
  assignCompanyCode
} from '../controllers/user.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = express.Router();

// ========================================
// PROFILE ROUTES (AUTHENTICATED USER)
// ========================================

// Get current user profile
router.get('/profile', authMiddleware, getUserProfile);

// Update current user profile (basic info only - no files)
router.post('/profile', authMiddleware, updateUserProfile);

// Change password
router.post('/change-password', authMiddleware, changePassword);

// Update full name
router.post('/profile/name', authMiddleware, updateFullName);

// Delete avatar
router.delete('/profile/avatar', authMiddleware, deleteUserAvatar);

// Delete signature
router.delete('/profile/signature', authMiddleware, deleteUserSignature);

// ========================================
// ADMIN USER MANAGEMENT ROUTES
// ========================================

// Get user statistics (admin only) - must be before /:id routes
router.get('/stats', authMiddleware, requireRole('admin'), getUserStats);

// Get all users (admin only)
router.get('/', authMiddleware, requireRole('admin'), getAllUsers);

// Update user role (admin only) - user → technician → admin
router.post('/:id/role', authMiddleware, requireRole('admin'), updateUserRole);

// Toggle user active/inactive status (admin only)
router.post('/:id/status', authMiddleware, requireRole('admin'), toggleUserStatus);

// Update specific user's full name (admin only)
router.post('/:id/name', authMiddleware, requireRole('admin'), updateFullName);

// Delete specific user's avatar (admin only)
router.delete('/:id/avatar', authMiddleware, requireRole('admin'), deleteUserAvatar);

// Delete specific user's signature (admin only)
router.delete('/:id/signature', authMiddleware, requireRole('admin'), deleteUserSignature);

// Change specific user's password (admin only - requires old password)
router.post('/:id/password', authMiddleware, requireRole('admin'), changePassword);

// Reset user password (admin only - NO old password needed)
router.post('/:id/reset-password', authMiddleware, requireRole('admin'), adminResetPassword);

// Assign company code to user (admin only)
router.post('/:id/assign-company', authMiddleware, requireRole('admin'), assignCompanyCode);

// Delete user (admin only)
router.delete('/:id', authMiddleware, requireRole('admin'), deleteUser);
router.post('/:id/verify-manual', authMiddleware, requireRole('admin'), manualVerifyUser);
export default router;

/*
ROUTE SUMMARY:

PROFILE ROUTES (All Users):
- GET    /api/users/profile              - Get current user profile
- PUT    /api/users/profile              - Update current user profile
- PUT    /api/users/change-password      - Change current user password
- PUT    /api/users/profile/name         - Update current user full name
- DELETE /api/users/profile/avatar       - Delete current user avatar
- DELETE /api/users/profile/signature    - Delete current user signature

ADMIN ROUTES (Admin Only):
- GET    /api/users/stats                - Get user statistics
- GET    /api/users                      - Get all users
- PATCH  /api/users/:id/role             - Update user role
- PATCH  /api/users/:id/status           - Toggle user active status
- PUT    /api/users/:id/name             - Update specific user full name
- DELETE /api/users/:id/avatar           - Delete specific user avatar
- DELETE /api/users/:id/signature        - Delete specific user signature
- PUT    /api/users/:id/password         - Change specific user password
- DELETE /api/users/:id                  - Delete user

FILE UPLOADS (handled by upload controller):
- POST   /api/upload/avatar?userId=1     - Upload avatar
- POST   /api/upload/signature?userId=1  - Upload signature
*/