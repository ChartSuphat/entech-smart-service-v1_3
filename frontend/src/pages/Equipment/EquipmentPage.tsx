import React, { useState, useEffect } from 'react';
import AddInstrumentModal from '../../components/Equipment/AddInstrumentModal';
import AddProbeModal from '../../components/Equipment/AddProbeModal';
import EquipmentTable from '../../components/Equipment/EquipmentTable';
import { FaPlus } from 'react-icons/fa';
import api from '../../utils/axios';
// Equipment interface
interface Equipment {
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

// Probe interface
interface Probe {
  id: string;
  probeDescription: string;
  probeModel: string;
  probeSN: string;
  createdAt: string;
  updatedAt: string;
  createdById: number;
}

const EquipmentPage: React.FC = () => {
  // State for data and modals
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [probes, setProbes] = useState<Probe[]>([]);
  const [isInstrumentModalOpen, setIsInstrumentModalOpen] = useState(false);
  const [isProbeModalOpen, setIsProbeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [editingInstrument, setEditingInstrument] = useState<Equipment | null>(null);
  const [editingProbe, setEditingProbe] = useState<Probe | null>(null);

  // Check if user can modify equipment (admin or technician)
  const canModify = user?.role === 'admin' || user?.role === 'technician';

  // const fetchUserInfo = async () => {
  // try {
  //   const response = await api.get('/auth/me');
  //   if (response.data.success) {
  //     setUser(response.data.data);
  //     console.log('User loaded:', response.data.data?.role);
  //   }
  // } catch (error) {
  //   console.error('Error fetching user info:', error);
  // }
    const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.data);
        console.log('User loaded:', response.data.data?.role);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const loadAllData = async () => {
    try {
      setIsLoadingData(true);
      setError(null);
      console.log('Loading all equipment data...');
      
      const [equipmentResponse, probesResponse] = await Promise.all([
        api.get('/equipment'),
        api.get('/equipment/probes')
      ]);
      
      console.log('Equipment response:', equipmentResponse.data);
      console.log('Probes response:', probesResponse.data);
      
      // Handle equipment response
      if (equipmentResponse.data.success && Array.isArray(equipmentResponse.data.data)) {
        setEquipment(equipmentResponse.data.data);
        console.log('Equipment loaded:', equipmentResponse.data.data.length, 'items');
      } else if (Array.isArray(equipmentResponse.data)) {
        setEquipment(equipmentResponse.data);
        console.log('Equipment loaded (direct array):', equipmentResponse.data.length, 'items');
      } else {
        console.log('Equipment data format issue:', equipmentResponse.data);
        setEquipment([]);
      }
      
      // Handle probes response
      if (probesResponse.data.success && Array.isArray(probesResponse.data.data)) {
        setProbes(probesResponse.data.data);
        console.log('Probes loaded:', probesResponse.data.data.length, 'items');
      } else if (Array.isArray(probesResponse.data)) {
        setProbes(probesResponse.data);
        console.log('Probes loaded (direct array):', probesResponse.data.length, 'items');
      } else {
        console.log('Probes data format issue:', probesResponse.data);
        setProbes([]);
      }
      
    } catch (error: any) {
      console.error('Error loading data:', error);
      setEquipment([]);
      setProbes([]);
      setError(`Network error: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setIsLoadingData(false);
    }
  };


  // Load both equipment and probes in parallel
  // const loadAllData = async () => {
  //   try {
  //     setIsLoadingData(true);
  //     setError(null);
  //     console.log('Loading all equipment data...');
      
  //     const [equipmentResponse, probesResponse] = await Promise.all([
  //       fetch('/api/equipment', { 
  //         credentials: 'include',
  //         headers: { 'Content-Type': 'application/json' }
  //       }),
  //       fetch('/api/equipment/probes', { 
  //         credentials: 'include',
  //         headers: { 'Content-Type': 'application/json' }
  //       })
  //     ]);
      
  //     console.log('Equipment response status:', equipmentResponse.status);
  //     console.log('Probes response status:', probesResponse.status);
      
  //     // Handle equipment response
  //     if (equipmentResponse.ok) {
  //       try {
  //         const equipmentResult = await equipmentResponse.json();
  //         console.log('Equipment result:', equipmentResult);
          
  //         if (equipmentResult.success && Array.isArray(equipmentResult.data)) {
  //           setEquipment(equipmentResult.data);
  //           console.log('Equipment loaded:', equipmentResult.data.length, 'items');
  //         } else if (Array.isArray(equipmentResult)) {
  //           setEquipment(equipmentResult);
  //           console.log('Equipment loaded (direct array):', equipmentResult.length, 'items');
  //         } else {
  //           console.log('Equipment data format issue:', equipmentResult);
  //           setEquipment([]);
  //         }
  //       } catch (parseError) {
  //         console.error('Error parsing equipment response:', parseError);
  //         setEquipment([]);
  //       }
  //     } else {
  //       console.log('Equipment response not ok, status:', equipmentResponse.status);
  //       setEquipment([]);
  //       setError(`Failed to load equipment: ${equipmentResponse.status}`);
  //     }
      
  //     // Handle probes response
  //     if (probesResponse.ok) {
  //       try {
  //         const probesResult = await probesResponse.json();
  //         console.log('Probes result:', probesResult);
          
  //         if (probesResult.success && Array.isArray(probesResult.data)) {
  //           setProbes(probesResult.data);
  //           console.log('Probes loaded:', probesResult.data.length, 'items');
  //         } else if (Array.isArray(probesResult)) {
  //           setProbes(probesResult);
  //           console.log('Probes loaded (direct array):', probesResult.length, 'items');
  //         } else {
  //           console.log('Probes data format issue:', probesResult);
  //           setProbes([]);
  //         }
  //       } catch (parseError) {
  //         console.error('Error parsing probes response:', parseError);
  //         setProbes([]);
  //       }
  //     } else {
  //       console.log('Probes response not ok, status:', probesResponse.status);
  //       setProbes([]);
  //       if (!error) {
  //         setError(`Failed to load probes: ${probesResponse.status}`);
  //       }
  //     }
      
  //   } catch (error) {
  //     console.error('Error loading data:', error);
  //     setEquipment([]);
  //     setProbes([]);
  //     setError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  //   } finally {
  //     setIsLoadingData(false);
  //   }
  // };

  useEffect(() => {
    console.log('EquipmentPage mounted, starting data load...');
    fetchUserInfo();
    loadAllData();
  }, []);

  // Handle adding new instrument
  // const handleAddInstrument = async (instrumentData: any) => {
  //   try {
  //     setIsLoading(true);
      
  //     const response = await fetch('/api/equipment', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       credentials: 'include',
  //       body: JSON.stringify(instrumentData)
  //     });

  //     if (response.ok) {
  //       const result = await response.json();
  //       if (result.success) {
  //         setEquipment(prev => [result.data, ...prev]);
  //         setIsInstrumentModalOpen(false);
  //         setEditingInstrument(null);
  //         alert('Instrument added successfully!');
  //       } else {
  //         alert('Error: ' + result.message);
  //       }
  //     } else {
  //       const error = await response.json();
  //       alert('Error: ' + (error.message || 'Failed to add instrument'));
  //     }
  //   } catch (error) {
  //     console.error('Error adding instrument:', error);
  //     alert('Error: Failed to add instrument');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleAddInstrument = async (instrumentData: any) => {
    try {
      setIsLoading(true);
      const response = await api.post('/equipment', instrumentData);

      if (response.data.success) {
        setEquipment(prev => [response.data.data, ...prev]);
        setIsInstrumentModalOpen(false);
        setEditingInstrument(null);
        alert('Instrument added successfully!');
      } else {
        alert('Error: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error adding instrument:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to add instrument'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle editing instrument
  // const handleEditInstrument = async (instrumentData: any) => {
  //   if (!editingInstrument) return;
    
  //   try {
  //     setIsLoading(true);
      
  //     const response = await fetch(`/api/equipment/${editingInstrument.id}`, {
  //       method: 'PUT',
  //       headers: { 'Content-Type': 'application/json' },
  //       credentials: 'include',
  //       body: JSON.stringify(instrumentData)
  //     });

  //     if (response.ok) {
  //       const result = await response.json();
  //       if (result.success) {
  //         setEquipment(prev => 
  //           prev.map(item => 
  //             item.id === editingInstrument.id ? result.data : item
  //           )
  //         );
  //         setIsInstrumentModalOpen(false);
  //         setEditingInstrument(null);
  //         alert('Instrument updated successfully!');
  //       } else {
  //         alert('Error: ' + result.message);
  //       }
  //     } else {
  //       const error = await response.json();
  //       alert('Error: ' + (error.message || 'Failed to update instrument'));
  //     }
  //   } catch (error) {
  //     console.error('Error updating instrument:', error);
  //     alert('Error: Failed to update instrument');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleEditInstrument = async (instrumentData: any) => {
    if (!editingInstrument) return;
    
    try {
      setIsLoading(true);
      const response = await api.post(`/equipment/${editingInstrument.id}`, instrumentData);

      if (response.data.success) {
        setEquipment(prev => 
          prev.map(item => 
            item.id === editingInstrument.id ? response.data.data : item
          )
        );
        setIsInstrumentModalOpen(false);
        setEditingInstrument(null);
        alert('Instrument updated successfully!');
      } else {
        alert('Error: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error updating instrument:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to update instrument'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding new probe
  // const handleAddProbe = async (probeData: any) => {
  //   try {
  //     setIsLoading(true);
  //     console.log('Adding probe:', probeData);
      
  //     const response = await fetch('/api/equipment/probes', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       credentials: 'include',
  //       body: JSON.stringify({
  //         probeDescription: probeData.probeDescription,
  //         probeModel: probeData.probeModel,
  //         probeSN: probeData.probeSN
  //       })
  //     });

  //     if (response.ok) {
  //       const result = await response.json();
  //       if (result.success) {
  //         setProbes(prev => [result.data, ...prev]);
  //         setIsProbeModalOpen(false);
  //         setEditingProbe(null);
  //         alert('Probe added successfully!');
  //       } else {
  //         alert('Error: ' + result.message);
  //       }
  //     } else {
  //       const error = await response.json();
  //       alert('Error: ' + (error.message || 'Failed to add probe'));
  //     }
  //   } catch (error) {
  //     console.error('Error adding probe:', error);
  //     alert('Error: Failed to add probe');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

    const handleAddProbe = async (probeData: any) => {
    try {
      setIsLoading(true);
      console.log('Adding probe:', probeData);
      
      const response = await api.post('/equipment/probes', {
        probeDescription: probeData.probeDescription,
        probeModel: probeData.probeModel,
        probeSN: probeData.probeSN
      });

      if (response.data.success) {
        setProbes(prev => [response.data.data, ...prev]);
        setIsProbeModalOpen(false);
        setEditingProbe(null);
        alert('Probe added successfully!');
      } else {
        alert('Error: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error adding probe:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to add probe'));
    } finally {
      setIsLoading(false);
    }
  };


  // Handle editing probe
  // const handleEditProbe = async (probeData: any) => {
  //   if (!editingProbe) return;
    
  //   try {
  //     setIsLoading(true);
  //     console.log('Updating probe:', probeData);
      
  //     const response = await fetch(`/api/equipment/probes/${editingProbe.id}`, {
  //       method: 'PUT',
  //       headers: { 'Content-Type': 'application/json' },
  //       credentials: 'include',
  //       body: JSON.stringify({
  //         probeDescription: probeData.probeDescription,
  //         probeModel: probeData.probeModel,
  //         probeSN: probeData.probeSN
  //       })
  //     });

  //     if (response.ok) {
  //       const result = await response.json();
  //       if (result.success) {
  //         setProbes(prev => 
  //           prev.map(item => 
  //             item.id === editingProbe.id ? result.data : item
  //           )
  //         );
  //         setIsProbeModalOpen(false);
  //         setEditingProbe(null);
  //         alert('Probe updated successfully!');
  //       } else {
  //         alert('Error: ' + result.message);
  //       }
  //     } else {
  //       const error = await response.json();
  //       alert('Error: ' + (error.message || 'Failed to update probe'));
  //     }
  //   } catch (error) {
  //     console.error('Error updating probe:', error);
  //     alert('Error: Failed to update probe');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleEditProbe = async (probeData: any) => {
    if (!editingProbe) return;
    
    try {
      setIsLoading(true);
      console.log('Updating probe:', probeData);
      
      const response = await api.post(`/equipment/probes/${editingProbe.id}`, {
        probeDescription: probeData.probeDescription,
        probeModel: probeData.probeModel,
        probeSN: probeData.probeSN
      });

      if (response.data.success) {
        setProbes(prev => 
          prev.map(item => 
            item.id === editingProbe.id ? response.data.data : item
          )
        );
        setIsProbeModalOpen(false);
        setEditingProbe(null);
        alert('Probe updated successfully!');
      } else {
        alert('Error: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error updating probe:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to update probe'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete instrument (from modal)
  // const handleDeleteInstrument = async (id: string) => {
  //   try {
  //     const response = await fetch(`/api/equipment/${id}`, {
  //       method: 'DELETE',
  //       credentials: 'include'
  //     });

  //     if (response.ok) {
  //       const result = await response.json();
  //       if (result.success) {
  //         setEquipment(prev => prev.filter(eq => eq.id !== id));
  //         setIsInstrumentModalOpen(false);
  //         setEditingInstrument(null);
  //         alert('Instrument deleted successfully!');
  //       } else {
  //         alert('Error: ' + result.message);
  //       }
  //     } else {
  //       const error = await response.json();
  //       alert('Error: ' + (error.message || 'Failed to delete instrument'));
  //     }
  //   } catch (error) {
  //     console.error('Error deleting instrument:', error);
  //     alert('Error: Failed to delete instrument');
  //   }
  // };

  const handleDeleteInstrument = async (id: string) => {
    try {
      const response = await api.delete(`/equipment/${id}`);

      if (response.data.success) {
        setEquipment(prev => prev.filter(eq => eq.id !== id));
        setIsInstrumentModalOpen(false);
        setEditingInstrument(null);
        alert('Instrument deleted successfully!');
      } else {
        alert('Error: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error deleting instrument:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to delete instrument'));
    }
  };

  // Handle delete probe (from modal)
  // const handleDeleteProbe = async (id: string) => {
  //   try {
  //     console.log('Deleting probe:', id);
  //     const response = await fetch(`/api/equipment/probes/${id}`, {
  //       method: 'DELETE',
  //       credentials: 'include'
  //     });

  //     if (response.ok) {
  //       const result = await response.json();
  //       if (result.success) {
  //         setProbes(prev => prev.filter(probe => probe.id !== id));
  //         setIsProbeModalOpen(false);
  //         setEditingProbe(null);
  //         alert('Probe deleted successfully!');
  //       } else {
  //         alert('Error: ' + result.message);
  //       }
  //     } else {
  //       const error = await response.json();
  //       alert('Error: ' + (error.message || 'Failed to delete probe'));
  //     }
  //   } catch (error) {
  //     console.error('Error deleting probe:', error);
  //     alert('Error: Failed to delete probe');
  //   }
  // };

  const handleDeleteProbe = async (id: string) => {
    try {
      console.log('Deleting probe:', id);
      const response = await api.delete(`/equipment/probes/${id}`);

      if (response.data.success) {
        setProbes(prev => prev.filter(probe => probe.id !== id));
        setIsProbeModalOpen(false);
        setEditingProbe(null);
        alert('Probe deleted successfully!');
      } else {
        alert('Error: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error deleting probe:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to delete probe'));
    }
  };

  // Handle opening edit modals
  const handleOpenEditInstrument = (equipment: Equipment) => {
    setEditingInstrument(equipment);
    setIsInstrumentModalOpen(true);
  };


  const handleOpenEditProbe = (probe: Probe) => {
    setEditingProbe(probe);
    setIsProbeModalOpen(true);
  };

  // Handle opening create modals
  const handleOpenCreateInstrument = () => {
    setEditingInstrument(null);
    setIsInstrumentModalOpen(true);
  };

  const handleOpenCreateProbe = () => {
    setEditingProbe(null);
    setIsProbeModalOpen(true);
  };

  // Handle closing modals
  const handleCloseInstrumentModal = () => {
    setIsInstrumentModalOpen(false);
    setEditingInstrument(null);
  };

  const handleCloseProbeModal = () => {
    setIsProbeModalOpen(false);
    setEditingProbe(null);
  };

  // Loading state
  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <div className="text-lg text-gray-600">Loading equipment...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-600">Equipment Management</h1>
        {/* Only show Add buttons if user can modify */}
        {canModify && (
          <div className="flex gap-3">
            <button
              onClick={handleOpenCreateInstrument}
              className="bg-sky-500 text-white px-4 py-2 rounded hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isLoading}
            >
              <FaPlus size={14} />
              Add Instrument
            </button>
            <button
              onClick={handleOpenCreateProbe}
              className="bg-orange-400 text-white px-4 py-2 rounded hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isLoading}
            >
              <FaPlus size={14} />
              Add Probe
            </button>
          </div>
        )}
      </div>

      {/* Show user role for debugging */}
      {user && (
        <div className="mb-4 text-sm text-gray-500">
          Logged in as: {user.fullName} ({user.role})
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError(null)}
            className="ml-4 text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Debug info */}
      <div className="mb-4 text-sm text-gray-500">
        Found {equipment.length} instruments and {probes.length} probes
      </div>

      {/* Equipment Table Component */}
      <EquipmentTable
        instruments={equipment}
        probes={probes}
        onEditInstrument={canModify ? handleOpenEditInstrument : undefined}
        onEditProbe={canModify ? handleOpenEditProbe : undefined}
        onDeleteInstrument={undefined} // Remove delete from table
        onDeleteProbe={undefined} // Remove delete from table
        onAddInstrument={canModify ? handleOpenCreateInstrument : undefined}
        onAddProbe={canModify ? handleOpenCreateProbe : undefined}
        canModify={canModify}
        isLoading={isLoading}
      />

      {/* Only show modals if user can modify */}
      {canModify && (
        <>
          {/* Add/Edit Instrument Modal */}
          <AddInstrumentModal
            isOpen={isInstrumentModalOpen}
            onClose={handleCloseInstrumentModal}
            onSubmit={editingInstrument ? handleEditInstrument : handleAddInstrument}
            onDelete={editingInstrument ? handleDeleteInstrument : undefined}
            editData={editingInstrument}
            isLoading={isLoading}
          />

          {/* Add/Edit Probe Modal */}
          <AddProbeModal
            isOpen={isProbeModalOpen}
            onClose={handleCloseProbeModal}
            onSubmit={editingProbe ? handleEditProbe : handleAddProbe}
            onDelete={editingProbe ? () => handleDeleteProbe(editingProbe.id) : undefined}
            editData={editingProbe ? { 
              id: parseInt(editingProbe.id), 
              probeDescription: editingProbe.probeDescription,
              probeModel: editingProbe.probeModel,
              probeSN: editingProbe.probeSN
            } : undefined}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
};

export default EquipmentPage;