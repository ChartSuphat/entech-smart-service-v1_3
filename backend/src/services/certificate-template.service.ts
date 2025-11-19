// FIXED: src/services/certificate-template.service.ts - Add watermark support

import { PrismaClient } from '@prisma/client';
import * as handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  CertificateTemplateData,
  CertificateWithAllRelations,
  CompanyInfo,
  StandardReference,
  ProcessedAmbientConditions,
  SignatureData,
  CalculationResults,
  PDFGenerationOptions,
  DEFAULT_PDF_OPTIONS,
  DEFAULT_COMPANY_INFO
} from '../types/certificate-template.types';

export class CertificateTemplateService {
  private prisma: PrismaClient;
  private templateCache: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor() {
    this.prisma = new PrismaClient();
    this.registerHandlebarsHelpers();
  }

  /**
   * Generate HTML from certificate data
   */
  async generateCertificateHTML(certificateId: number): Promise<string> {
    try {
      const templateData = await this.getCertificateTemplateData(certificateId);
      const template = await this.getTemplate('certificate');
      
      return template(templateData);
    } catch (error) {
      console.error('💥 Error generating certificate HTML:', error);
      throw new Error(`Failed to generate certificate HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate PDF from certificate data
   */
  async generateCertificatePDF(
    certificateId: number, 
    options: Partial<PDFGenerationOptions> = {}
  ): Promise<Buffer> {
    try {
      const html = await this.generateCertificateHTML(certificateId);
      const pdfOptions = { ...DEFAULT_PDF_OPTIONS, ...options };

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Set content and wait for fonts/images to load
      await page.setContent(html, { 
        waitUntil: ['networkidle0', 'domcontentloaded'] 
      });

      // Generate PDF - explicitly type the result
      const pdfResult = await page.pdf({
        format: pdfOptions.format,
        margin: pdfOptions.margin,
        printBackground: pdfOptions.printBackground,
        preferCSSPageSize: pdfOptions.preferCSSPageSize,
        displayHeaderFooter: pdfOptions.displayHeaderFooter,
        headerTemplate: pdfOptions.headerTemplate,
        footerTemplate: pdfOptions.footerTemplate
      }) as Uint8Array;

      await browser.close();
      
      // Convert to Buffer to ensure proper typing
      return Buffer.from(pdfResult);
    } catch (error) {
      console.error('💥 Error generating certificate PDF:', error);
      throw new Error(`Failed to generate certificate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ✅ FIXED: Get complete certificate data for template with watermark support
   */
  async getCertificateTemplateData(certificateId: number): Promise<CertificateTemplateData> {
    try {
      const certificate = await this.prisma.certificate.findUnique({
        where: { id: certificateId },
        include: {
          equipment: true,
          probe: true,
          customer: true,
          tool: true,
          createdBy: {
            select: { 
              id: true, 
              fullName: true, 
              email: true, 
              role: true,
              avatar: true,
              signature: true
            }
          },
          approvedBy: {
            select: { 
              id: true, 
              fullName: true, 
              email: true, 
              role: true,
              avatar: true,
              signature: true
            }
          },
          calibrationData: { orderBy: { id: 'asc' } },
          adjustedData: { orderBy: { id: 'asc' } }
        }
      });

      if (!certificate) {
        throw new Error('Certificate not found');
      }

      // Process calibration data with gasUnit from tool
      const gasUnit = certificate.tool?.gasUnit || 'ppm';
      const processedCalibrationData = this.processCalibrationData(certificate.calibrationData, gasUnit);
      const processedAdjustedData = certificate.adjustedData && certificate.adjustedData.length > 0 ?
        this.processCalibrationData(certificate.adjustedData, gasUnit) : [];

      // Auto-fill signature paths
      let technicianSignature: string | undefined;
      let approverSignature: string | undefined;

    if (certificate.createdBy?.signature) {
  technicianSignature = `http://localhost:4040/uploads/signatures/${certificate.createdBy.signature}`;
  // Will be: /uploads/signatures/sig-2-1759410993282.png
}

if (certificate.approvedBy?.signature) {
  approverSignature = `http://localhost:4040/uploads/signatures/${certificate.approvedBy.signature}`;
}

      const isDraft = this.isDraftCertificate(certificate);

      // ✅ ADD THIS LINE: Get logo as base64
      const logoBase64 = await this.getLogoAsBase64();

      // Create certificate with processed data
      const certificateWithProcessedData = {
        ...certificate,
        calibrationData: processedCalibrationData,
        adjustedData: processedAdjustedData,
        createdBy: certificate.createdBy ? {
          ...certificate.createdBy,
          signature: technicianSignature
        } : undefined,
        approvedBy: certificate.approvedBy ? {
          ...certificate.approvedBy,
          signature: approverSignature
        } : undefined
      };

      const templateData: CertificateTemplateData = {
        certificate: certificateWithProcessedData as CertificateWithAllRelations,

        // ✅ UPDATE THIS LINE: Use base64 logo
        company: {
          ...this.getCompanyInfo(),
          logo: logoBase64  // Changed from '/Logo.png' to base64
        },

        standardReference: await this.getStandardReference(certificate.calibrationData, certificate.tool),
        ambientConditions: this.processAmbientConditions(certificate.ambientConditions),
        signatures: this.getSignatureData(certificate, technicianSignature, approverSignature),
        calculations: this.getCalculationResults(certificateWithProcessedData),
        isDraft: isDraft,
        formatType: certificate.formatType || 'official'
      };

      return templateData;
    } catch (error) {
      console.error('Error getting certificate template data:', error);
      throw error;
    }
  }
  
  /**
   * ✅ NEW: Determine if certificate should be displayed as draft
   */
 private isDraftCertificate(certificate: any): boolean {
  // Only show watermark if explicitly enabled via checkbox
  const shouldShowWatermark = certificate.hasWatermark === true;
  
  console.log('🎯 Watermark check:', {
    formatType: certificate.formatType,
    hasWatermark: certificate.hasWatermark,
    status: certificate.status,
    result: shouldShowWatermark
  });
  
  return shouldShowWatermark;
}

  /**
   * Process calibration data and calculate missing values
   */
  private processCalibrationData(calibrationData: any[], gasUnit: string = 'ppm'): any[] {
    if (!calibrationData || calibrationData.length === 0) {
      return [];
    }

    return calibrationData.map(data => {
      const measurements = [data.measurement1, data.measurement2, data.measurement3];

      // Calculate values if they don't exist or recalculate if needed
      const meanValue = data.meanValue || this.calculateMean(measurements);
      const error = data.error !== null ? data.error : (data.standardValue - meanValue);
      const repeatability = data.repeatability || this.calculateRepeatability(measurements, meanValue);
      const combinedUncertainty = data.combinedUncertainty || this.calculateCombinedUncertainty(
        data.uncertaintyStandard,
        repeatability,
        data.resolution
      );
      const expandedUncertainty = data.expandedUncertainty || (combinedUncertainty * 2); // k=2

      return {
        ...data,
        gasUnit: gasUnit, // Add gasUnit to each calibration data row
        meanValue: Number(meanValue.toFixed(1)),
        error: Number(error.toFixed(1)),
        repeatability: Number(repeatability.toFixed(1)),
        combinedUncertainty: Number(combinedUncertainty.toFixed(1)),
        expandedUncertainty: Number(expandedUncertainty.toFixed(1))
      };
    });
  }

  /**
   * Calculate mean of measurements
   */
  private calculateMean(measurements: number[]): number {
    return measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
  }

  /**
   * Calculate repeatability uncertainty
   */
  private calculateRepeatability(measurements: number[], mean: number): number {
    if (measurements.length <= 1) return 0;
    const variance = measurements.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (measurements.length - 1);
    return Math.sqrt(variance) / Math.sqrt(measurements.length);
  }

  /**
   * Calculate combined uncertainty
   */
  private calculateCombinedUncertainty(
    uncertaintyStandard: number, 
    repeatability: number, 
    resolution: number
  ): number {
    const resolutionUncertainty = resolution / (2 * Math.sqrt(3));
    return Math.sqrt(
      Math.pow(uncertaintyStandard, 2) + 
      Math.pow(repeatability, 2) + 
      Math.pow(resolutionUncertainty, 2)
    );
  }

  /**
   * Process ambient conditions with units
   */
  private processAmbientConditions(ambientConditions: any): ProcessedAmbientConditions {
    const conditions = typeof ambientConditions === 'string' 
      ? JSON.parse(ambientConditions) 
      : ambientConditions || {};
    
    return {
      temperature: conditions.temperature || 25.0,
      humidity: conditions.humidity || 55.0,
      gasTemperature: conditions.gasTemperature || 30.5,
      flowRate: conditions.flowRate || 1000,
      gasPressure: conditions.gasPressure || 1023.5,
      temperatureUnit: '°C',
      humidityUnit: '%RH',
      gasTemperatureUnit: '°C',
      flowRateUnit: 'mL/min',
      gasPressureUnit: 'mbar'
    };
  }

  /**
   * ✅ UPDATED: Get standard reference data with tool support
   */
  private async getStandardReference(calibrationData: any[], tool?: any): Promise<StandardReference[]> {
    // If we have tool data, use it
    if (tool) {
      const gasUnit = tool?.gasUnit || 'ppm';
      return [{
        standard: `${tool.gasName} ${tool.concentration}`,
        gasUnit: gasUnit,
        referenceNo: tool.certificateNumber || 'N/A',
        vendor: tool.vendorName || 'N/A',
        dueDate: tool.dueDate ? new Date(tool.dueDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: '2-digit'
        }) : 'N/A'
      }];
    }

    // Fallback to calibration data
    if (!calibrationData || calibrationData.length === 0) {
      return [{
        standard: 'Ammonia (NH3) 50.2 ppm',
        gasUnit: 'ppm',
        referenceNo: 'CG-0940-24',
        vendor: 'NIMT',
        dueDate: '12-Mar-26'
      }];
    }

    // Get unique gas types from calibration data
    const uniqueGasTypes = [...new Set(calibrationData.map(d => d.gasType))];
    
    return uniqueGasTypes.map(gasType => ({
      standard: `${gasType} 50.2 ppm`,
      gasUnit: tool?.gasUnit || 'ppm',
      referenceNo: 'CG-0940-24',
      vendor: 'NIMT',
      dueDate: '12-Mar-26'
    }));
  }

  /**
   * Get signature data with auto-filled signatures
   */
  private getSignatureData(
    certificate: any, 
    technicianSignature?: string, 
    approverSignature?: string
  ): SignatureData {
    return {
      technicianName: certificate.createdBy?.fullName || certificate.technicianName || 'Unknown Technician',
      technicianSignature: technicianSignature,
      approverName: certificate.approvedBy?.fullName || certificate.approverName || 'Mr.Pongpat Keiwamphon',
      approverSignature: approverSignature,
      technicianTitle: 'Technician',
      approverTitle: 'Approved By'
    };
  }

  /**
   * Get calculation results and metadata
   */
  private getCalculationResults(certificate: any): CalculationResults {
    // Build parameter string from all calibration data to show all gases with their units
    let parameterOfCalibration = 'Gas Calibration';

    if (certificate.calibrationData && certificate.calibrationData.length > 0) {
      const gasParams = certificate.calibrationData.map((data: any) => {
        const gasType = data.gasType;

        // Check if gasType already includes value and unit (legacy format)
        // e.g., "Hydrogen (H2) 49.3 %LEL"
        if (gasType && (gasType.includes('%LEL') || gasType.includes('ppm') || gasType.includes('%vol'))) {
          return gasType; // Use as-is if it already has unit
        }

        // Otherwise build the string with value and unit
        const value = data.standardValue;
        const unit = data.gasUnit || certificate.tool?.gasUnit || 'ppm';
        return `${gasType} ${value} ${unit}`;
      });
      parameterOfCalibration = `Gas Calibration ${gasParams.join(', ')}`;
    } else if (certificate.tool) {
      const gasType = certificate.tool.gasName || 'Unknown';
      const concentration = certificate.tool.concentration || 0;
      const unit = certificate.tool.gasUnit || 'ppm';
      parameterOfCalibration = `Gas Calibration ${gasType} ${concentration} ${unit}`;
    }

    return {
      totalPages: 2,
      receivingNo: certificate.customer?.customerId || certificate.id.toString(),
      parameterOfCalibration: parameterOfCalibration,
      conditionOfUUC: 'Used',
      remarks: [
        '1μmol/mol = 1 ppm',
        `Sensor NH₃ rang 0-100 ppm Reponse time T₉₀/T₉₅ (s) = 50/90`
      ]
    };
  }

  /**
   * Get company information with updated logo path
   */
  private getCompanyInfo(): CompanyInfo {
    return {
      ...DEFAULT_COMPANY_INFO,
      logo: '/Logo.png'  // Frontend public folder path
    };
  }
 private async getLogoAsBase64(): Promise<string> {
  try {
    // Adjusted paths for your project structure
    const possiblePaths = [
      path.join(process.cwd(), '..', 'frontend', 'public', 'Logo.png'), // Backend accessing frontend
      path.join(process.cwd(), 'public', 'Logo.png'), // If backend has its own public folder
      path.join(process.cwd(), 'uploads', 'documents', 'Logo.png'),
      'C:\\Users\\suphat\\Entech-Smart-Service\\frontend\\public\\Logo.png' // Absolute path as fallback
    ];

    for (const logoPath of possiblePaths) {
      try {
        console.log('Trying logo path:', logoPath);
        const logoBuffer = await fs.readFile(logoPath);
        const base64Logo = logoBuffer.toString('base64');
        console.log('✅ Logo loaded from:', logoPath);
        return `data:image/png;base64,${base64Logo}`;
      } catch (err) {
        console.log('❌ Logo not found at:', logoPath);
        continue;
      }
    }

    console.warn('⚠️ Logo not found in any expected location');
    return '';
  } catch (error) {
    console.error('❌ Error loading logo:', error);
    return '';
  }
}
  /**
   * Load and compile Handlebars template
   */
  private async getTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      // Updated path resolution to be more flexible
      const templatePath = path.join(__dirname, '..', 'template', `${templateName}.hbs`);
      console.log('📂 Loading template from:', templatePath);
      
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateContent);
      
      this.templateCache.set(templateName, template);
      return template;
    } catch (error) {
      console.error(`💥 Error loading template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found at expected location`);
    }
  }

  /**
 * Register Handlebars helpers
 */
private registerHandlebarsHelpers(): void {
  // Date formatting
  handlebars.registerHelper('formatDate', (date: Date | string, format: string = 'DD-MMM-YY') => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear().toString().slice(-2);
    
    switch (format) {
      case 'DD-MMM-YY':
        return `${day}-${month}-${year}`;
      case 'DD-MMM-YYYY':
        return `${day}-${month}-${d.getFullYear()}`;
      case 'DD/MM/YY':
        return `${day}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${year}`;
      default:
        return d.toLocaleDateString();
    }
  });

  // Number formatting
  handlebars.registerHelper('formatNumber', (num: number | string, decimals: number = 1) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (typeof n !== 'number' || isNaN(n)) return num;
    return n.toFixed(decimals);
  });

  // ✅ ADD THIS NEW HELPER HERE - BOOLEAN CHECKER
  handlebars.registerHelper('ifTrue', function(this: any, value: any, options: any) {
    if (value === true) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  // Temperature and humidity formatting
  handlebars.registerHelper('formatTemperature', (temp: number) => {
    return `${temp.toFixed(1)} °C`;
  });

  handlebars.registerHelper('formatHumidity', (humidity: number) => {
    return `${humidity.toFixed(1)} %RH`;
  });


    // Conditional helpers
    handlebars.registerHelper('eq', (a: any, b: any) => {
      return a === b;
    });

    handlebars.registerHelper('gt', (a: number, b: number) => {
      return a > b;
    });

    handlebars.registerHelper('add', (a: number, b: number) => {
      return a + b;
    });

    handlebars.registerHelper('subtract', (a: number, b: number) => {
      return a - b;
    });

    // Format gas parameter with value and unit for table display
    handlebars.registerHelper('gasWithValueUnit', (data: any) => {
      if (!data) return '';

      const gasType = data.gasType || '';
      const standardValue = data.standardValue || '';
      const gasUnit = data.gasUnit || '';

      // If gasType already includes value and unit (legacy format), use as-is
      if (gasType && (gasType.includes('%LEL') || gasType.includes('ppm') || gasType.includes('%vol'))) {
        return gasType;
      }

      // Otherwise build: "Hydrogen (H2) 49.3 %LEL"
      return `${gasType} ${standardValue} ${gasUnit}`.trim();
    });

    // Conditional block helper
    handlebars.registerHelper('ifCond', function(this: any, v1: any, operator: string, v2: any, options: any) {
      switch (operator) {
        case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    });
  }

  /**
   * Clear template cache (useful for development)
   */
  public clearTemplateCache(): void {
    this.templateCache.clear();
  }

  /**
   * Check if certificate exists and has required data
   */
  async validateCertificateForTemplate(certificateId: number): Promise<boolean> {
    try {
      const certificate = await this.prisma.certificate.findUnique({
        where: { id: certificateId },
        include: {
          equipment: true,
          probe: true,
          customer: true
        }
      });

      return !!(certificate && certificate.equipment && certificate.probe && certificate.customer);
    } catch (error) {
      console.error('Error validating certificate:', error);
      return false;
    }
  }
}