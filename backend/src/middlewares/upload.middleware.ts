// middlewares/upload.middleware.ts - Modified Version with User ID for Avatar/Signature Only

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Environment-based upload directory
const uploadsDir = process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads');

// Add debug logging
console.log('Middleware uploads directory:', uploadsDir);
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// File type definitions
const FILE_TYPES = {
  IMAGES: /\.(jpeg|jpg|png|gif|webp)$/i,
  DOCUMENTS: /\.(pdf|doc|docx)$/i,
  IMAGES_AND_PDF: /\.(jpeg|jpg|png|gif|webp|pdf)$/i,
  ALL_ALLOWED: /\.(jpeg|jpg|png|gif|webp|pdf|doc|docx)$/i
};

const MIME_TYPES = {
  IMAGES: /^image\/(jpeg|jpg|png|gif|webp)$/,
  DOCUMENTS: /^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
  IMAGES_AND_PDF: /^(image\/(jpeg|jpg|png|gif|webp)|application\/pdf)$/
};

// Ensure base directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Create subdirectories
const UPLOAD_FOLDERS = [
  'avatars', 'signatures', 'certificates', 'documents', 
  'tools', 'reports', 'temp', 'backups'
];

UPLOAD_FOLDERS.forEach(folder => {
  const folderPath = path.join(uploadsDir, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`Created ${folder} directory:`, folderPath);
  }
});

// upload.middleware.ts - Fix the createUserBasedFilename function

const createUserBasedFilename = (req: any, file: Express.Multer.File, prefix: string) => {
  // Get userId from authMiddleware (req.userId), NOT from req.body
  const userId = req.userId;
  
  if (!userId) {
    throw new Error('User authentication required');
  }
  
  const timestamp = Date.now();
  const ext = path.extname(file.originalname).toLowerCase();
  
  return `${prefix}-${userId}-${timestamp}${ext}`;
};
// BUSINESS-BASED FILENAME GENERATOR (for certificates, documents, tools, etc.)
const createBusinessFilename = (req: any, file: Express.Multer.File, prefix: string) => {
  const randomName = crypto.randomBytes(12).toString('hex');
  const timestamp = Date.now();
  const ext = path.extname(file.originalname).toLowerCase();
  
  return `${prefix}_${randomName}_${timestamp}${ext}`;
};

// Enhanced storage creator with conditional filename generation
const createStorage = (subfolder: string, useUserId: boolean = false) => multer.diskStorage({
  destination: (req, file, cb) => {
    const targetDir = path.join(uploadsDir, subfolder);
    
    // Double-check directory exists
    if (!fs.existsSync(targetDir)) {
      try {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log('Created directory on-demand:', targetDir);
      } catch (error) {
        console.error('Failed to create directory:', error);
        return cb(error as Error, '');
      }
    }
    
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    try {
      const prefix = subfolder.slice(0, 3); // 'ava', 'sig', 'cer', etc.
      
      let filename: string;
      if (useUserId) {
        // For avatars and signatures - include user ID
        filename = createUserBasedFilename(req, file, prefix);
      } else {
        // For business files - use random ID
        filename = createBusinessFilename(req, file, prefix);
      }
      
      console.log(`Generated filename: ${filename} for ${subfolder}`);
      cb(null, filename);
    } catch (error) {
      console.error(`Error generating filename for ${subfolder}:`, error);
      cb(error as Error, '');
    }
  }
});

// Enhanced file filter creator
const createFileFilter = (allowedExtensions: RegExp, allowedMimeTypes: RegExp, maxSize: number) => ({
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.test(file.mimetype);

    console.log(`File validation - Name: ${file.originalname}, MIME: ${file.mimetype}, Ext valid: ${extname}, MIME valid: ${mimetype}`);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      const error = `Invalid file type. File: ${file.originalname}, MIME: ${file.mimetype}. Allowed types vary by upload category.`;
      console.log('File rejected:', error);
      cb(new Error(error));
    }
  },
  limits: { 
    fileSize: maxSize,
    files: 1 // Only allow single file uploads for security
  }
});

// ORGANIZED UPLOAD CONFIGURATIONS
export const uploadConfigs = {
  // USER AVATARS - Profile pictures (WITH USER ID)
  avatar: multer({
    storage: createStorage('avatars', true), // useUserId = true
    ...createFileFilter(
      FILE_TYPES.IMAGES, 
      MIME_TYPES.IMAGES, 
      4 * 1024 * 1024 // 4MB
    )
  }),

  // SIGNATURES - Digital signatures for documents (WITH USER ID)
  signature: multer({
    storage: createStorage('signatures', true), // useUserId = true
    ...createFileFilter(
      FILE_TYPES.IMAGES, 
      MIME_TYPES.IMAGES, 
      1 * 1024 * 1024 // 1MB (signatures are usually small)
    )
  }),

  // CERTIFICATES - Training certificates, compliance docs (NO USER ID)
  certificate: multer({
    storage: createStorage('certificates', false), // useUserId = false
    ...createFileFilter(
      FILE_TYPES.IMAGES_AND_PDF, 
      MIME_TYPES.IMAGES_AND_PDF, 
      10 * 1024 * 1024 // 10MB
    )
  }),

  // DOCUMENTS - General business documents (NO USER ID)
  document: multer({
    storage: createStorage('documents', false), // useUserId = false
    ...createFileFilter(
      FILE_TYPES.ALL_ALLOWED, 
      /^(image\/|application\/)/,
      15 * 1024 * 1024 // 15MB
    )
  }),

  // TOOLS - Equipment and tool images (NO USER ID)
  tool: multer({
    storage: createStorage('tools', false), // useUserId = false
    ...createFileFilter(
      FILE_TYPES.IMAGES, 
      MIME_TYPES.IMAGES, 
      5 * 1024 * 1024 // 5MB
    )
  }),

  // REPORTS - Generated reports and exports (NO USER ID)
  report: multer({
    storage: createStorage('reports', false), // useUserId = false
    ...createFileFilter(
      FILE_TYPES.DOCUMENTS, 
      MIME_TYPES.DOCUMENTS, 
      20 * 1024 * 1024 // 20MB
    )
  }),

  // BACKUP FILES (NO USER ID)
  backup: multer({
    storage: createStorage('backups', false), // useUserId = false
    ...createFileFilter(
      /\.(zip|tar|gz|sql|json)$/i,
      /^application\/(zip|x-tar|gzip|sql|json)$/,
      100 * 1024 * 1024 // 100MB
    )
  }),

  // TEMPORARY UPLOADS (NO USER ID)
  temp: multer({
    storage: createStorage('temp', false), // useUserId = false
    ...createFileFilter(
      FILE_TYPES.ALL_ALLOWED,
      /^(image\/|application\/)/,
      50 * 1024 * 1024 // 50MB
    )
  })
};

// Debug upload configs
console.log('DEBUGGING UPLOAD CONFIGS:');
console.log('uploadConfigs.avatar exists:', !!uploadConfigs.avatar);
console.log('uploadConfigs.signature exists:', !!uploadConfigs.signature);

// UTILITY FUNCTIONS

// Get file URL for frontend
export const getFileUrl = (category: string, filename: string) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/uploads/${category}/${filename}`;
};

// Get user-based file URL (for avatar and signature)
export const getUserFileUrl = (category: string, userId: number, filename: string) => {
  // filename should be just the timestamp part (e.g., "1692123456789.png")
  // we construct the full filename
  const prefix = category === 'avatars' ? 'ava' : 'sig';
  const fullFilename = `${prefix}-${userId}-${filename}`;
  return getFileUrl(category, fullFilename);
};

// Clean up old temp files (call this periodically)
export const cleanupTempFiles = async (olderThanHours: number = 24) => {
  const tempDir = path.join(uploadsDir, 'temp');
  const now = Date.now();
  const cutoff = now - (olderThanHours * 60 * 60 * 1000);

  try {
    const files = fs.readdirSync(tempDir);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < cutoff) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
    
    console.log(`Cleaned up ${deletedCount} temporary files older than ${olderThanHours} hours`);
  } catch (error) {
    console.error('Error cleaning temp files:', error);
  }
};

export const deleteFile = (category: string, filename: string) => {
  try {
    const filePath = path.join(uploadsDir, category, filename);
    console.log(`Checking if file exists: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Successfully deleted file: ${category}/${filename}`);
      return true;
    } else {
      console.log(`File does not exist: ${category}/${filename}`);
      return false;
    }
  } catch (error) {
    console.error(`Error deleting file ${category}/${filename}:`, error);
    return false;
  }
};

// Delete old user files when updating (for avatar and signature)
export const deleteOldUserFile = (userId: number, category: string, oldFilename?: string) => {
  try {
    if (!oldFilename) {
      console.log(`No old filename provided for user ${userId} in ${category}`);
      return false;
    }
    
    // ✅ FIXED: Use filename as-is (it already has the full prefix from database)
    console.log(`Attempting to delete: ${category}/${oldFilename}`);
    
    const success = deleteFile(category, oldFilename);
    if (success) {
      console.log(`Successfully deleted old ${category} for user ${userId}: ${oldFilename}`);
    } else {
      console.log(`Failed to delete or file not found: ${category}/${oldFilename}`);
    }
    return success;
  } catch (error) {
    console.error(`Error deleting old ${category} for user ${userId}:`, error);
    return false;
  }
};

// Delete business file (for certificates, documents, tools, etc.)
export const deleteBusinessFile = (category: string, filename: string) => {
  try {
    // For business files, filename is stored in full
    const success = deleteFile(category, filename);
    if (success) {
      console.log(`Deleted ${category} file: ${filename}`);
    }
    return success;
  } catch (error) {
    console.error(`Error deleting ${category} file:`, error);
    return false;
  }
};

// ERROR HANDLER
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  console.error('Upload Error:', error.message);

  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ 
          success: false,
          message: 'File too large', 
          maxSize: 'Check upload category limits',
          error: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ 
          success: false,
          message: 'Unexpected file field', 
          error: 'UNEXPECTED_FIELD'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ 
          success: false,
          message: 'Too many files', 
          error: 'TOO_MANY_FILES'
        });
      default:
        return res.status(400).json({ 
          success: false,
          message: 'Upload error', 
          error: error.code 
        });
    }
  }
  
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid file type', 
      details: error.message,
      error: 'INVALID_FILE_TYPE'
    });
  }

  if (error.message && error.message.includes('User not authenticated')) {
    return res.status(401).json({ 
      success: false,
      message: 'User authentication required', 
      error: 'AUTHENTICATION_REQUIRED'
    });
  }

  // Directory creation errors
  if (error.code === 'EACCES' || error.code === 'ENOENT') {
    return res.status(500).json({ 
      success: false,
      message: 'Server storage error', 
      error: 'STORAGE_ERROR'
    });
  }

  next(error);
};
export const cleanupAllUserFiles = (userId: number) => {
  const categories = ['avatars', 'signatures'];
  let totalDeleted = 0;
  
  categories.forEach(category => {
    try {
      const categoryDir = path.join(uploadsDir, category);
      if (!fs.existsSync(categoryDir)) return;
      
      const files = fs.readdirSync(categoryDir);
      const prefix = category === 'avatars' ? 'ava' : 'sig';
      
      // Find all files for this user
      const userFiles = files.filter(file => 
        file.startsWith(`${prefix}-${userId}-`)
      );
      
      // Delete all but the most recent file (highest timestamp)
      if (userFiles.length > 1) {
        userFiles.sort((a, b) => {
          const timestampA = a.split('-')[2]?.split('.')[0] || '0';
          const timestampB = b.split('-')[2]?.split('.')[0] || '0';
          return parseInt(timestampB) - parseInt(timestampA); // Newest first
        });
        
        // Keep the first (newest), delete the rest
        const filesToDelete = userFiles.slice(1);
        
        filesToDelete.forEach(file => {
          const deleted = deleteFile(category, file);
          if (deleted) totalDeleted++;
        });
      }
      
    } catch (error) {
      console.error(`Error cleaning up ${category} for user ${userId}:`, error);
    }
  });
  
  console.log(`Cleaned up ${totalDeleted} old files for user ${userId}`);
  return totalDeleted;
};
// Default export for backward compatibility  
export default uploadConfigs.document;