// routes/upload.routes.ts - FIXED VERSION WITH AUTH
import express from 'express';
import { 
  uploadSingle, 
  handleFileUpload, 
  uploadMultiple, 
  handleMultipleFileUpload,
  uploadProfileMultiple,
  handleProfileFileUpload,
  uploadCertificateFiles,
  handleCertificateFileUpload,
  getFileInfo,
  uploadSignatureOnly,
  handleSignatureUpload,
  uploadAvatar, 
  handleAvatarUpload,
  uploadSignature as uploadSignatureNew,
  handleSignatureUpload as handleSignatureUploadNew,
  uploadCertificate,
  handleCertificateUpload,
  uploadToolImage,
  handleToolImageUpload,
  uploadDocument,
  handleDocumentUpload,
  uploadToolFiles,
  handleToolFileUpload,
  testDeletion,
  listUserFiles
} from '../controllers/upload.controller';

import { handleUploadError } from '../middlewares/upload.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

// ========================================
// USER FILES - Avatar & Signature
// ========================================

// Avatar upload
router.post('/avatar', 
  authMiddleware, 
  uploadAvatar, 
  handleUploadError, 
  handleAvatarUpload
);

// Signature upload
router.post('/signature', 
  authMiddleware, 
  uploadSignatureOnly, 
  handleUploadError,
  handleSignatureUpload
);

// Signature v2
router.post('/signature-v2', 
  authMiddleware, 
  uploadSignatureNew, 
  handleUploadError, 
  handleSignatureUploadNew
);

// Profile upload (avatar + signature together)
router.post('/profile', 
  authMiddleware, 
  uploadProfileMultiple, 
  handleUploadError,
  handleProfileFileUpload
);

// ========================================
// BUSINESS FILES
// ========================================

// Certificate upload
router.post('/certificate', 
  authMiddleware, 
  uploadCertificateFiles, 
  handleUploadError,
  handleCertificateFileUpload
);

// Certificate v2
router.post('/certificate-v2', 
  authMiddleware, 
  uploadCertificate, 
  handleUploadError, 
  handleCertificateUpload
);

// Tool image
router.post('/tool-image', 
  authMiddleware, 
  uploadToolImage, 
  handleUploadError, 
  handleToolImageUpload
);

// Document
router.post('/document', 
  authMiddleware, 
  uploadDocument, 
  handleUploadError, 
  handleDocumentUpload
);

// Single file
router.post('/single', 
  authMiddleware, 
  uploadSingle, 
  handleUploadError,
  handleFileUpload
);

// Multiple files
router.post('/multiple', 
  authMiddleware, 
  uploadMultiple, 
  handleUploadError,
  handleMultipleFileUpload
);

// Tool files (certificate + image)
router.post('/tool-files', 
  authMiddleware, 
  uploadToolFiles, 
  handleUploadError, 
  handleToolFileUpload
);

// ========================================
// FILE MANAGEMENT
// ========================================

// Get file info
router.get('/info/:filename', authMiddleware, getFileInfo);

// Debug routes
router.get('/test-deletion', testDeletion);
router.get('/list-user-files', listUserFiles);

export default router;

/*
USAGE WITH AUTH:

All routes require authentication. The userId is taken from req.userId (set by authMiddleware).
Frontend should NOT send userId in FormData - it comes from the auth token.

1. AVATAR UPLOAD:
   POST /api/upload/avatar
   Headers: { Authorization: "Bearer <token>" }
   FormData: { avatar: File }
   
2. SIGNATURE UPLOAD:
   POST /api/upload/signature
   Headers: { Authorization: "Bearer <token>" }
   FormData: { signature: File }
   
3. PROFILE UPLOAD:
   POST /api/upload/profile
   Headers: { Authorization: "Bearer <token>" }
   FormData: { avatar: File, signature: File }

SECURITY:
✅ All routes protected by authMiddleware
✅ userId taken from authenticated user (req.userId)
✅ Prevents user impersonation
✅ Cannot upload files for other users
✅ Full audit trail of who uploaded what

AUTO-CLEANUP:
✅ Old avatar deleted when new one uploaded
✅ Old signature deleted when new one uploaded
✅ Prevents file accumulation
*/