// routes/pdfGenerator.routes.ts
import { Router } from 'express';
import PDFGeneratorController from '../controllers/pdfGenerator.controller';
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const pdfController = new PDFGeneratorController();

// Middleware to handle validation errors
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Basic validation middleware for certificate data
const certificateValidation = [
  body('certificateNo').notEmpty().withMessage('Certificate number is required'),
  body('dateOfIssue').isISO8601().withMessage('Date of issue must be a valid date'),
  body('dateOfCalibration').isISO8601().withMessage('Date of calibration must be a valid date'),
  body('technicianName').notEmpty().withMessage('Technician name is required'),
  body('calibrationPlace').notEmpty().withMessage('Calibration place is required'),
  body('procedureNo').notEmpty().withMessage('Procedure number is required'),
  body('status').isIn(['draft', 'official']).withMessage('Status must be either draft or official'),
  
  // Equipment validation
  body('equipment.instrumentDescription').notEmpty().withMessage('Instrument description is required'),
  body('equipment.instrumentModel').notEmpty().withMessage('Instrument model is required'),
  body('equipment.instrumentSerialNo').notEmpty().withMessage('Instrument serial number is required'),
  
  // Probe validation
  body('probe.probeDescription').notEmpty().withMessage('Probe description is required'),
  body('probe.probeModel').notEmpty().withMessage('Probe model is required'),
  body('probe.probeSN').notEmpty().withMessage('Probe serial number is required'),
  
  // Customer validation
  body('customer.companyName').notEmpty().withMessage('Customer company name is required'),
  body('customer.contactPerson').notEmpty().withMessage('Customer contact person is required'),
  
  // Ambient conditions validation
  body('ambientConditions.temperature').isNumeric().withMessage('Temperature must be a number'),
  body('ambientConditions.humidity').isNumeric().withMessage('Humidity must be a number'),
  body('ambientConditions.pressure').isNumeric().withMessage('Pressure must be a number'),
  body('ambientConditions.gasTemperature').isNumeric().withMessage('Gas temperature must be a number'),
  body('ambientConditions.flowRate').isNumeric().withMessage('Flow rate must be a number'),
  body('ambientConditions.gasPressure').isNumeric().withMessage('Gas pressure must be a number'),
];

/**
 * @route GET /api/pdf-generator/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', pdfController.healthCheck);

/**
 * @route POST /api/pdf-generator/generate
 * @desc Generate and download certificate PDF
 * @access Private
 * @body CertificateData
 */
router.post('/generate', 
  certificateValidation,
  handleValidationErrors,
  pdfController.generateCertificate
);

/**
 * @route POST /api/pdf-generator/generate-base64
 * @desc Generate certificate PDF and return as base64
 * @access Private
 * @body CertificateData
 */
router.post('/generate-base64',
  certificateValidation,
  handleValidationErrors,
  pdfController.generateCertificateBase64
);

/**
 * @route POST /api/pdf-generator/preview
 * @desc Preview certificate data without generating PDF
 * @access Private
 * @body CertificateData
 */
router.post('/preview',
  certificateValidation,
  handleValidationErrors,
  pdfController.previewCertificate
);

export default router;