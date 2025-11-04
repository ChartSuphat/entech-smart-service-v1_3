// services/pdfGenerator.service.ts - Enhanced with format type support
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';

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
  // FIXED: Use formatType instead of status for draft/official
  formatType: 'draft' | 'official';
  status: 'pending' | 'approved';
  // Signature and logo paths
  technicianSignature?: string;
  approverSignature?: string;
  companyLogo?: string;
}

export class PDFGeneratorService {
  private uploadsDir: string;
  private templatePath: string;

  constructor() {
    // Set uploads directory path
    this.uploadsDir = process.env.NODE_ENV === 'production' 
      ? '/var/uploads' 
      : path.join(process.cwd(), 'src/uploads');
    
    // Path to your HTML template
    this.templatePath = path.join(process.cwd(), 'templates', 'certificate.hbs');
  }

  async generateCertificatePDF(certificateData: CertificateData): Promise<Buffer> {
    console.log('🔍 Generating PDF for certificate:', certificateData.certificateNo, 'Format:', certificateData.formatType);
    
    try {
      // Method 1: Use HTML template with Puppeteer (Recommended)
      if (fs.existsSync(this.templatePath)) {
        return await this.generateFromHTMLTemplate(certificateData);
      } else {
        // Method 2: Fallback to PDFKit method
        console.log('⚠️ HTML template not found, using PDFKit fallback');
        return await this.generateWithPDFKit(certificateData);
      }
    } catch (error) {
      console.error('💥 Error generating PDF:', error);
      throw error;
    }
  }

  // NEW: Generate PDF from HTML template using Puppeteer
  private async generateFromHTMLTemplate(certificateData: CertificateData): Promise<Buffer> {
    console.log('📄 Using HTML template method for PDF generation');
    
    // Enrich data with signatures and prepare template data
    const enrichedData = await this.enrichWithSignatures(certificateData);
    
    // Prepare template data
    const templateData = {
      certificate: enrichedData,
      // FIXED: Pass isDraft flag based on formatType
      isDraft: enrichedData.formatType === 'draft',
      signatures: {
        technicianName: enrichedData.technicianName,
        technicianTitle: 'Technician',
        technicianSignature: enrichedData.technicianSignature,
        approverName: 'Mr. Pongpat Keiwamphon',
        approverTitle: 'Approved By',
        approverSignature: enrichedData.approverSignature
      },
      calculations: {
        totalPages: enrichedData.calibrationData && enrichedData.calibrationData.length > 0 ? 2 : 1,
        receivingNo: enrichedData.certificateNo,
        parameterOfCalibration: enrichedData.gasCylinder 
          ? `Gas Calibration ${enrichedData.gasCylinder.gasName} ${enrichedData.gasCylinder.realConcentration} ppm`
          : 'Gas Calibration',
        conditionOfUUC: 'Used'
      },
      standardReference: enrichedData.gasCylinder ? [{
        standard: `${enrichedData.gasCylinder.gasName} (${enrichedData.gasCylinder.chemicalFormula})`,
        referenceNo: enrichedData.gasCylinder.itemNumber,
        vendor: enrichedData.gasCylinder.supplierName,
        dueDate: 'N/A'
      }] : []
    };

    // Read and compile HTML template
    const templateSource = fs.readFileSync(this.templatePath, 'utf8');
    const template = handlebars.compile(templateSource);
    
    // Register Handlebars helpers
    this.registerHandlebarsHelpers();
    
    // Generate HTML from template
    const html = template(templateData);
    
    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      // Set content and wait for it to load
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Generate PDF with A4 settings
      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          bottom: '15mm',
          left: '15mm',
          right: '15mm'
        }
      });
      
      // Convert Uint8Array to Buffer
      const pdfBuffer = Buffer.from(pdfUint8Array);
      
      console.log('✅ PDF generated successfully using HTML template');
      return pdfBuffer;
      
    } finally {
      await browser.close();
    }
  }

  // Register Handlebars helpers for date and number formatting
  private registerHandlebarsHelpers() {
    // Date formatting helper
    handlebars.registerHelper('formatDate', (date: string | Date, format: string) => {
      const d = new Date(date);
      
      switch (format) {
        case 'DD-MMM-YY':
          return d.toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: '2-digit' 
          });
        case 'DD/MM/YY':
          return d.toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: '2-digit', 
            year: '2-digit' 
          });
        default:
          return d.toLocaleDateString();
      }
    });

    // Number formatting helper
    handlebars.registerHelper('formatNumber', (number: number, decimals: number = 1) => {
      return Number(number).toFixed(decimals);
    });
  }

  // FALLBACK: Generate PDF using PDFKit (your existing method)
  private async generateWithPDFKit(certificateData: CertificateData): Promise<Buffer> {
    console.log('📄 Using PDFKit fallback method for PDF generation');
    
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const pageWidth = 595.28;
    const pageHeight = 841.89;

    // Enrich with signatures
    const enrichedData = await this.enrichWithSignatures(certificateData);
    
    // Add company header with real logo
    await this.addHeader(doc, enrichedData, pageWidth);
    
    // Add certificate title and basic info
    this.addCertificateInfo(doc, enrichedData);
    
    // Add equipment and customer information
    this.addEquipmentInfo(doc, enrichedData);
    
    // Add calibration details
    this.addCalibrationDetails(doc, enrichedData);
    
    // Add ambient conditions
    this.addAmbientConditions(doc, enrichedData);
    
    // Add calibration data table (if available)
    if (enrichedData.calibrationData) {
      this.addCalibrationDataTable(doc, enrichedData.calibrationData);
    }
    
    // Add footer with real signatures
    await this.addFooter(doc, enrichedData, pageWidth, pageHeight);
    
    // Add company contact info
    this.addCompanyInfo(doc, pageHeight);
    
    // FIXED: Add draft watermark based on formatType
    if (enrichedData.formatType === 'draft') {
      this.addDraftWatermark(doc, pageWidth, pageHeight);
    }
    
    // Finalize the PDF
    doc.end();
    
    // Return PDF as buffer
    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
    });
  }

  // Enrich certificate data with user signatures
  private async enrichWithSignatures(data: CertificateData): Promise<CertificateData> {
    try {
      console.log('🔍 Enriching certificate with signatures for technician:', data.technicianName);
      
      // Fetch technician's signature from database
      const technicianSignaturePath = await this.getTechnicianSignature(data.technicianName);
      
      // Get approver's signature (fixed approver)
      const approverSignaturePath = await this.getApproverSignature();
      
      // Get company logo
      const companyLogoPath = await this.getCompanyLogo();
      
      return {
        ...data,
        technicianSignature: technicianSignaturePath,
        approverSignature: approverSignaturePath,
        companyLogo: companyLogoPath
      };
    } catch (error) {
      console.error('❌ Error enriching with signatures:', error);
      return data; // Return original data if signature fetching fails
    }
  }

  // Get technician signature from database
  private async getTechnicianSignature(technicianName: string): Promise<string | undefined> {
    try {
      const response = await fetch(`http://localhost:4040/api/users/by-name/${encodeURIComponent(technicianName)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log ("getTechnicianSignature: ", response)
      if (response.ok) {
        const userData = await response.json();
        const signaturePath = userData.data?.signature;
           console.log ("signaturePath: ", signaturePath)
        if (signaturePath) {
          const fullPath = signaturePath.startsWith('/uploads/') 
            ? path.join(this.uploadsDir, signaturePath.replace('/uploads/', ''))
            : path.join(this.uploadsDir, signaturePath);
          
          if (fs.existsSync(fullPath)) {
            console.log('✅ Found technician signature:', fullPath);
            return fullPath;
          }
        }
      }
      
      console.log('⚠️ No signature found for technician:', technicianName);
      return undefined;
    } catch (error) {
      console.error('❌ Error fetching technician signature:', error);
      return undefined;
    }
  }

  // Get approver signature (fixed approver)
  private async getApproverSignature(): Promise<string | undefined> {
    try {
      const response = await fetch('http://localhost:4040/api/users/by-name/Pongpat%20Keiwamphon', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const userData = await response.json();
        const signaturePath = userData.data?.signature;
        
        if (signaturePath) {
          const fullPath = signaturePath.startsWith('/uploads/') 
            ? path.join(this.uploadsDir, signaturePath.replace('/uploads/', ''))
            : path.join(this.uploadsDir, signaturePath);
          
          if (fs.existsSync(fullPath)) {
            console.log('✅ Found approver signature:', fullPath);
            return fullPath;
          }
        }
      }
      
      console.log('⚠️ No approver signature found');
      return undefined;
    } catch (error) {
      console.error('❌ Error fetching approver signature:', error);
      return undefined;
    }
  }

  // Get company logo
  private async getCompanyLogo(): Promise<string | undefined> {
    try {
      const possibleLogoPaths = [
        path.join(this.uploadsDir, 'documents', 'company-logo.png'),
        path.join(this.uploadsDir, 'documents', 'entech-logo.png'),
        path.join(this.uploadsDir, 'documents', 'logo.png'),
        path.join(this.uploadsDir, 'logos', 'company-logo.png'),
        path.join(process.cwd(), 'assets', 'logo.png'),
      ];
      
      for (const logoPath of possibleLogoPaths) {
        if (fs.existsSync(logoPath)) {
          console.log('✅ Found company logo:', logoPath);
          return logoPath;
        }
      }
      
      console.log('⚠️ No company logo found');
      return undefined;
    } catch (error) {
      console.error('❌ Error fetching company logo:', error);
      return undefined;
    }
  }

  // PDFKit helper methods (your existing methods with minor updates)
  private async addHeader(doc: PDFKit.PDFDocument, data: CertificateData, pageWidth: number) {
    if (data.companyLogo && fs.existsSync(data.companyLogo)) {
      try {
        doc.image(data.companyLogo, 50, 50, { width: 120, height: 40 });
      } catch (error) {
        this.addTextLogo(doc);
      }
    } else {
      this.addTextLogo(doc);
    }
    
    doc.fontSize(24)
      .fillColor('#000')
      .font('Helvetica-Bold')
      .text('Calibration Certificate', pageWidth - 350, 50, { width: 300, align: 'right' });
    
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .text('Certificate No.:', pageWidth - 350, 85)
      .font('Helvetica')
      .text(data.certificateNo, pageWidth - 250, 85);
    
    doc.moveTo(50, 130)
      .lineTo(pageWidth - 50, 130)
      .stroke();
  }

  private addTextLogo(doc: PDFKit.PDFDocument) {
    doc.fontSize(22)
      .fillColor('#1E88E5')
      .font('Helvetica-Bold')
      .text('ENTECH', 50, 50);
    
    doc.fontSize(22)
      .fillColor('#FF9800')
      .font('Helvetica-Bold')
      .text('SI', 135, 50);
  }

  private addDraftWatermark(doc: PDFKit.PDFDocument, pageWidth: number, pageHeight: number) {
    doc.save();
    doc.rotate(-45, { origin: [pageWidth / 2, pageHeight / 2] });
    doc.fontSize(72)
      .fillColor('#FF0000', 0.1)
      .font('Helvetica-Bold')
      .text('DRAFT', pageWidth / 2 - 100, pageHeight / 2 - 40);
    doc.restore();
  }

  // Keep your other existing PDFKit methods...
  private addCertificateInfo(doc: PDFKit.PDFDocument, data: CertificateData) {
    // Your existing implementation
  }

  private addEquipmentInfo(doc: PDFKit.PDFDocument, data: CertificateData) {
    // Your existing implementation
  }

  private addCalibrationDetails(doc: PDFKit.PDFDocument, data: CertificateData) {
    // Your existing implementation
  }

  private addAmbientConditions(doc: PDFKit.PDFDocument, data: CertificateData) {
    // Your existing implementation
  }

  private addCalibrationDataTable(doc: PDFKit.PDFDocument, calibrationData: Array<any>) {
    // Your existing implementation
  }

  private async addFooter(doc: PDFKit.PDFDocument, data: CertificateData, pageWidth: number, pageHeight: number) {
    // Your existing implementation with signature handling
  }

  private addCompanyInfo(doc: PDFKit.PDFDocument, pageHeight: number) {
    // Your existing implementation
  }
}

export default PDFGeneratorService;