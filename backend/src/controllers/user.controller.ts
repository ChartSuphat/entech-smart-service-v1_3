// controllers/user.controller.ts - FIXED VERSION

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// FIXED: Helper function to delete user files with proper path construction
const deleteUserFile = (userId: number, category: string, filename: string | null) => {
  if (!filename) return;
  
  try {
    // Handle different filename formats
    let actualFilename: string;
    
    if (filename.startsWith('/uploads/')) {
      // Old format: "/uploads/signatures/sig-1-1755864077657.png"
      actualFilename = path.basename(filename);
    } else if (filename.includes('sig-') || filename.includes('ava-')) {
      // Full filename: "sig-1-1755864077657.png"
      actualFilename = filename;
    } else {
      // Timestamp part only: "1755864077657.png"
      const prefix = category === 'signatures' ? 'sig' : 'ava';
      actualFilename = `${prefix}-${userId}-${filename}`;
    }
    
    const fullPath = path.join(process.cwd(), 'uploads', category, actualFilename);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`Deleted old ${category} file:`, actualFilename);
    } else {
      console.log(`${category} file not found:`, actualFilename);
    }
  } catch (error) {
    console.error(`Error deleting ${category} file:`, filename, error);
  }
};

// Get user profile
export const getUserProfile = async (req: any, res: Response) => {
  try {
    console.log("Hello");
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    console.log('A')

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        avatar: true,
        signature: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log("user: ", user)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log("b");

    // FIXED: Construct proper URLs for frontend
    const responseUser = {
      ...user,
      avatarUrl: user.avatar ? `/uploads/avatars/ava-${userId}-${user.avatar}` : null,
      signatureUrl: user.signature ? `/uploads/signatures/sig-${userId}-${user.signature}` : null
    };

    console.log("responseUser: ", responseUser)

    res.json({
      success: true,
      data: responseUser
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// SIMPLIFIED: Update user profile (basic info only, no file handling)
export const updateUserProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { fullName, email } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const updateData: any = {};
    
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        avatar: true,
        signature: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Construct URLs for response
    const responseUser = {
      ...updatedUser,
      avatarUrl: updatedUser.avatar ? `/uploads/avatars/ava-${userId}-${updatedUser.avatar}` : null,
      signatureUrl: updatedUser.signature ? `/uploads/signatures/sig-${userId}-${updatedUser.signature}` : null
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: responseUser
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Update Full Name only
export const updateFullName = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id || parseInt(req.params.id);
    const { fullName } = req.body;

    if (!fullName || fullName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Full name is required'
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { fullName: fullName.trim() },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        avatar: true,
        signature: true
      }
    });

    res.json({
      success: true,
      message: 'Full name updated successfully',
      data: updated
    });
  } catch (error: any) {
    console.error('Error updating full name:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update full name',
      error: error.message
    });
  }
};

// REMOVED: updateAvatar and updateSignature methods
// These should only be handled by the upload controller to maintain consistency

// Delete user avatar
export const deleteUserAvatar = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id || parseInt(req.params.id);

    // Get current avatar
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete file
    if (user.avatar) {
      deleteUserFile(userId, 'avatars', user.avatar);
    }

    // Remove from database
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        avatar: true,
        signature: true
      }
    });

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
      data: updated
    });
  } catch (error: any) {
    console.error('Error deleting avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete avatar',
      error: error.message
    });
  }
};

// Delete user signature
export const deleteUserSignature = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id || parseInt(req.params.id);

    // Get current signature
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { signature: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete file
    if (user.signature) {
      deleteUserFile(userId, 'signatures', user.signature);
    }

    // Remove from database
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { signature: null },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        avatar: true,
        signature: true
      }
    });

    res.json({
      success: true,
      message: 'Signature deleted successfully',
      data: updated
    });
  } catch (error: any) {
    console.error('Error deleting signature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete signature',
      error: error.message
    });
  }
};

// Change Password
export const changePassword = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id || parseInt(req.params.id);
    const { currentPassword, oldPassword, newPassword } = req.body;
    
    const currentPwd = currentPassword || oldPassword;

    if (!currentPwd || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPwd, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error: any) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Delete user (admin only)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    // Get user data before deletion to clean up files
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatar: true,
        signature: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete associated files
    console.log('Deleting user and associated files...');
    deleteUserFile(userId, 'avatars', user.avatar);
    deleteUserFile(userId, 'signatures', user.signature);

    // Delete user from database
    const deletedUser = await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      success: true,
      message: 'User and associated files deleted successfully',
      data: {
        id: deletedUser.id,
        username: deletedUser.username
      }
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    // Validate role (matching your Prisma schema)
    const validRoles = ['admin', 'technician', 'user']; // Your actual roles from schema
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Valid roles are: ' + validRoles.join(', ')
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: `User role updated from ${existingUser.role} to ${role}`,
      data: updatedUser
    });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
};

// Toggle user active status (admin only)
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    // Get current user status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, isActive: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Toggle status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser
    });
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};
// Manual verification by admin
export const manualVerifyUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: true,
        verifyToken: null // Clear verification token
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true
      }
    });

    res.json({
      success: true,
      message: 'User manually verified by admin',
      data: updatedUser
    });
  } catch (error: any) {
    console.error('Error verifying user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify user',
      error: error.message
    });
  }
};
// Get user statistics (admin only)
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { isActive: true }
    });
    const inactiveUsers = totalUsers - activeUsers;

    // Count by role
    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    // Recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    const stats = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      recentUsers,
      roleBreakdown: roleStats.reduce((acc, stat) => {
        acc[stat.role] = stat._count.role;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
};