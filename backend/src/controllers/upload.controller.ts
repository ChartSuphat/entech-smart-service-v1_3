// controllers/upload.controller.ts - FIXED VERSION

import { Request, Response } from 'express';
import { uploadConfigs, deleteOldUserFile, getFileUrl, handleUploadError } from '../middlewares/upload.middleware';
import { getUserById, updateUserAvatar, updateUserSignature } from '../services/user.service';

// AVATAR UPLOAD
export const uploadAvatar = uploadConfigs.avatar.single('avatar');

export const handleAvatarUpload = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No avatar file uploaded' 
      });
    }

    const userId = (req as any).userId;
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required' 
      });
    }

    const currentUser = await getUserById(userId);
    const oldAvatarFilename = currentUser?.avatar;

    // Store the full filename as-is
    const fullFilename = req.file.filename;

    // Save full filename to database
    await updateUserAvatar(userId, fullFilename);

    // Delete old file (if exists)
    if (oldAvatarFilename) {
      deleteOldUserFile(userId, 'avatars', oldAvatarFilename);
    }

    console.log(`Avatar uploaded for user ${userId}:`, fullFilename);

    res.json({ 
      success: true,
      message: 'Avatar uploaded successfully',
      filename: fullFilename,
      url: `/uploads/avatars/${fullFilename}`,
      userId: userId,
      size: req.file.size
    });
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Avatar upload failed', 
      error: error.message 
    });
  }
};

// SIGNATURE UPLOAD
export const uploadSignature = uploadConfigs.signature.single('signature');

export const handleSignatureUpload = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No signature file uploaded' 
      });
    }

    const userId = (req as any).userId;
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required' 
      });
    }

    const currentUser = await getUserById(userId);
    const oldSignatureFilename = currentUser?.signature;

    // Store the full filename as-is
    const fullFilename = req.file.filename;

    // Save full filename to database
    await updateUserSignature(userId, fullFilename);

    // Delete old file (if exists)
    if (oldSignatureFilename) {
      deleteOldUserFile(userId, 'signatures', oldSignatureFilename);
    }

    console.log(`Signature uploaded for user ${userId}:`, fullFilename);

    res.json({ 
      success: true,
      message: 'Signature uploaded successfully',
      filename: fullFilename,
      url: `/uploads/signatures/${fullFilename}`,
      userId: userId,
      size: req.file.size
    });
  } catch (error: any) {
    console.error('Signature upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Signature upload failed', 
      error: error.message 
    });
  }
};

// CERTIFICATE UPLOAD
export const uploadCertificate = uploadConfigs.certificate.single('certificate');

export const handleCertificateUpload = (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No certificate file uploaded' 
      });
    }

    // const baseUrl = process.env.BASE_URL || 'http://localhost:4040';
    const certificatePath = `/uploads/certificates/${req.file.filename}`;
    
    console.log('Certificate uploaded:', req.file.filename);

    res.json({ 
      success: true,
      message: 'Certificate uploaded successfully',
      filename: req.file.filename,
      url: certificatePath,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error: any) {
    console.error('Certificate upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Certificate upload failed', 
      error: error.message 
    });
  }
};

// TOOL IMAGE UPLOAD
export const uploadToolImage = uploadConfigs.tool.single('toolImage');

export const handleToolImageUpload = (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No tool image uploaded' 
      });
    }

    // Use BASE_URL from environment
    // const baseUrl = process.env.BASE_URL || 'http://localhost:4040';
    const toolImagePath = `/uploads/tools/${req.file.filename}`;
    
    console.log('Tool image uploaded:', req.file.filename);

    res.json({ 
      success: true,
      message: 'Tool image uploaded successfully',
      filename: req.file.filename,
      url: toolImagePath,  // ✅ Full URL with BASE_URL
      size: req.file.size
    });
  } catch (error: any) {
    console.error('Tool image upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Tool image upload failed', 
      error: error.message 
    });
  }
};

// DOCUMENT UPLOAD
export const uploadDocument = uploadConfigs.document.single('document');

export const handleDocumentUpload = (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No document uploaded' 
      });
    }

    const documentPath = `/uploads/documents/${req.file.filename}`;
    console.log('Document uploaded:', req.file.filename);

    res.json({ 
      success: true,
      message: 'Document uploaded successfully',
      filename: req.file.filename,
      url: documentPath,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error: any) {
    console.error('Document upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Document upload failed', 
      error: error.message 
    });
  }
};

// PROFILE UPLOAD (Avatar + Signature)
export const uploadProfileMultiple = uploadConfigs.avatar.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'signature', maxCount: 1 }
]);

export const handleProfileFileUpload = async (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const userId = (req as any).userId;
    
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No files uploaded' 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required for profile uploads' 
      });
    }

    const currentUser = await getUserById(userId);
    const result: any = { userId };

    // Handle avatar upload
    if (files.avatar && files.avatar[0]) {
      const avatarFile = files.avatar[0];
      const fullFilename = avatarFile.filename;
      
      // Update database with full filename
      await updateUserAvatar(userId, fullFilename);
      
      // Delete old avatar
      if (currentUser?.avatar) {
        deleteOldUserFile(userId, 'avatars', currentUser.avatar);
      }

      result.avatar = {
        filename: fullFilename,
        url: `/uploads/avatars/${fullFilename}`,
        size: avatarFile.size
      };
      console.log(`Avatar updated for user ${userId}`);
    }

    // Handle signature upload
    if (files.signature && files.signature[0]) {
      const signatureFile = files.signature[0];
      const fullFilename = signatureFile.filename;
      
      // Update database with full filename
      await updateUserSignature(userId, fullFilename);
      
      // Delete old signature
      if (currentUser?.signature) {
        deleteOldUserFile(userId, 'signatures', currentUser.signature);
      }

      result.signature = {
        filename: fullFilename,
        url: `/uploads/signatures/${fullFilename}`,
        size: signatureFile.size
      };
      console.log(`Signature updated for user ${userId}`);
    }

    res.json({ 
      success: true,
      message: 'Profile files uploaded successfully',
      files: result
    });
  } catch (error: any) {
    console.error('Profile upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Profile file upload failed', 
      error: error.message 
    });
  }
};

// TOOL FILES (Certificate + Tool Image)
export const uploadToolFiles = uploadConfigs.certificate.fields([
  { name: 'certFile', maxCount: 1 },
  { name: 'toolImage', maxCount: 1 }
]);

export const handleToolFileUpload = (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No files uploaded' 
      });
    }

    const result: any = {};

    if (files.certFile && files.certFile[0]) {
      const certFile = files.certFile[0];
      result.certFile = {
        filename: certFile.filename,
        url: `/uploads/certificates/${certFile.filename}`,
        size: certFile.size
      };
    }

    if (files.toolImage && files.toolImage[0]) {
      const toolFile = files.toolImage[0];
      result.toolImage = {
        filename: toolFile.filename,
        url: `/uploads/tools/${toolFile.filename}`,
        size: toolFile.size
      };
    }

    console.log('Tool files uploaded:', Object.keys(result));

    res.json({ 
      success: true,
      message: 'Tool files uploaded successfully',
      files: result
    });
  } catch (error: any) {
    console.error('Tool files upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Tool files upload failed', 
      error: error.message 
    });
  }
};

// FILE MANAGEMENT
export const getFileInfo = (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const categories = ['avatars', 'signatures', 'certificates', 'documents', 'tools', 'reports'];
    
    for (const category of categories) {
      try {
        const filePath = require('path').join(process.cwd(), 'uploads', category, filename);
        const fs = require('fs');
        
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          return res.json({
            success: true,
            data: {
              filename,
              category,
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
              url: `/uploads/${category}/${filename}`
            }
          });
        }
      } catch (error) {
        continue;
      }
    }

    res.status(404).json({
      success: false,
      message: 'File not found'
    });
  } catch (error: any) {
    console.error('File info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get file info',
      error: error.message
    });
  }
};

export const testDeletion = async (req: Request, res: Response) => {
  try {
    const userId = 1;
    const oldFilename = "sig-1-1755864042600.png"; // Full filename
    
    console.log("Testing deletion:");
    console.log("User ID:", userId);
    console.log("Old filename:", oldFilename);
    
    const result = deleteOldUserFile(userId, 'signatures', oldFilename);
    
    console.log("Deletion result:", result);
    
    const fs = require('fs');
    const path = require('path');
    const expectedPath = path.join(process.cwd(), 'uploads', 'signatures', oldFilename);
    const fileExists = fs.existsSync(expectedPath);
    
    res.json({
      success: true,
      data: {
        userId,
        oldFilename,
        expectedPath,
        fileExists,
        deletionResult: result
      }
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const listUserFiles = async (req: Request, res: Response) => {
  try {
    const userId = 1;
    const fs = require('fs');
    const path = require('path');
    
    const signaturesDir = path.join(process.cwd(), 'uploads', 'signatures');
    const allFiles = fs.readdirSync(signaturesDir);
    const userFiles = allFiles.filter((file: string) => file.startsWith(`sig-${userId}-`));
    
    const { getUserById } = require('../services/user.service');
    const user = await getUserById(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        allFiles,
        userFiles,
        databaseSignature: user?.signature,
        shouldDelete: userFiles.length > 1 ? userFiles.slice(0, -1) : []
      }
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// BACKWARD COMPATIBILITY EXPORTS
export const uploadSingle = uploadConfigs.document.single('file');
export const handleFileUpload = handleDocumentUpload;
export const uploadMultiple = uploadToolFiles;
export const handleMultipleFileUpload = handleToolFileUpload;
export const uploadSignatureOnly = uploadSignature;
export const uploadCertificateFiles = uploadCertificate;
export const handleCertificateFileUpload = handleCertificateUpload;