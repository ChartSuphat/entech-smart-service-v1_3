import React, { useState } from 'react';
import type { Device } from '../../types/device';
import { FaRegEdit } from "react-icons/fa";
import { HiOutlineDocumentText } from 'react-icons/hi';
import { BiSolidUpArrow, BiSolidDownArrow } from 'react-icons/bi';

interface DeviceTableProps {
  devices: Device[];
  onEdit?: (device: Device) => void;
  canModify: boolean;
}

const DeviceTable: React.FC<DeviceTableProps> = ({ devices, onEdit, canModify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'model' | 'serialNumber' | 'manufacturer' | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Format date to dd/mm/yyyy like ToolTable
  const formatDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Status check - Valid or Expired
  const getStatus = (dueDate: string | Date | null | undefined): { text: string; className: string } => {
    if (!dueDate) {
      return { text: 'No Due Date', className: 'bg-gray-100 text-gray-700' };
    }

    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (due < today) {
      return { text: 'Expired', className: 'bg-red-100 text-red-600' };
    }

    return { text: 'Valid', className: 'bg-green-100 text-green-700' };
  };

  // Filter devices
  const filtered = devices.filter((device) =>
    device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort devices
  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const valA = a[sortKey] || '';
    const valB = b[sortKey] || '';
    return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  // Handle sort toggle
  const handleSort = (key: 'name' | 'model' | 'serialNumber' | 'manufacturer') => {
    if (sortKey === key) {
      if (sortAsc) {
        setSortAsc(false); // Go to descending
      } else {
        setSortKey(null); // Go to unsorted
        setSortAsc(true);
      }
    } else {
      setSortKey(key); // New field - start with ascending
      setSortAsc(true);
    }
  };

  // Sort icon component - matching ToolTable
  const getSortIcon = (key: 'name' | 'model' | 'serialNumber' | 'manufacturer') => {
    const isSorted = sortKey === key;
    
    return (
      <div className="flex flex-col ml-1">
        {isSorted ? (
          sortAsc ? (
            <BiSolidUpArrow className="h-3 w-3" />
          ) : (
            <BiSolidDownArrow className="h-3 w-3" />
          )
        ) : (
          <div className="flex flex-col">
            <BiSolidUpArrow className="h-3 w-3 text-blue-300 opacity-50" />
            <BiSolidDownArrow className="h-3 w-3 text-blue-300 opacity-50 -mt-1" />
          </div>
        )}
      </div>
    );
  };

  // Handle certificate file view
  const handleFileView = (fileUrl: string | undefined) => {
    if (!fileUrl) {
      alert('No certificate file available');
      return;
    }

    const isValidUrl = fileUrl.startsWith('/uploads/') || 
                      fileUrl.startsWith('blob:') || 
                      fileUrl.startsWith('http://') || 
                      fileUrl.startsWith('https://');

    if (!isValidUrl) {
      alert('Certificate file is not available for preview. Please edit this device and re-upload the file.');
      return;
    }
    
    let fullUrl = fileUrl;
    if (fileUrl.startsWith('/uploads/')) {
      fullUrl = `https://entech-online.com${fileUrl}`;
    }
    
    window.open(fullUrl, '_blank');
  };

  if (devices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 text-lg">No devices found.</p>
        {canModify && (
          <p className="text-gray-400 mt-2">Click "Add Device" to create your first device.</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-blue-500 text-white">
            <tr>
              {/* Device Name - Sortable */}
              <th className="px-4 py-3 text-left font-medium border-r border-blue-400">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center justify-between hover:text-blue-200 w-full"
                >
                  <span>Device Name</span>
                  {getSortIcon('name')}
                </button>
              </th>

              {/* Model - Sortable */}
              <th className="px-4 py-3 text-left font-medium border-r border-blue-400">
                <button
                  onClick={() => handleSort('model')}
                  className="flex items-center justify-between hover:text-blue-200 w-full"
                >
                  <span>Model</span>
                  {getSortIcon('model')}
                </button>
              </th>

              {/* Serial Number - Sortable */}
              <th className="px-4 py-3 text-left font-medium border-r border-blue-400">
                <button
                  onClick={() => handleSort('serialNumber')}
                  className="flex items-center justify-between hover:text-blue-200 w-full"
                >
                  <span>Serial Number</span>
                  {getSortIcon('serialNumber')}
                </button>
              </th>

              {/* Manufacturer - Sortable */}
              <th className="px-4 py-3 text-left font-medium border-r border-blue-400">
                <button
                  onClick={() => handleSort('manufacturer')}
                  className="flex items-center justify-between hover:text-blue-200 w-full"
                >
                  <span>Manufacturer</span>
                  {getSortIcon('manufacturer')}
                </button>
              </th>

              {/* Non-sortable columns */}
              <th className="px-4 py-3 text-left font-medium border-r border-blue-400">Due Date</th>
              <th className="px-4 py-3 text-center font-medium border-r border-blue-400">Cert File</th>
              <th className="px-4 py-3 text-center font-medium border-r border-blue-400">Status</th>
              
              {/* Only show Action column if user can modify */}
              {canModify && (
                <th className="px-4 py-3 text-center font-medium">Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((device, index) => {
              const status = getStatus(device.dueDate);
              
              // Alternating row colors like ToolTable
              const rowBgColor = index % 2 === 0 ? 'bg-white' : 'bg-gray-100';

              return (
                <tr key={device.id} className={`border-b hover:bg-blue-50 ${rowBgColor}`}>
                  <td className="px-4 py-3 border-r border-gray-200">
                    <div className="text-sm font-medium text-gray-900">{device.name}</div>
                  </td>
                  <td className="px-4 py-3 border-r border-gray-200">
                    <div className="text-sm text-gray-900">{device.model}</div>
                  </td>
                  <td className="px-4 py-3 border-r border-gray-200">
                    <div className="text-sm text-gray-900">{device.serialNumber}</div>
                  </td>
                  <td className="px-4 py-3 border-r border-gray-200">
                    <div className="text-sm text-gray-900">{device.manufacturer}</div>
                  </td>
                  <td className="px-4 py-3 border-r border-gray-200">
                    <div className="text-sm text-gray-900">{formatDate(device.dueDate)}</div>
                  </td>
                  
                  {/* Certificate File with HiOutlineDocumentText icon - matching ToolTable */}
                  <td className="px-4 py-3 text-center border-r border-gray-200">
                    {device.certificateUrl ? (
                      <button
                        onClick={() => handleFileView(device.certificateUrl)}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer p-1 rounded hover:bg-blue-100 flex items-center justify-center mx-auto"
                        title="View certificate"
                      >
                        <HiOutlineDocumentText className="w-6 h-6" />
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  
                  {/* Status - Valid/Expired */}
                  <td className="px-4 py-3 text-center border-r border-gray-200">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${status.className}`}>
                      {status.text}
                    </span>
                  </td>
                  
                  {/* Only show Action column if user can modify */}
                  {canModify && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onEdit?.(device)}
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        title={`Edit ${device.name}`}
                      >
                        <FaRegEdit className="w-5 h-5 text-blue-600" />
                        <span className="text-blue-600 hover:text-blue-800 font-medium">Edit</span>
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {sorted.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No devices found matching your search criteria.' : 'No devices found.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceTable;