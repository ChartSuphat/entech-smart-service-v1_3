// src/controllers/certificate-template.controller.ts

import { Response } from 'express';
import { CertificateTemplateService } from '../services/certificate-template.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { PDFGenerationOptions } from '../types/certificate-template.types';

export class CertificateTemplateController {
  private certificateTemplateService: CertificateTemplateService;

  constructor() {
    this.certificateTemplateService = new CertificateTemplateService();
  }

  /**
   * GET /api/certificates/:id/preview
   * Generate HTML preview of certificate
   */
  previewCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
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

      console.log('🔍 Generating certificate preview for ID:', certificateId, 'User:', req.user?.fullName);

      // Check if certificate exists and user has access
      const hasAccess = await this.checkCertificateAccess(certificateId, req.user);
      if (!hasAccess.success) {
        res.status(hasAccess.status).json({
          success: false,
          message: hasAccess.message
        });
        return;
      }

      const html = await this.certificateTemplateService.generateCertificateHTML(certificateId);

      // Return HTML directly for preview
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);

    } catch (error) {
      console.error('💥 Error generating certificate preview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate certificate preview',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * GET /api/certificates/:id/pdf
   * Generate and download PDF certificate
   */
  downloadCertificatePDF = async (req: AuthRequest, res: Response): Promise<void> => {
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

      console.log('📄 Generating certificate PDF for ID:', certificateId, 'User:', req.user?.fullName);

      // Check if certificate exists and user has access
      const hasAccess = await this.checkCertificateAccess(certificateId, req.user);
      if (!hasAccess.success) {
        res.status(hasAccess.status).json({
          success: false,
          message: hasAccess.message
        });
        return;
      }

      // Get PDF options from query parameters
      const pdfOptions: Partial<PDFGenerationOptions> = {};
      
      if (req.query.format) {
        pdfOptions.format = req.query.format as 'A4' | 'Letter';
      }

      if (req.query.margin) {
        try {
          pdfOptions.margin = JSON.parse(req.query.margin as string);
        } catch (e) {
          // Use default margin if parsing fails
        }
      }

      const pdfBuffer = await this.certificateTemplateService.generateCertificatePDF(
        certificateId, 
        pdfOptions
      );

      // Get certificate details for custom filename
const templateData = await this.certificateTemplateService.getCertificateTemplateData(certificateId);
const cert = templateData.certificate;

// Build filename: [Draft] CertNo CustomerName ToolName.pdf
const isDraft = cert.formatType === 'draft';
const certNo = cert.certificateNo || 'Unknown';
const customerName = cert.customer?.companyName || 'Unknown';

// Get tool name only (without concentration)
let toolName = '';
try {
  const certWithTool = cert as any;
  if (certWithTool.tool) {
    toolName = certWithTool.tool.gasName; // Just the gas name
  }
} catch (e) {
  toolName = '';
}

// Build filename parts
const parts = isDraft ? ['Draft', certNo, customerName, toolName] : [certNo, customerName, toolName];
const filename = parts.filter(Boolean).join(' ').trim() + '.pdf';

console.log('Generated filename:', filename);

// Set response headers for PDF download
res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
res.setHeader('Content-Length', pdfBuffer.length);
res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
res.setHeader('Pragma', 'no-cache');
res.setHeader('Expires', '0');

res.send(pdfBuffer);

    } catch (error) {
      console.error('💥 Error generating certificate PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate certificate PDF',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * GET /api/certificates/:id/print
   * Generate print-optimized HTML view
   */
  printCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
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

      console.log('🖨️ Generating certificate print view for ID:', certificateId, 'User:', req.user?.fullName);

      // Check if certificate exists and user has access
      const hasAccess = await this.checkCertificateAccess(certificateId, req.user);
      if (!hasAccess.success) {
        res.status(hasAccess.status).json({
          success: false,
          message: hasAccess.message
        });
        return;
      }

      const html = await this.certificateTemplateService.generateCertificateHTML(certificateId);

      // Add print-specific styles and auto-print script
      const printHtml = this.addPrintEnhancements(html);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(printHtml);

    } catch (error) {
      console.error('💥 Error generating certificate print view:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate certificate print view',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * GET /api/certificates/:id/template-data
   * Get raw template data (for debugging or API access)
   */
  getCertificateTemplateData = async (req: AuthRequest, res: Response): Promise<void> => {
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

      // Check if certificate exists and user has access
      const hasAccess = await this.checkCertificateAccess(certificateId, req.user);
      if (!hasAccess.success) {
        res.status(hasAccess.status).json({
          success: false,
          message: hasAccess.message
        });
        return;
      }

      const templateData = await this.certificateTemplateService.getCertificateTemplateData(certificateId);

      res.json({
        success: true,
        data: templateData,
        message: 'Certificate template data retrieved successfully'
      });

    } catch (error) {
      console.error('💥 Error getting certificate template data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get certificate template data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * POST /api/certificates/:id/regenerate-pdf
   * Regenerate PDF with custom options
   */
  regeneratePDFWithOptions = async (req: AuthRequest, res: Response): Promise<void> => {
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

      // Check if certificate exists and user has access
      const hasAccess = await this.checkCertificateAccess(certificateId, req.user);
      if (!hasAccess.success) {
        res.status(hasAccess.status).json({
          success: false,
          message: hasAccess.message
        });
        return;
      }

      // Extract PDF options from request body
      const {
        format = 'A4',
        margin,
        printBackground = true,
        displayHeaderFooter = false,
        headerTemplate,
        footerTemplate
      } = req.body;

      const pdfOptions: Partial<PDFGenerationOptions> = {
        format,
        printBackground,
        displayHeaderFooter,
        headerTemplate,
        footerTemplate
      };

      if (margin) {
        pdfOptions.margin = margin;
      }

      const pdfBuffer = await this.certificateTemplateService.generateCertificatePDF(
        certificateId, 
        pdfOptions
      );

      // Get certificate details for filename
      const templateData = await this.certificateTemplateService.getCertificateTemplateData(certificateId);
      const filename = `Certificate_${templateData.certificate.certificateNo.replace(/[^a-zA-Z0-9]/g, '_')}_Custom.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);

    } catch (error) {
      console.error('💥 Error regenerating certificate PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to regenerate certificate PDF',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * DELETE /api/certificates/template-cache
   * Clear template cache (development/admin only)
   */
  clearTemplateCache = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Only admin can clear cache
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Only administrators can clear template cache.'
        });
        return;
      }

      this.certificateTemplateService.clearTemplateCache();

      res.json({
        success: true,
        message: 'Template cache cleared successfully'
      });

    } catch (error) {
      console.error('💥 Error clearing template cache:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear template cache',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Check if user has access to certificate
   */
  private async checkCertificateAccess(
    certificateId: number, 
    user?: any
  ): Promise<{ success: boolean; status: number; message: string }> {
    try {
      if (!user) {
        return {
          success: false,
          status: 401,
          message: 'Authentication required'
        };
      }

      const templateData = await this.certificateTemplateService.getCertificateTemplateData(certificateId);
      
      if (!templateData) {
        return {
          success: false,
          status: 404,
          message: 'Certificate not found'
        };
      }

      // Admin can access all certificates
      if (user.role === 'admin') {
        return { success: true, status: 200, message: 'Access granted' };
      }

      // Technician can access certificates they created
      if (user.role === 'technician' && templateData.certificate.createdBy.id === user.id) {
        return { success: true, status: 200, message: 'Access granted' };
      }

      // Users can view approved certificates only (if needed)
      if (user.role === 'user' && templateData.certificate.status === 'approved') {
        return { success: true, status: 200, message: 'Access granted' };
      }

      return {
        success: false,
        status: 403,
        message: 'Access denied. You do not have permission to view this certificate.'
      };

    } catch (error) {
      return {
        success: false,
        status: 500,
        message: 'Error checking certificate access'
      };
    }
  }

  /**
   * Add print-specific enhancements to HTML
   */
  private addPrintEnhancements(html: string): string {
    const printScript = `
      <script>
        window.onload = function() {
          // Auto-print when page loads (optional)
          // window.print();
          
          // Add print button
          const printButton = document.createElement('button');
          printButton.textContent = 'Print Certificate';
          printButton.className = 'no-print';
          printButton.style.cssText = \`
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            z-index: 9999;
            font-size: 14px;
          \`;
          printButton.onclick = () => window.print();
          document.body.appendChild(printButton);
        };
      </script>
    `;

    return html.replace('</body>', `${printScript}</body>`);
  }

  /**
   * Helper method to get signature file path based on user ID
   */
  private getSignatureFilePath(userId: number, signatureFilename?: string): string | undefined {
    if (!signatureFilename) return undefined;
    return `/uploads/signature-${userId}-${signatureFilename}`;
  }
}

export default CertificateTemplateController;