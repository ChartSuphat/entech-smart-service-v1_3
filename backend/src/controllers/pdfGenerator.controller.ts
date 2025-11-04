// controllers/pdfGenerator.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import PDFGeneratorService from '../services/pdfGenerator.service';
import { CertificateService } from '../services/certificate.service';

interface CertificateData {
  certificateNo: string;
  dateOfIssue: string;
  dateOfCalibration: string;
  equipment: {
    instrumentDescription: string;
    instrumentModel: string;
    instrumentSerialNo: string;
    manufacturer?: string;
  };
  probe: {
    probeDescription: string;
    probeModel: string;
    probeSN: string;
  };
  customer: {
    companyName: string;
    contactPerson: string;
    address?: string;
  };
  gasCylinder?: {
    gasName: string;
    chemicalFormula: string;
    realConcentration: number;
    itemNumber: string;
    supplierName: string;
  };
  technicianName: string;
  calibrationPlace: string;
  procedureNo: string;
  ambientConditions: {
    temperature: number;
    humidity: number;
    pressure: number;
    gasTemperature: number;
    flowRate: number;
    gasPressure: number;
  };
  calibrationData?: Array<{
    gasType: string;
    standardValue: number;
    measurement1: number;
    measurement2: number;
    measurement3: number;
    meanValue: number;
    error: number;
    uncertainty: number;
  }>;
  formatType: 'draft' | 'official';
status: 'pending' | 'approved';
}

export class PDFGeneratorController {
  private pdfService: PDFGeneratorService;
  private certificateService: CertificateService;

  constructor() {
    this.pdfService = new PDFGeneratorService();
    this.certificateService = new CertificateService();
  }

  // Health check endpoint
  healthCheck = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json({
      success: true,
      message: 'PDF Generator service is running',
      timestamp: new Date().toISOString()
    });
  };

  // Generate PDF from direct certificate data (existing functionality)
  generateCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const certificateData: CertificateData = req.body;
      
      console.log('🔍 Generating PDF for certificate:', certificateData.certificateNo);
      
      const pdfBuffer = await this.pdfService.generateCertificatePDF(certificateData);
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Certificate_${certificateData.certificateNo}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      
      // Send the PDF buffer
      res.send(pdfBuffer);
      
      console.log('✅ PDF generated successfully for certificate:', certificateData.certificateNo);
    } catch (error) {
      console.error('💥 Error generating PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Generate PDF as base64 from direct certificate data (existing functionality)
  generateCertificateBase64 = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const certificateData: CertificateData = req.body;
      
      console.log('🔍 Generating PDF base64 for certificate:', certificateData.certificateNo);
      
      const pdfBuffer = await this.pdfService.generateCertificatePDF(certificateData);
      const base64PDF = pdfBuffer.toString('base64');
      const formatSuffix = certificateData.formatType === 'draft' ? '_DRAFT' : '';
      res.json({
        success: true,
        data: {
          pdf: base64PDF,
          filename: `Certificate_${certificateData.certificateNo}${formatSuffix}.pdf`,
          mimeType: 'application/pdf'
        },
        message: 'PDF generated successfully'
      });
      
      console.log('✅ PDF base64 generated successfully for certificate:', certificateData.certificateNo);
    } catch (error) {
      console.error('💥 Error generating PDF base64:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Preview certificate data (existing functionality)
  previewCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const certificateData: CertificateData = req.body;
      
      // Return the processed data that would be used for PDF generation
      res.json({
        success: true,
        data: {
          certificateData,
          previewInfo: {
            filename: `Certificate_${certificateData.certificateNo}.pdf`,
            formatType: certificateData.formatType,
            status: certificateData.status,
            generatedAt: new Date().toISOString()
          }
        },
        message: 'Certificate data preview generated successfully'
      });
    } catch (error) {
      console.error('💥 Error generating preview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate preview',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // NEW: Generate PDF from certificate ID
  generateCertificatePDFFromId = async (req: AuthRequest, res: Response): Promise<void> => {
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

      console.log('🔍 Generating PDF for certificate ID:', certificateId);

      // Get certificate data from database
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

      // Check permissions (creator or admin)
      const canGenerate = req.user?.role === 'admin' || 
                         (req.user?.role === 'technician' && certificate.createdById === req.user.id);

      if (!canGenerate) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only generate PDFs for certificates you created, or be an administrator.'
        });
        return;
      }

      // Transform database certificate to PDF format
      const certificateData = this.transformCertificateForPDF(certificate);
      
      // Generate PDF
      const pdfBuffer = await this.pdfService.generateCertificatePDF(certificateData);
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Certificate_${certificate.certificateNo}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      
      // Send the PDF buffer
      res.send(pdfBuffer);
      
      console.log('✅ PDF generated successfully for certificate ID:', certificateId);
    } catch (error) {
      console.error('💥 Error generating PDF from certificate ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // NEW: Generate PDF preview from certificate ID
  generateCertificatePDFPreview = async (req: AuthRequest, res: Response): Promise<void> => {
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

      console.log('🔍 Generating PDF preview for certificate ID:', certificateId);

      // Get certificate data from database
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

      // Check permissions (creator or admin)
      const canGenerate = req.user?.role === 'admin' || 
                         (req.user?.role === 'technician' && certificate.createdById === req.user.id);

      if (!canGenerate) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only generate PDFs for certificates you created, or be an administrator.'
        });
        return;
      }

      // Transform database certificate to PDF format
      const certificateData = this.transformCertificateForPDF(certificate);
      
      // Generate PDF
      const pdfBuffer = await this.pdfService.generateCertificatePDF(certificateData);
      const base64PDF = pdfBuffer.toString('base64');
      
      res.json({
        success: true,
        data: {
          pdf: base64PDF,
          filename: `Certificate_${certificate.certificateNo}.pdf`,
          mimeType: 'application/pdf',
          certificateData: certificateData
        },
        message: 'PDF preview generated successfully'
      });
      
      console.log('✅ PDF preview generated successfully for certificate ID:', certificateId);
    } catch (error) {
      console.error('💥 Error generating PDF preview from certificate ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF preview',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Helper method to transform database certificate to PDF format
  private transformCertificateForPDF(certificate: any): CertificateData {
    return {
      certificateNo: certificate.certificateNo,
      dateOfIssue: certificate.dateOfIssue,
      dateOfCalibration: certificate.dateOfCalibration,
      equipment: {
        instrumentDescription: certificate.equipment?.instrumentDescription || '',
        instrumentModel: certificate.equipment?.instrumentModel || '',
        instrumentSerialNo: certificate.equipment?.instrumentSerialNo || '',
        manufacturer: certificate.equipment?.manufacturer
      },
      probe: {
        probeDescription: certificate.probe?.probeDescription || '',
        probeModel: certificate.probe?.probeModel || '',
        probeSN: certificate.probe?.probeSN || ''
      },
      customer: {
        companyName: certificate.customer?.companyName || '',
        contactPerson: certificate.customer?.contactPerson || '',
        address: certificate.customer?.address
      },
      gasCylinder: certificate.gasCylinder ? {
        gasName: certificate.gasCylinder.gasName,
        chemicalFormula: certificate.gasCylinder.chemicalFormula,
        realConcentration: certificate.gasCylinder.realConcentration,
        itemNumber: certificate.gasCylinder.itemNumber,
        supplierName: certificate.gasCylinder.supplierName
      } : undefined,
      technicianName: certificate.technicianName || '',
      calibrationPlace: certificate.calibrationPlace || '',
      procedureNo: certificate.procedureNo || '',
      ambientConditions: {
        temperature: certificate.ambientConditions?.temperature || 0,
        humidity: certificate.ambientConditions?.humidity || 0,
        pressure: certificate.ambientConditions?.pressure || 0,
        gasTemperature: certificate.ambientConditions?.gasTemperature || 0,
        flowRate: certificate.ambientConditions?.flowRate || 0,
        gasPressure: certificate.ambientConditions?.gasPressure || 0
      },
      calibrationData: certificate.calibrationData || undefined,
      formatType: certificate.formatType as 'draft' | 'official',
      status: certificate.status as 'pending' | 'approved'
    };
  }
}

export default PDFGeneratorController;