import React, { useEffect, useState } from 'react';
import { getTools, createTool, updateTool, deleteTool } from '../../services/toolService';
import ToolTable from '../../components/Tools/ToolTable';
import ToolModal from '../../components/Tools/ToolModal';
import type { Tool } from '../../types/tool';
import api from '../../utils/axios';

const ToolsPage: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Check if user can modify tools (admin or technician)
  const canModify = user?.role === 'admin' || user?.role === 'technician';

  // const fetchUserInfo = async () => {
  //   try {
  //     const response = await fetch('/api/auth/me', {
  //       credentials: 'include'
  //     });
      
  //     if (response.ok) {
  //       const userData = await response.json();
  //       setUser(userData.data);
  //       console.log('User loaded:', userData.data?.role);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching user info:', error);
  //     // Fallback for development
  //     setUser({ id: 1, role: 'admin', fullName: 'Admin User' });
  //   }
  // };
    const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/me');
      
      if (response.data.success && response.data.data) {
        setUser(response.data.data);
        console.log('User loaded:', response.data.data?.role);
      } else {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      // Fallback for development
      setUser({ id: 1, role: 'admin', fullName: 'Admin User' });
    }
  };

  // const loadTools = async () => {
  //   try {
  //     setIsLoading(true);
  //     setError(null);
  //     const tools = await getTools();
  //     console.log('Tools loaded successfully:', tools.length, 'tools');
  //     setTools(tools);
  //   } catch (error) {
  //     console.error('Error loading tools:', error);
  //     setError('Failed to load tools. Please try again.');
  //     setTools([]);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const loadTools = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const tools = await getTools();
      console.log('Tools loaded successfully:', tools.length, 'tools');
      setTools(tools);
    } catch (error) {
      console.error('Error loading tools:', error);
      setError('Failed to load tools. Please try again.');
      setTools([]);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchUserInfo();
    loadTools();
  }, []);

  const handleSave = async (tool: Partial<Tool>) => {
    try {
      setError(null);
      if (tool.id) {
        const response = await updateTool(tool.id, tool);
        console.log('Tool updated successfully:', response);
      } else {
        const response = await createTool(tool);
        console.log('Tool created successfully:', response);
      }
      setIsModalOpen(false);
      setSelectedTool(null);
      await loadTools();
    } catch (error) {
      console.error('Error saving tool:', error);
      setError('Failed to save tool. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;
    
    try {
      setError(null);
      const response = await deleteTool(id);
      console.log('Tool deleted successfully:', response);
      await loadTools();
    } catch (error) {
      console.error('Error deleting tool:', error);
      setError('Failed to delete tool. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTool(null);
    setError(null);
  };

  const handleAddTool = () => {
    setSelectedTool(null);
    setIsModalOpen(true);
    setError(null);
  };

  const handleEditTool = (tool: Tool) => {
    setSelectedTool(tool);
    setIsModalOpen(true);
    setError(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-blue-600 mb-8">
          Gas Cylinders List ({tools.length})
        </h1>
        {/* Only show Add button if user can modify */}
        {canModify && (
          <button
            className="bg-orange-400 text-white px-4 py-2 rounded hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddTool}
            disabled={isLoading}
          >
            + Add Tool
          </button>
        )}
      </div>

      

      {/* Error message display */}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="text-red-700 font-bold">×</span>
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-600">Loading tools...</div>
        </div>
      ) : (
        <div>
         
          <ToolTable 
            tools={tools} 
            onEdit={canModify ? handleEditTool : undefined}
            canModify={canModify}
          />
        </div>
      )}

      {/* Only show modal if user can modify */}
      {canModify && (
        <ToolModal
          isOpen={isModalOpen}
          onRequestClose={handleCloseModal}
          onSave={handleSave}
          onDelete={handleDelete}
          initialData={selectedTool}
        />
      )}
    </div>
  );
};

export default ToolsPage;