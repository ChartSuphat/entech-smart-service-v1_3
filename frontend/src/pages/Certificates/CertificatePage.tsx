import React, { useState, useEffect } from 'react';
import { HiPlus } from 'react-icons/hi';
import CertificateTable from '../../components/Certificates/CertificateTable';
import CertificateModal from '../../components/Certificates/CertificateModal';
import api from '../../utils/axios';

// Types
interface Certificate {
  id: number;
  certificateNo: string;
  formatType?: 'draft' | 'official';
  status: 'pending' | 'approved';
  dateOfCalibration: string;
  dateOfIssue: string;
  equipmentId: string;
  probeId: string;
  customerId: string;
  technicianName: string;
  calibrationPlace: string;
  procedureNo: string;
  hasAdjustment: boolean;
  createdAt: string;
  updatedAt?: string;
  equipment?: {
    id: string;
    instrumentDescription: string;
    instrumentModel: string;
    instrumentSerialNo: string;
  };
  probe?: {
    id: string;
    probeDescription: string;
    probeModel: string;
    probeSN: string;
  };
  customer?: {
    id: string;
    companyName: string;
    contactPerson: string;
  };
  createdBy?: {
    id: number;
    fullName: string;
    email: string;
  };
  createdById: number;
}

type SortField = 'certificateNo' | 'formatType' | 'customer' | 'technician' | 'status' | 'date';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

const CertificatePage: React.FC = () => {
  // State
  const [allCertificates, setAllCertificates] = useState<Certificate[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [user, setUser] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  
  const itemsPerPage = 10;
  const canModify = user?.role === 'admin' || user?.role === 'technician';

  // API Functions
  const fetchUserInfo = async () => {
    // try {
    //   const response = await fetch('/api/auth/me', { credentials: 'include' });
    //   if (response.ok) {
    //     const userData = await response.json();
    //     setUser(userData.data);
    //   }
    // } catch (error) {
    //   setUser({ id: 1, role: 'admin', fullName: 'Admin User' }); // Fallback
    // }
    await loadUser();
  };


  const loadUser = async () => {
    try {
      const response = await api.get('/auth/me');
      
      // ✅ Fix: Access response.data first, then check success
      console.log('User data:', response.data);
      
      if (response.data.success) {
        setUser(response.data.data);  // Get nested user data
      } else {
        setUser(response.data);  // Fallback if no success wrapper
      }
    } catch (error: any) {
      console.error('Auth check failed:', error.response?.data || error.message);
    }
  };

  // const fetchAllCertificates = async () => {
  //   try {
  //     setLoading(true);
  //     setError(null);
      
  //     const queryParams = new URLSearchParams({ limit: '1000', page: '1' });
  //     if (!canModify) queryParams.append('status', 'approved');

  //     const response = await fetch(`/api/certificates?${queryParams}`, { credentials: 'include' });
  //     const data = await response.json();
      
  //     if (data.success) {
  //       setAllCertificates(data.data.certificates);
  //     } else {
  //       throw new Error(data.message || 'Failed to fetch certificates');
  //     }
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'An error occurred');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

    const fetchAllCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = { limit: '1000', page: '1' };
      if (!canModify) params.status = 'approved';

      const response = await api.get('/certificates', { params });
      
      if (response.data.success) {
        setAllCertificates(response.data.data.certificates);
      } else {
        throw new Error(response.data.message || 'Failed to fetch certificates');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Helper Functions
  const sortCertificates = (certificates: Certificate[], config: SortConfig): Certificate[] => {
    if (!config.field) return certificates;

    return [...certificates].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (config.field) {
        case 'certificateNo': [aValue, bValue] = [a.certificateNo || '', b.certificateNo || '']; break;
        case 'formatType':  [aValue, bValue] = [a.formatType || 'official', b.formatType || 'official']; break;
        case 'customer': [aValue, bValue] = [a.customer?.companyName || '', b.customer?.companyName || '']; break;
        case 'technician': [aValue, bValue] = [a.technicianName || '', b.technicianName || '']; break;
        case 'status': [aValue, bValue] = [a.status || '', b.status || '']; break;
        case 'date': [aValue, bValue] = [new Date(a.createdAt).getTime(), new Date(b.createdAt).getTime()]; break;
        default: return 0;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      return config.direction === 'asc' ? (aValue < bValue ? -1 : 1) : (aValue > bValue ? -1 : 1);
    });
  };

  const searchCertificates = (certificates: Certificate[], term: string): Certificate[] => {
    if (!term.trim()) return certificates;
    const lower = term.toLowerCase();
    return certificates.filter(cert => 
      cert.certificateNo?.toLowerCase().includes(lower) ||
      cert.customer?.companyName?.toLowerCase().includes(lower) ||
      cert.technicianName?.toLowerCase().includes(lower) ||
      cert.equipment?.instrumentDescription?.toLowerCase().includes(lower) ||
      cert.equipment?.instrumentModel?.toLowerCase().includes(lower)
    );
  };

  // const paginateCertificates = (certificates: Certificate[], page: number, perPage: number) => {
  //   const start = (page - 1) * perPage;
  //   return {
  //     paginatedData: certificates.slice(start, start + perPage),
  //     totalPages: Math.ceil(certificates.length / perPage)
  //   };
  // };

  // Effects
  useEffect(() => { fetchUserInfo(); }, []);
  useEffect(() => { if (user) fetchAllCertificates(); }, [user, canModify]);
  
  useEffect(() => {
    let processed = searchCertificates(allCertificates, searchTerm);
    processed = sortCertificates(processed, sortConfig);
   
    
    setFilteredCertificates(processed);
    setTotalPages(1);
  }, [allCertificates, searchTerm, sortConfig, currentPage]);

  // Handlers
  const handleSort = (field: SortField) => {
    const direction = sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ field, direction });
    setCurrentPage(1);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  // const handleBulkApprove = async (certificateIds: number[]) => {
  //   try {
  //     const response = await fetch('/api/certificates/bulk-approve', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       credentials: 'include',
  //       body: JSON.stringify({ certificateIds }),
  //     });

  //     const result = await response.json();
  //     if (!response.ok) throw new Error(result.message || 'Failed to approve certificates');
      
  //     await fetchAllCertificates();
  //     const { approvedCount, skippedCount } = result.data;
  //     alert(`Successfully approved ${approvedCount} certificate(s)${skippedCount > 0 ? `. ${skippedCount} skipped.` : '.'}`);
  //   } catch (error) {
  //     alert(`Failed to approve certificates: ${error instanceof Error ? error.message : 'Unknown error'}`);
  //   }
  // };

  const handleBulkApprove = async (certificateIds: number[]) => {
    try {
      const response = await api.post('/certificates/bulk-approve', { certificateIds });

      if (response.data.success) {
        await fetchAllCertificates();
        const { approvedCount, skippedCount } = response.data.data;
        alert(`Successfully approved ${approvedCount} certificate(s)${skippedCount > 0 ? `. ${skippedCount} skipped.` : '.'}`);
      } else {
        throw new Error(response.data.message || 'Failed to approve certificates');
      }
    } catch (error: any) {
      alert(`Failed to approve certificates: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  };

  const handleCreateCertificate = () => {
    setModalMode('create');
    setSelectedCertificate(null);
    setIsModalOpen(true);
  };

  const handleEditCertificate = (certificate: Certificate) => {
    setModalMode('edit');
    setSelectedCertificate(certificate);
    setIsModalOpen(true);
  };

  const handleViewCertificate = (certificate: Certificate) => {
    setModalMode('view');
    setSelectedCertificate(certificate);
    setIsModalOpen(true);
  };

  // const handleDeleteCertificate = async (certificate: Certificate) => {
  //   if (!confirm(`Delete certificate ${certificate.certificateNo}?`)) return;

  //   try {
  //     const response = await fetch(`/api/certificates/${certificate.id}`, {
  //       method: 'DELETE',
  //       credentials: 'include'
  //     });

  //     const data = await response.json();
  //     if (data.success) {
  //       fetchAllCertificates();
  //       alert('Certificate deleted successfully!');
  //     } else {
  //       throw new Error(data.message || 'Failed to delete certificate');
  //     }
  //   } catch (err) {
  //     alert(err instanceof Error ? err.message : 'Failed to delete certificate');
  //   }
  // };

  const handleDeleteCertificate = async (certificate: Certificate) => {
    if (!confirm(`Delete certificate ${certificate.certificateNo}?`)) return;

    try {
      const response = await api.delete(`/certificates/${certificate.id}`);

      if (response.data.success) {
        fetchAllCertificates();
        alert('Certificate deleted successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to delete certificate');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete certificate');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCertificate(null);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setSelectedCertificate(null);
    fetchAllCertificates();
  };

  return (
    <div className="w-full">
      {/* Dashboard-Consistent Header */}
     
        
          <h1 className="text-3xl font-bold text-blue-600 mb-8">
            Certificate Management
          </h1>
        
      

      {/* Compact Search & Add Section - Mobile Optimized */}
<div className="p-2 sm:p-4 md:p-6">
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-4">
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">

      {/* Compact Search Input */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="border px-3 py-2 rounded-md w-[300px] sm:w-[200px] md:w-[300px]"
        />
      </div>

      {/* Compact Add Button */}
      {canModify && (
        <button
          onClick={handleCreateCertificate}
          className="flex items-center justify-center px-2 py-1 sm:px-3 sm:py-2 
                     bg-orange-400 text-white rounded-md hover:bg-orange-500 
                     transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
        >
          <HiPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          <span className="hidden sm:inline">Create Certificate</span>
          <span className="sm:hidden">Create</span>
        </button>
      )}
    </div>
  </div>
</div>


     {/* Full-Width Table Container - Mobile Optimized */}
<div className="bg-white shadow-sm border-t border-b border-gray-200 sm:border sm:mx-4 md:mx-6 sm:rounded-lg overflow-x-auto">
  {/* This wrapper ensures scroll bar on small screens */}
  <div className="min-w-[900px]">
    <CertificateTable
      certificates={filteredCertificates}
      loading={loading}
      error={error}
      currentPage={currentPage}
      totalPages={totalPages}
      isAdmin={canModify}
      canModify={canModify}
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      onPageChange={setCurrentPage}
      onEdit={canModify ? handleEditCertificate : undefined}
      onView={handleViewCertificate}
      onDelete={canModify ? handleDeleteCertificate : undefined}
      onBulkApprove={canModify ? handleBulkApprove : undefined}
      sortConfig={sortConfig}
      onSort={handleSort}
    />
  </div>
</div>



      {/* Modal */}
      {(canModify || modalMode === 'view') && (
        <CertificateModal
          isOpen={isModalOpen}
          mode={modalMode}
          certificate={selectedCertificate}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default CertificatePage;