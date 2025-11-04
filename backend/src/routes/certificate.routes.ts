import { Router } from 'express';
import { CertificateController } from '../controllers/certificate.controller';
import PDFGeneratorController from '../controllers/pdfGenerator.controller';
import { CertificateTemplateController } from '../controllers/certificate-template.controller';
import { authMiddleware, requireStaff, requireAdmin } from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';

const router = Router();
const certificateController = new CertificateController();
const pdfController = new PDFGeneratorController();
const certificateTemplateController = new CertificateTemplateController();

// Configure multer for signature uploads
const signatureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/signatures/');
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    // OLD: cb(null, `signature-${userId}-${timestamp}${ext}`);
    // NEW:
    cb(null, `${timestamp}${ext}`);  // Just timestamp, no userId prefix
  }
});

const uploadSignature = multer({ 
  storage: signatureStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png) are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Simple validation middleware
const validateRequest = (schema: any) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error instanceof Error ? error.message : 'Invalid data'
      });
    }
  };
};

// Apply authentication to all routes
router.use(authMiddleware);

// ========================================
// EXISTING ROUTES (Modified for auto-signatures)
// ========================================

// GET routes (all authenticated users can access)
router.get('/', certificateController.getAllCertificates);
router.get('/ambient-defaults', certificateController.getDefaultAmbientConditions);
router.get('/:id', certificateController.getCertificateById);

// Certificate number generation
router.get('/generate-number', requireStaff, certificateController.generateCertificateNumber);

// ========================================
// NEW WORKFLOW ROUTES
// ========================================

// STEP 1: Technician creates certificate (auto-adds technician signature)
router.post('/', requireStaff, certificateController.createCertificate);

// STEP 2: Admin approves certificate (auto-adds admin signature) 
router.post('/:id/approve', requireAdmin, certificateController.approveCertificate);
// STEP 2b: Admin bulk approve certificates  
router.post('/bulk-approve', requireAdmin, certificateController.bulkApproveCertificates);
// Get pending certificates for admin review
router.get('/pending', requireAdmin, certificateController.getPendingCertificates);

// ========================================
// SIGNATURE MANAGEMENT ROUTES
// ========================================

// Upload signature for current user
router.post('/users/signature', uploadSignature.single('signature'), certificateController.uploadUserSignature);

// Get current user's signature status
router.get('/users/signature', certificateController.getUserSignature);

// Delete user's signature
router.delete('/users/signature', certificateController.deleteUserSignature);

// ========================================
// EXISTING CERTIFICATE EDITING ROUTES
// ========================================

// Certificate editing routes
router.post('/:id', certificateController.updateCertificate);
router.patch('/:id/ambient-conditions', certificateController.updateAmbientConditions);
router.post('/:id/calibration-data', certificateController.addCalibrationData);
router.post('/:id/adjusted-calibration-data', certificateController.addAdjustedCalibrationData);

// Status routes (kept for backward compatibility, but approve route is preferred)
router.post('/:id/status', certificateController.updateCertificateStatus);

// ========================================
// PDF GENERATION ROUTES - EXISTING (keep these)
// ========================================

/**
 * @route GET /api/certificates/:id/pdf
 * @desc Generate and download PDF for existing certificate
 * @access Private (creator or admin only)
 */
router.get('/:id/pdf', pdfController.generateCertificatePDFFromId);

/**
 * @route GET /api/certificates/:id/pdf/preview
 * @desc Generate PDF preview (base64) for existing certificate
 * @access Private (creator or admin only)
 */
router.get('/:id/pdf/preview', pdfController.generateCertificatePDFPreview);

// ========================================
// TEMPLATE ROUTES - EXISTING (keep these)
// ========================================

/**
 * @route GET /api/certificates/:id/template/preview
 * @desc Generate HTML template preview of certificate
 * @access Private (authenticated users)
 */
router.get('/:id/template/preview', certificateTemplateController.previewCertificate);

/**
 * @route GET /api/certificates/:id/template/pdf
 * @desc Download certificate as PDF using template system
 * @access Private (authenticated users)
 */
router.get('/:id/template/pdf', certificateTemplateController.downloadCertificatePDF);

/**
 * @route GET /api/certificates/:id/template/print
 * @desc Generate print-optimized HTML view using template
 * @access Private (authenticated users)
 */
router.get('/:id/template/print', certificateTemplateController.printCertificate);

/**
 * @route GET /api/certificates/:id/template/data
 * @desc Get raw template data for debugging (Staff only)
 * @access Private (staff only)
 */
router.get('/:id/template/data', requireStaff, certificateTemplateController.getCertificateTemplateData);

/**
 * @route POST /api/certificates/:id/template/regenerate-pdf
 * @desc Regenerate PDF with custom options (Staff only)
 * @access Private (staff only)
 */
router.post('/:id/template/regenerate-pdf', requireStaff, certificateTemplateController.regeneratePDFWithOptions);

/**
 * @route DELETE /api/certificates/template/cache
 * @desc Clear template cache (Admin only)
 * @access Private (admin only)
 */
router.delete('/template/cache', requireAdmin, certificateTemplateController.clearTemplateCache);

// ========================================
// ADMIN ROUTES
// ========================================

// Admin only routes
router.delete('/:id', requireAdmin, certificateController.deleteCertificate);

export default router;