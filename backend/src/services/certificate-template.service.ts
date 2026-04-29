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
  DEFAULT_COMPANY_INFO,
  ProcessedCalZeroData
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
      const processedCalibrationData = this.padToMinRows(this.processCalibrationData(certificate.calibrationData, gasUnit));
      const processedAdjustedData = certificate.adjustedData && certificate.adjustedData.length > 0 ?
        this.padToMinRows(this.processCalibrationData(certificate.adjustedData, gasUnit)) : [];

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

      // Process Cal Zero data for Biogas/CEMS certificates
      const calZeroData = this.processCalZeroData(certificate);

      const templateData: CertificateTemplateData = {
        certificate: certificateWithProcessedData as CertificateWithAllRelations,

        company: {
          ...this.getCompanyInfo(),
          logo: logoBase64
        },

        standardReference: this.padToMinRows(await this.getStandardReference(certificate.calibrationData, certificate.tool, certificate)) as StandardReference[],
        ambientConditions: this.processAmbientConditions(certificate.ambientConditions),
        signatures: this.getSignatureData(certificate, technicianSignature, approverSignature),
        calculations: this.getCalculationResults(certificateWithProcessedData),
        isDraft: isDraft,
        formatType: certificate.formatType || 'official',
        calZeroData
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
  private padToMinRows<T>(arr: T[], min = 4): (T | { isEmpty: true })[] {
    const result: (T | { isEmpty: true })[] = [...arr];
    while (result.length < min) result.push({ isEmpty: true });
    return result;
  }

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
        gasUnit: data.gasUnit || gasUnit, // Use row's gasUnit if exists, otherwise use fallback
        meanValue: Number(meanValue.toFixed(2)),
        error: Number(error.toFixed(2)),
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
  private async getStandardReference(calibrationData: any[], tool?: any, certificate?: any): Promise<StandardReference[]> {
    // Build from calibrationData rows (each row has referenceNo, vendor, certDueDate, gasType, standardValue, gasUnit)
    if (calibrationData && calibrationData.length > 0) {
      // Group rows by referenceNo so same-tank gases share one entry
      const seen = new Map<string, StandardReference[]>();

      for (const row of calibrationData) {
        const refNo = row.referenceNo || tool?.certificateNumber || 'N/A';
        const vendor = row.vendor || tool?.vendorName || 'N/A';
        const dueDate = row.certDueDate || (tool?.dueDate ? new Date(tool.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', timeZone: 'Asia/Bangkok' }) : 'N/A');
        const gasUnit = row.gasUnit || 'ppm';
        const standard = `${row.gasType} ${row.standardValue} ${gasUnit}`;

        if (!seen.has(refNo)) seen.set(refNo, []);
        seen.get(refNo)!.push({
          standard,
          gasUnit: '',   // unit already included in standard string
          referenceNo: refNo,
          vendor,
          dueDate
        });
      }

      // Flatten: one row per gas (rows already deduplicated by gas name via calibrationData)
      const refs = Array.from(seen.values()).flat();
      return this.prependZeroGasRef(refs, certificate);
    }

    // Fallback: single tool
    if (tool) {
      const gasUnit = tool.gasUnit || 'ppm';
      const dueDate = tool.dueDate ? new Date(tool.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', timeZone: 'Asia/Bangkok' }) : 'N/A';
      let refs: StandardReference[];
      if (tool.isMixGas && tool.components?.length) {
        refs = tool.components.map((c: any) => ({
          standard: `${c.gasName} ${c.concentration} ${c.gasUnit || gasUnit}`,
          gasUnit: '',
          referenceNo: tool.certificateNumber || 'N/A',
          vendor: tool.vendorName || 'N/A',
          dueDate
        }));
      } else {
        refs = [{
          standard: `${tool.gasName} ${tool.concentration} ${gasUnit}`,
          gasUnit: '',
          referenceNo: tool.certificateNumber || 'N/A',
          vendor: tool.vendorName || 'N/A',
          dueDate
        }];
      }
      return this.prependZeroGasRef(refs, certificate);
    }

    return this.prependZeroGasRef([], certificate);
  }

  /** Prepend zero gas entry to standard reference list for Biogas/CEMS certificates */
  private prependZeroGasRef(refs: StandardReference[], certificate?: any): StandardReference[] {
    if ((certificate?.certType !== 'biogas' && certificate?.certType !== 'cems' && certificate?.certType !== 'biogas_cems') || !certificate?.calZeroData) return refs;
    const czd = typeof certificate.calZeroData === 'string'
      ? JSON.parse(certificate.calZeroData)
      : certificate.calZeroData;
    if (!czd?.zeroGasName) return refs;
    const zeroEntry: StandardReference = {
      standard: czd.zeroGasName,
      gasUnit: '',
      referenceNo: czd.zeroReferenceNo || 'N/A',
      vendor: czd.zeroVendor || 'N/A',
      dueDate: czd.zeroDueDate || 'N/A'
    };
    return [zeroEntry, ...refs];
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
   * Process Cal Zero data for Biogas/CEMS certificates
   */
  private processCalZeroData(certificate: any): ProcessedCalZeroData | null {
    if ((certificate.certType !== 'biogas' && certificate.certType !== 'cems' && certificate.certType !== 'biogas_cems') || !certificate.calZeroData) return null;

    const czd = typeof certificate.calZeroData === 'string'
      ? JSON.parse(certificate.calZeroData)
      : certificate.calZeroData;

    const beforeRows = this.processCalibrationData(czd.beforeRows || [], 'ppm');
    const afterRows = czd.afterRows?.length > 0
      ? this.processCalibrationData(czd.afterRows, 'ppm')
      : [];

    return {
      zeroGasName: czd.zeroGasName || 'N/A',
      zeroReferenceNo: czd.zeroReferenceNo || 'N/A',
      zeroVendor: czd.zeroVendor || 'N/A',
      zeroDueDate: czd.zeroDueDate || 'N/A',
      standardRef: [{
        standard: czd.zeroGasName || 'N/A',
        gasUnit: '',
        referenceNo: czd.zeroReferenceNo || 'N/A',
        vendor: czd.zeroVendor || 'N/A',
        dueDate: czd.zeroDueDate || 'N/A'
      }],
      beforeRows,
      afterRows,
      hasAfterRows: afterRows.length > 0
    };
  }

  /**
   * Get calculation results and metadata
   */
  private getCalculationResults(certificate: any): CalculationResults {
    let parameterOfCalibration = 'Gas Calibration';

    const resolveUnit = (unit: string | null | undefined): string =>
      unit && unit !== 'N/A' && unit.trim() !== '' ? unit.trim() : 'ppm';

    const parts: string[] = [];

    // 1) Zero gas from calZeroData (if this is biogas/cems cert)
    const czd = certificate.calZeroData
      ? (typeof certificate.calZeroData === 'string' ? JSON.parse(certificate.calZeroData) : certificate.calZeroData)
      : null;
    if (czd?.zeroGasName) {
      parts.push(czd.zeroGasName);
    }

    // 2) Calibration gases from calibrationData rows
    if (certificate.calibrationData && certificate.calibrationData.length > 0) {
      for (const row of certificate.calibrationData) {
        const gasType = row.gasType && row.gasType !== 'Unknown' ? row.gasType : null;
        const stdVal  = row.standardValue != null ? row.standardValue : '';
        const unit    = resolveUnit(row.gasUnit);
        if (gasType) parts.push(`${gasType} ${stdVal} ${unit}`.trim());
      }
    } else if (certificate.tool) {
      // Fallback for old certs with no calibrationData rows
      const gasType = certificate.tool.gasName;
      const unit    = resolveUnit(certificate.tool.gasUnit);
      parts.push(`${gasType} ${certificate.tool.concentration} ${unit}`);
    }

    if (parts.length > 0) {
      // 2 entries per line
      const lines: string[] = [];
      for (let i = 0; i < parts.length; i += 2) {
        lines.push(parts.slice(i, i + 2).join(', '));
      }
      parameterOfCalibration = `Gas Calibration ${lines.join(',\n')}`;
    }

    const receivingNo = certificate.receivingNo || certificate.customer?.customerId || certificate.id.toString();
    console.log('📋 Receiving No calculation:', {
      certificateReceivingNo: certificate.receivingNo,
      customerCustomerId: certificate.customer?.customerId,
      certificateId: certificate.id,
      finalReceivingNo: receivingNo
    });

    return {
      totalPages: 2,
      receivingNo: receivingNo,
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

      // Extract clean gas name (remove any value/unit if corrupted in gasType)
      let gasName = data.gasType || '';
      // Remove patterns like "49.3 %LEL" or "50.2 ppm" from gasType if present
      gasName = gasName.replace(/\s+\d+\.?\d*\s*(%LEL|ppm|%vol|%|LEL).*$/i, '').trim();

      const standardValue = data.standardValue || '';
      const gasUnit = data.gasUnit || '';

      // Build: "Hydrogen (H2) 49.3 %LEL"
      return `${gasName} ${standardValue} ${gasUnit}`.trim();
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




