// src/types/certificate.types.ts - FIXED VERSION
import { CertificateStatus, FormatType } from '@prisma/client';

// =============================================
// AMBIENT CONDITIONS
// =============================================
export interface AmbientConditions {
  temperature: number;      // °C
  humidity: number;         // %RH
  pressure: number;         // mbar
  gasTemperature: number;   // °C
  flowRate: number;         // mL/min
  gasPressure: number;      // mbar
}

// =============================================
// CALIBRATION DATA INTERFACES
// =============================================

// Input interface for creating calibration data (matches your frontend form)
export interface CalibrationDataInput {
  gasType: string;
  gasUnit: string;
  standardValue: number;
  measurement1: number;
  measurement2: number;
  measurement3: number;
  resolution: number;
  uncertaintyStandard: number;
  // Calculated fields (computed by frontend and saved to DB)
  meanValue: number;
  error: number;
  repeatability: number;
  combinedUncertainty: number;
  expandedUncertainty: number;
}

// Response interface for calibration data from database
export interface CalibrationDataResponse {
  id: number;
  certificateId: number;
  gasType: string;
  gasUnit: string;
  standardValue: number;
  measurement1: number;
  measurement2: number;
  measurement3: number;
  resolution: number;
  uncertaintyStandard: number;
  meanValue: number | null;
  error: number | null;
  repeatability: number | null;
  combinedUncertainty: number | null;
  expandedUncertainty: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// User selection interface for relations
export interface UserSelection {
  id: number;
  fullName: string;
  email: string;
  signature: string | null;
}

// =============================================
// CERTIFICATE CRUD INTERFACES
// =============================================

export interface CreateCertificateData {
  certificateNo?: string;
  receivingNo?: string;
  formatType?: 'draft' | 'official';
  hasWatermark?: boolean;
  dateOfIssue?: Date;
  equipmentId: string;
  probeId: string;
  customerId: string;
  technicianName: string;
  calibrationPlace: string;
  procedureNo: string;
  hasAdjustment?: boolean;
  dateOfCalibration?: Date;
  ambientConditions?: any;
  calibrationData?: any[];
  adjustedData?: any[];
  remarks?: string;
  toolId?: number;
  createdById: number;
}

export interface UpdateCertificateData {
  certificateNo?: string;
  receivingNo?: string;
  formatType?: 'draft' | 'official';
  hasWatermark?: boolean;
  dateOfIssue?: Date;
  equipmentId?: string;
  probeId?: string;
  customerId?: string;
  technicianName?: string;
  calibrationPlace?: string;
  procedureNo?: string;
  hasAdjustment?: boolean;
  dateOfCalibration?: Date;
  ambientConditions?: any;
  calibrationData?: any[];
  adjustedData?: any[];
  remarks?: string;
  toolId?: number;
}

// =============================================
// RESPONSE INTERFACES
// =============================================

export interface CertificateResponse {
  id: number;
  certificateNo: string;
  receivingNo?: string | null;
  formatType: FormatType;
  status: CertificateStatus;
  dateOfIssue: Date;
  dateOfCalibration: Date;
  dueDate: Date | null;
  equipmentId: string;
  probeId: string;
  customerId: string;
  toolId?: number | null;
  technicianName: string;
  technicianSignature: string | null;
  approverName: string;
  approverSignature: string | null;
  calibrationPlace: string;
  procedureNo: string;
  ambientConditions: AmbientConditions;
  hasAdjustment: boolean;
  createdById: number;
  approvedById: number | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations - matching Prisma query structure
  equipment?: {
    id: string;
    instrumentDescription: string;
    instrumentModel: string;
    instrumentSerialNo: string;
    manufacturer: string;
    [key: string]: any;
  };
  probe?: {
    id: string;
    probeDescription: string;
    probeModel: string;
    probeSN: string;
    [key: string]: any;
  };
  customer?: {
    id: string;
    customerId: string;
    companyName: string;
    companyNameTH: string | null;
    address: string;
    addressTH: string | null;
    contactPerson: string;
    email: string;
    phone: string;
    [key: string]: any;
  };
  createdBy?: UserSelection;
  approvedBy?: UserSelection | null;
  calibrationData?: CalibrationDataResponse[];
  adjustedData?: CalibrationDataResponse[];
}

// =============================================
// FILTER AND PAGINATION INTERFACES
// =============================================

export interface CertificateFilters {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  sortBy?: string;    
  sortOrder?: string; 
  userId?: number;
  userRole?: string;
  userCompanyCode?: string | null;
}

export interface CertificatePagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CertificateListResponse {
  certificates: CertificateResponse[];
  pagination: CertificatePagination;
}

// =============================================
// FRONTEND FORM DATA INTERFACES
// =============================================

export interface CertificateFormData {
  certificateNo: string;
  formatType: 'draft' | 'official';
  customerId: string;
  equipmentId: string;
  probeId: string;
  toolId: number;
  technicianName: string;
  calibrationPlace: string;
  procedureNo: string;
  hasAdjustment: boolean;
  dateOfCalibration: string;
  receivingNo: string;
  resolution: number;
  remarks: string;
  measurementData: {
    beforeAdjustment: {
      measure1: number;
      measure2: number;
      measure3: number;
      standardValue: number;
      meanUUC: number;
      error: number;
      uncertainty: number;
    };
    afterAdjustment: {
      measure1: number;
      measure2: number;
      measure3: number;
      standardValue: number;
      meanUUC: number;
      error: number;
      uncertainty: number;
    };
  };
  uncertaintyBudget: {
    repeatability: number;
    resolution: number;
    standardUncertainty: number;
    gasTemperatureEffect: number;
    gasFlowRateEffect: number;
    combinedUncertainty: number;
    expandedUncertainty: number;
    coverageFactor: number;
  };
  ambientConditions: {
    temperature: number;
    humidity: number;
    pressure: number;
    gasTemperature: number;
    flowRate: number;
    gasPressure: number;
  };
}

// =============================================
// UTILITY FUNCTION TYPES
// =============================================

export type FormDataToApiData = (
  formData: CertificateFormData,
  createdById: number,
  selectedTool?: any
) => CreateCertificateData;

export type ApiDataToFormData = (
  certificate: CertificateResponse
) => CertificateFormData;

// =============================================
// VALIDATION INTERFACES
// =============================================

export interface CertificateValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface CertificateValidationResult {
  isValid: boolean;
  errors: CertificateValidationError[];
}