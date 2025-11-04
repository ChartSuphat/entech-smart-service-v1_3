// middleware/admin.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const requireAdmin = (req: any, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated and has admin role
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
};