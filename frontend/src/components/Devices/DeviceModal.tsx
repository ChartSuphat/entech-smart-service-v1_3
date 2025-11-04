import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { Device } from '../../types/device';
import { uploadService } from '../../services/uploadService';

interface DeviceModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onSave: (device: Partial<Device>) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  initialData?: Device | null;
}

const DeviceModal: React.FC<DeviceModalProps> = ({
  isOpen,
  onRequestClose,
  onSave,
  onDelete,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    serialNumber: '',
    manufacturer: '',
  });
  const [calibrationDate, setCalibrationDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        model: initialData.model || '',
        serialNumber: initialData.serialNumber || '',
        manufacturer: initialData.manufacturer || '',
      });
      setCalibrationDate(initialData.calibrationDate ? new Date(initialData.calibrationDate) : null);
      setDueDate(initialData.dueDate ? new Date(initialData.dueDate) : null);
      
      // Set preview for existing certificate
      if (initialData.certificateUrl) {
        const certUrl = initialData.certificateUrl.startsWith('/uploads/') 
          ? initialData.certificateUrl
          : initialData.certificateUrl;
        setCertificatePreview(certUrl);
      } else {
        setCertificatePreview('');
      }
      setCertificateFile(null);
    } else {
      setFormData({
        name: '',
        model: '',
        serialNumber: '',
        manufacturer: '',
      });
      setCalibrationDate(null);
      setDueDate(null);
      setCertificateFile(null);
      setCertificatePreview('');
      setPdfPreviewUrl('');
    }
    setUploadError(null);
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFilePreview = (file: File, setPreview: (preview: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCertificateFile(file);
    
    if (file) {
      if (file.type.startsWith('image/')) {
        handleFilePreview(file, setCertificatePreview);
        setPdfPreviewUrl('');
      } else if (file.type === 'application/pdf') {
        const pdfUrl = URL.createObjectURL(file);
        setPdfPreviewUrl(pdfUrl);
        setCertificatePreview('');
      } else {
        setCertificatePreview('');
        setPdfPreviewUrl('');
      }
    } else {
      setCertificatePreview('');
      setPdfPreviewUrl('');
    }
  };

  const uploadCertificate = async (): Promise<string | undefined> => {
    if (!certificateFile) return undefined;

    try {
      const result = await uploadService.uploadCertificate(certificateFile);
      console.log('Device certificate uploaded:', result.url);
      return result.url;
    } catch (error) {
      console.error('Certificate upload failed:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsUploading(true);
  setUploadError(null);

  try {
    // Validate required dates
    if (!calibrationDate || !dueDate) {
      setUploadError('Calibration date and due date are required');
      setIsUploading(false);
      return;
    }

    // Upload certificate if new file selected
    const certificateUrl = await uploadCertificate();

    const deviceData: Partial<Device> = {
      ...(initialData?.id && { id: initialData.id }),
      ...formData,
      calibrationDate: calibrationDate.toISOString(),
      dueDate: dueDate.toISOString(),
      certificateUrl: certificateUrl || initialData?.certificateUrl || undefined,
    };

    console.log('💾 Saving device with data:', deviceData);
    await onSave(deviceData);
    onRequestClose();
  } catch (error) {
    console.error('❌ Save error:', error);
    setUploadError(error instanceof Error ? error.message : 'Upload failed');
  } finally {
    setIsUploading(false);
  }
};

  const handleDelete = async () => {
    if (initialData?.id && onDelete) {
      if (window.confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
        setIsUploading(true);
        try {
          await onDelete(initialData.id);
          onRequestClose();
        } catch (error) {
          console.error('Delete error:', error);
          setUploadError('Failed to delete device');
        } finally {
          setIsUploading(false);
        }
      }
    }
  };

  // Cleanup PDF URL when modal closes
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      ariaHideApp={false}
      className="bg-white rounded-lg shadow-lg p-6 w-[600px] max-h-[90vh] overflow-y-auto mx-auto mt-8"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-8"
    >
      <h2 className="text-xl font-semibold mb-4">
        {initialData ? 'Edit Device' : 'Add New Device'}
      </h2>

      {/* Upload Error Display */}
      {uploadError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {uploadError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Device Name */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Device Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter device name"
              disabled={isUploading}
            />
          </div>

          {/* Model */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter model"
              disabled={isUploading}
            />
          </div>

          {/* Serial Number */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Serial Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter serial number"
              disabled={isUploading}
            />
          </div>

          {/* Manufacturer */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Manufacturer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter manufacturer"
              disabled={isUploading}
            />
          </div>

          {/* Calibration Date */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Calibration Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              selected={calibrationDate}
              onChange={(date) => setCalibrationDate(date)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dateFormat="dd-MMM-yy"
              placeholderText="Select calibration date"
              required
              disabled={isUploading}
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Due Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              selected={dueDate}
              onChange={(date) => setDueDate(date)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dateFormat="dd-MMM-yy"
              placeholderText="Select due date"
              required
              disabled={isUploading}
            />
          </div>

          {/* Device Certificate */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Device Certificate (Optional)
            </label>
            
            {/* Show existing file preview for edit mode */}
            {certificatePreview && !certificateFile && (
              <div className="mb-3">
                {certificatePreview.endsWith('.pdf') || certificatePreview.includes('pdf') ? (
                  <div className="p-4 bg-gray-100 border border-gray-300 rounded-md">
                    <p className="text-sm text-gray-600">📄 Current Certificate File</p>
                    <a 
                      href={certificatePreview} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Current Certificate →
                    </a>
                  </div>
                ) : (
                  <img 
                    src={certificatePreview} 
                    alt="Current Certificate" 
                    className="w-full h-40 object-contain rounded-md border border-gray-300"
                    onError={() => setCertificatePreview('')}
                  />
                )}
              </div>
            )}
            
            {/* New file image preview */}
            {certificatePreview && certificateFile && certificateFile.type.startsWith('image/') && (
              <div className="mb-3">
                <p className="text-xs text-green-600 mb-1">✅ New file selected:</p>
                <img 
                  src={certificatePreview} 
                  alt="Certificate Preview" 
                  className="w-full h-40 object-contain rounded-md border border-gray-300"
                  onError={() => setCertificatePreview('')}
                />
              </div>
            )}
            
            {/* PDF Preview */}
            {pdfPreviewUrl && certificateFile && certificateFile.type === 'application/pdf' && (
              <div className="mb-3">
                <p className="text-xs text-green-600 mb-1">✅ New PDF selected:</p>
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-64 border border-gray-300 rounded-md"
                  title="PDF Preview"
                />
                <p className="text-xs text-gray-500 mt-1">PDF Preview - {certificateFile.name}</p>
              </div>
            )}
            
            <div className="relative">
              <input 
                type="file" 
                accept="image/*,.pdf"
                onChange={handleCertificateChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="certificate-file"
                disabled={isUploading}
              />
              <label 
                htmlFor="certificate-file"
                className={`flex items-center justify-center w-full h-10 px-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 hover:bg-gray-50 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-sm text-gray-600">
                  {certificateFile ? `New file: ${certificateFile.name}` : 'Choose certificate file...'}
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Upload certificate photo (JPG, PNG, GIF) or PDF file
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-3 mt-6 pt-4 border-t">
          <div>
            {initialData && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isUploading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                🗑️ Delete
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onRequestClose}
              disabled={isUploading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? '⏳ Uploading...' : (initialData ? 'Update' : 'Save')}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default DeviceModal;