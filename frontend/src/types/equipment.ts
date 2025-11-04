// Update your existing Equipment interface
export interface Equipment {
  id: string;
  instrumentDescription: 'GAS_DETECTOR' | 'GAS_ANALYZER';
  instrumentModel: string;
  instrumentSerialNo: string;
  idNoOrControlNo?: string;
  manufacturer: string;
  createdAt: string;
  updatedAt: string;
  createdById: number;
  
}

// Update your Probe interface  
export interface Probe {
  id: string;
  probeDescription: string; 
  probeModel: string;
  probeSN: string;
  createdAt: string;
  updatedAt: string;
  createdById: number;
  
}