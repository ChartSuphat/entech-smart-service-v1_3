// src/services/deviceService.ts
import api from '../utils/axios';
import type { Device } from '../types/device';

export const getDevices = async (): Promise<Device[]> => {
  try {
    const response = await api.get('/devices');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching devices:', error);
    throw error;
  }
};

export const getDeviceById = async (id: number): Promise<Device> => {
  try {
    const response = await api.get(`/devices/${id}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching device:', error);
    throw error;
  }
};

export const createDevice = async (device: Partial<Device>): Promise<Device> => {
  try {
    // Send as JSON (certificate already uploaded separately)
    const response = await api.post('/devices', device);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error creating device:', error);
    throw error;
  }
};

export const updateDevice = async (id: number, device: Partial<Device>): Promise<Device> => {
  try {
    // Send as JSON (certificate already uploaded separately)
    const response = await api.post(`/devices/${id}`, device);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error updating device:', error);
    throw error;
  }
};

export const deleteDevice = async (id: number): Promise<void> => {
  try {
    await api.delete(`/devices/${id}`);
  } catch (error) {
    console.error('Error deleting device:', error);
    throw error;
  }
};