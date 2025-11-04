// services/toolService.ts
import api from '../utils/axios';  // ✅ Use the shared api instance
import type { Tool } from '../types/tool';

export const getTools = async (): Promise<Tool[]> => {
  const response = await api.get('/tools');  // Full path with /tools
  return response.data.success ? response.data.data : [];
};

export const createTool = async (toolData: Partial<Tool>): Promise<Tool> => {
  const response = await api.post('/tools', toolData);
  return response.data;
};

export const updateTool = async (id: number, toolData: Partial<Tool>): Promise<Tool> => {
  const response = await api.post(`/tools/${id}`, toolData);
  return response.data;
};

export const deleteTool = async (id: number): Promise<void> => {
  await api.delete(`/tools/${id}`);
};