// controllers/certificate.controller.ts - MODIFIED WITH AUTO-SIGNATURES

import { Response } from 'express';
import { CertificateService } from '../services/certificate.service';
import { 
  CreateCertificateSchema, 
  UpdateCertificateSchema,
  UpdateAmbientConditionsSchema,
  CertificateQuerySchema
} from '../validators/certificate.validator';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ZodError } from 'zod';

export class CertificateController {
  private certificateService: CertificateService;

  constructor() {
    this.certificateService = new CertificateService();
  }

  // GET /api/certificates
  getAllCertificates = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const validatedQuery = CertificateQuerySchema.parse(req.query);
      
      const { page = 1, limit = 10, status, search } = validatedQuery;
      
      console.log('Getting certificates - User:', req.user?.fullName, 'Role:', req.user?.role);
      
      const certificates = await this.certificateService.getAllCertificates({
        page,
        limit,
        status,
        search,
        userId: req.user?.id,
        userRole: req.user?.role
      });

      res.json({
        success: true,
        data: certificates,
        message: 'Certificates retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching certificates:', error);
      
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.issues
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve certificates',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // GET /api/certificates/:id
  getCertificateById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Validate ID is a number
      const certificateId = parseInt(id);
      if (isNaN(certificateId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid certificate ID'
        });
        return;
      }

      const certificate = await this.certificateService.getCertificateById(
        certificateId,
        req.user?.id,
        req.user?.role
      );

      if (!certificate) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
        return;
      }

      res.json({
        success: true,
        data: certificate,
        message: 'Certificate retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching certificate:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve certificate',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // MODIFIED: POST /api/certificates - Now auto-adds technician signature
  createCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
       console.log('🔍 CONTROLLER: Create certificate called');
    console.log('🔍 CONTROLLER: Request body toolId:', req.body.toolId);
    console.log('🔍 CONTROLLER: Full request body:', JSON.stringify(req.body, null, 2));
    console.log('Creating certificate - User role:', req.user?.role);
      // This check should be handled by middleware, but keeping as fallback
      if (!req.user || (req.user.role !== 'technician' && req.user.role !== 'admin')) {
        console.log('Access denied - Invalid role:', req.user?.role);
        res.status(403).json({
          success: false,
          message: 'Access denied. Only technicians and administrators can create certificates.'
        });
        return;
      }

      const validatedData = CreateCertificateSchema.parse(req.body);

      // Modified to auto-add technician signature
      const certificate = await this.certificateService.createCertificate({
        ...validatedData,
        createdById: req.user.id
      });

      console.log('Certificate created successfully:', certificate.certificateNo);

      res.status(201).json({
        success: true,
        data: certificate,
        message: `Certificate ${certificate.certificateNo} created successfully. Status: ${certificate.status}`
      });
    } catch (error) {
      console.error('Error creating certificate:', error);
      
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues
        });
        return;
      }

      // Handle specific database/business logic errors
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          res.status(409).json({
            success: false,
            message: 'Certificate number already exists'
          });
          return;
        }
        
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create certificate',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // NEW: POST /api/certificates/:id/approve - Admin approves with auto-signature
  approveCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const certificateId = parseInt(req.params.id);
      
      if (isNaN(certificateId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid certificate ID'
        });
        return;
      }

      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Only administrators can approve certificates.'
        });
        return;
      }

      const approvedCertificate = await this.certificateService.approveCertificate(
        certificateId,
        req.user.id
      );

      res.json({
        success: true,
        data: approvedCertificate,
        message: `Certificate ${approvedCertificate.certificateNo} approved successfully`
      });

    } catch (error) {
      console.error('Error approving certificate:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to approve certificate'
      });
    }
  };

  // NEW: POST /api/certificates/bulk-approve - Admin bulk approve certificates
bulkApproveCertificates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { certificateIds } = req.body;

    // Validation
    if (!Array.isArray(certificateIds) || certificateIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Certificate IDs array is required and cannot be empty'
      });
      return;
    }

    // Validate all IDs are numbers
    const validIds = certificateIds.filter(id => Number.isInteger(id) && id > 0);
    if (validIds.length !== certificateIds.length) {
      res.status(400).json({
        success: false,
        message: 'All certificate IDs must be valid positive integers'
      });
      return;
    }

    // Check admin permission
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can bulk approve certificates.'
      });
      return;
    }

    console.log(`Admin ${req.user.fullName} attempting to bulk approve ${validIds.length} certificates:`, validIds);

    // Call service method for bulk approval
    const result = await this.certificateService.bulkApproveCertificates(
      validIds,
      req.user.id
    );

    res.json({
      success: true,
      data: result,
      message: `Successfully approved ${result.approvedCount} certificate(s). ${result.skippedCount} were already approved or not found.`
    });

  } catch (error) {
    console.error('Error bulk approving certificates:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to bulk approve certificates'
    });
  }
};

  // NEW: GET /api/certificates/pending - Get pending certificates for admin
  getPendingCertificates = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Only administrators can view pending certificates.'
        });
        return;
      }

      const pendingCertificates = await this.certificateService.getPendingCertificates();

      res.json({
        success: true,
        data: pendingCertificates,
        count: pendingCertificates.length,
        message: `Found ${pendingCertificates.length} pending certificates`
      });

    } catch (error) {
      console.error('Error fetching pending certificates:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch pending certificates'
      });
    }
  };

  // NEW: POST /api/certificates/users/signature - Upload user signature
uploadUserSignature = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No signature file uploaded'
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const userId = req.user.id;
    
    // ✅ FIXED: Just use the filename from multer as-is (no manipulation)
    const signatureFilename = req.file.filename;
    
    const updatedUser = await this.certificateService.updateUserSignature(
      userId, 
      signatureFilename
    );
    
    res.json({
      success: true,
      data: {
        user: updatedUser,
        signaturePath: `/uploads/signatures/${signatureFilename}` // ✅ Clean path
      },
      message: 'Signature uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading signature:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload signature'
    });
  }
};

  // NEW: GET /api/certificates/users/signature - Get user signature status
getUserSignature = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const userId = req.user.id;
    
    const user = await this.certificateService['prisma'].user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, signature: true, role: true }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          role: user.role
        },
        hasSignature: !!user.signature,
        signaturePath: user.signature ? `/uploads/signatures/${user.signature}` : null // ✅ Clean path
      }
    });

  } catch (error) {
    console.error('Error getting user signature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user signature'
    });
  }
};

  // NEW: DELETE /api/certificates/users/signature - Delete user signature
  deleteUserSignature = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const userId = req.user.id;
      
      const updatedUser = await this.certificateService.updateUserSignature(
        userId, 
        null as any // Remove signature
      );
      
      res.json({
        success: true,
        data: updatedUser,
        message: 'Signature deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting signature:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete signature'
      });
    }
  };

  // PUT /api/certificates/:id - Only creator or admin
  updateCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const certificateId = parseInt(id);
      
      if (isNaN(certificateId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid certificate ID'
        });
        return;
      }

      // Check if certificate exists and get ownership
      const existingCert = await this.certificateService.getCertificateById(certificateId);
      if (!existingCert) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
        return;
      }

      // Check permissions (creator or admin)
      const canEdit = req.user?.role === 'admin' || 
                     (req.user?.role === 'technician' && existingCert.createdById === req.user.id);

      if (!canEdit) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only edit certificates you created, or be an administrator.'
        });
        return;
      }

      const validatedData = UpdateCertificateSchema.parse(req.body);
      const certificate = await this.certificateService.updateCertificate(certificateId, validatedData);

      res.json({
        success: true,
        data: certificate,
        message: 'Certificate updated successfully'
      });
    } catch (error) {
      console.error('Error updating certificate:', error);
      
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update certificate',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // DELETE /api/certificates/:id - Only ADMIN
  deleteCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // This check should be handled by middleware
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Only administrators can delete certificates.'
        });
        return;
      }

      const { id } = req.params;
      const certificateId = parseInt(id);
      
      if (isNaN(certificateId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid certificate ID'
        });
        return;
      }

      // Check if certificate exists before attempting deletion
      const existingCert = await this.certificateService.getCertificateById(certificateId);
      if (!existingCert) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
        return;
      }

      await this.certificateService.deleteCertificate(certificateId);

      res.json({
        success: true,
        message: 'Certificate deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting certificate:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete certificate',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // GET /api/certificates/ambient-defaults
  getDefaultAmbientConditions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const defaults = await this.certificateService.getDefaultAmbientConditions();

      res.json({
        success: true,
        data: defaults,
        message: 'Default ambient conditions retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting ambient defaults:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get default ambient conditions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // PATCH /api/certificates/:id/ambient-conditions
  updateAmbientConditions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const certificateId = parseInt(id);
      
      if (isNaN(certificateId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid certificate ID'
        });
        return;
      }

      // Check ownership
      const existingCert = await this.certificateService.getCertificateById(certificateId);
      if (!existingCert) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
        return;
      }

      const canEdit = req.user?.role === 'admin' || 
                     (req.user?.role === 'technician' && existingCert.createdById === req.user.id);

      if (!canEdit) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only edit certificates you created.'
        });
        return;
      }

      const validatedData = UpdateAmbientConditionsSchema.parse(req.body);
      const certificate = await this.certificateService.updateAmbientConditions(certificateId, validatedData);

      res.json({
        success: true,
        data: certificate,
        message: 'Ambient conditions updated successfully'
      });
    } catch (error) {
      console.error('Error updating ambient conditions:', error);
      
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update ambient conditions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // GET /api/certificates/generate-number
  generateCertificateNumber = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // This check should be handled by middleware
      if (!req.user || (req.user.role !== 'technician' && req.user.role !== 'admin')) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Only technicians and administrators can generate certificate numbers.'
        });
        return;
      }

      const certificateNumber = await this.certificateService.generateCertificateNumber();

      res.json({
        success: true,
        data: { certificateNumber },
        message: 'Certificate number generated successfully'
      });
    } catch (error) {
      console.error('Error generating certificate number:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate certificate number',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // PUT /api/certificates/:id/status
  updateCertificateStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const certificateId = parseInt(id);
      if (isNaN(certificateId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid certificate ID'
        });
        return;
      }

      if (!status || !['pending', 'approved'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Must be "pending" or "approved".'
        });
        return;
      }

      // Check if certificate exists
      const existingCert = await this.certificateService.getCertificateById(certificateId);
      if (!existingCert) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
        return;
      }

      // Only admins can approve certificates
      if (status === 'approved' && req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Only administrators can approve certificates.'
        });
        return;
      }

      // Only creator or admin can change status to pending
      if (status === 'pending') {
        const canEdit = req.user?.role === 'admin' || 
                       (req.user?.role === 'technician' && existingCert.createdById === req.user.id);
        
        if (!canEdit) {
          res.status(403).json({
            success: false,
            message: 'Access denied. You can only modify certificates you created.'
          });
          return;
        }
      }

      const certificate = await this.certificateService.updateCertificateStatus(
        certificateId,
        status,
        req.user?.id
      );

      res.json({
        success: true,
        data: certificate,
        message: `Certificate ${status === 'approved' ? 'approved' : 'set to pending'} successfully`
      });
    } catch (error) {
      console.error('Error updating certificate status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update certificate status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // POST /api/certificates/:id/calibration-data
  addCalibrationData = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const certificateId = parseInt(id);
      
      if (isNaN(certificateId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid certificate ID'
        });
        return;
      }

      // Check ownership
      const existingCert = await this.certificateService.getCertificateById(certificateId);
      if (!existingCert) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
        return;
      }

      const canEdit = req.user?.role === 'admin' || 
                     (req.user?.role === 'technician' && existingCert.createdById === req.user.id);

      if (!canEdit) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only edit certificates you created.'
        });
        return;
      }

      // TODO: Add validation schema for calibration data
      const calibrationData = req.body;
      const result = await this.certificateService.addCalibrationData(certificateId, calibrationData);

      res.json({
        success: true,
        data: result,
        message: 'Calibration data added successfully'
      });
    } catch (error) {
      console.error('Error adding calibration data:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to add calibration data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // POST /api/certificates/:id/adjusted-calibration-data
  addAdjustedCalibrationData = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const certificateId = parseInt(id);
      
      if (isNaN(certificateId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid certificate ID'
        });
        return;
      }

      // Check ownership
      const existingCert = await this.certificateService.getCertificateById(certificateId);
      if (!existingCert) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
        return;
      }

      const canEdit = req.user?.role === 'admin' || 
                     (req.user?.role === 'technician' && existingCert.createdById === req.user.id);

      if (!canEdit) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only edit certificates you created.'
        });
        return;
      }

      // TODO: Add validation schema for adjusted calibration data
      const adjustedCalibrationData = req.body;
      const result = await this.certificateService.addAdjustedCalibrationData(certificateId, adjustedCalibrationData);

      res.json({
        success: true,
        data: result,
        message: 'Adjusted calibration data added successfully'
      });
    } catch (error) {
      console.error('Error adding adjusted calibration data:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to add adjusted calibration data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

// Export both named and default
export default CertificateController;