// utils/CertificateMapper.ts
export interface CertificateTemplateData {
  // Header Information
  certificateNo: string;
  dateOfIssue: string;
  
  // Equipment Information
  instrumentDescription: string;
  instrumentModel: string;
  instrumentSerialNo: string;
  idNo: string;
  manufacturer: string;
  
  // Probe Information
  probeDescription: string;
  probeModel: string;
  probeSerial: string;
  
  // Customer Information
  customerName: string;
  customerAddress: string;
  
  // Certificate Details
  totalPages: number;
  currentPage: number;
  receivingNo: string;
  receivingDate: string;
  parameterOfCalibration: string;
  condition: string;
  
  // Environmental Conditions - removed pressure
  ambientConditions: {
    temperature: number;
    humidity: number;
  };
  
  // Calibration Information
  calibrationPlace: string;
  calibrationProcedureNo: string;
  dateOfCalibration: string;
  
  // Standard Reference (Table 1)
  standardReference: {
    standard: string;
    referenceNo: string;
    vendor: string;
    dueDate: string;
  };
  
  // Measured Room Conditions - removed pressure
  measuredConditions: {
    temperature: number;
    humidity: number;
    gasTemperature: number;
    flowRate: number;
    gasPressure: number;
  };
  
  // Calibration Results (Before Adjustment) - Table 2
  resultsBeforeAdjustment: {
    parameterOfStandard: string;
    standardValues: number;
    meanOfUUC: number;
    error: number;
    uncertainty: number;
  };
  
  // Calibration Results (After Adjustment) - Table 3 (if applicable)
  resultsAfterAdjustment?: {
    parameterOfStandard: string;
    standardValues: number;
    meanOfUUC: number;
    error: number;
    uncertainty: number;
  };
  
  // Additional Information
  remarks: string;
  sensorRange: string;
  responseTime: string;
  
  // Signatures - auto-filled by user ID
  technician: {
    name: string;
    signature?: string;
  };
  approvedBy: {
    name: string;
    signature?: string;
  };
  
  // Footer Information
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    taxId: string;
  };
  
  // Processing flags
  hasAdjustment: boolean;
  issuedDate: string;
}

export class CertificateMapper {
  static mapFormDataToTemplate(
    formData: any,
    customer: any,
    equipment: any,
    probe: any,
    tool: any,
    createdByUser?: any,  // Added user parameter for auto-filling signatures
    approvedByUser?: any
  ): CertificateTemplateData {
    
    // Calculate certificate number if not provided
    const certificateNo = formData.certificateNo || 
      `GC-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;
    
    return {
      // Header Information
      certificateNo,
      dateOfIssue: new Date().toLocaleDateString('en-GB'),
      
      // Equipment Information
      instrumentDescription: equipment?.instrumentDescription || 'Gas Detector',
      instrumentModel: equipment?.instrumentModel || 'N/A',
      instrumentSerialNo: equipment?.instrumentSerialNo || 'N/A',
      idNo: equipment?.id || 'N/A',
      manufacturer: 'Osham Co.,Ltd.', // Default from template
      
      // Probe Information
      probeDescription: probe?.probeDescription || 'Electrochemical Sensor',
      probeModel: probe?.probeModel || 'N/A',
      probeSerial: probe?.probeSN || 'N/A',
      
      // Customer Information
      customerName: customer?.companyName || 'N/A',
      customerAddress: customer?.address || 'N/A',
      
      // Certificate Details
      totalPages: formData.hasAdjustment ? 2 : 2, // Always 2 pages based on template
      currentPage: 1,
      receivingNo: formData.receivingNo || 'N/A',
      receivingDate: formData.dateOfCalibration || new Date().toLocaleDateString('en-GB'),
      parameterOfCalibration: `Gas Calibration ${tool?.gasName || 'Ammonia'} (${tool?.gasName || 'NH3'}) ${tool?.concentration || '50.2'} ppm`,
      condition: 'Used',
      
      // Environmental Conditions (removed pressure)
      ambientConditions: {
        temperature: formData.ambientConditions?.temperature || 25,
        humidity: formData.ambientConditions?.humidity || 55
      },
      
      // Calibration Information
      calibrationPlace: formData.calibrationPlace || 'EntechSi Co., Ltd.',
      calibrationProcedureNo: formData.procedureNo || 'WI-CL-17-C',
      dateOfCalibration: formData.dateOfCalibration || new Date().toLocaleDateString('en-GB'),
      
      // Standard Reference (Table 1)
      standardReference: {
        standard: `${tool?.gasName || 'Ammonia'} (${tool?.gasName || 'NH3'}) ${tool?.concentration || '50.2'} ppm`,
        referenceNo: tool?.certificateNumber || 'GG-0040-24',
        vendor: tool?.vendorName || 'NINT',
        dueDate: tool?.dueDate ? new Date(tool.dueDate).toLocaleDateString('en-GB') : 'N/A'
      },
      
      // Measured Room Conditions (removed pressure)
      measuredConditions: {
        temperature: formData.ambientConditions?.temperature || 31.2,
        humidity: formData.ambientConditions?.humidity || 55.1,
        gasTemperature: formData.ambientConditions?.gasTemperature || 30.5,
        flowRate: formData.ambientConditions?.flowRate || 1000,
        gasPressure: formData.ambientConditions?.gasPressure || 1023.5
      },
      
      // Calibration Results (Before Adjustment)
      resultsBeforeAdjustment: {
        parameterOfStandard: `${tool?.gasName || 'Ammonia'} (${tool?.gasName || 'NH3'}) ${tool?.concentration || '50.2'} ppm`,
        standardValues: formData.measurementData?.beforeAdjustment?.standardValue || tool?.concentration || 50.2,
        meanOfUUC: formData.measurementData?.beforeAdjustment?.meanUUC || 0,
        error: formData.measurementData?.beforeAdjustment?.error || 0,
        uncertainty: formData.uncertaintyBudget?.expandedUncertainty || 4.0
      },
      
      // Calibration Results (After Adjustment) - Only if hasAdjustment
      resultsAfterAdjustment: formData.hasAdjustment ? {
        parameterOfStandard: `${tool?.gasName || 'Ammonia'} (${tool?.gasName || 'NH3'}) ${tool?.concentration || '50.2'} ppm`,
        standardValues: formData.measurementData?.afterAdjustment?.standardValue || tool?.concentration || 50.2,
        meanOfUUC: formData.measurementData?.afterAdjustment?.meanUUC || 0,
        error: formData.measurementData?.afterAdjustment?.error || 0,
        uncertainty: formData.uncertaintyBudget?.expandedUncertainty || 4.0
      } : undefined,
      
      // Additional Information
      remarks: '1μmol/mol = 1 ppm',
      sensorRange: 'Sensor NH₃ rang 0-100 ppm Response time Ta/T₉₀ (s) = 50/90',
      responseTime: 'Ta/T₉₀ (s) = 50/90',
      
      // Signatures - auto-filled by user ID and signature files
      technician: {
        name: createdByUser?.fullName || formData.technicianName || 'Default Technician',
        signature: createdByUser?.signature || undefined
      },
      approvedBy: {
        name: approvedByUser?.fullName || 'Pongpat Kewarphan', // From template
        signature: approvedByUser?.signature || undefined
      },
      
      // Footer Information
      companyInfo: {
        name: 'ENTECH SI CO.,LTD.',
        address: '171/21 Wanwaithayakorn 47 Yaek 48, Thongsongkrong, Latkrabang, Bangkok 10210 THAILAND',
        phone: 'Tel. 0-2779-8855',
        email: 'info@entechsi.com',
        website: 'www.entechsi.com',
        taxId: '0105560020602'
      },
      
      // Processing flags
      hasAdjustment: formData.hasAdjustment || false,
      issuedDate: new Date().toLocaleDateString('en-GB')
    };
  }
  
  // Helper method to get user signature path
  static getUserSignaturePath(userId: number, signatureFilename?: string): string | undefined {
    if (!signatureFilename) return undefined;
    return `/uploads/signature-${userId}-${signatureFilename}`;
  }
  
  // Helper method to format dates consistently
  static formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB'); // DD/MM/YYYY format like in template
  }
  
  // Helper method to format numbers with proper precision
  static formatNumber(value: number, decimals: number = 1): string {
    return value.toFixed(decimals);
  }
  
  // Method to validate required fields
  static validateTemplateData(data: CertificateTemplateData): string[] {
    const errors: string[] = [];
    
    if (!data.certificateNo) errors.push('Certificate number is required');
    if (!data.instrumentDescription) errors.push('Instrument description is required');
    if (!data.customerName) errors.push('Customer name is required');
    if (!data.dateOfCalibration) errors.push('Calibration date is required');
    if (!data.technician.name) errors.push('Technician name is required');
    
    return errors;
  }
}