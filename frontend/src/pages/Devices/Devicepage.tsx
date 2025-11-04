import React, { useEffect, useState } from 'react';
import { getDevices, createDevice, updateDevice, deleteDevice } from '../../services/deviceService';
import DeviceTable from '../../components/Devices/DeviceTable';
import DeviceModal from '../../components/Devices/DeviceModal';
import type { Device } from '../../types/device';
import api from '../../utils/axios';

const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user can modify devices (admin or technician)
  const canModify = user?.role === 'admin' || user?.role === 'technician';

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

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const devices = await getDevices();
      console.log('Devices loaded successfully:', devices.length, 'devices');
      setDevices(devices);
      setFilteredDevices(devices);
    } catch (error) {
      console.error('Error loading devices:', error);
      setError('Failed to load devices. Please try again.');
      setDevices([]);
      setFilteredDevices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
    loadDevices();
  }, []);

  // Filter devices based on search only
  useEffect(() => {
    let filtered = devices;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(device =>
        device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDevices(filtered);
  }, [searchTerm, devices]);

  const handleSave = async (device: Partial<Device>) => {
    try {
      setError(null);
      if (device.id) {
        const response = await updateDevice(device.id, device);
        console.log('Device updated successfully:', response);
      } else {
        const response = await createDevice(device);
        console.log('Device created successfully:', response);
      }
      setIsModalOpen(false);
      setSelectedDevice(null);
      await loadDevices();
    } catch (error) {
      console.error('Error saving device:', error);
      setError('Failed to save device. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this device?')) return;
    
    try {
      setError(null);
      const response = await deleteDevice(id);
      console.log('Device deleted successfully:', response);
      await loadDevices();
    } catch (error) {
      console.error('Error deleting device:', error);
      setError('Failed to delete device. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDevice(null);
    setError(null);
  };

  const handleAddDevice = () => {
    setSelectedDevice(null);
    setIsModalOpen(true);
    setError(null);
  };

  const handleEditDevice = (device: Device) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
    setError(null);
  };

  return (
    <div className="p-6">
      {/* Title and Add Button on Same Line */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-600">
          Reference Devices List ({filteredDevices.length})
        </h1>
        {canModify && (
          <button
            className="bg-orange-400 text-white px-4 py-2 rounded hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddDevice}
            disabled={isLoading}
          >
            + Add Device
          </button>
        )}
      </div>

      
      <div className="mb-5">
        <input
          type="text"
          placeholder="Model or S/N or Manufacturer"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-1/3 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
          <div className="text-gray-600">Loading devices...</div>
        </div>
      ) : (
        <div>
          <DeviceTable 
            devices={filteredDevices} 
            onEdit={canModify ? handleEditDevice : undefined}
            canModify={canModify}
          />
        </div>
      )}

      {/* Only show modal if user can modify */}
      {canModify && (
        <DeviceModal
          isOpen={isModalOpen}
          onRequestClose={handleCloseModal}
          onSave={handleSave}
          onDelete={handleDelete}
          initialData={selectedDevice}
        />
      )}
    </div>
  );
};

export default DevicesPage;