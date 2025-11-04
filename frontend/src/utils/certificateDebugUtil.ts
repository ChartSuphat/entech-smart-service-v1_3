// certificateDebugUtils.ts
// Separate debug utility functions for Certificate Modal

export interface DebugFormData {
  customerId: string;
  calibrationPlace: string;
  equipmentId: string;
  probeId: string;
  toolId: number;
  technicianName: string;
  procedureNo: string;
  hasAdjustment: boolean;
  dateOfCalibration: string;
  measurementData: any;
  uncertaintyBudget: any;
  ambientConditions: any;
  remarks: string;
}

// Debug logging functions
export const debugUtils = {
  
  // Log form data state
  logFormData: (currentStep: number, canProceed: boolean, formData: DebugFormData, customerInput: string, dataCounts: any) => {
    console.log('=== FORM DEBUG DATA ===');
    console.log('Current Step:', currentStep);
    console.log('Can Proceed:', canProceed);
    console.log('Form Data:', formData);
    console.log('Customer Input:', customerInput);
    console.log('All Data Counts:', dataCounts);
  },

  // Test API endpoints
  testAPIs: async () => {
    console.log('=== TESTING API ENDPOINTS ===');
    const endpoints = [
      '/api/customers',
      '/api/equipment', 
      '/api/equipment/probes',
      '/api/tools',
      '/api/users/profile'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, { 
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        console.log(`${endpoint}:`, response.status, response.ok ? '✅' : '❌');
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`${endpoint} Error:`, errorText);
        }
      } catch (error) {
        console.error(`${endpoint} ERROR:`, (error as Error).message);
      }
    }
  },

  // Log API loading progress
  logAPILoading: (message: string, endpoints?: string[]) => {
    console.log('🔍', message);
    if (endpoints) {
      console.log('📡 Starting API calls to:', endpoints);
    }
  },

  // Log API response status
  logAPIResponseStatus: (responses: Record<string, number>) => {
    console.log('📡 API Response Status:', responses);
  },

  // Log API response data
  logAPIResponseData: (type: string, data: any) => {
    const emoji = {
      'customers': '👥',
      'equipment': '🏭',
      'probes': '🔧',
      'tools': '🔧',
      'user': '👤'
    }[type] || '📄';
    
    console.log(`${emoji} ${type.charAt(0).toUpperCase() + type.slice(1)} API Response:`, data);
  },

  // Log successful data loading
  logDataLoaded: (type: string, count: number) => {
    console.log(`✅ Loaded ${type}:`, count);
  },

  // Log API errors
  logAPIError: (type: string, status: number, details?: string) => {
    console.error(`❌ ${type.charAt(0).toUpperCase() + type.slice(1)} API failed:`, status);
    if (details) {
      console.error(`❌ ${type.charAt(0).toUpperCase() + type.slice(1)} error details:`, details);
    }
  },

  // Log general errors
  logGeneralError: (context: string, error: any) => {
    console.error(`💥 Error ${context}:`, error);
  },

  // Log form submission
  logFormSubmission: (formData: DebugFormData, currentStep: number, mode: string, loading: boolean) => {
    console.log('🚀 Form submitted!');
    console.log('📝 Form data:', formData);
    console.log('🔍 Current step:', currentStep);
    console.log('🔍 Mode:', mode);
    console.log('🔍 Loading state before:', loading);
  },

  // Log certificate submission process
  logCertificateSubmission: (message: string, data?: any) => {
    console.log(message);
    if (data) {
      console.log('Form data:', data);
    }
  },

  // Log tool selection and auto-fill
  logToolAutoFill: (selectedTool: any, standardValue: number, standardUncertainty: number) => {
    console.log('🎯 Auto-filling standard value from tool:', selectedTool);
    console.log('📊 Tool data:', {
      gasName: selectedTool.gasName,
      concentration: selectedTool.concentration,
      selectedValue: standardValue
    });
    console.log('✅ Standard value auto-filled with:', standardValue);
    console.log('✅ Standard uncertainty auto-filled with:', standardUncertainty);
  },

  // Log measurements calculation
  logMeasurementCalculation: (type: string, calculation: any) => {
    console.log(`🧮 Calculation for ${type}:`, calculation);
  },

  // Log uncertainty budget calculation
  logUncertaintyCalculation: (data: any) => {
    console.log('🧮 Calculating uncertainty with:', data);
  },

  // Log step navigation
  logStepNavigation: (direction: string, currentStep: number, newStep?: number) => {
    const arrow = direction === 'next' ? '➡️' : '⬅️';
    console.log(`${arrow} ${direction.charAt(0).toUpperCase() + direction.slice(1)} button clicked, current step:`, currentStep);
    if (newStep) {
      console.log('✅ Moved to step:', newStep);
    }
  },

  // Log step validation
  logStepValidation: (currentStep: number, canProceed: boolean, validationData: any) => {
    console.log(`🔍 Step ${currentStep} can proceed:`, canProceed);
    console.log('📊 Current form validation data:', validationData);
  },

  // Log customer selection
  logCustomerSelection: (customer: any) => {
    console.log('👤 Customer selected:', customer);
  },

  // Log button clicks
  logButtonClick: (buttonName: string, buttonState?: any) => {
    console.log(`🚀 ${buttonName} button clicked!`);
    if (buttonState) {
      console.log('📋 Button state:', buttonState);
    }
  },

  // Log user data loading
  logUserDataLoading: (message: string, status?: number) => {
    console.log('🔍 Loading current user data...');
    if (status) {
      console.log('📡 API Response Status:', status);
    }
  },

  // Log user data success
  logUserDataSuccess: (userData: any, technicianName: string) => {
    console.log('👤 User Data:', userData);
    console.log('✅ Setting technician name to:', technicianName);
  },

  // Log user data warnings
  logUserDataWarning: (message: string) => {
    console.log('⚠️', message);
  },

  // Log modal state
  logModalState: (isOpen: boolean, mode: string) => {
    if (isOpen) {
      console.log('📂 Modal opened, loading data...');
    }
    console.log('Modal mode:', mode);
  },

  // Log API call details
  logAPICall: (method: string, url: string, data?: any) => {
    console.log(`📡 API Call: ${method} ${url}`);
    if (data) {
      console.log('📤 Request data:', data);
    }
  },

  // Log API response
  logAPIResponse: (url: string, status: number, data?: any) => {
    console.log(`📥 API Response from ${url}:`, status);
    if (data) {
      console.log('📄 Response data:', data);
    }
  },

  // Log certificate creation success
  logCertificateSuccess: (mode: string, responseData: any) => {
    console.log(`Certificate ${mode === 'create' ? 'created' : 'updated'} successfully!`);
    console.log('Response data:', {
      certificateNo: responseData.data?.certificateNo,
      calibrationDataCount: responseData.data?.calibrationData?.length || 0,
      adjustedDataCount: responseData.data?.adjustedData?.length || 0,
      hasRemarks: !!responseData.data?.remarks
    });
  },

  // Log certificate errors
  logCertificateError: (error: any, responseData?: any) => {
    console.error('Certificate submission error:', error);
    if (responseData) {
      console.error('Certificate API error:', responseData);
    }
  }
};

// Helper function to create test data
export const createTestData = (setFormData: Function, setCustomerInput: Function) => {
  console.log('=== FILL TEST DATA ===');
  setFormData((prev: any) => ({
    ...prev,
    customerId: 'test-customer-1',
    calibrationPlace: 'Test Lab',
    equipmentId: 'test-equipment-1',
    probeId: 'test-probe-1',
    toolId: 1,
    measurementData: {
      ...prev.measurementData,
      beforeAdjustment: {
        ...prev.measurementData.beforeAdjustment,
        measure1: 100.1,
        measure2: 100.2,
        measure3: 100.3,
        standardValue: 100.0
      }
    }
  }));
  setCustomerInput('Test Customer - Test Contact');
  console.log('Test data filled');
};

// Create debug panel state checker
export const getDebugPanelData = (
  currentStep: number,
  canProceedToNext: () => boolean,
  formData: DebugFormData,
  loading: boolean,
  dataCounts: { customers: number; equipment: number; probes: number; tools: number }
) => {
  return {
    currentStep,
    canProceed: canProceedToNext(),
    customerId: formData.customerId || 'EMPTY',
    calibrationPlace: formData.calibrationPlace || 'EMPTY',
    equipmentId: formData.equipmentId || 'EMPTY',
    probeId: formData.probeId || 'EMPTY',
    toolId: formData.toolId || 'EMPTY',
    loading,
    ...dataCounts
  };
};