// src/types/certificate-template.types.ts

export interface CertificateTemplateData {
  certificate: CertificateWithAllRelations;
  company: CompanyInfo;
  standardReference: StandardReference[];
  ambientConditions: ProcessedAmbientConditions;
  signatures: SignatureData;
  calculations: CalculationResults;
  // ✅ ADD THESE TWO LINES:
  isDraft: boolean;
  formatType: 'draft' | 'official';
}

export interface CertificateWithAllRelations {
  id: number;
  certificateNo: string;
  formatType: 'draft' | 'official';
  status: string;
  dateOfIssue: Date;
  dateOfCalibration: Date;
  dueDate?: Date;
  technicianName: string;
  technicianSignature?: string;
  approverName: string;
  approverSignature?: string;
  calibrationPlace: string;
  procedureNo: string;
  hasAdjustment: boolean;
  createdAt: Date;
  updatedAt: Date;
  hasWatermark: boolean;

  
  // Relations
  equipment: EquipmentInfo;
  probe: ProbeInfo;
  customer: CustomerInfo;
  createdBy: UserInfo;
  approvedBy?: UserInfo;
  calibrationData: CalibrationDataInfo[];
  adjustedData: AdjustedCalibrationDataInfo[];
}

export interface EquipmentInfo {
  id: string;
  instrumentDescription: string;
  instrumentModel: string;
  instrumentSerialNo: string;
  idNoOrControlNo?: string;
  manufacturer: string;
}

export interface ProbeInfo {
  id: string;
  probeDescription: string;
  probeModel: string;
  probeSN: string;
}

export interface CustomerInfo {
  id: string;
  customerId: string;
  companyName: string;
  companyNameTH?: string;
  address: string;
  addressTH?: string;
  contactPerson: string;
  email: string;
  phone: string;
}

export interface UserInfo {
  id: number;
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
  signature?: string;
}

export interface CalibrationDataInfo {
  id: number;
  gasType: string;
  gasUnit: string;
  standardValue: number;
  measurement1: number;
  measurement2: number;
  measurement3: number;
  resolution: number;
  uncertaintyStandard: number;
  meanValue?: number;
  error?: number;
  repeatability?: number;
  combinedUncertainty?: number;
  expandedUncertainty?: number;
}

export interface AdjustedCalibrationDataInfo {
  id: number;
  gasType: string;
  gasUnit: string;
  standardValue: number;
  measurement1: number;
  measurement2: number;
  measurement3: number;
  resolution: number;
  uncertaintyStandard: number;
  meanValue?: number;
  error?: number;
  repeatability?: number;
  combinedUncertainty?: number;
  expandedUncertainty?: number;
}

export interface CompanyInfo {
  name: string;
  nameTH: string;
  address: string;
  addressTH: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  logo: string;
}

export interface StandardReference {
  standard: string;
  gasUnit: string
  referenceNo: string;
  vendor: string;
  dueDate: string;
}

// Updated ambient conditions interface - REMOVED PRESSURE
export interface ProcessedAmbientConditions {
  temperature: number;
  humidity: number;
  // Removed pressure field
  gasTemperature: number;
  flowRate: number;
  gasPressure: number;
  // Units for display
  temperatureUnit: string;
  humidityUnit: string;
  // Removed pressureUnit
  gasTemperatureUnit: string;
  flowRateUnit: string;
  gasPressureUnit: string;
}

export interface SignatureData {
  technicianName: string;
  technicianSignature?: string;
  approverName: string;
  approverSignature?: string;
  technicianTitle: string;
  approverTitle: string;
}

export interface CalculationResults {
  totalPages: number;
  receivingNo: string;
  parameterOfCalibration: string;
  conditionOfUUC: string;
  remarks: string[];
}

// PDF generation options with proper Buffer type
export interface PDFGenerationOptions {
  format: 'A4' | 'Letter';
  margin: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  printBackground: boolean;
  preferCSSPageSize: boolean;
  displayHeaderFooter: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}

export const DEFAULT_PDF_OPTIONS: PDFGenerationOptions = {
  format: 'A4',
  margin: {
    top: '0.5in',
    right: '0.5in',
    bottom: '0.5in',
    left: '0.5in'
  },
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: false
};

// Updated company info with Logo.png from src
export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'ENTECH SI CO.,LTD.',
  nameTH: 'บริษัท เอนเทค เอสไอ จำกัด',
  address: '177/121 Soi Ngamwongwan 47 Yaek 48, Toongsangphong, Laksri, Bangkok 10210 THAILAND',
  addressTH: '177/121 ซอยงามวงศ์วาน 47 แยก 48 ทุ่งสองห้อง หลักสี่ กรุงเทพฯ 10210',
  phone: '0-2779-8655',
  fax: 'Fax ID: 01055650200202',
  email: 'info@entechsi.com',
  website: 'www.entechsi.com',
  logo: '/app/src/Logo.png'  // Updated to use Logo.png from src
};

// Type assertion helper for Puppeteer PDF result
export type PDFResult = Buffer;