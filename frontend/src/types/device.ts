export interface Device {
  id: number;
  name: string;
  model: string;
  serialNumber: string;
  manufacturer: string;
  calibrationDate: string | Date;
  dueDate: string | Date;
  certificateUrl?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}