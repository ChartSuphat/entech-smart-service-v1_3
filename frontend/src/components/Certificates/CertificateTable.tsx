import React, { useState, useEffect } from 'react';
import {
  HiPencil,
  HiTrash,
  HiDocument,
  HiDownload,
  HiDocumentText,
  HiPrinter,
  HiTemplate,
  HiCheck,
} from 'react-icons/hi';
import { BiSolidUpArrow, BiSolidDownArrow } from 'react-icons/bi';
import api from '../../utils/axios';

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

interface CertificateTableProps {
  certificates: Certificate[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  isAdmin?: boolean;
  canModify?: boolean;
  searchTerm?: string;
  onSearchChange?: (searchTerm: string) => void;
  onPageChange: (page: number) => void;
  onEdit?: (certificate: Certificate) => void;
  onView: (certificate: Certificate) => void;
  onDelete?: (certificate: Certificate) => void;
  onBulkApprove?: (certificateIds: number[]) => void;
  sortConfig?: SortConfig;
  onSort?: (field: SortField) => void;
}

const CertificateTable: React.FC<CertificateTableProps> = ({
  certificates,
  loading,
  error,
  currentPage,
  totalPages,
  isAdmin = false,
  canModify = false,
  searchTerm = '',
  onSearchChange,
  onPageChange,
  onEdit,
  onView,
  onDelete,
  onBulkApprove,
  sortConfig,
  onSort
}) => {
  const [templateLoading, setTemplateLoading] = useState<number | null>(null);
  const [selectedCertificates, setSelectedCertificates] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [bulkApproveLoading, setBulkApproveLoading] = useState(false);

  const pendingCertificates = canModify ? certificates.filter(cert => cert.status === 'pending') : [];
  const pendingCertificateIds = pendingCertificates.map(cert => cert.id);

  useEffect(() => {
    if (!canModify) return;
    const allPendingSelected = pendingCertificateIds.length > 0 &&
      pendingCertificateIds.every(id => selectedCertificates.has(id));
    setSelectAll(allPendingSelected);
  }, [selectedCertificates, pendingCertificateIds, canModify]);

  // Simple sortable header
  const SortableHeader: React.FC<{
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }> = ({ field, children, className = "" }) => {
    const isSorted = sortConfig?.field === field;
    const direction = sortConfig?.direction;

    const handleSort = () => {
      if (onSort) {
        onSort(field);
      }
    };

    return (
      <th
        className={`px-2 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-600 transition-colors ${className}`}
        onClick={handleSort}
      >
        <div className="flex items-center justify-between">
          <span className="truncate">{children}</span>
          <div className="flex flex-col ml-1">
            {isSorted ? (
              direction === 'asc' ? (
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
        </div>
      </th>
    );
  };

  const handleCheckboxChange = (certificateId: number) => {
    if (!canModify) return;
    const newSelected = new Set(selectedCertificates);
    if (newSelected.has(certificateId)) {
      newSelected.delete(certificateId);
    } else {
      newSelected.add(certificateId);
    }
    setSelectedCertificates(newSelected);
  };

  const handleSelectAll = () => {
    if (!canModify) return;
    if (selectAll) {
      const newSelected = new Set(selectedCertificates);
      pendingCertificateIds.forEach(id => newSelected.delete(id));
      setSelectedCertificates(newSelected);
    } else {
      const newSelected = new Set(selectedCertificates);
      pendingCertificateIds.forEach(id => newSelected.add(id));
      setSelectedCertificates(newSelected);
    }
  };

  const handleBulkApprove = async () => {
    if (!canModify || selectedCertificates.size === 0 || !onBulkApprove) return;

    setBulkApproveLoading(true);
    try {
      await onBulkApprove(Array.from(selectedCertificates));
      setSelectedCertificates(new Set());
    } catch (error) {
      console.error('Error approving certificates:', error);
      alert('Failed to approve certificates. Please try again.');
    } finally {
      setBulkApproveLoading(false);
    }
  };

  // const handleTemplatePreview = async (certificate: Certificate) => {
  //   try {
  //     setTemplateLoading(certificate.id);
  //     const previewUrl = `/api/certificates/${certificate.id}/template/preview`;
  //     window.open(previewUrl, '_blank');
  //   } catch (error) {
  //     console.error('Error opening template preview:', error);
  //     alert(`Failed to open template preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
  //   } finally {
  //     setTemplateLoading(null);
  //   }
  // };
  const handleTemplatePreview = async (certificate: Certificate) => {
    try {
      setTemplateLoading(certificate.id);


      const response = await api.get(`/certificates/${certificate.id}/template/pdf?preview=true`, {
        responseType: 'blob'
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');

      // Clean up after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error: any) {
      console.error('Error opening template preview:', error);
      alert(`Failed to open template preview: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setTemplateLoading(null);
    }
  };



  const handleTemplateDownload = async (certificate: Certificate) => {
    try {
      setTemplateLoading(certificate.id);

      // ✅ Use api instance instead of fetch
      const response = await api.get(`/certificates/${certificate.id}/template/pdf`, {
        responseType: 'blob'
      });

      const blob = response.data;

      // Extract filename from backend's Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${certificate.certificateNo}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      alert(`Failed to download PDF: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setTemplateLoading(null);
    }
  };
  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600">Loading certificates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600 text-base font-medium">Error</div>
        <p className="text-gray-600 mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="p-4 text-center">
        <HiDocumentText className="mx-auto h-8 w-8 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {canModify ? 'No certificates' : 'No approved certificates available'}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {canModify
            ? 'Get started by creating a new certificate.'
            : 'Approved certificates will appear here when available.'
          }
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Count and Bulk Actions - Compact */}
      <div className="bg-white border-b border-gray-200 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {canModify ? 'Total' : 'Approved'}: <span className="font-semibold">{certificates.length}</span>
            {canModify && pendingCertificates.length > 0 && (
              <span className="ml-3 text-orange-600">• {pendingCertificates.length} Pending</span>
            )}
          </div>

          {canModify && selectedCertificates.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-600">{selectedCertificates.size} selected</span>
              <button
                onClick={() => setSelectedCertificates(new Set())}
                className="px-2 py-1 text-xs border border-red-500 text-red-600 rounded hover:bg-red-50"
              >
                Clear
              </button>
              <button
                onClick={handleBulkApprove}
                disabled={bulkApproveLoading}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {bulkApproveLoading ? 'Approving...' : 'Approve'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Simple Table with Horizontal Scrollbar - Fixed */}
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full divide-y divide-gray-200" style={{ minWidth: '700px' }}>
          <thead className="bg-blue-500">
            <tr>
              {canModify && (
                <th className="px-2 py-2 w-8">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    disabled={pendingCertificateIds.length === 0}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </th>
              )}

              <SortableHeader field="certificateNo" className="min-w-[100px]">Cert No.</SortableHeader>
              <th className="px-2 py-2 text-left text-xs font-semibold text-white uppercase min-w-[150px]">Equipment</th>
              <SortableHeader field="formatType" className="min-w-[80px]">Format</SortableHeader>
              <SortableHeader field="customer" className="min-w-[120px]">Customer</SortableHeader>
              <SortableHeader field="technician" className="min-w-[100px]">Tech</SortableHeader>
              {canModify && <SortableHeader field="status" className="min-w-[80px]">Status</SortableHeader>}
              <SortableHeader field="date" className="min-w-[80px]">Date</SortableHeader>
              <th className="px-2 py-2 text-center text-xs font-semibold text-white uppercase min-w-[150px]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {certificates.map((certificate) => (
              <tr key={certificate.id} className={`hover:bg-gray-50 ${selectedCertificates.has(certificate.id) ? 'bg-blue-50' : ''}`}>
                {canModify && (
                  <td className="px-2 py-2 w-8">
                    {certificate.status === 'pending' ? (
                      <input
                        type="checkbox"
                        checked={selectedCertificates.has(certificate.id)}
                        onChange={() => handleCheckboxChange(certificate.id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    ) : (
                      <div className="h-4 w-4"></div>
                    )}
                  </td>
                )}
                
                <td className="px-2 py-2 min-w-[100px]">
                  <div className="text-xs font-medium text-gray-900 truncate">{certificate.certificateNo}</div>
                  <div className="text-xs text-gray-500 truncate">{new Date(certificate.dateOfCalibration).toLocaleDateString('en-GB')}</div>
                </td>
                
                <td className="px-2 py-2 min-w-[150px]">
                  <div className="text-xs text-gray-900 truncate">{certificate.equipment?.instrumentDescription || 'N/A'}</div>
                  <div className="text-xs text-gray-500 truncate">{certificate.equipment?.instrumentModel || 'N/A'}</div>
                </td>
                <td className="px-2 py-2 min-w-[80px]">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                  certificate.formatType === 'draft' 
                  ? 'bg-yellow-100 text-gray-800' 
                  : 'bg-green-100 text-gray-800'
                  }`}>
                  {certificate.formatType === 'draft' ? 'Draft' : 'Official'}
                </span>
                </td>
                <td className="px-2 py-2 min-w-[120px]">
                  <div className="text-xs text-gray-900 truncate">{certificate.customer?.companyName || 'N/A'}</div>
                  <div className="text-xs text-gray-500 truncate">{certificate.customer?.contactPerson || 'N/A'}</div>
                </td>

                <td className="px-2 py-2 min-w-[100px]">
                  <div className="text-xs text-gray-900 truncate">{certificate.technicianName}</div>
                </td>

                {canModify && (
                  <td className="px-2 py-2 min-w-[80px]">
                    <span className={`px-1 py-1 text-xs rounded ${certificate.status === 'approved' ? 'bg-green-100 text-gray-800' : 'bg-yellow-100 text-gray-800'}`}>
                      {certificate.status}
                    </span>
                  </td>
                )}

                <td className="px-2 py-2 min-w-[80px] text-xs text-gray-500">
                  {new Date(certificate.createdAt).toLocaleDateString('en-GB')}
                </td>

                <td className="px-1 py-2 min-w-[150px] text-center">
                  <div className="flex items-center justify-center space-x-1">
                    {/* PDF Actions */}
                    <button
                      onClick={() => handleTemplatePreview(certificate)}
                      disabled={templateLoading === certificate.id}
                      className="p-1 border border-blue-300 rounded text-blue-700 bg-white hover:bg-blue-50"
                      title="Preview"
                    >
                      <HiTemplate className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => handleTemplateDownload(certificate)}
                      disabled={templateLoading === certificate.id}
                      className="p-1 border border-blue-300 rounded text-blue-700 bg-white hover:bg-blue-50"
                      title="Download"
                    >
                      <HiDownload className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => onView(certificate)}
                      className="p-1 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50"
                      title="View"
                    >
                      <HiDocument className="h-3 w-3" />
                    </button>

                    {canModify && onEdit && (
                      <button
                        onClick={() => onEdit(certificate)}
                        className="p-1 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50"
                        title="Edit"
                      >
                        <HiPencil className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Simple Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-3 py-2 flex items-center justify-between border-t border-gray-200">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CertificateTable;