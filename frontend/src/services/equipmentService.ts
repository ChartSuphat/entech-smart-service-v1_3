import axios from 'axios';
import type { Equipment } from '../types/equipment';

// Fixed: Use port 4040 and remove /api since your backend has dual routing
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4040';

const api = axios.create({
  baseURL: `${API_BASE_URL}/equipment`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use((config) => {
  console.log('📡 Equipment API request to:', config.url);
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ Equipment API response:', response.status);
    return response;
  },
  (error) => {
    console.error('❌ Equipment API Error:', error.response?.status, error.response?.data?.message);
    
    if (error.response?.status === 401) {
      console.error('🚫 Unauthorized - user needs to login');
      // Optionally redirect to login
      // window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export const getEquipment = async (): Promise<Equipment[]> => {
  try {
    const response = await api.get('/');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching equipment:', error);
    throw error;
  }
};

export const getEquipmentById = async (id: string): Promise<Equipment> => {
  try {
    const response = await api.get(`/${id}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error fetching equipment ${id}:`, error);
    throw error;
  }
};

export const createEquipment = async (equipment: Partial<Equipment>) => {
  try {
    console.log('Creating equipment:', equipment);
    const response = await api.post('/', equipment);
    return response.data;
  } catch (error) {
    console.error('Error creating equipment:', error);
    throw error;
  }
};

export const updateEquipment = async (id: string, data: Partial<Equipment>) => {
  try {
    console.log(`Updating equipment ${id}:`, data);
    const response = await api.put(`/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating equipment ${id}:`, error);
    throw error;
  }
};

export const deleteEquipment = async (id: string) => {
  try {
    const response = await api.delete(`/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting equipment ${id}:`, error);
    throw error;
  }
};

// Probe-related endpoints
export const getEquipmentProbes = async (equipmentId: string) => {
  try {
    const response = await api.get(`/${equipmentId}/probes`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error fetching probes for equipment ${equipmentId}:`, error);
    throw error;
  }
};

export const addProbeToEquipment = async (equipmentId: string, probeData: any) => {
  try {
    console.log(`Adding probe to equipment ${equipmentId}:`, probeData);
    const response = await api.post(`/${equipmentId}/probes`, probeData);
    return response.data;
  } catch (error) {
    console.error(`Error adding probe to equipment ${equipmentId}:`, error);
    throw error;
  }
};

export const removeProbeFromEquipment = async (equipmentId: string, probeId: string) => {
  try {
    const response = await api.delete(`/${equipmentId}/probes/${probeId}`);
    return response.data;
  } catch (error) {
    console.error(`Error removing probe ${probeId} from equipment ${equipmentId}:`, error);
    throw error;
  }
};

// Standalone probe endpoints (not tied to equipment)
export const getAllProbes = async () => {
  try {
    const response = await api.get('/probes');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching all probes:', error);
    throw error;
  }
};

export const createProbe = async (probeData: any) => {
  try {
    console.log('Creating standalone probe:', probeData);
    const response = await api.post('/probes', probeData);
    return response.data;
  } catch (error) {
    console.error('Error creating probe:', error);
    throw error;
  }
};

export const updateProbe = async (probeId: string, probeData: any) => {
  try {
    console.log(`Updating probe ${probeId}:`, probeData);
    const response = await api.put(`/probes/${probeId}`, probeData);
    return response.data;
  } catch (error) {
    console.error(`Error updating probe ${probeId}:`, error);
    throw error;
  }
};

export const deleteProbe = async (probeId: string) => {
  try {
    const response = await api.delete(`/probes/${probeId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting probe ${probeId}:`, error);
    throw error;
  }
};

// Get current user for auth check
export const getCurrentUser = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      withCredentials: true
    });
    return response.data.success ? response.data.data : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};