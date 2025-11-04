import React, { useState, useEffect } from 'react';
import {
  HiX,
  HiSave,
  HiEye,
  HiCalendar,
  HiOfficeBuilding,
  HiUser,
  HiCog,
  HiDocumentText,
  HiDownload,
  HiDocument,
  HiChevronRight,
  HiCheck,
  HiBeaker,
  HiTrash
} from 'react-icons/hi';
import { debugUtils, createTestData, getDebugPanelData } from '../../utils/certificateDebugUtil';
// Import the separate uncertainty table component
import UncertaintyBudgetTable from './UncertaintyBudgetTable';
import api from '../../utils/axios';

// =============================================
// PART 1: TYPES AND INTERFACES
// =============================================

interface Certificate {
  id: number;
  certificateNo: string;
  status: 'pending' | 'approved';
  dateOfCalibration: string;
  dateOfIssue: string;
  equipmentId: string;
  probeId: string;
  customerId: string;
  toolId?: number; // Changed from gasCylinderId to toolId
  technicianName: string;
  calibrationPlace: string;
  procedureNo: string;
  hasAdjustment: boolean;
  ambientConditions?: {
    temperature: number;
    humidity: number;
    pressure: number;
    gasTemperature: number;
    flowRate: number;
    gasPressure: number;
  };
}

interface Equipment {
  id: string;
  instrumentDescription: string;
  instrumentModel: string;
  instrumentSerialNo: string;
  customerId?: string;
}

interface Probe {
  id: string;
  probeDescription: string;
  probeModel: string;
  probeSN: string;
  customerId?: string;
}

interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  address?: string;
}

interface Tool {
  id: number;
  certificateNumber: string;
  gasName: string;
  gasUnit: string;
  vendorName: string;
  concentration: number;
  uncertaintyPercent: number;
  uncertaintyStandard?: number;
  dueDate: string;
  certFile?: string;
  toolImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CertificateModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  certificate: Certificate | null;
  onClose: () => void;
  onSuccess: () => void;
  onDelete?: (certificate: Certificate) => Promise<void>;
}

// =============================================
// PART 2: MAIN COMPONENT
// =============================================

const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  mode,
  certificate,
  onClose,
  onSuccess
}) => {
  // =============================================
  // PART 3: STATE MANAGEMENT
  // =============================================

  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  // Data arrays - will be loaded from real APIs
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [allProbes, setAllProbes] = useState<Probe[]>([]);
  const [allTools, setAllTools] = useState<Tool[]>([]);

  // Filtered data
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [filteredProbes, setFilteredProbes] = useState<Probe[]>([]);
  // Equipment and Probe search state
  const [equipmentInput, setEquipmentInput] = useState('');
  const [probeInput, setProbeInput] = useState('');
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
  const [showProbeDropdown, setShowProbeDropdown] = useState(false);
  const [filteredEquipmentForSearch, setFilteredEquipmentForSearch] = useState<Equipment[]>([]);
  const [filteredProbesForSearch, setFilteredProbesForSearch] = useState<Probe[]>([]);
  const [selectedEquipmentIndex, setSelectedEquipmentIndex] = useState(-1);
  const [selectedProbeIndex, setSelectedProbeIndex] = useState(-1);
  // Customer input
  const [customerInput, setCustomerInput] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1);
  //edit mode 
  const [hasWatermark, setHasWatermark] = useState(false);
  const [issueDate, setIssueDate] = useState('');
  const [user, setUser] = useState<any>(null); // Only add if you don't already have this

  // Form state
  const [formData, setFormData] = useState({
    certificateNo: '',
    formatType: 'official' as 'draft' | 'official', // ✅ CHANGED: Default to 'official'
    customerId: '',
    equipmentId: '',
    probeId: '',
    toolId: 0,
    technicianName: 'Default Technician',
    calibrationPlace: '',
    procedureNo: 'WI-CL-17-C',
    hasAdjustment: false,
    dateOfCalibration: '',
    receivingNo: '',
    resolution: 0.1,
    remarks: '',
    measurementData: {
      beforeAdjustment: {
        measure1: 0,
        measure2: 0,
        measure3: 0,
        standardValue: 0,
        meanUUC: 0,
        error: 0,
        uncertainty: 0
      },
      afterAdjustment: {
        measure1: 0,
        measure2: 0,
        measure3: 0,
        standardValue: 0,
        meanUUC: 0,
        error: 0,
        uncertainty: 0
      }
    },
    uncertaintyBudget: {
      before: {
        repeatability: 0,
        resolution: 0,
        standardUncertainty: 0,
        gasTemperatureEffect: 0.1,
        gasFlowRateEffect: 0.1,
        combinedUncertainty: 0,
        expandedUncertainty: 0,
        coverageFactor: 2
      },
      after: {
        repeatability: 0,
        resolution: 0,
        standardUncertainty: 0,
        gasTemperatureEffect: 0.1,
        gasFlowRateEffect: 0.1,
        combinedUncertainty: 0,
        expandedUncertainty: 0,
        coverageFactor: 2
      }
    },
    ambientConditions: {
      temperature: 25.0,
      humidity: 55.0,
      pressure: 1013.4,
      gasTemperature: 30.5,
      flowRate: 1000,
      gasPressure: 1023.5
    }
  });

  // Updated steps configuration - reduced from 4 to 4 steps
  const steps = [
    { number: 1, title: 'Customer & Location', description: 'Select customer & calibration place' },
    { number: 2, title: 'Equipment & Standard Gas', description: 'Select equipment, probe & gas cylinder' },
    { number: 3, title: 'Measurements & Environment', description: 'Record data & ambient conditions' },
    { number: 4, title: 'Certificate Details', description: 'Final details & review' }
  ];

  // =============================================
  // PART 4: EFFECTS AND DATA LOADING
  // =============================================

  // Load all data from real APIs
  // const loadAllData = async () => {
  //   try {
  //     debugUtils.logAPILoading('Loading all data from APIs...', ['/api/customers', '/api/equipment', '/api/equipment/probes', '/api/tools']);

  //     // Load data from your real APIs
  //     const [customersRes, equipmentRes, probesRes, toolsRes] = await Promise.all([
  //       fetch('/api/customers', { credentials: 'include' }),
  //       fetch('/api/equipment', { credentials: 'include' }),
  //       fetch('/api/equipment/probes', { credentials: 'include' }),
  //       fetch('/api/tools', { credentials: 'include' }) // Tools endpoint
  //     ]);

  //     // Load customers
  //     if (customersRes.ok) {
  //       const customersData = await customersRes.json();
  //       console.log('👥 Customers API Response:', customersData);

  //       let customerArray = [];
  //       if (Array.isArray(customersData)) {
  //         customerArray = customersData;
  //       } else if (customersData.data && Array.isArray(customersData.data)) {
  //         customerArray = customersData.data;
  //       } else if (customersData.customers && Array.isArray(customersData.customers)) {
  //         customerArray = customersData.customers;
  //       }

  //       setAllCustomers(customerArray);
  //       setFilteredCustomers(customerArray);
  //       console.log('✅ Loaded customers:', customerArray.length);
  //     } else {
  //       console.error('❌ Customers API failed:', customersRes.status);
  //     }

  //     // Load equipment
  //     if (equipmentRes.ok) {
  //       const equipmentData = await equipmentRes.json();
  //       console.log('🏭 Equipment API Response:', equipmentData);

  //       let equipmentArray = [];
  //       if (Array.isArray(equipmentData)) {
  //         equipmentArray = equipmentData;
  //       } else if (equipmentData.data && Array.isArray(equipmentData.data)) {
  //         equipmentArray = equipmentData.data;
  //       }

  //       setAllEquipment(equipmentArray);
  //       console.log('✅ Loaded equipment:', equipmentArray.length);
  //     } else {
  //       console.error('❌ Equipment API failed:', equipmentRes.status);
  //     }

  //     // Load probes
  //     if (probesRes.ok) {
  //       const probesData = await probesRes.json();
  //       console.log('🔧 Probes API Response:', probesData);

  //       let probeArray = [];
  //       if (Array.isArray(probesData)) {
  //         probeArray = probesData;
  //       } else if (probesData.data && Array.isArray(probesData.data)) {
  //         probeArray = probesData.data;
  //       } else if (probesData.probes && Array.isArray(probesData.probes)) {
  //         probeArray = probesData.probes;
  //       }

  //       setAllProbes(probeArray);
  //       console.log('✅ Loaded probes:', probeArray.length);
  //     } else {
  //       console.error('❌ Probes API failed:', probesRes.status);
  //     }

  //     // Load tools
  //     if (toolsRes.ok) {
  //       const toolsData = await toolsRes.json();
  //       console.log('🏭 Tools API Response:', toolsData);

  //       let toolsArray = [];
  //       if (Array.isArray(toolsData)) {
  //         toolsArray = toolsData;
  //       } else if (toolsData.data && Array.isArray(toolsData.data)) {
  //         toolsArray = toolsData.data;
  //       } else if (toolsData.tools && Array.isArray(toolsData.tools)) {
  //         toolsArray = toolsData.tools;
  //       }

  //       // Filter only active/non-expired tools
  //       const activeTools = toolsArray.filter((tool: any) => {
  //         if (!tool.dueDate) return true;
  //         const isActive = new Date(tool.dueDate) > new Date();
  //         return isActive;
  //       });

  //       setAllTools(activeTools);
  //       console.log('✅ Loaded active tools:', activeTools.length);
  //     } else {
  //       console.error('❌ Tools API failed:', toolsRes.status);
  //       const errorText = await toolsRes.text();
  //       console.error('❌ Tools error details:', errorText);
  //     }
  //   } catch (error) {
  //     console.error('💥 Error loading data:', error);
  //   }
  // };

  const loadAllData = async () => {
    try {
      debugUtils.logAPILoading('Loading all data from APIs...', ['/api/customers', '/api/equipment', '/api/equipment/probes', '/api/tools']);

      const [customersRes, equipmentRes, probesRes, toolsRes] = await Promise.all([
        api.get('/customers'),
        api.get('/equipment'),
        api.get('/equipment/probes'),
        api.get('/tools')
      ]);

      // Load customers
      const customersData = customersRes.data;
      console.log('👥 Customers API Response:', customersData);

      let customerArray = [];
      if (Array.isArray(customersData)) {
        customerArray = customersData;
      } else if (customersData.data && Array.isArray(customersData.data)) {
        customerArray = customersData.data;
      } else if (customersData.customers && Array.isArray(customersData.customers)) {
        customerArray = customersData.customers;
      }

      setAllCustomers(customerArray);
      setFilteredCustomers(customerArray);

      // Load equipment
      const equipmentData = equipmentRes.data;
      let equipmentArray = [];
      if (Array.isArray(equipmentData)) {
        equipmentArray = equipmentData;
      } else if (equipmentData.data && Array.isArray(equipmentData.data)) {
        equipmentArray = equipmentData.data;
      }
      setAllEquipment(equipmentArray);

      // Load probes
      const probesData = probesRes.data;
      let probeArray = [];
      if (Array.isArray(probesData)) {
        probeArray = probesData;
      } else if (probesData.data && Array.isArray(probesData.data)) {
        probeArray = probesData.data;
      } else if (probesData.probes && Array.isArray(probesData.probes)) {
        probeArray = probesData.probes;
      }
      setAllProbes(probeArray);

      // Load tools
      const toolsData = toolsRes.data;
      let toolsArray = [];
      if (Array.isArray(toolsData)) {
        toolsArray = toolsData;
      } else if (toolsData.data && Array.isArray(toolsData.data)) {
        toolsArray = toolsData.data;
      } else if (toolsData.tools && Array.isArray(toolsData.tools)) {
        toolsArray = toolsData.tools;
      }

      const activeTools = toolsArray.filter((tool: any) => {
        if (!tool.dueDate) return true;
        return new Date(tool.dueDate) > new Date();
      });

      setAllTools(activeTools);
    } catch (error: any) {
      console.error('💥 Error loading data:', error);
    }
  };

  // const loadCurrentUserData = async () => {
  //   try {
  //     console.log('🔍 Loading current user data...');

  //     // Use your real API endpoint
  //     const response = await fetch('/api/users/profile', { 
  //       method: 'GET',
  //       credentials: 'include',
  //       headers: {
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     console.log('📡 API Response Status:', response.status);

  //     if (response.ok) {
  //       const userData = await response.json();
  //       console.log('👤 User Data:', userData);

  //       // Handle your API response format
  //       if (userData.success && userData.data) {
  //         const user = userData.data;
  //         const technicianName = user.fullName || user.name || user.username || 'Default Technician';

  //         console.log('✅ Setting technician name to:', technicianName);

  //         setFormData(prev => ({
  //           ...prev,
  //           technicianName: technicianName,
  //         }));
  //       } else if (userData.fullName || userData.name) {
  //         // Handle direct user object response
  //         const technicianName = userData.fullName || userData.name || userData.username || 'Default Technician';

  //         console.log('✅ Setting technician name to:', technicianName);

  //         setFormData(prev => ({
  //           ...prev,
  //           technicianName: technicianName,
  //         }));
  //       } else {
  //         console.log('⚠️ No user data found in response');
  //         setFormData(prev => ({
  //           ...prev,
  //           technicianName: 'Default Technician',
  //         }));
  //       }
  //     } else {
  //       console.error('❌ API call failed:', response.status, response.statusText);
  //       setFormData(prev => ({
  //         ...prev,
  //         technicianName: 'Default Technician',
  //       }));
  //     }
  //   } catch (error) {
  //     console.error('💥 Error loading user data:', error);
  //     setFormData(prev => ({
  //       ...prev,
  //       technicianName: 'Default Technician',
  //     }));
  //   }
  // };

  const loadCurrentUserData = async () => {
    try {
      const response = await api.get('/users/profile');

      if (response.data.success && response.data.data) {
        const user = response.data.data;
        const technicianName = user.fullName || user.name || user.username || 'Default Technician';

        setFormData(prev => ({
          ...prev,
          technicianName: technicianName,
        }));
      }
    } catch (error) {
      console.error('💥 Error loading user data:', error);
    }
  };

  //   const loadUserInfo = async () => {
  //   try {
  //     // Use the same endpoint you already have working
  //     const response = await fetch('/api/users/profile', { 
  //       credentials: 'include',
  //       headers: {
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     if (response.ok) {
  //       const userData = await response.json();
  //       console.log('👤 User Info for Admin Check:', userData);

  //       // Handle your API response format
  //       if (userData.success && userData.data) {
  //         setUser(userData.data);
  //       } else if (userData.fullName || userData.role) {
  //         setUser(userData);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error loading user info:', error);
  //   }
  // };
  const loadUserInfo = async () => {
    try {
      const response = await api.get('/users/profile');

      if (response.data.success && response.data.data) {
        setUser(response.data.data);
      } else if (response.data.fullName || response.data.role) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };



  const loadCertificateForEdit = async (certificateId: number) => {
    try {
      console.log('Loading certificate for edit:', certificateId);

      // const response = await fetch(`/api/certificates/${certificateId}`, {
      //   credentials: 'include'
      // });

      // if (!response.ok) {
      //   throw new Error(`Failed to load certificate: ${response.status}`);
      // }

      // const result = await response.json();
      // const fullCertificate = result.data || result;
      const response = await api.get(`/certificates/${certificateId}`);
      const fullCertificate = response.data.data || response.data;
      console.log('Full certificate data loaded:', fullCertificate);

      // ✅ FIXED: Check both hasWatermark field AND formatType for watermark state
      const certificateHasWatermark = fullCertificate.hasWatermark === true ||
        fullCertificate.formatType === 'draft';
      setHasWatermark(certificateHasWatermark);

      // Set issue date
      setIssueDate(fullCertificate.dateOfIssue
        ? new Date(fullCertificate.dateOfIssue).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
      );

      // Populate form with complete certificate data
      setFormData({
        certificateNo: fullCertificate.certificateNo || '',
        formatType: fullCertificate.formatType || 'official', // ✅ CHANGED: Default to 'official'
        customerId: fullCertificate.customerId || '',
        equipmentId: fullCertificate.equipmentId || '',
        probeId: fullCertificate.probeId || '',
        toolId: fullCertificate.toolId || 0,
        technicianName: fullCertificate.technicianName || 'Default Technician',
        calibrationPlace: fullCertificate.calibrationPlace || '',
        procedureNo: fullCertificate.procedureNo || 'WI-CL-17-C',
        hasAdjustment: fullCertificate.hasAdjustment || false,
        dateOfCalibration: fullCertificate.dateOfCalibration
          ? new Date(fullCertificate.dateOfCalibration).toISOString().split('T')[0]
          : '',
        receivingNo: fullCertificate.receivingNo || '',
        resolution: fullCertificate.resolution || 0.1,
        remarks: fullCertificate.remarks || '',
        // ... rest of your existing measurement data loading ...
        measurementData: {
          beforeAdjustment: {
            measure1: fullCertificate.calibrationData?.[0]?.measurement1 || 0,
            measure2: fullCertificate.calibrationData?.[0]?.measurement2 || 0,
            measure3: fullCertificate.calibrationData?.[0]?.measurement3 || 0,
            standardValue: fullCertificate.calibrationData?.[0]?.standardValue || 0,
            meanUUC: fullCertificate.calibrationData?.[0]?.meanValue || 0,
            error: fullCertificate.calibrationData?.[0]?.error || 0,
            uncertainty: fullCertificate.calibrationData?.[0]?.expandedUncertainty || 0
          },
          afterAdjustment: {
            measure1: fullCertificate.adjustedData?.[0]?.measurement1 || 0,
            measure2: fullCertificate.adjustedData?.[0]?.measurement2 || 0,
            measure3: fullCertificate.adjustedData?.[0]?.measurement3 || 0,
            standardValue: fullCertificate.adjustedData?.[0]?.standardValue || 0,
            meanUUC: fullCertificate.adjustedData?.[0]?.meanValue || 0,
            error: fullCertificate.adjustedData?.[0]?.error || 0,
            uncertainty: fullCertificate.adjustedData?.[0]?.expandedUncertainty || 0
          }
        },
        uncertaintyBudget: {
          before: {
            repeatability: fullCertificate.calibrationData?.[0]?.repeatability || 0,
            resolution: fullCertificate.calibrationData?.[0]?.resolution || 0.1,
            standardUncertainty: fullCertificate.calibrationData?.[0]?.uncertaintyStandard || 0,
            gasTemperatureEffect: 0.1,
            gasFlowRateEffect: 0.1,
            combinedUncertainty: fullCertificate.calibrationData?.[0]?.combinedUncertainty || 0,
            expandedUncertainty: fullCertificate.calibrationData?.[0]?.expandedUncertainty || 0,
            coverageFactor: 2
          },
          after: {
            repeatability: fullCertificate.adjustedData?.[0]?.repeatability || 0,
            resolution: fullCertificate.adjustedData?.[0]?.resolution || 0.1,
            standardUncertainty: fullCertificate.adjustedData?.[0]?.uncertaintyStandard || 0,
            gasTemperatureEffect: 0.1,
            gasFlowRateEffect: 0.1,
            combinedUncertainty: fullCertificate.adjustedData?.[0]?.combinedUncertainty || 0,
            expandedUncertainty: fullCertificate.adjustedData?.[0]?.expandedUncertainty || 0,
            coverageFactor: 2
          }
        },
        ambientConditions: fullCertificate.ambientConditions || {
          temperature: 25.0,
          humidity: 55.0,
          pressure: 1013.4,
          gasTemperature: 30.5,
          flowRate: 1000,
          gasPressure: 1023.5
        }
      });

      return fullCertificate;
    } catch (error) {
      console.error('Error loading certificate for edit:', error);
      throw error;
    }
  };
  // Populate customer display name for edit mode
  useEffect(() => {
    if (mode === 'edit' && certificate && allCustomers.length > 0 && formData.customerId) {
      const customer = allCustomers.find(c => c.id === formData.customerId);
      if (customer) {
        setCustomerInput(`${customer.companyName} - ${customer.contactPerson}`);
        console.log('Set customer input for edit mode:', customer.companyName);
      }
    }
  }, [mode, certificate, allCustomers, formData.customerId]);

  // Populate equipment display name for edit mode
  useEffect(() => {
    if (mode === 'edit' && certificate && filteredEquipment.length > 0 && formData.equipmentId) {
      const equipment = filteredEquipment.find(e => e.id === formData.equipmentId);
      if (equipment) {
        setEquipmentInput(`${equipment.instrumentDescription} - ${equipment.instrumentModel} (SN: ${equipment.instrumentSerialNo})`);
        console.log('Set equipment input for edit mode:', equipment.instrumentDescription);
      }
    }
  }, [mode, certificate, filteredEquipment, formData.equipmentId]);

  // Populate probe display name for edit mode
  useEffect(() => {
    if (mode === 'edit' && certificate && filteredProbes.length > 0 && formData.probeId) {
      const probe = filteredProbes.find(p => p.id === formData.probeId);
      if (probe) {
        setProbeInput(`${probe.probeDescription} - ${probe.probeModel} (SN: ${probe.probeSN})`);
        console.log('Set probe input for edit mode:', probe.probeDescription);
      }
    }
  }, [mode, certificate, filteredProbes, formData.probeId]);
  useEffect(() => {
    if (isOpen) {
      loadAllData();
      loadCurrentUserData();
      loadUserInfo(); // This will now work with your existing API

      if (mode === 'create') {
        setCurrentStep(1);
        setFormData(prev => ({
          ...prev,
          certificateNo: '',
          formatType: 'official', // ✅ CHANGED: Set to 'official' for new certificates
          customerId: '',
          equipmentId: '',
          probeId: '',
          toolId: 0,
          calibrationPlace: '',
          procedureNo: 'WI-CL-17-C',
          hasAdjustment: false,
          dateOfCalibration: new Date().toISOString().split('T')[0],
          remarks: '',
          ambientConditions: {
            temperature: 25.0,
            humidity: 55.0,
            pressure: 1013.4,
            gasTemperature: 30.5,
            flowRate: 1000,
            gasPressure: 1023.5
          }
        }));

        // ✅ RESET edit-specific states for create mode
        setHasWatermark(false); // No watermark for new certificates
        setIssueDate(new Date().toISOString().split('T')[0]);
        setCustomerInput('');
        setEquipmentInput('');
        setProbeInput('');
      } else if ((mode === 'edit' || mode === 'view') && certificate?.id) {
        // Load complete certificate data for edit/view
        loadCertificateForEdit(certificate.id)
          .then((fullCertificate) => {
            console.log('Certificate loaded successfully for', mode, 'mode');
          })
          .catch((error) => {
            console.error('Failed to load certificate:', error);
            alert('Failed to load certificate data');
          });
      }
    }
  }, [isOpen, mode, certificate?.id]);
  // Populate standard gas tool selection for edit mode
  useEffect(() => {
    if (mode === 'edit' && certificate && allTools.length > 0 && formData.toolId > 0) {
      const tool = allTools.find(t => t.id === formData.toolId);
      if (tool) {
        console.log('Found and selected tool for edit mode:', tool.gasName, tool.concentration);
        // The toolId is already set in formData, so the dropdown should show the selected tool
        // But we need to make sure the tool auto-fill effects trigger
        setTimeout(() => {
          console.log('Triggering tool auto-fill for edit mode');
        }, 100);
      } else {
        console.log('Tool not found in available tools:', formData.toolId, 'Available:', allTools.map(t => t.id));
      }
    }
  }, [mode, certificate, allTools, formData.toolId]);
  // Filter customers based on input
  useEffect(() => {
    if (customerInput.length > 0) {
      const filtered = allCustomers.filter(customer =>
        customer.companyName.toLowerCase().includes(customerInput.toLowerCase()) ||
        customer.contactPerson.toLowerCase().includes(customerInput.toLowerCase())
      );
      setFilteredCustomers(filtered);
      setShowCustomerDropdown(true);
      setSelectedCustomerIndex(-1); // Reset selection when filtering
    } else {
      setFilteredCustomers(allCustomers);
      setShowCustomerDropdown(false);
      setSelectedCustomerIndex(-1);
    }
  }, [customerInput, allCustomers]);

  // Filter equipment and probes when customer is selected
  useEffect(() => {
    if (formData.customerId) {
      const customerEquipment = allEquipment.filter(eq =>
        eq.customerId === formData.customerId || !eq.customerId
      );
      setFilteredEquipment(customerEquipment);

      const customerProbes = allProbes.filter(probe =>
        probe.customerId === formData.customerId || !probe.customerId
      );
      setFilteredProbes(customerProbes);
    } else {
      setFilteredEquipment(allEquipment);
      setFilteredProbes(allProbes);
    }
  }, [formData.customerId, allEquipment, allProbes]);

  // Auto-fill standard value when gas cylinder is selected
  // Filter equipment based on input
  useEffect(() => {
    if (equipmentInput.length > 0) {
      const filtered = filteredEquipment.filter(equipment =>
        equipment.instrumentDescription.toLowerCase().includes(equipmentInput.toLowerCase()) ||
        equipment.instrumentModel.toLowerCase().includes(equipmentInput.toLowerCase()) ||
        equipment.instrumentSerialNo.toLowerCase().includes(equipmentInput.toLowerCase())
      );
      setFilteredEquipmentForSearch(filtered);
      setShowEquipmentDropdown(true);
      setSelectedEquipmentIndex(-1);
    } else {
      setFilteredEquipmentForSearch(filteredEquipment);
      setShowEquipmentDropdown(false);
      setSelectedEquipmentIndex(-1);
    }
  }, [equipmentInput, filteredEquipment]);

  // Filter probes based on input
  useEffect(() => {
    if (probeInput.length > 0) {
      const filtered = filteredProbes.filter(probe =>
        probe.probeDescription.toLowerCase().includes(probeInput.toLowerCase()) ||
        probe.probeModel.toLowerCase().includes(probeInput.toLowerCase()) ||
        probe.probeSN.toLowerCase().includes(probeInput.toLowerCase())
      );
      setFilteredProbesForSearch(filtered);
      setShowProbeDropdown(true);
      setSelectedProbeIndex(-1);
    } else {
      setFilteredProbesForSearch(filteredProbes);
      setShowProbeDropdown(false);
      setSelectedProbeIndex(-1);
    }
  }, [probeInput, filteredProbes]);
  useEffect(() => {
    if (formData.toolId > 0) {
      const selectedTool = allTools.find(c => c.id === formData.toolId);
      if (selectedTool) {
        console.log('🎯 Auto-filling standard value from tool:', selectedTool);

        const standardValue = selectedTool.concentration || 0;

        console.log('📊 Tool data:', {
          gasName: selectedTool.gasName,
          concentration: selectedTool.concentration,
          selectedValue: standardValue
        });

        setFormData(prev => ({
          ...prev,
          measurementData: {
            ...prev.measurementData,
            beforeAdjustment: {
              ...prev.measurementData.beforeAdjustment,
              standardValue: standardValue
            },
            afterAdjustment: {
              ...prev.measurementData.afterAdjustment,
              standardValue: standardValue
            }
          }
        }));

        const standardUncertainty = selectedTool.uncertaintyStandard ||
          selectedTool.uncertaintyPercent ||
          0.09;

        setFormData(prev => ({
          ...prev,
          uncertaintyBudget: {
            ...prev.uncertaintyBudget,
            before: {
              ...prev.uncertaintyBudget.before,
              standardUncertainty: standardUncertainty
            },
            after: {
              ...prev.uncertaintyBudget.after,
              standardUncertainty: standardUncertainty
            }
          }
        }));

        setTimeout(() => {
          calculateMeasurements('beforeAdjustment');
          calculateMeasurements('afterAdjustment');
        }, 100);

        console.log('✅ Standard value auto-filled with:', standardValue);
        console.log('✅ Standard uncertainty auto-filled with:', standardUncertainty);
      }
    }
  }, [formData.toolId, allTools]);

  // Recalculate when measurement values change
  useEffect(() => {
    const beforeMeasurements = formData.measurementData.beforeAdjustment;
    if (beforeMeasurements.measure1 || beforeMeasurements.measure2 || beforeMeasurements.measure3 || beforeMeasurements.standardValue) {
      calculateMeasurements('beforeAdjustment');
    }
  }, [
    formData.measurementData.beforeAdjustment.measure1,
    formData.measurementData.beforeAdjustment.measure2,
    formData.measurementData.beforeAdjustment.measure3,
    formData.measurementData.beforeAdjustment.standardValue
  ]);

  useEffect(() => {
    const afterMeasurements = formData.measurementData.afterAdjustment;
    if (afterMeasurements.measure1 || afterMeasurements.measure2 || afterMeasurements.measure3 || afterMeasurements.standardValue) {
      calculateMeasurements('afterAdjustment');
    }
  }, [
    formData.measurementData.afterAdjustment.measure1,
    formData.measurementData.afterAdjustment.measure2,
    formData.measurementData.afterAdjustment.measure3,
    formData.measurementData.afterAdjustment.standardValue
  ]);

  // =============================================
  // PART 5: EVENT HANDLERS
  // =============================================

  const handleCustomerSelect = (customer: Customer) => {
    setFormData(prev => ({ ...prev, customerId: customer.id }));
    setCustomerInput(`${customer.companyName} - ${customer.contactPerson}`);
    setShowCustomerDropdown(false);
    setSelectedCustomerIndex(-1);
  };

  const handleCustomerInputChange = (value: string) => {
    setCustomerInput(value);
    if (!value) {
      setFormData(prev => ({ ...prev, customerId: '' }));
    }
  };

  const handleCustomerKeyDown = (e: React.KeyboardEvent) => {
    if (!showCustomerDropdown || filteredCustomers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedCustomerIndex(prev =>
          prev < filteredCustomers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedCustomerIndex(prev =>
          prev > 0 ? prev - 1 : filteredCustomers.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedCustomerIndex >= 0 && selectedCustomerIndex < filteredCustomers.length) {
          handleCustomerSelect(filteredCustomers[selectedCustomerIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowCustomerDropdown(false);
        setSelectedCustomerIndex(-1);
        break;
    }
  };
  // Equipment handlers
  const handleEquipmentSelect = (equipment: Equipment) => {
    setFormData(prev => ({ ...prev, equipmentId: equipment.id }));
    setEquipmentInput(`${equipment.instrumentDescription} - ${equipment.instrumentModel}( SN: ${equipment.instrumentSerialNo})`);
    setShowEquipmentDropdown(false);
    setShowEquipmentDropdown(false);
    setSelectedEquipmentIndex(-1);
  };

  const handleEquipmentInputChange = (value: string) => {
    setEquipmentInput(value);
    if (!value) {
      setFormData(prev => ({ ...prev, equipmentId: '' }));
    }
  };

  const handleEquipmentKeyDown = (e: React.KeyboardEvent) => {
    if (!showEquipmentDropdown || filteredEquipmentForSearch.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedEquipmentIndex(prev =>
          prev < filteredEquipmentForSearch.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedEquipmentIndex(prev =>
          prev > 0 ? prev - 1 : filteredEquipmentForSearch.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedEquipmentIndex >= 0 && selectedEquipmentIndex < filteredEquipmentForSearch.length) {
          handleEquipmentSelect(filteredEquipmentForSearch[selectedEquipmentIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowEquipmentDropdown(false);
        setSelectedEquipmentIndex(-1);
        break;
    }
  };

  // Probe handlers
  const handleProbeSelect = (probe: Probe) => {
    setFormData(prev => ({ ...prev, probeId: probe.id }));
    setProbeInput(`${probe.probeDescription} - ${probe.probeModel} (SN: ${probe.probeSN})`);
    setShowProbeDropdown(false);
    setSelectedProbeIndex(-1);
  };

  const handleProbeInputChange = (value: string) => {
    setProbeInput(value);
    if (!value) {
      setFormData(prev => ({ ...prev, probeId: '' }));
    }
  };

  const handleProbeKeyDown = (e: React.KeyboardEvent) => {
    if (!showProbeDropdown || filteredProbesForSearch.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedProbeIndex(prev =>
          prev < filteredProbesForSearch.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedProbeIndex(prev =>
          prev > 0 ? prev - 1 : filteredProbesForSearch.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedProbeIndex >= 0 && selectedProbeIndex < filteredProbesForSearch.length) {
          handleProbeSelect(filteredProbesForSearch[selectedProbeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowProbeDropdown(false);
        setSelectedProbeIndex(-1);
        break;
    }
  };
  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    console.log('🔍 canProceedToNext check:', {
      currentStep,
      customerId: formData.customerId,
      calibrationPlace: formData.calibrationPlace,
      equipmentId: formData.equipmentId,
      probeId: formData.probeId,
      toolId: formData.toolId,
      mode
    });

    switch (currentStep) {
      case 1:
        if (mode === 'edit') {
          // In edit mode, customer is already selected, just check calibration place
          return formData.calibrationPlace.trim() !== '';
        } else {
          const canProceed = formData.customerId !== '' && formData.calibrationPlace.trim() !== '';
          console.log('Step 1 can proceed:', canProceed);
          return canProceed;
          // // In create mode, need both customer and calibration place
          // return formData.customerId !== '' && formData.calibrationPlace.trim() !== '';
        }
      case 2: return formData.equipmentId !== '' && formData.probeId !== '' && formData.toolId !== 0;
      case 3: return true; // Measurements step
      case 4: return true; // Details step
      default: return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else if (name === 'toolId') {
      const numValue = parseInt(value) || 0;
      console.log('🔧 Setting toolId:', numValue, 'from value:', value);
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else if (name.startsWith('ambient.')) {
      // ... rest of your code
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        ambientConditions: {
          ...prev.ambientConditions,
          [field]: parseFloat(value) || 0
        }
      }));
    } else if (name.startsWith('measurement.')) {
      const [_, type, field] = name.split('.');

      // Prevent editing of standardValue - it should only come from tool selection
      if (field === 'standardValue') {
        console.log('🔒 Standard Value is locked - cannot be edited manually');
        return; // Don't allow manual changes
      }

      const newValue = parseFloat(value) || 0;

      // Create the updated form data
      const updatedFormData = {
        ...formData,
        measurementData: {
          ...formData.measurementData,
          [type]: {
            ...formData.measurementData[type as keyof typeof formData.measurementData],
            [field]: newValue
          }
        }
      };

      // Update state
      setFormData(updatedFormData);

      // Calculate with the fresh data immediately
      calculateMeasurements(type as 'beforeAdjustment' | 'afterAdjustment', updatedFormData);
    } else if (name === 'resolution') {
      setFormData(prev => ({
        ...prev,
        resolution: parseFloat(value) || 0
      }));
      // Recalculate both uncertainty budgets when resolution changes
      setTimeout(() => {
        calculateUncertaintyBudget('before');
        if (formData.hasAdjustment) {
          calculateUncertaintyBudget('after');
        }
      }, 10);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Calculate mean, error, and uncertainty for measurements
  const calculateMeasurements = (type: 'beforeAdjustment' | 'afterAdjustment', updatedFormData?: any) => {
    // Use updated data if provided, otherwise use current formData
    const dataToUse = updatedFormData || formData;
    const measurements = dataToUse.measurementData[type];
    const { measure1, measure2, measure3, standardValue } = measurements;

    // Skip calculation if values are not ready
    if (!measure1 && !measure2 && !measure3) return;

    // Calculate mean of UUC: (measure1 + measure2 + measure3) / 3
    const meanUUC = Math.round(((measure1 + measure2 + measure3) / 3) * 1000) / 1000;

    // Calculate error: mean of UUC - standard value
    const error = Math.round((meanUUC - standardValue) * 1000) / 1000;

    // Calculate repeatability using SAMPLE standard deviation (N-1) for 3 measurements
    const mean = meanUUC;
    const variance = ((measure1 - mean) ** 2 + (measure2 - mean) ** 2 + (measure3 - mean) ** 2) / (3 - 1);
    const repeatability = Math.sqrt(variance) / Math.sqrt(2);

    console.log('🧮 Calculating with fresh values for', type, ':', {
      measure1, measure2, measure3,
      meanUUC, standardValue, error, repeatability
    });

    // Update state with calculated values
    setFormData(prev => {
      const newFormData = {
        ...prev,
        measurementData: {
          ...prev.measurementData,
          [type]: {
            ...prev.measurementData[type],
            meanUUC: meanUUC,
            error: error
          }
        },
        uncertaintyBudget: {
          ...prev.uncertaintyBudget,
          [type === 'beforeAdjustment' ? 'before' : 'after']: {
            ...prev.uncertaintyBudget[type === 'beforeAdjustment' ? 'before' : 'after'],
            repeatability: repeatability
          }
        }
      };

      // Trigger uncertainty calculation with the new data
      setTimeout(() => {
        calculateUncertaintyBudgetWithData(
          type === 'beforeAdjustment' ? 'before' : 'after',
          newFormData,
          repeatability
        );
      }, 10);

      return newFormData;
    });
  };
  // Calculate uncertainty budget with fresh data
  const calculateUncertaintyBudgetWithData = (
    budgetType: 'before' | 'after',
    freshFormData: any,
    freshRepeatability: number
  ) => {
    const currentBudget = freshFormData.uncertaintyBudget[budgetType];
    const { gasTemperatureEffect, gasFlowRateEffect } = currentBudget;
    const resolution = freshFormData.resolution;

    // Get standard uncertainty from selected tool
    const selectedTool = allTools.find(c => c.id === freshFormData.toolId);
    const standardUncertainty =
      selectedTool?.uncertaintyStandard ||
      selectedTool?.uncertaintyPercent ||
      0.09;

    console.log(`🎯 Fresh ${budgetType} uncertainty calculation:`, {
      repeatability: freshRepeatability,
      resolution,
      standardUncertainty,
      gasTemperatureEffect,
      gasFlowRateEffect
    });

    // Resolution uncertainty = resolution / sqrt3
    const resolutionUncertainty = resolution / Math.sqrt(3);

    // Combined standard uncertainty
    const combinedUncertainty = Math.sqrt(
      freshRepeatability ** 2 +
      resolutionUncertainty ** 2 +
      (standardUncertainty / 2) ** 2 +
      (gasTemperatureEffect / Math.sqrt(3)) ** 2 +
      (gasFlowRateEffect / Math.sqrt(3)) ** 2
    );

    // Expanded uncertainty (k=2)
    const expandedUncertainty = combinedUncertainty * 2;

    setFormData(prev => ({
      ...prev,
      uncertaintyBudget: {
        ...prev.uncertaintyBudget,
        [budgetType]: {
          ...prev.uncertaintyBudget[budgetType],
          resolution: resolutionUncertainty,
          standardUncertainty: standardUncertainty,
          combinedUncertainty: combinedUncertainty,
          expandedUncertainty: expandedUncertainty,
          repeatability: freshRepeatability
        }
      }
    }));
  };

  // Calculate uncertainty budget
  const calculateUncertaintyBudget = (budgetType: 'before' | 'after' = 'before') => {
    const currentBudget = formData.uncertaintyBudget[budgetType];
    const { repeatability, gasTemperatureEffect, gasFlowRateEffect } = currentBudget;
    const resolution = formData.resolution;

    // Get standard uncertainty from selected tool
    const selectedTool = allTools.find(c => c.id === formData.toolId);

    // Use uncertainty from tool if available, try different field names to match your database
    const standardUncertainty =
      selectedTool?.uncertaintyStandard ||
      selectedTool?.uncertaintyPercent ||
      0.09; // Default fallback

    console.log(`🧮 Calculating ${budgetType} uncertainty with:`, {
      selectedTool: selectedTool?.gasName,
      standardUncertainty,
      repeatability,
      resolution,
      availableUncertaintyFields: {
        uncertaintyStandard: selectedTool?.uncertaintyStandard,
        uncertaintyPercent: selectedTool?.uncertaintyPercent
      }
    });

    // Resolution uncertainty = resolution / sqrt3
    const resolutionUncertainty = resolution / Math.sqrt(3);

    // Combined standard uncertainty
    const combinedUncertainty = Math.sqrt(
      repeatability ** 2 +
      resolutionUncertainty ** 2 +
      (standardUncertainty / 2) ** 2 +
      (gasTemperatureEffect / Math.sqrt(3)) ** 2 +
      (gasFlowRateEffect / Math.sqrt(3)) ** 2)
      ;

    // Expanded uncertainty (k=2)
    const expandedUncertainty = combinedUncertainty * 2;

    setFormData(prev => ({
      ...prev,
      uncertaintyBudget: {
        ...prev.uncertaintyBudget,
        [budgetType]: {
          ...prev.uncertaintyBudget[budgetType],
          resolution: resolutionUncertainty,
          standardUncertainty: standardUncertainty,
          combinedUncertainty: combinedUncertainty,
          expandedUncertainty: expandedUncertainty
        }
      }
    }));
  };
  // Helper function to get current user ID
  // const getCurrentUserId = async (): Promise<number> => {
  //   try {
  //     const response = await fetch('/api/users/profile', {
  //       method: 'GET',
  //       credentials: 'include',
  //       headers: {
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     console.log('User profile API response status:', response.status);

  //     if (response.ok) {
  //       const userData = await response.json();
  //       console.log('User profile data:', userData);

  //       // Handle different response formats from your API
  //       if (userData.success && userData.data?.id) {
  //         return userData.data.id;
  //       } else if (userData.id) {
  //         return userData.id;
  //       } else {
  //         console.error('No user ID found in response:', userData);
  //         throw new Error('User ID not found in response');
  //       }
  //     } else {
  //       console.error('User profile API failed:', response.status, response.statusText);
  //       throw new Error(`Failed to get user profile: ${response.status}`);
  //     }
  //   } catch (error) {
  //     console.error('Error getting current user ID:', error);
  //     throw new Error('Authentication required - please log in again');
  //   }
  // };

  const getCurrentUserId = async (): Promise<number> => {
    try {
      const response = await api.get('/users/profile');

      if (response.data.success && response.data.data?.id) {
        return response.data.data.id;
      } else if (response.data.id) {
        return response.data.id;
      } else {
        throw new Error('User ID not found in response');
      }
    } catch (error) {
      console.error('Error getting current user ID:', error);
      throw new Error('Authentication required - please log in again');
    }
  };

  // 🔄 REPLACE YOUR handleSubmit FUNCTION WITH THIS VERSION:

  // 1. Add console logs in your handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    debugUtils.logFormSubmission(formData, currentStep, mode, loading);
    setLoading(true);
    console.log('🚀 HANDLE SUBMIT CALLED!'); // Add this line
    debugUtils.logFormSubmission(formData, currentStep, mode, loading);
    try {
      console.log('Starting certificate submission process...');
      console.log('Form data:', formData);

      // Validate selected tool
      const selectedTool = allTools.find(c => c.id === formData.toolId);

      if (!selectedTool) {
        throw new Error('Please select a standard gas tool for calibration');
      }

      console.log('Selected tool:', selectedTool);

      // Get current user ID
      const currentUserId = await getCurrentUserId();
      console.log('Current user ID:', currentUserId);

      // Validate required fields
      const requiredFields = {
        customerId: 'Please select a customer',
        equipmentId: 'Please select equipment',
        probeId: 'Please select a probe',
        technicianName: 'Technician name is required',
        calibrationPlace: 'Calibration place is required',
        procedureNo: 'Procedure number is required'
      };

      for (const [field, message] of Object.entries(requiredFields)) {
        const value = formData[field as keyof typeof formData];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          throw new Error(message);
        }
      }

      // Prepare calibration data from before adjustment measurements
      const calibrationData = [{
        gasType: selectedTool.gasName || 'Unknown Gas',
        standardValue: formData.measurementData.beforeAdjustment.standardValue,
        measurement1: formData.measurementData.beforeAdjustment.measure1,
        measurement2: formData.measurementData.beforeAdjustment.measure2,
        measurement3: formData.measurementData.beforeAdjustment.measure3,
        resolution: formData.resolution,
        uncertaintyStandard: formData.uncertaintyBudget.before.standardUncertainty,
        // Calculated fields from frontend
        meanValue: formData.measurementData.beforeAdjustment.meanUUC,
        error: formData.measurementData.beforeAdjustment.error,
        repeatability: formData.uncertaintyBudget.before.repeatability,
        combinedUncertainty: formData.uncertaintyBudget.before.combinedUncertainty,
        expandedUncertainty: formData.uncertaintyBudget.before.expandedUncertainty
      }];

      // Prepare adjusted data if adjustment is enabled
      const adjustedData = formData.hasAdjustment ? [{
        gasType: selectedTool.gasName || 'Unknown Gas',
        standardValue: formData.measurementData.afterAdjustment.standardValue,
        measurement1: formData.measurementData.afterAdjustment.measure1,
        measurement2: formData.measurementData.afterAdjustment.measure2,
        measurement3: formData.measurementData.afterAdjustment.measure3,
        resolution: formData.resolution,
        uncertaintyStandard: formData.uncertaintyBudget.after.standardUncertainty,
        // Calculated fields from frontend
        meanValue: formData.measurementData.afterAdjustment.meanUUC,
        error: formData.measurementData.afterAdjustment.error,
        repeatability: formData.uncertaintyBudget.after.repeatability,
        combinedUncertainty: formData.uncertaintyBudget.after.combinedUncertainty,
        expandedUncertainty: formData.uncertaintyBudget.after.expandedUncertainty
      }] : undefined;

      // Validate measurement data
      if (calibrationData[0].standardValue <= 0) {
        throw new Error('Standard value must be greater than 0');
      }

      if (calibrationData[0].measurement1 < 0 || calibrationData[0].measurement2 < 0 || calibrationData[0].measurement3 < 0) {
        throw new Error('Measurements cannot be negative');
      }

      // Validate ambient conditions ranges
      const ambient = formData.ambientConditions;
      if (ambient.temperature < -50 || ambient.temperature > 100) {
        throw new Error('Temperature must be between -50°C and 100°C');
      }
      if (ambient.humidity < 0 || ambient.humidity > 100) {
        throw new Error('Humidity must be between 0% and 100%');
      }
      if (ambient.pressure < 800 || ambient.pressure > 1200) {
        throw new Error('Pressure must be between 800 and 1200 mbar');
      }
      if (ambient.gasTemperature < -50 || ambient.gasTemperature > 100) {
        throw new Error('Gas Temperature must be between -50°C and 100°C');
      }
      if (ambient.flowRate < 1 || ambient.flowRate > 10000) {
        throw new Error('Flow Rate must be between 1 and 10000');
      }
      if (ambient.gasPressure < 800 || ambient.gasPressure > 1200) {
        throw new Error('Gas Pressure must be between 800 and 1200 mbar');
      }
      console.log('🔍 Frontend formData.toolId:', formData.toolId);
      console.log('🔍 Frontend toolId type:', typeof formData.toolId);
      // Prepare final certificate data for API
      const certificateData = {
        certificateNo: formData.certificateNo || undefined,
        formatType: formData.formatType, // This will be 'official' by default, 'draft' if watermark selected
        status: 'pending',
        customerId: formData.customerId,
        equipmentId: formData.equipmentId,
        probeId: formData.probeId,
        toolId: formData.toolId,
        technicianName: formData.technicianName,
        calibrationPlace: formData.calibrationPlace,
        procedureNo: formData.procedureNo,
        hasAdjustment: formData.hasAdjustment,
        dateOfCalibration: formData.dateOfCalibration
          ? new Date(formData.dateOfCalibration).toISOString()
          : new Date().toISOString(),

        // ✅ FIXED: Include these fields for both create and edit
        hasWatermark: mode === 'edit' ? hasWatermark : false, // Only allow watermark in edit mode
        dateOfIssue: mode === 'edit' && issueDate && user?.role === 'admin'
          ? new Date(issueDate).toISOString()
          : undefined, // Only allow admin to change issue date

        ambientConditions: {
          temperature: Number(ambient.temperature),
          humidity: Number(ambient.humidity),
          pressure: Number(ambient.pressure),
          gasTemperature: Number(ambient.gasTemperature),
          flowRate: Number(ambient.flowRate),
          gasPressure: Number(ambient.gasPressure)
        },
        createdById: currentUserId,
        calibrationData: calibrationData,
        adjustedData: adjustedData,
        remarks: formData.remarks || undefined
      };
      console.log('🚀 Sending to backend:', {
        toolId: certificateData.toolId,
        toolIdType: typeof certificateData.toolId
      });
      console.log('Final certificate data being sent to API:', certificateData);
      console.log('Calibration data preview:', {
        hasCalibrationData: !!certificateData.calibrationData?.length,
        calibrationRecords: certificateData.calibrationData?.length || 0,
        hasAdjustedData: !!certificateData.adjustedData?.length,
        adjustedRecords: certificateData.adjustedData?.length || 0,
        gasType: certificateData.calibrationData?.[0]?.gasType,
        standardValue: certificateData.calibrationData?.[0]?.standardValue,
        hasRemarks: !!certificateData.remarks
      });

      // Make the API call
      // const url = mode === 'create' 
      //   ? '/api/certificates' 
      //   : `/api/certificates/${certificate?.id}`;  // Add certificate ID for updates
      const url = mode === 'create'
        ? '/certificates'
        : `/certificates/${certificate?.id}`;

      // const response = await fetch(url, {
      //   method: mode === 'create' ? 'POST' : 'PUT',
      //   credentials: 'include',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(certificateData)
      // });
      const response = await api.post(url, certificateData);

      console.log('Certificate API response status:', response.status);
      const responseData = response.data;
      if (response.status < 200 || response.status >= 300) {
        console.error('Certificate API error:', responseData);
        // ... error handling
        throw new Error(responseData.message || `HTTP ${response.status}`);
      }
      // Parse response
      // const responseData = await response.json();
      console.log('Certificate API response data:', responseData);

      // if (!response.ok) {
      //   console.error('Certificate API error:', responseData);
      if (response.status < 200 || response.status >= 300) {  // ✅ Changed from !response.ok
        console.error('Certificate API error:', responseData);
        // Handle specific validation errors
        if (responseData.errors && Array.isArray(responseData.errors)) {
          const errorMessages = responseData.errors.map((err: any) => {
            const fieldPath = err.path?.join('.') || 'Unknown field';
            const message = err.message || err.code || 'Invalid value';
            return `${fieldPath}: ${message}`;
          }).join('\n');
          throw new Error(`Validation Failed:\n${errorMessages}`);
        }

        throw new Error(responseData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (responseData.success) {
        console.log('Certificate created/updated successfully!');
        console.log('Response data:', {
          certificateNo: responseData.data?.certificateNo,
          calibrationDataCount: responseData.data?.calibrationData?.length || 0,
          adjustedDataCount: responseData.data?.adjustedData?.length || 0,
          hasRemarks: !!responseData.data?.remarks
        });

        // Show success message with details
        const successMessageParts = [
          `Certificate ${mode === 'create' ? 'created' : 'updated'} successfully!`,
          `Certificate No: ${responseData.data?.certificateNo}`,
          `Calibration data: ${responseData.data?.calibrationData?.length || 0} records`,
          formData.hasAdjustment ? `Adjusted data: ${responseData.data?.adjustedData?.length || 0} records` : '',
          formData.remarks ? 'Remarks: Included' : ''
        ].filter(Boolean);

        const successMessage = successMessageParts.join('\n');

        alert(successMessage);

        // Close modal and refresh list
        onSuccess();
      } else {
        throw new Error(responseData.message || 'Unknown error from API');
      }

    } catch (error) {
      console.error('Certificate submission error:', error);

      // Handle different error types
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Show user-friendly error message
      alert(`Failed to ${mode === 'create' ? 'create' : 'update'} certificate:\n\n${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!certificate?.id) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete certificate ${certificate.certificateNo}?\n\n` +
      `This action cannot be undone and will permanently remove:\n` +
      `- All calibration data\n` +
      `- All adjusted data\n` +
      `- All ambient conditions\n` +
      `- Associated PDF files\n\n` +
      `Type the certificate number to confirm: ${certificate.certificateNo}`
    );

    if (!confirmDelete) return;

    const userInput = window.prompt(`Please type "${certificate.certificateNo}" to confirm deletion:`);

    if (userInput !== certificate.certificateNo) {
      alert('Certificate number did not match. Deletion cancelled.');
      return;
    }

    setIsDeleting(true);

    try {
      const response = await api.delete(`/certificates/${certificate.id}`);

      if (response.data.success) {
        alert(`Certificate ${certificate.certificateNo} has been permanently deleted.`);
        onSuccess();
      } else {
        throw new Error(response.data.message || 'Failed to delete certificate');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`Failed to delete certificate: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // =============================================
  // PART 6: RENDER HELPERS
  // =============================================

  const renderModalHeader = () => {
    const title = {
      create: 'Create New Certificate',
      edit: 'Edit Certificate',
      view: 'View Certificate'
    }[mode];

    const icon = {
      create: HiSave,
      edit: HiCog,
      view: HiEye
    }[mode];

    const Icon = icon;

    return (
      <>
        <div className="flex items-center">
          <Icon className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {certificate && (
            <span className="ml-3 text-sm text-gray-500">
              {certificate.certificateNo}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-2"
        >
          <HiX className="w-6 h-6" />
        </button>
      </>
    );
  };

  const renderProgressSteps = () => {
    if (mode !== 'create') return null;

    return (
      <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${currentStep > step.number
                ? 'bg-green-500 text-white'
                : currentStep === step.number
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-500'
                }`}>
                {currentStep > step.number ? (
                  <HiCheck className="w-4 h-4" />
                ) : (
                  step.number
                )}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">{step.title}</div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <HiChevronRight className="w-5 h-5 text-gray-400 mx-6" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // STEP 1: Customer & Calibration Place
  const renderCustomerAndLocation = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <HiOfficeBuilding className="w-5 h-5 mr-3" />
          Customer & Calibration Location
        </h3>

        {/* NEW: Watermark and Issue Date Controls - Only show in EDIT mode */}
        {mode === 'edit' && (
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="text-md font-medium text-purple-800 mb-3 flex items-center">
              <HiDocumentText className="w-4 h-4 mr-2" />
              Certificate Display Options
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ✅ Watermark Control - Admin Only */}
              {user?.role === 'admin' && (
                <div className="flex items-center p-3 border-2 rounded-lg bg-white">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hasWatermark"
                      checked={hasWatermark}
                      onChange={(e) => {
                        const newHasWatermark = e.target.checked;
                        setHasWatermark(newHasWatermark);

                        // Automatically update format type
                        setFormData(prev => ({
                          ...prev,
                          formatType: newHasWatermark ? 'draft' : 'official'
                        }));

                        console.log('Watermark changed:', newHasWatermark, 'Format type:', newHasWatermark ? 'draft' : 'official');
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasWatermark" className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {hasWatermark ? 'Draft Format (with watermark)' : 'Official Format (clean)'}
                        <span className="text-xs text-red-600 ml-2">(Admin Only)</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {hasWatermark
                          ? 'Certificate will show DRAFT watermark'
                          : 'Clean official certificate (default)'}
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* ✅ Issue Date Control - Admin Only */}
              {user?.role === 'admin' && (
                <div className="p-3 border-2 rounded-lg bg-white">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Date
                    <span className="text-xs text-red-600 ml-1">(Admin Only)</span>
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Change the certificate issue date
                  </div>
                </div>
              )}
            </div>

            {/* ✅ Format Type Display - Show for all users */}
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm text-blue-800">
                <strong>Current Format:</strong> {formData.formatType.toUpperCase()}
                {formData.formatType === 'draft' ? ' (with watermark)' : ' (clean)'}
              </div>
            </div>
          </div>
        )}

        {/* Show current format in create/view mode */}
        {mode !== 'edit' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800">
              <strong>Certificate Format:</strong> Official Certificate
            </div>
          </div>
        )}

        {/* Customer Selection - LOCKED IN EDIT MODE */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer
          </label>
          <input
            type="text"
            value={customerInput}
            onChange={(e) => handleCustomerInputChange(e.target.value)}
            onFocus={() => mode !== 'edit' && setShowCustomerDropdown(true)}
            onKeyDown={handleCustomerKeyDown}
            onBlur={() => {
              setTimeout(() => {
                setShowCustomerDropdown(false);
                setSelectedCustomerIndex(-1);
              }, 200);
            }}
            disabled={mode === 'view' || mode === 'edit'}
            placeholder="Type to search customers..."  // ✅ Added
            className={`w-full px-4 py-3 text-sm border ${!formData.customerId && customerInput.length === 0
                ? 'border-red-300'  // ✅ Show red border if empty
                : 'border-gray-300'
              } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />

          {/* Add validation message */}
          {!formData.customerId && (
            <div className="text-xs text-red-500 mt-1">
              Please select a customer from the dropdown
            </div>
          )}

          {/* Customer Dropdown - Only show in create mode */}
          {showCustomerDropdown && filteredCustomers.length > 0 && mode === 'create' && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
                  onMouseEnter={() => setSelectedCustomerIndex(index)}
                  className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${index === selectedCustomerIndex
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : 'hover:bg-gray-100'
                    }`}
                >
                  <div className="text-sm font-medium text-gray-900">{customer.companyName}</div>
                  <div className="text-sm text-gray-500">{customer.contactPerson}</div>
                  {customer.address && (
                    <div className="text-xs text-gray-400 mt-1">{customer.address}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Simple confirmation without warning message */}
        {formData.customerId && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800">
              Selected customer: {customerInput}
            </div>
          </div>
        )}

        {formData.customerId && (
          <div className={`p-3 border rounded-md ${mode === 'edit'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-green-50 border-green-200'
            }`}>
            <div className={`text-sm ${mode === 'edit' ? 'text-yellow-800' : 'text-green-800'
              }`}>
              {mode === 'edit' ? '🔒' : '✓'} Customer selected: {customerInput}
            </div>
          </div>
        )}

        {/* Calibration Place - EDITABLE IN EDIT MODE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calibration Place <span className="text-red-500">*</span>
            {mode === 'edit' && <span className="text-green-600 ml-2">(Can be edited)</span>}
          </label>
          <input
            type="text"
            name="calibrationPlace"
            value={formData.calibrationPlace}
            onChange={handleInputChange}
            disabled={mode === 'view'} // Only disabled in view mode
            required
            placeholder="Enter Calibration Location"
            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <div className="text-xs text-gray-500 mt-1">
            Specify where the calibration will be performed
          </div>
        </div>
      </div>
    );
  };


  // STEP 2: Equipment & Standard Gas (Combined) - RESPONSIVE VERSION
  const renderEquipmentAndGas = () => {
    const selectedTool = allTools.find(c => c.id === formData.toolId);

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <HiBeaker className="w-5 h-5 mr-3" />
          Equipment & Standard Gas Configuration
        </h3>

        {/* Equipment and Probe Section - RESPONSIVE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-3 sm:p-4 bg-gray-50 rounded-lg">

          {/* Equipment Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment ({filteredEquipment.length})
            </label>
            <input
              type="text"
              value={equipmentInput}
              onChange={(e) => handleEquipmentInputChange(e.target.value)}
              onFocus={() => setShowEquipmentDropdown(true)}
              onKeyDown={handleEquipmentKeyDown}
              onBlur={() => {
                setTimeout(() => {
                  setShowEquipmentDropdown(false);
                  setSelectedEquipmentIndex(-1);
                }, 200);
              }}
              disabled={mode === 'view'}
              placeholder="Type equipment model, or serial number"
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />

            {/* Equipment Dropdown */}
            {showEquipmentDropdown && filteredEquipmentForSearch.length > 0 && mode !== 'view' && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredEquipmentForSearch.map((equipment, index) => (
                  <div
                    key={equipment.id}
                    onClick={() => handleEquipmentSelect(equipment)}
                    onMouseEnter={() => setSelectedEquipmentIndex(index)}
                    className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${index === selectedEquipmentIndex
                      ? 'bg-blue-50 border-l-4 border-l-blue-500'
                      : 'hover:bg-gray-100'
                      }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{equipment.instrumentDescription}</div>
                    <div className="text-sm text-gray-500">Model: {equipment.instrumentModel}</div>
                    <div className="text-xs text-gray-400">Serial No: {equipment.instrumentSerialNo}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Equipment Selected */}
            {formData.equipmentId && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm text-blue-800">
                  ✓ Equipment selected:{" "}
                  {(() => {
                    const eq = filteredEquipment.find(e => e.id === formData.equipmentId);
                    return eq
                      ? `${eq.instrumentDescription} - ${eq.instrumentModel} (Serial No: ${eq.instrumentSerialNo})`
                      : equipmentInput;
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Probe Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Probe ({filteredProbes.length})
            </label>
            <input
              type="text"
              value={probeInput}
              onChange={(e) => handleProbeInputChange(e.target.value)}
              onFocus={() => setShowProbeDropdown(true)}
              onKeyDown={handleProbeKeyDown}
              onBlur={() => {
                setTimeout(() => {
                  setShowProbeDropdown(false);
                  setSelectedProbeIndex(-1);
                }, 200);
              }}
              disabled={mode === 'view'}
              placeholder="Type probe description, model, or serial number..."
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />

            {/* Probe Dropdown */}
            {showProbeDropdown && filteredProbesForSearch.length > 0 && mode !== 'view' && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredProbesForSearch.map((probe, index) => (
                  <div
                    key={probe.id}
                    onClick={() => handleProbeSelect(probe)}
                    onMouseEnter={() => setSelectedProbeIndex(index)}
                    className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${index === selectedProbeIndex
                      ? 'bg-blue-50 border-l-4 border-l-blue-500'
                      : 'hover:bg-gray-100'
                      }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{probe.probeDescription}</div>
                    <div className="text-sm text-gray-500">Model: {probe.probeModel}</div>
                    <div className="text-xs text-gray-400">Serial No: {probe.probeSN}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Probe Selected */}
            {formData.probeId && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="text-sm text-green-800">
                  ✓ Probe selected:{" "}
                  {(() => {
                    const probe = filteredProbes.find(p => p.id === formData.probeId);
                    return probe
                      ? `${probe.probeDescription} - ${probe.probeModel} (Serial No: ${probe.probeSN})`
                      : probeInput;
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Standard Gas Tool Section - Keep as is */}
        <div className="p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h4 className="text-md font-medium text-purple-800 mb-3 flex items-center">
            <HiBeaker className="w-4 h-4 mr-2" />
            Standard Gas Tool Selection
          </h4>

          <div>
            <label className="block text-sm font-medium text-purple-700 mb-2">
              Standard Gas Tool for Calibration ({allTools.length} available)
            </label>
            {allTools.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-yellow-800">
                  ⚠️ No gas tools available. Please check:
                  <ul className="mt-2 text-sm list-disc list-inside">
                    <li>Gas tools are not expired</li>
                    <li>API endpoint /api/tools is working</li>
                    <li>Gas tools exist in the database</li>
                  </ul>
                </div>
              </div>
            ) : (
              <select
                name="toolId"
                value={formData.toolId}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select Standard Gas Tool</option>
                {allTools.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.gasName} - {tool.concentration}{tool.gasUnit || 'ppm'} - {tool.certificateNumber}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Show selected gas tool details */}
          {formData.toolId > 0 && selectedTool && (
            <div className="mt-4 p-3 bg-white border border-purple-200 rounded-md">
              <div className="text-sm font-medium text-purple-800 mb-2">
                ✓ Selected Standard Gas Tool Details:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-purple-700">
                <div><strong>Gas Name:</strong> {selectedTool.gasName}</div>
                <div><strong>Concentration:</strong> {selectedTool.concentration} {selectedTool.gasUnit || 'ppm'}</div>
                <div><strong>Vendor:</strong> {selectedTool.vendorName}</div>
                <div><strong>Certificate No:</strong> {selectedTool.certificateNumber}</div>
                {selectedTool.dueDate && (
                  <div className="col-span-1 sm:col-span-2">
                    <strong>Due Date:</strong> {new Date(selectedTool.dueDate).toLocaleDateString()}
                  </div>
                )}
                {(selectedTool.uncertaintyPercent || selectedTool.uncertaintyStandard) && (
                  <div className="col-span-1 sm:col-span-2">
                    <strong>Uncertainty:</strong> ±{
                      selectedTool.uncertaintyPercent ||
                      selectedTool.uncertaintyStandard
                    }%
                  </div>
                )}
              </div>

              {/* Auto-fill notification */}
              <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded-md">
                <div className="text-xs text-green-800 flex items-center">
                  <span className="mr-1">🎯</span>
                  <strong>Auto-filled:</strong> Standard Value will be set to {selectedTool.concentration} {selectedTool.gasUnit || 'ppm'} in measurement section
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configuration Summary */}
        {formData.equipmentId && formData.probeId && formData.toolId > 0 && (
          <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm font-medium text-green-800 mb-2">
              📋 Complete Equipment & Gas Configuration:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-green-700">
              <div>
                <strong>Equipment:</strong>
                {(() => {
                  const eq = filteredEquipment.find(e => e.id === formData.equipmentId);
                  return eq ? ` ${eq.instrumentDescription}` : '';
                })()}
              </div>
              <div>
                <strong>Probe:</strong>
                {(() => {
                  const probe = filteredProbes.find(p => p.id === formData.probeId);
                  return probe ? ` ${probe.probeDescription}` : '';
                })()}
              </div>
              <div>
                <strong>Standard Gas:</strong>
                {(() => {
                  const tool = allTools.find(c => c.id === formData.toolId);
                  return tool ? ` ${tool.gasName} (${tool.concentration}${tool.gasUnit || 'ppm'})` : '';
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // STEP 3: Measurements & Environment - RESPONSIVE VERSION
  const renderMeasurementsAndEnvironment = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <HiDocumentText className="w-5 h-5 mr-3" />
          Calibration Measurements & Environmental Conditions
        </h3>

        {/* Environmental Conditions Section - RESPONSIVE */}
        <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-md font-medium text-blue-800 mb-3 flex items-center">
            <HiCog className="w-4 h-4 mr-2" />
            Ambient Environmental Conditions
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                name="ambient.temperature"
                value={formData.ambientConditions.temperature}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Humidity (%)
              </label>
              <input
                type="number"
                step="0.1"
                name="ambient.humidity"
                value={formData.ambientConditions.humidity}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Pressure (hPa)
              </label>
              <input
                type="number"
                step="0.1"
                name="ambient.pressure"
                value={formData.ambientConditions.pressure}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Gas Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                name="ambient.gasTemperature"
                value={formData.ambientConditions.gasTemperature}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Flow Rate
              </label>
              <input
                type="number"
                step="0.1"
                name="ambient.flowRate"
                value={formData.ambientConditions.flowRate}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Gas Pressure (hPa)
              </label>
              <input
                type="number"
                step="0.1"
                name="ambient.gasPressure"
                value={formData.ambientConditions.gasPressure}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Calibration Parameters - RESPONSIVE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Receiving No.
            </label>
            <input
              type="text"
              name="receivingNo"
              value={formData.receivingNo}
              onChange={handleInputChange}
              disabled={mode === 'view'}
              placeholder="e.g., C250256"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resolution
            </label>
            <input
              type="number"
              step="0.01"
              name="resolution"
              value={formData.resolution}
              onChange={handleInputChange}
              disabled={mode === 'view'}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* STEP 1: Initial Measurements (Before Adjustment) */}
        <div className="p-4 border-2 border-orange-300 rounded-lg bg-orange-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-orange-800 flex items-center">
              <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">1</span>
              Initial Calibration Measurements (Before Any Adjustment)
            </h4>
            <div className="text-sm text-orange-600 font-medium">
              Required - Fill these first
            </div>
          </div>

          {/* Initial Measurements Grid - RESPONSIVE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            <div>
              <label className="block text-xs font-medium text-orange-700 mb-1">
                Standard Value
              </label>
              <input
                type="number"
                step="0.1"
                name="measurement.beforeAdjustment.standardValue"
                value={formData.measurementData.beforeAdjustment.standardValue}
                onChange={handleInputChange}
                disabled={true}  // Always disabled
                className={`w-full px-2 py-1 text-sm border rounded-md disabled:bg-gray-200 disabled:text-gray-600 ${formData.toolId > 0 ? 'border-orange-300 bg-green-50' : 'border-gray-300 bg-gray-100'
                  }`}
                placeholder={formData.toolId > 0 ? "Auto-filled from gas tool" : "Select a gas tool first"}
              />
              {formData.toolId === 0 && (
                <div className="text-xs text-red-500 mt-1">
                  Please select a standard gas tool to auto-fill this value
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-orange-700 mb-1">
                Measure 1 *
              </label>
              <input
                type="number"
                step="0.1"
                name="measurement.beforeAdjustment.measure1"
                value={formData.measurementData.beforeAdjustment.measure1}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                required
                className="w-full px-2 py-1 text-sm border border-orange-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-orange-700 mb-1">
                Measure 2 *
              </label>
              <input
                type="number"
                step="0.1"
                name="measurement.beforeAdjustment.measure2"
                value={formData.measurementData.beforeAdjustment.measure2}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                required
                className="w-full px-2 py-1 text-sm border border-orange-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-orange-700 mb-1">
                Measure 3 *
              </label>
              <input
                type="number"
                step="0.1"
                name="measurement.beforeAdjustment.measure3"
                value={formData.measurementData.beforeAdjustment.measure3}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                required
                className="w-full px-2 py-1 text-sm border border-orange-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-orange-700 mb-1">
                Mean of UUC
                <span
                  className="text-orange-500 cursor-help ml-1"
                  title="Formula: (Measure 1 + Measure 2 + Measure 3) ÷ 3"
                >
                  ?
                </span>
              </label>
              <input
                type="number"
                value={formData.measurementData.beforeAdjustment.meanUUC.toFixed(1)}
                disabled
                className="w-full px-2 py-1 text-sm border border-orange-300 rounded-md bg-orange-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-orange-700 mb-1">
                Error
                <span
                  className="text-orange-500 cursor-help ml-1"
                  title="Formula: Standard Value - Mean of UUC"
                >
                  ?
                </span>
              </label>
              <input
                type="number"
                value={formData.measurementData.beforeAdjustment.error.toFixed(1)}
                disabled
                className="w-full px-2 py-1 text-sm border border-orange-300 rounded-md bg-orange-100"
              />
            </div>
          </div>

          {/* Show progress indicator */}
          {formData.measurementData.beforeAdjustment.measure1 > 0 &&
            formData.measurementData.beforeAdjustment.measure2 > 0 &&
            formData.measurementData.beforeAdjustment.measure3 > 0 && (
              <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded-md">
                <div className="text-xs text-green-800 flex items-center">
                  <HiCheck className="w-4 h-4 mr-1" />
                  Initial measurements completed. Error: {formData.measurementData.beforeAdjustment.error.toFixed(1)}
                </div>
              </div>
            )}
        </div>

        {/* STEP 2: Adjustment Decision */}
        <div className="p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-blue-800 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">2</span>
              Equipment Adjustment Decision
            </h4>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="hasAdjustment"
                checked={formData.hasAdjustment}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <span className="text-sm font-medium text-blue-700">
                Equipment was adjusted based on initial measurements
              </span>
            </label>
          </div>

          {formData.hasAdjustment && (
            <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
              <div className="text-sm text-yellow-800">
                <strong>Note:</strong> After checking this box, please adjust your equipment and then fill the measurements below.
              </div>
            </div>
          )}
        </div>

        {/* STEP 3: After Adjustment Measurements (Only show if adjustment is checked) */}
        {formData.hasAdjustment && (
          <div className="p-4 border-2 border-green-300 rounded-lg bg-green-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-green-800 flex items-center">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">3</span>
                Post-Adjustment Measurements (After Equipment Adjustment)
              </h4>
              <div className="text-sm text-green-600 font-medium">
                Fill after adjusting equipment
              </div>
            </div>

            {/* After Adjustment Grid - RESPONSIVE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  Standard Value
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="measurement.afterAdjustment.standardValue"
                  value={formData.measurementData.afterAdjustment.standardValue}
                  onChange={handleInputChange}
                  disabled={true}  // Always disabled
                  className={`w-full px-2 py-1 text-sm border rounded-md disabled:bg-gray-200 disabled:text-gray-600 ${formData.toolId > 0 ? 'border-green-300 bg-yellow-50' : 'border-gray-300 bg-gray-100'
                    }`}
                  placeholder={formData.toolId > 0 ? "Auto-filled from gas tool" : "Select a gas tool first"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  Measure 1 *
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="measurement.afterAdjustment.measure1"
                  value={formData.measurementData.afterAdjustment.measure1}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  required
                  className="w-full px-2 py-1 text-sm border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  Measure 2 *
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="measurement.afterAdjustment.measure2"
                  value={formData.measurementData.afterAdjustment.measure2}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  required
                  className="w-full px-2 py-1 text-sm border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  Measure 3 *
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="measurement.afterAdjustment.measure3"
                  value={formData.measurementData.afterAdjustment.measure3}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  required
                  className="w-full px-2 py-1 text-sm border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  Mean of UUC
                  <span
                    className="text-green-500 cursor-help ml-1"
                    title="Formula: (Measure 1 + Measure 2 + Measure 3) ÷ 3"
                  >
                    ?
                  </span>
                </label>
                <input
                  type="number"
                  value={formData.measurementData.afterAdjustment.meanUUC.toFixed(1)}
                  disabled
                  className="w-full px-2 py-1 text-sm border border-green-300 rounded-md bg-green-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  Error
                  <span
                    className="text-green-500 cursor-help ml-1"
                    title="Formula: Standard Value - Mean of UUC"
                  >
                    ?
                  </span>
                </label>
                <input
                  type="number"
                  value={formData.measurementData.afterAdjustment.error.toFixed(1)}
                  disabled
                  className="w-full px-2 py-1 text-sm border border-green-300 rounded-md bg-green-100"
                />
              </div>
            </div>

            {/* Show progress indicator for after adjustment */}
            {formData.measurementData.afterAdjustment.measure1 > 0 &&
              formData.measurementData.afterAdjustment.measure2 > 0 &&
              formData.measurementData.afterAdjustment.measure3 > 0 && (
                <div className="mt-3 p-2 bg-blue-100 border border-blue-300 rounded-md">
                  <div className="text-xs text-blue-800 flex items-center">
                    <HiCheck className="w-4 h-4 mr-1" />
                    Post-adjustment measurements completed. Error: {formData.measurementData.afterAdjustment.error.toFixed(1)}
                  </div>
                </div>
              )}

            {/* Comparison between before and after */}
            {formData.measurementData.beforeAdjustment.error !== 0 &&
              formData.measurementData.afterAdjustment.error !== 0 && (
                <div className="mt-3 p-3 bg-white border border-gray-300 rounded-md">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Adjustment Comparison:</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-orange-600 font-medium">Before:</span> {formData.measurementData.beforeAdjustment.error.toFixed(1)} error
                    </div>
                    <div>
                      <span className="text-green-600 font-medium">After:</span> {formData.measurementData.afterAdjustment.error.toFixed(1)} error
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Improvement:</span> {(formData.measurementData.beforeAdjustment.error - formData.measurementData.afterAdjustment.error).toFixed(1)}
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Uncertainty Budget Tables - Show based on measurement state */}
        <div className="space-y-4">
          {/* Show "Before Adjustment" uncertainty table only when initial measurements are complete */}
          {formData.measurementData.beforeAdjustment.measure1 > 0 &&
            formData.measurementData.beforeAdjustment.measure2 > 0 &&
            formData.measurementData.beforeAdjustment.measure3 > 0 && (
              <UncertaintyBudgetTable
                uncertaintyBudget={formData.uncertaintyBudget.before}  // ✅ Specific budget
                resolution={formData.resolution}
                measurementType="before"
                className=""
              />
            )}

          {/* Show "After Adjustment" uncertainty table only when adjustment is enabled AND post-adjustment measurements are complete */}
          {formData.hasAdjustment &&
            formData.measurementData.afterAdjustment.measure1 > 0 &&
            formData.measurementData.afterAdjustment.measure2 > 0 &&
            formData.measurementData.afterAdjustment.measure3 > 0 && (
              <UncertaintyBudgetTable
                uncertaintyBudget={formData.uncertaintyBudget.after}  // ✅ Specific budget
                resolution={formData.resolution}
                measurementType="after"
                className=""
              />
            )}
        </div>
      </div>
    );
  };

  // STEP 4: Certificate Details - RESPONSIVE VERSION
  const renderCertificateDetails = () => {
    return (
      <div className="space-y-4">

        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <HiDocumentText className="w-5 h-5 mr-3" />
          Certificate Details & Final Review
        </h3>

        {/* Certificate Form Fields - RESPONSIVE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certificate Number
            </label>
            <input
              type="text"
              name="certificateNo"
              value={formData.certificateNo}
              onChange={handleInputChange}
              disabled={mode === 'view'}
              placeholder="Auto-generated if empty"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calibration Date
            </label>
            <input
              type="date"
              name="dateOfCalibration"
              value={formData.dateOfCalibration}
              onChange={handleInputChange}
              disabled={mode === 'view'}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Technician Name
              <span className="text-xs text-blue-600 ml-1">(Auto-filled from your profile)</span>
            </label>
            <input
              type="text"
              name="technicianName"
              value={formData.technicianName}
              onChange={handleInputChange}
              disabled={mode === 'view'}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 bg-blue-50 border-blue-200"
              placeholder="Loading from your profile..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Procedure Number
            </label>
            <input
              type="text"
              name="procedureNo"
              value={formData.procedureNo}
              onChange={handleInputChange}
              disabled={mode === 'view'}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Remarks Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Certificate Remarks
            <span className="text-xs text-gray-500 ml-1">(Optional - Additional notes or observations)</span>
          </label>
          <textarea
            name="remarks"
            value={formData.remarks || ''}
            onChange={handleInputChange}
            disabled={mode === 'view'}
            rows={6}  // Increased from 4 to 6
            placeholder="Enter remarks"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 resize-none whitespace-pre-wrap font-mono"
            style={{ lineHeight: '1.6' }}
          />
        </div>

        {/* Summary Section - RESPONSIVE */}
        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-md font-medium text-gray-800 mb-3">
            Certificate Summary
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
            <div>
              <strong>Customer:</strong> {customerInput || 'Not selected'}
            </div>
            <div>
              <strong>Calibration Place:</strong> {formData.calibrationPlace || 'Not specified'}
            </div>
            <div>
              <strong>Equipment:</strong> {(() => {
                const eq = filteredEquipment.find(e => e.id === formData.equipmentId);
                return eq ? `${eq.instrumentDescription}` : 'Not selected';
              })()}
            </div>
            <div>
              <strong>Probe:</strong> {(() => {
                const probe = filteredProbes.find(p => p.id === formData.probeId);
                return probe ? `${probe.probeDescription}` : 'Not selected';
              })()}
            </div>
            <div>
              <strong>Standard Gas:</strong> {(() => {
                const tool = allTools.find(c => c.id === formData.toolId);
                return tool ? `${tool.gasName} (${tool.concentration}${tool.gasUnit || 'ppm'})` : 'Not selected';
              })()}
            </div>
            <div>
              <strong>Calibration Date:</strong> {formData.dateOfCalibration || 'Not set'}
            </div>
            {formData.remarks && (
              <div className="col-span-1 sm:col-span-2">
                <strong>Remarks:</strong> {formData.remarks}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };





  // REPLACE your broken renderModalFooter function with this complete version:

  // const renderModalFooter = () => {

  //   return (
  //     <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
  //       <div className="flex items-center justify-between">
  //         {/* PDF Actions - if certificate exists */}
  //         <div className="flex items-center space-x-2">
  //           {certificate && certificate.id && (
  //             <>
  //               <button
  //                 type="button"
  //                 // onClick={async () => {
  //                 //   setPdfLoading(true);
  //                 //   try {
  //                 //     // const response = await fetch(`/api/certificates/${certificate.id}/template/pdf?preview=true`, {
  //                 //     //   credentials: 'include'
  //                 //     // });

  //                 //     const response = await api.get(`/certificates/${certificate.id}/template/pdf?preview=true`, {
  //                 //       responseType: 'blob'
  //                 //     });
  //                 //     if (response.status == 200) {
  //                 //       const blob = response.data;  // Changed from await response.blob()
  //                 //       const url = window.URL.createObjectURL(blob);
  //                 //       window.open(url, '_blank');
  //                 //       setTimeout(() => window.URL.revokeObjectURL(url), 100);

  //                 //     }



  //                 //   } catch (error) {
  //                 //     console.error('PDF preview error:', error);
  //                 //     alert('Error previewing PDF');
  //                 //   } finally {
  //                 //     setPdfLoading(false);
  //                 //   }
  //                 // }}
  //                 onClick={async () => {
  //                   setPdfLoading(true);
  //                   try {
  //                     const response = await api.get(`/certificates/${certificate.id}/template/pdf?preview=true`, {
  //                       responseType: 'blob'
  //                     });

  //                     const blob = response.data;
  //                     const url = window.URL.createObjectURL(blob);
  //                     window.open(url, '_blank');
  //                     setTimeout(() => window.URL.revokeObjectURL(url), 100);
  //                   } catch (error) {
  //                     console.error('PDF preview error:', error);
  //                     alert('Error previewing PDF');
  //                   } finally {
  //                     setPdfLoading(false);
  //                   }
  //                 }}
  //                 disabled={pdfLoading}
  //                 className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
  //               >
  //                 <HiEye className="w-3 h-3 mr-1" />
  //                 {pdfLoading ? 'Loading...' : 'Preview PDF'}
  //               </button>
  //               <button
  //                 type="button"
  //                 onClick={async () => {
  //                   setPdfLoading(true);
  //                   try {
  //                     // const response = await fetch(`/api/certificates/${certificate.id}/template/pdf`, {
  //                     //   credentials: 'include'
  //                     // });
  //                     setPdfLoading(true);
  //                     try {
  //                       const response = await api.get(`/certificates/${certificate.id}/template/pdf`, {
  //                         responseType: 'blob'
  //                       });

  //                       const blob = response.data;
  //                       const url = window.URL.createObjectURL(blob);
  //                       const a = document.createElement('a');
  //                       a.href = url;
  //                       // ✅ Check if certificate is draft or official
  //                       const isDraft = formData.formatType === 'draft';

  //                       let filename: string;

  //                       if (isDraft) {
  //                         // Draft format: "Draft [rest of info]"
  //                         const customer = allCustomers.find(c => c.id === formData.customerId);
  //                         const tool = allTools.find(t => t.id === formData.toolId);

  //                         filename = [
  //                           'Draft',
  //                           certificate.certificateNo,
  //                           customer?.companyName || 'Unknown',
  //                           tool ? `${tool.gasName}` : ''
  //                         ].filter(Boolean).join(' ') + '.pdf';
  //                       } else {
  //                         // Official format: "CertNo CustomerName ToolName"
  //                         const customer = allCustomers.find(c => c.id === formData.customerId);
  //                         const tool = allTools.find(t => t.id === formData.toolId);

  //                         filename = [
  //                           certificate.certificateNo,
  //                           customer?.companyName || 'Unknown',
  //                           tool ? `${tool.gasName} ${tool.concentration}ppm` : ''
  //                         ].filter(Boolean).join(' ') + '.pdf';
  //                       }

  //                       a.download = filename;
  //                       document.body.appendChild(a);
  //                       a.click();
  //                       document.body.removeChild(a);
  //                       window.URL.revokeObjectURL(url);
  //                     } else {
  //                       alert('Failed to download PDF');
  //                     }
  //                   } catch (error) {
  //                 console.error('Download error:', error);
  //               alert('Error downloading PDF');
  //                   } finally {
  //                 setPdfLoading(false);
  //                   }
  //                 }}
  //               disabled={pdfLoading}
  //               className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
  //               >
  //               <HiDownload className="w-3 h-3 mr-1" />
  //               {pdfLoading ? 'Loading...' : 'Download PDF'}
  //             </button>

  //         </>
  //           )}
  //         {/* 🔥 ADD DELETE BUTTON HERE - Step 3 */}
  //         {mode === 'edit' && certificate && user?.role === 'admin' && (
  //           <button
  //             type="button"
  //             onClick={handleDelete}
  //             disabled={isDeleting || loading}
  //             className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
  //           >
  //             <HiTrash className="w-3 h-3 mr-1" />
  //             {isDeleting ? 'Deleting...' : 'Delete Certificate'}
  //           </button>
  //         )}
  //       </div>

  //       {/* Navigation and Form Actions */}
  //       <div className="flex items-center space-x-2">
  //         {/* Step Navigation for Create Mode */}
  //         {mode === 'create' && (
  //           <>
  //             {currentStep > 1 && (
  //               <button
  //                 type="button"
  //                 onClick={handlePrevious}
  //                 className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50"
  //               >
  //                 Previous
  //               </button>
  //             )}

  //             {currentStep < steps.length && (
  //               <button
  //                 type="button"
  //                 onClick={handleNext}
  //                 disabled={!canProceedToNext()}
  //                 className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
  //               >
  //                 Next
  //               </button>
  //             )}
  //           </>
  //         )}

  //         {/* Form Actions */}
  //         <button
  //           type="button"
  //           onClick={onClose}
  //           className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50"
  //         >
  //           {mode === 'view' ? 'Close' : 'Cancel'}
  //         </button>

  //         {(mode !== 'view' && (currentStep === steps.length || mode !== 'create')) && (
  //           <button
  //             type="submit"
  //             disabled={loading}
  //             className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 disabled:opacity-50 flex items-center"
  //           >
  //             {loading ? (
  //               <>
  //                 <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
  //                 {mode === 'create' ? 'Creating...' : 'Updating...'}
  //               </>
  //             ) : (
  //               <>
  //                 <HiSave className="w-3 h-3 mr-1" />
  //                 {mode === 'create' ? 'Create Certificate' : 'Update Certificate'}
  //               </>
  //             )}
  //           </button>
  //         )}
  //       </div>
  //     </div>
  //     </div >
  //   );
  // };
  const renderModalFooter = () => {
    return (
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* PDF Actions - if certificate exists */}
          <div className="flex items-center space-x-2">
            {certificate && certificate.id && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    setPdfLoading(true);
                    try {
                      const response = await api.get(`/certificates/${certificate.id}/template/pdf?preview=true`, {
                        responseType: 'blob'
                      });

                      const blob = response.data;
                      const url = window.URL.createObjectURL(blob);
                      window.open(url, '_blank');
                      setTimeout(() => window.URL.revokeObjectURL(url), 100);
                    } catch (error) {
                      console.error('PDF preview error:', error);
                      alert('Error previewing PDF');
                    } finally {
                      setPdfLoading(false);
                    }
                  }}
                  disabled={pdfLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiEye className="w-3 h-3 mr-1" />
                  {pdfLoading ? 'Loading...' : 'Preview PDF'}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setPdfLoading(true);
                    try {
                      const response = await api.get(`/certificates/${certificate.id}/template/pdf`, {
                        responseType: 'blob'
                      });

                      const blob = response.data;
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;

                      // ✅ Check if certificate is draft or official
                      const isDraft = formData.formatType === 'draft';

                      let filename: string;

                      if (isDraft) {
                        const customer = allCustomers.find(c => c.id === formData.customerId);
                        const tool = allTools.find(t => t.id === formData.toolId);

                        filename = [
                          'Draft',
                          certificate.certificateNo,
                          customer?.companyName || 'Unknown',
                          tool ? `${tool.gasName}` : ''
                        ].filter(Boolean).join(' ') + '.pdf';
                      } else {
                        const customer = allCustomers.find(c => c.id === formData.customerId);
                        const tool = allTools.find(t => t.id === formData.toolId);

                        filename = [
                          certificate.certificateNo,
                          customer?.companyName || 'Unknown',
                          tool ? `${tool.gasName} ${tool.concentration}${tool.gasUnit || 'ppm'}` : ''
                        ].filter(Boolean).join(' ') + '.pdf';
                      }

                      a.download = filename;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Download error:', error);
                      alert('Error downloading PDF');
                    } finally {
                      setPdfLoading(false);
                    }
                  }}
                  disabled={pdfLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiDownload className="w-3 h-3 mr-1" />
                  {pdfLoading ? 'Loading...' : 'Download PDF'}
                </button>
              </>
            )}

            {/* Delete Button */}
            {mode === 'edit' && certificate && user?.role === 'admin' && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || loading}
                className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiTrash className="w-3 h-3 mr-1" />
                {isDeleting ? 'Deleting...' : 'Delete Certificate'}
              </button>
            )}
          </div>

          {/* Navigation and Form Actions */}
          <div className="flex items-center space-x-2">
            {/* Step Navigation for Create Mode */}
            {mode === 'create' && (
              <>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}

                {currentStep < steps.length && (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceedToNext()}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                )}
              </>
            )}

            {/* Form Actions */}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              {mode === 'view' ? 'Close' : 'Cancel'}
            </button>

            {(mode !== 'view' && (currentStep === steps.length || mode !== 'create')) && (
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    <HiSave className="w-3 h-3 mr-1" />
                    {mode === 'create' ? 'Create Certificate' : 'Update Certificate'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };
  // =============================================
  // PART 7: MAIN RENDER FUNCTION
  // =============================================

  // REPLACE your main render function with this corrected structure:

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 md:p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl h-[95vh] sm:h-[90vh] md:h-[85vh] flex flex-col">

        {/* HEADER SECTION */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 flex-shrink-0">
          {renderModalHeader()}
        </div>

        {/* PROGRESS STEPS SECTION */}
        <div className="flex-shrink-0">
          {renderProgressSteps()}
        </div>

        {/* FORM WRAPPER - NOW WRAPS BOTH CONTENT AND FOOTER */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">

          {/* CONTENT SECTION - Scrollable */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
            <div className="space-y-4 sm:space-y-5 md:space-y-6">

              {/* STEP 1: Customer & Location */}
              {(currentStep === 1 || mode !== 'create') && renderCustomerAndLocation()}

              {/* STEP 2: Equipment & Standard Gas (Combined) */}
              {(currentStep === 2 || mode !== 'create') && formData.customerId && formData.calibrationPlace && renderEquipmentAndGas()}

              {/* STEP 3: Measurements & Environment (Combined) */}
              {(currentStep === 3 || mode !== 'create') && formData.equipmentId && formData.probeId && formData.toolId > 0 && renderMeasurementsAndEnvironment()}

              {/* STEP 4: Certificate Details */}
              {(currentStep === 4 || mode !== 'create') && renderCertificateDetails()}

            </div>
          </div>

          {/* FOOTER SECTION - NOW INSIDE THE FORM */}
          <div className="flex-shrink-0">
            {renderModalFooter()}
          </div>

        </form>

      </div>
    </div>
  );
};

export default CertificateModal;