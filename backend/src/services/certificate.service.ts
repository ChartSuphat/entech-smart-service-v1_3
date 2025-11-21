// src/services/certificate.service.ts - UPDATED WITH CALIBRATION DATA SUPPORT

import { PrismaClient, CertificateStatus, Prisma } from '@prisma/client';
import {
  AmbientConditions,
  CreateCertificateData,
  UpdateCertificateData,
  CertificateFilters,
  CalibrationDataInput,
  CertificateResponse
} from '../types/certificate.types';

export class CertificateService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getAllCertificates(filters: CertificateFilters) {
    const { page, limit, status, search } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { certificateNo: { contains: search, mode: 'insensitive' } },
        { technicianName: { contains: search, mode: 'insensitive' } },
        { calibrationPlace: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [certificates, total] = await Promise.all([
      this.prisma.certificate.findMany({
        where,
        skip,
        take: limit,
        include: {
          equipment: true,
          probe: true,
          customer: true,
          createdBy: {
            select: { id: true, fullName: true, email: true, signature: true }
          },
          approvedBy: {
            select: { id: true, fullName: true, email: true, signature: true }
          },
          calibrationData: { orderBy: { id: 'asc' } },
          adjustedData: { orderBy: { id: 'asc' } }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prisma.certificate.count({ where })
    ]);

    return {
      certificates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getCertificateById(id: number, userId?: number, userRole?: string): Promise<CertificateResponse | null> {
  const certificate = await this.prisma.certificate.findUnique({
    where: { id },
    include: {
      equipment: true,
      probe: true,
      customer: true,
      tool: true, // This is already correct
      createdBy: {
        select: { id: true, fullName: true, email: true, signature: true }
      },
      approvedBy: {
        select: { id: true, fullName: true, email: true, signature: true }
      },
      calibrationData: { orderBy: { id: 'asc' } },
      adjustedData: { orderBy: { id: 'asc' } }
    }
  });

  if (!certificate) return null;

  // Add debugging to see if tool is loaded
  console.log('Certificate loaded with tool:', {
    certificateId: certificate.id,
    toolId: certificate.toolId,
    toolData: certificate.tool
  });

  return {
    ...certificate,
    ambientConditions: certificate.ambientConditions as unknown as AmbientConditions
  } as unknown as CertificateResponse;
}
  // UPDATED: Create certificate WITH calibration data
  async createCertificate(data: CreateCertificateData): Promise<CertificateResponse> {
  console.log('🔍 Backend received toolId:', {
    toolId: data.toolId,
    toolIdType: typeof data.toolId,
    isNull: data.toolId === null,
    isUndefined: data.toolId === undefined,
    isZero: data.toolId === 0
  });
  
  const certificateNo = data.certificateNo || await this.generateCertificateNumber();

  // Get technician info and signature
  const technician = await this.prisma.user.findUnique({
    where: { id: data.createdById },
    select: { 
      id: true,
      fullName: true, 
      signature: true,
      role: true 
    }
  });

  if (!technician) {
    throw new Error('Technician not found');
  }

  if (technician.role !== 'technician' && technician.role !== 'admin') {
    throw new Error('User must be technician or admin to create certificates');
  }

  const DEFAULT_AMBIENT_CONDITIONS: AmbientConditions = {
    temperature: 25.0,
    humidity: 55.0,
    pressure: 1013.4,
    gasTemperature: 30.5,
    flowRate: 1000,
    gasPressure: 1023.5
  };

  const mergedAmbient = {
    ...DEFAULT_AMBIENT_CONDITIONS,
    ...(data.ambientConditions || {})
  };

  // Get tool data to extract gasUnit
  let toolGasUnit = 'ppm'; // Default fallback
  if (data.toolId) {
    const tool = await this.prisma.tool.findUnique({
      where: { id: data.toolId },
      select: { gasUnit: true }
    });
    if (tool?.gasUnit) {
      toolGasUnit = tool.gasUnit;
      console.log(`✅ Using gasUnit from tool: ${toolGasUnit}`);
    }
  }

  // Prepare calibration data for creation - include gasUnit from tool
  const calibrationDataCreate = data.calibrationData?.map(cal => ({
    gasType: cal.gasType,
    gasUnit: toolGasUnit, // ✅ Add gasUnit from tool
    standardValue: cal.standardValue,
    measurement1: cal.measurement1,
    measurement2: cal.measurement2,
    measurement3: cal.measurement3,
    resolution: cal.resolution,
    uncertaintyStandard: cal.uncertaintyStandard,
    meanValue: cal.meanValue,
    error: cal.error,
    repeatability: cal.repeatability,
    combinedUncertainty: cal.combinedUncertainty,
    expandedUncertainty: cal.expandedUncertainty
  }));

  // Prepare adjusted data for creation (if hasAdjustment)
  const adjustedDataCreate = (data.hasAdjustment && data.adjustedData)
    ? data.adjustedData.map(adj => ({
        gasType: adj.gasType,
        gasUnit: toolGasUnit, // ✅ Add gasUnit from tool
        standardValue: adj.standardValue,
        measurement1: adj.measurement1,
        measurement2: adj.measurement2,
        measurement3: adj.measurement3,
        resolution: adj.resolution,
        uncertaintyStandard: adj.uncertaintyStandard,
        meanValue: adj.meanValue,
        error: adj.error,
        repeatability: adj.repeatability,
        combinedUncertainty: adj.combinedUncertainty,
        expandedUncertainty: adj.expandedUncertainty
      }))
    : undefined;

  console.log('Creating certificate with data:', {
    certificateNo,
    technicianName: technician.fullName,
    formatType: data.formatType || 'official', // ✅ LOG NEW FIELD
    hasWatermark: data.hasWatermark || false, // ✅ LOG NEW FIELD
    hasCalibrationData: !!calibrationDataCreate?.length,
    hasAdjustedData: !!adjustedDataCreate?.length,
    calibrationDataCount: calibrationDataCreate?.length || 0,
    adjustedDataCount: adjustedDataCreate?.length || 0
  });

  // Create certificate with nested calibration data
  const certificate = await this.prisma.certificate.create({
    data: {
      certificateNo,
      formatType: data.formatType || 'official', // ✅ CHANGED DEFAULT
      hasWatermark: data.hasWatermark || false, // ✅ ADD NEW FIELD
      dateOfIssue: data.dateOfIssue || new Date(), // ✅ ADD NEW FIELD
      equipmentId: data.equipmentId,
      probeId: data.probeId,
      toolId: data.toolId || null,
      customerId: data.customerId,
      technicianName: technician.fullName,
      technicianSignature: technician.signature,
      calibrationPlace: data.calibrationPlace,
      procedureNo: data.procedureNo,
      hasAdjustment: data.hasAdjustment || false,
      ambientConditions: mergedAmbient as unknown as Prisma.JsonObject,
      dateOfCalibration: data.dateOfCalibration || new Date(),
      createdById: data.createdById,
      status: 'pending',
      approvedById: null,
      approverSignature: null,
      remarks: data.remarks,
      
      // ADDED: Create related calibration data
      ...(calibrationDataCreate && calibrationDataCreate.length > 0 && {
        calibrationData: {
          create: calibrationDataCreate
        }
      }),

      // ADDED: Create related adjusted data if exists
      ...(adjustedDataCreate && adjustedDataCreate.length > 0 && {
        adjustedData: {
          create: adjustedDataCreate
        }
      })
    },
    include: {
      equipment: true,
      probe: true,
      customer: true,
      tool: true,
      createdBy: {
        select: { id: true, fullName: true, email: true, signature: true }
      },
      calibrationData: { orderBy: { id: 'asc' } },
      adjustedData: { orderBy: { id: 'asc' } }
    }
  });

  console.log(`✅ Certificate ${certificate.certificateNo} created successfully`);
  console.log(`   - Created by: ${technician.fullName}`);
  console.log(`   - Format: ${certificate.formatType} (watermark: ${certificate.hasWatermark})`); // ✅ LOG NEW FIELDS
  console.log(`   - Calibration data records: ${certificate.calibrationData?.length || 0}`);
  console.log(`   - Adjusted data records: ${certificate.adjustedData?.length || 0}`);
  console.log(`   - Technician signature: ${certificate.technicianSignature ? 'Auto-added' : 'Not available'}`);

  return certificate as unknown as CertificateResponse;
}

  // UPDATED: Update certificate WITH calibration data support
 async updateCertificate(id: number, data: UpdateCertificateData): Promise<CertificateResponse> {
  // Check if certificate exists
  const existingCertificate = await this.prisma.certificate.findUnique({
    where: { id },
    include: {
      calibrationData: true,
      adjustedData: true
    }
  });

  if (!existingCertificate) {
    throw new Error('Certificate not found');
  }

  // Use transaction to update certificate and calibration data atomically
  const updatedCertificate = await this.prisma.$transaction(async (tx) => {
    // Update the main certificate
    const updatePayload: Prisma.CertificateUpdateInput = {
      certificateNo: data.certificateNo,
      formatType: data.formatType,
      hasWatermark: data.hasWatermark, // ✅ ADD NEW FIELD
      dateOfIssue: data.dateOfIssue, // ✅ ADD NEW FIELD
      
      // Use Prisma relation syntax for foreign keys
      ...(data.equipmentId && {
        equipment: { connect: { id: data.equipmentId } }
      }),
      ...(data.probeId && {
        probe: { connect: { id: data.probeId } }
      }),
      ...(data.customerId && {
        customer: { connect: { id: data.customerId } }
      }),
      ...(data.toolId !== undefined && {
        tool: data.toolId ? { connect: { id: data.toolId } } : { disconnect: true }
      }),
      
      technicianName: data.technicianName,
      calibrationPlace: data.calibrationPlace,
      procedureNo: data.procedureNo,
      hasAdjustment: data.hasAdjustment,
      remarks: data.remarks,
      dateOfCalibration: data.dateOfCalibration,
      ambientConditions: data.ambientConditions
        ? data.ambientConditions as unknown as Prisma.JsonObject
        : undefined,
      updatedAt: new Date()
    };

    const updatedCert = await tx.certificate.update({
      where: { id },
      data: updatePayload
    });

    // Update calibration data if provided
    if (data.calibrationData) {
      // Delete existing calibration data
      await tx.calibrationData.deleteMany({
        where: { certificateId: id }
      });

      // Create new calibration data
      if (data.calibrationData.length > 0) {
        // Get tool gasUnit if toolId is provided in update
        let toolGasUnit = 'ppm';
        if (data.toolId) {
          const tool = await tx.tool.findUnique({
            where: { id: data.toolId },
            select: { gasUnit: true }
          });
          if (tool?.gasUnit) {
            toolGasUnit = tool.gasUnit;
          }
        } else {
          // If toolId not in update, get it from existing certificate
          const cert = await tx.certificate.findUnique({
            where: { id },
            select: { toolId: true }
          });
          if (cert?.toolId) {
            const tool = await tx.tool.findUnique({
              where: { id: cert.toolId },
              select: { gasUnit: true }
            });
            if (tool?.gasUnit) {
              toolGasUnit = tool.gasUnit;
            }
          }
        }

        await tx.calibrationData.createMany({
          data: data.calibrationData.map(cal => ({
            certificateId: id,
            gasType: cal.gasType,
            gasUnit: toolGasUnit, // ✅ Add gasUnit from tool
            standardValue: cal.standardValue,
            measurement1: cal.measurement1,
            measurement2: cal.measurement2,
            measurement3: cal.measurement3,
            resolution: cal.resolution,
            uncertaintyStandard: cal.uncertaintyStandard,
            meanValue: cal.meanValue,
            error: cal.error,
            repeatability: cal.repeatability,
            combinedUncertainty: cal.combinedUncertainty,
            expandedUncertainty: cal.expandedUncertainty
          }))
        });
      }
    }

    // Update adjusted data if provided and hasAdjustment is true
    if (data.adjustedData !== undefined) {
      // Delete existing adjusted data
      await tx.adjustedCalibrationData.deleteMany({
        where: { certificateId: id }
      });

      // Create new adjusted data if exists and hasAdjustment
      if (data.hasAdjustment && data.adjustedData.length > 0) {
        // Get tool gasUnit (same logic as calibration data)
        let toolGasUnit = 'ppm';
        if (data.toolId) {
          const tool = await tx.tool.findUnique({
            where: { id: data.toolId },
            select: { gasUnit: true }
          });
          if (tool?.gasUnit) {
            toolGasUnit = tool.gasUnit;
          }
        } else {
          const cert = await tx.certificate.findUnique({
            where: { id },
            select: { toolId: true }
          });
          if (cert?.toolId) {
            const tool = await tx.tool.findUnique({
              where: { id: cert.toolId },
              select: { gasUnit: true }
            });
            if (tool?.gasUnit) {
              toolGasUnit = tool.gasUnit;
            }
          }
        }

        await tx.adjustedCalibrationData.createMany({
          data: data.adjustedData.map(adj => ({
            certificateId: id,
            gasType: adj.gasType,
            gasUnit: toolGasUnit, // ✅ Add gasUnit from tool
            standardValue: adj.standardValue,
            measurement1: adj.measurement1,
            measurement2: adj.measurement2,
            measurement3: adj.measurement3,
            resolution: adj.resolution,
            uncertaintyStandard: adj.uncertaintyStandard,
            meanValue: adj.meanValue,
            error: adj.error,
            repeatability: adj.repeatability,
            combinedUncertainty: adj.combinedUncertainty,
            expandedUncertainty: adj.expandedUncertainty
          }))
        });
      }
    }

    // Return updated certificate with relations
    return await tx.certificate.findUnique({
      where: { id },
      include: {
        equipment: true,
        probe: true,
        customer: true,
        tool: true, // ✅ MAKE SURE TOOL IS INCLUDED
        createdBy: {
          select: { id: true, fullName: true, email: true, signature: true }
        },
        approvedBy: {
          select: { id: true, fullName: true, email: true, signature: true }
        },
        calibrationData: { orderBy: { id: 'asc' } },
        adjustedData: { orderBy: { id: 'asc' } }
      }
    });
  });

  console.log(`✅ Certificate ${updatedCertificate?.certificateNo} updated successfully`);
  console.log(`   - Format: ${updatedCertificate?.formatType} (watermark: ${updatedCertificate?.hasWatermark})`); // ✅ LOG NEW FIELDS
  console.log(`   - Calibration data records: ${updatedCertificate?.calibrationData?.length || 0}`);
  console.log(`   - Adjusted data records: ${updatedCertificate?.adjustedData?.length || 0}`);

  return updatedCertificate as unknown as CertificateResponse;
}

  // NEW: Add individual calibration data to existing certificate
  async addCalibrationData(certificateId: number, calibrationData: CalibrationDataInput[]): Promise<CertificateResponse | null> {
    try {
      await this.prisma.calibrationData.createMany({
        data: calibrationData.map(cal => ({
          certificateId,
          gasType: cal.gasType,
          standardValue: cal.standardValue,
          measurement1: cal.measurement1,
          measurement2: cal.measurement2,
          measurement3: cal.measurement3,
          resolution: cal.resolution,
          uncertaintyStandard: cal.uncertaintyStandard,
          meanValue: cal.meanValue,
          error: cal.error,
          repeatability: cal.repeatability,
          combinedUncertainty: cal.combinedUncertainty,
          expandedUncertainty: cal.expandedUncertainty
        }))
      });

      console.log(`✅ Added ${calibrationData.length} calibration data records to certificate ${certificateId}`);

      return await this.getCertificateById(certificateId);
    } catch (error) {
      console.error('Error adding calibration data:', error);
      throw error;
    }
  }

  // NEW: Add individual adjusted calibration data to existing certificate
  async addAdjustedCalibrationData(certificateId: number, adjustedData: CalibrationDataInput[]): Promise<CertificateResponse | null> {
    try {
      await this.prisma.adjustedCalibrationData.createMany({
        data: adjustedData.map(adj => ({
          certificateId,
          gasType: adj.gasType,
          standardValue: adj.standardValue,
          measurement1: adj.measurement1,
          measurement2: adj.measurement2,
          measurement3: adj.measurement3,
          resolution: adj.resolution,
          uncertaintyStandard: adj.uncertaintyStandard,
          meanValue: adj.meanValue,
          error: adj.error,
          repeatability: adj.repeatability,
          combinedUncertainty: adj.combinedUncertainty,
          expandedUncertainty: adj.expandedUncertainty
        }))
      });

      console.log(`✅ Added ${adjustedData.length} adjusted data records to certificate ${certificateId}`);

      return await this.getCertificateById(certificateId);
    } catch (error) {
      console.error('Error adding adjusted calibration data:', error);
      throw error;
    }
  }

  // Admin approval with auto-signature
  async approveCertificate(certificateId: number, adminId: number): Promise<CertificateResponse> {
    try {
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId },
        select: { 
          id: true,
          fullName: true, 
          signature: true,
          role: true 
        }
      });

      if (!admin) {
        throw new Error('Admin not found');
      }

      if (admin.role !== 'admin') {
        throw new Error('Only admins can approve certificates');
      }

      const existingCertificate = await this.prisma.certificate.findUnique({
        where: { id: certificateId },
        select: { id: true, status: true, certificateNo: true }
      });

      if (!existingCertificate) {
        throw new Error('Certificate not found');
      }

      if (existingCertificate.status !== 'pending') {
        throw new Error('Certificate is not pending approval');
      }

      const approvedCertificate = await this.prisma.certificate.update({
        where: { id: certificateId },
        data: {
          status: 'approved',
          approvedById: adminId,
          approverName: admin.fullName,
          approverSignature: admin.signature,
          formatType: 'official',
          updatedAt: new Date(),
        },
        include: {
          equipment: true,
          probe: true,
          customer: true,
          createdBy: {
            select: { id: true, fullName: true, email: true, signature: true }
          },
          approvedBy: {
            select: { id: true, fullName: true, email: true, signature: true }
          },
          calibrationData: { orderBy: { id: 'asc' } },
          adjustedData: { orderBy: { id: 'asc' } }
        }
      });

      console.log(`✅ Certificate ${approvedCertificate.certificateNo} approved by ${admin.fullName}`);

      return approvedCertificate as unknown as CertificateResponse;

    } catch (error) {
      console.error('Error approving certificate:', error);
      throw error;
    }
  }
  // Add this method after the approveCertificate method
async bulkApproveCertificates(certificateIds: number[], adminId: number) {
  const results = {
    approvedCount: 0,
    skippedCount: 0,
    approvedCertificates: [] as CertificateResponse[],
    errors: [] as string[]
  };

  // Get admin info first
  const admin = await this.prisma.user.findUnique({
    where: { id: adminId },
    select: { 
      id: true,
      fullName: true, 
      signature: true,
      role: true 
    }
  });

  if (!admin) {
    throw new Error('Admin not found');
  }

  if (admin.role !== 'admin') {
    throw new Error('Only admins can approve certificates');
  }

  console.log(`Admin ${admin.fullName} bulk approving ${certificateIds.length} certificates`);

  // Process each certificate
  for (const certificateId of certificateIds) {
    try {
      // Check if certificate exists and is pending
      const existingCert = await this.prisma.certificate.findUnique({
        where: { id: certificateId },
        select: { id: true, certificateNo: true, status: true }
      });

      if (!existingCert) {
        console.log(`Certificate ${certificateId} not found, skipping`);
        results.skippedCount++;
        results.errors.push(`Certificate ${certificateId} not found`);
        continue;
      }

      if (existingCert.status === 'approved') {
        console.log(`Certificate ${existingCert.certificateNo} already approved, skipping`);
        results.skippedCount++;
        continue;
      }

      // Approve the certificate (reuse existing approval logic)
      const approvedCert = await this.approveCertificate(certificateId, adminId);
      results.approvedCertificates.push(approvedCert);
      results.approvedCount++;

      console.log(`✅ Certificate ${approvedCert.certificateNo} approved successfully`);

    } catch (error) {
      console.error(`❌ Error approving certificate ${certificateId}:`, error);
      results.skippedCount++;
      results.errors.push(`Certificate ${certificateId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log(`Bulk approval completed: ${results.approvedCount} approved, ${results.skippedCount} skipped`);
  return results;
}
  // Get pending certificates for admin review
  async getPendingCertificates() {
    try {
      const pendingCertificates = await this.prisma.certificate.findMany({
        where: { status: 'pending' },
        include: {
          equipment: true,
          probe: true,
          customer: true,
          createdBy: {
            select: { id: true, fullName: true, email: true }
          },
          calibrationData: { orderBy: { id: 'asc' } },
          adjustedData: { orderBy: { id: 'asc' } }
        },
        orderBy: { createdAt: 'desc' }
      });

      return pendingCertificates;

    } catch (error) {
      console.error('Error fetching pending certificates:', error);
      throw error;
    }
  }

  // Update user signature
  async updateUserSignature(userId: number, signaturePath: string) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { signature: signaturePath },
        select: { id: true, fullName: true, signature: true, role: true }
      });
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user signature:', error);
      throw error;
    }
  }

  // Update ambient conditions
  async updateAmbientConditions(id: number, ambient: Partial<AmbientConditions>) {
    const existingCert = await this.prisma.certificate.findUnique({
      where: { id },
      select: { ambientConditions: true }
    });

    if (!existingCert) {
      throw new Error('Certificate not found');
    }

    const currentAmbient = existingCert.ambientConditions as unknown as AmbientConditions;
    const mergedAmbient = {
      ...currentAmbient,
      ...ambient
    };

    const updated = await this.prisma.certificate.update({
      where: { id },
      data: {
        ambientConditions: mergedAmbient as unknown as Prisma.JsonObject,
        updatedAt: new Date()
      },
      include: {
        equipment: true,
        probe: true,
        customer: true,
        createdBy: {
          select: { id: true, fullName: true, email: true, signature: true }
        },
        approvedBy: {
          select: { id: true, fullName: true, email: true, signature: true }
        },
        calibrationData: { orderBy: { id: 'asc' } },
        adjustedData: { orderBy: { id: 'asc' } }
      }
    });

    return updated;
  }

  // Update certificate status
  async updateCertificateStatus(id: number, status: CertificateStatus, approvedById?: number) {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'approved' && approvedById) {
      updateData.approvedById = approvedById;
    }

    return await this.prisma.certificate.update({
      where: { id },
      data: updateData,
      include: {
        equipment: true,
        probe: true,
        customer: true,
        createdBy: {
          select: { id: true, fullName: true, email: true, signature: true }
        },
        approvedBy: {
          select: { id: true, fullName: true, email: true, signature: true }
        },
        calibrationData: { orderBy: { id: 'asc' } },
        adjustedData: { orderBy: { id: 'asc' } }
      }
    });
  }

  // Delete certificate with calibration data
async deleteCertificate(id: number): Promise<void> {
  try {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id },
      select: {
        id: true,
        certificateNo: true,
        status: true  // Keep this for logging only
      }
    });

    if (!certificate) {
      throw new Error('Certificate not found');
    }

    // ✅ REMOVED: Status check that was blocking approved certificates
    // if (certificate.status === 'approved') {
    //   throw new Error('Cannot delete approved certificates');
    // }

    // Use transaction to delete all related data
    await this.prisma.$transaction(async (tx) => {
      // Delete calibration data first (foreign key constraint)
      await tx.calibrationData.deleteMany({
        where: { certificateId: id }
      });

      // Delete adjusted calibration data
      await tx.adjustedCalibrationData.deleteMany({
        where: { certificateId: id }
      });

      // Delete the certificate
      await tx.certificate.delete({
        where: { id }
      });
    });

    console.log(`✅ Certificate ${certificate.certificateNo} (${certificate.status}) and all related data deleted successfully`);
  } catch (error) {
    console.error('Error deleting certificate:', error);
    throw error;
  }
}

  // Utility functions
  async getDefaultAmbientConditions(): Promise<AmbientConditions> {
    return {
      temperature: 25.0,
      humidity: 55.0,
      pressure: 1013.4,
      gasTemperature: 30.5,
      flowRate: 1000,
      gasPressure: 1023.5
    };
  }

  async generateCertificateNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `GC-${year}${month}${random}`;
  }
}

export default CertificateService;