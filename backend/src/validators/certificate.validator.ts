import { z } from 'zod';

const AmbientConditionsSchema = z.object({
  temperature: z.number().min(-50).max(100),
  humidity: z.number().min(0).max(100),
  pressure: z.number().min(800).max(1200),
  gasTemperature: z.number().min(-50).max(100),
  flowRate: z.number().min(1).max(10000),
  gasPressure: z.number().min(800).max(1200)
});

const CalibrationDataSchema = z.object({
  gasType: z.string().min(1, "Gas type is required"),
  standardValue: z.number().positive("Standard value must be positive"),
  measurement1: z.number().min(0, "Measurement 1 cannot be negative"),
  measurement2: z.number().min(0, "Measurement 2 cannot be negative"),
  measurement3: z.number().min(0, "Measurement 3 cannot be negative"),
  resolution: z.number().positive("Resolution must be positive"),
  uncertaintyStandard: z.number().min(0, "Uncertainty standard cannot be negative"),
  meanValue: z.number().optional(),
  error: z.number().optional(),
  repeatability: z.number().min(0).optional(),
  combinedUncertainty: z.number().min(0).optional(),
  expandedUncertainty: z.number().min(0).optional()
});

export const CreateCertificateSchema = z.object({
  certificateNo: z.string().optional(),
  formatType: z.enum(['draft', 'official']).default('official'),
  equipmentId: z.string().min(1, "Equipment ID is required"),
  probeId: z.string().min(1, "Probe ID is required"),
  customerId: z.string().min(1, "Customer ID is required"),
  technicianName: z.string().min(1, "Technician name is required"),
  calibrationPlace: z.string().min(1, "Calibration place is required"),
  procedureNo: z.string().min(1, "Procedure number is required"),
  hasAdjustment: z.boolean().optional(),
  hasWatermark: z.boolean().default(false),
  
  dateOfCalibration: z.string()
    .optional()
    .transform((str) => str ? new Date(str) : undefined),
  
  dateOfIssue: z.string()
    .optional()
    .transform((str) => str ? new Date(str) : undefined),
  
  ambientConditions: AmbientConditionsSchema.partial().optional(),
  calibrationData: z.array(CalibrationDataSchema).optional(),
  adjustedData: z.array(CalibrationDataSchema).optional(),
  remarks: z.string().optional(),
  
  // ✅ FIXED: Change toolId preprocessing to return undefined instead of null
  toolId: z.preprocess((val) => {
    if (val === null || val === undefined || val === '' || val === 0) return undefined;
    const num = Number(val);
    return Number.isNaN(num) ? undefined : num;
  }, z.number().int().positive().optional()), // Remove .nullable()
});

export const UpdateCertificateSchema = CreateCertificateSchema.partial();

export const UpdateAmbientConditionsSchema = AmbientConditionsSchema.partial();

export const CertificateQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.enum(['pending', 'approved']).optional(),
  search: z.string().optional()
});