import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import type { Tool } from '../../types/tool';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { uploadService } from '../../services/uploadService';
type Props = {
  isOpen: boolean;
  onRequestClose: () => void;
  onSave: (tool: Partial<Tool>) => void;
  onDelete?: (id: number) => void;
  initialData?: Partial<Tool> | null;
};

const ToolModal: React.FC<Props> = ({ isOpen, onRequestClose, onSave, onDelete, initialData }) => {
  const [certificateNumber, setCertificateNumber] = useState('');
  const [gasName, setGasName] = useState('');
  const [gasUnit, setGasUnit] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [concentration, setConcentration] = useState<number>(0);
  const [uncertaintyPercent, setUncertaintyPercent] = useState<number>(0);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [toolImage, setToolImage] = useState<File | null>(null);
  const [showFormula, setShowFormula] = useState(false);
  const [certPreview, setCertPreview] = useState('');
  const [toolImgPreview, setToolImgPreview] = useState('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');

  // ✅ Add loading state for uploads
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCertificateNumber(initialData.certificateNumber || '');
      setGasName(initialData.gasName || '');
      setGasUnit(initialData.gasUnit || 'ppm');
      setVendorName(initialData.vendorName || '');
      setConcentration(initialData.concentration || 0);
      setUncertaintyPercent(initialData.uncertaintyPercent || 0);
      setDueDate(initialData.dueDate ? new Date(initialData.dueDate) : null);
      
      // ✅ FIXED: Set preview URLs for existing files
      if (initialData.certFile) {
        // Convert database URL to full URL for preview
        const certUrl = initialData.certFile.startsWith('/uploads/') 
          ? initialData.certFile
          : initialData.certFile;
        setCertPreview(certUrl);
      } else {
        setCertPreview('');
      }
      
      if (initialData.toolImage) {
        // Convert database URL to full URL for preview
        const imageUrl = initialData.toolImage.startsWith('/uploads/') 
          ? initialData.toolImage
          : initialData.toolImage;
        setToolImgPreview(imageUrl);
      } else {
        setToolImgPreview('');
      }
    } else {
      // Reset form for new tool
      setCertificateNumber('');
      setGasName('');
      setGasUnit('');
      setVendorName('');
      setConcentration(0);
      setUncertaintyPercent(0);
      setDueDate(null);
      setCertFile(null);
      setToolImage(null);
      setCertPreview('');
      setToolImgPreview('');
      setPdfPreviewUrl('');
    }
    setUploadError(null);
  }, [initialData]);

  const handleFilePreview = (file: File, setPreview: (preview: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCertFile(file);
    
    if (file) {
      if (file.type.startsWith('image/')) {
        handleFilePreview(file, setCertPreview);
        setPdfPreviewUrl('');
      } else if (file.type === 'application/pdf') {
        const pdfUrl = URL.createObjectURL(file);
        setPdfPreviewUrl(pdfUrl);
        setCertPreview('');
      } else {
        setCertPreview('');
        setPdfPreviewUrl('');
      }
    } else {
      setCertPreview('');
      setPdfPreviewUrl('');
    }
  };

  const handleToolImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setToolImage(file);
    if (file) {
      handleFilePreview(file, setToolImgPreview);
    }
  };

// Replace your uploadFiles function with this:
const uploadFiles = async (): Promise<{ certFileUrl?: string; toolImageUrl?: string }> => {
  const uploadResults: { certFileUrl?: string; toolImageUrl?: string } = {};

  try {
    // Upload certificate
    if (certFile) {
      const result = await uploadService.uploadCertificate(certFile);
      uploadResults.certFileUrl = result.url;
      console.log('Certificate uploaded:', result.url);
    }

    // Upload tool image
    if (toolImage) {
      const result = await uploadService.uploadToolImage(toolImage);
      uploadResults.toolImageUrl = result.url;
      console.log('Tool image uploaded:', result.url);
    }
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }

  return uploadResults;
};

  // ✅ UPDATED: Handle save with file upload
  const handleSave = async () => {
    try {
      setIsUploading(true);
      setUploadError(null);

      // Upload files first
      const uploadResults = await uploadFiles();

      const uncertaintyStandard = (concentration * uncertaintyPercent) / 100;

      const formData: Partial<Tool> = {
        ...(initialData?.id && { id: initialData.id }),
        certificateNumber,
        gasName,
        gasUnit,
        vendorName,
        concentration,
        uncertaintyPercent,
        uncertaintyStandard,
        dueDate: dueDate?.toISOString() || '',
        // ✅ Use standard Tool type fields
        certFile: uploadResults.certFileUrl || initialData?.certFile,
        toolImage: uploadResults.toolImageUrl || initialData?.toolImage,
      };

      console.log('💾 Saving tool with data:', formData);

      onSave(formData);
    } catch (error) {
      console.error('❌ Save error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = () => {
    if (initialData?.id && onDelete) {
      if (window.confirm('Are you sure you want to delete this tool? This action cannot be undone.')) {
        onDelete(initialData.id);
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
        {initialData?.id ? 'Edit Tool' : 'Add Tool'}
      </h2>

      {/* ✅ Upload Error Display */}
      {uploadError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Upload Error:</strong> {uploadError}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block font-semibold mb-1 text-gray-700">Certificate Number</label>
          <input 
            value={certificateNumber} 
            onChange={(e) => setCertificateNumber(e.target.value)} 
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            placeholder="Enter certificate number"
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1 text-gray-700">Gas Name</label>
          <input
            value={gasName}
            onChange={(e) => setGasName(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter gas name"
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1 text-gray-700">Gas Unit</label>
          <input
            value={gasUnit}
            onChange={(e) => setGasUnit(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={initialData?.id ? "e.g., ppm, ppb, %, %LEL, mg/m³" : "Enter Gas Unit"}
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1 text-gray-700">Vendor Name</label>
          <input 
            value={vendorName} 
            onChange={(e) => setVendorName(e.target.value)} 
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            placeholder="Enter vendor name"
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1 text-gray-700">Concentration</label>
          <input 
            type="number" 
            value={concentration} 
            onChange={(e) => setConcentration(Number(e.target.value))} 
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
            placeholder="Enter concentration"
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1 text-gray-700">% of Uncertainty</label>
          <input 
            type="number" 
            step="0.01"
            value={uncertaintyPercent} 
            onChange={(e) => setUncertaintyPercent(Number(e.target.value))} 
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
            placeholder="Enter uncertainty percentage"
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1 text-gray-700">Uncertainty of Standard</label>
          <div className="relative">
            <input 
              type="text"
              value={((concentration * uncertaintyPercent) / 100).toFixed(4)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md bg-blue-50 text-blue-700 font-mono cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onClick={() => setShowFormula(!showFormula)}
              readOnly
              placeholder="Calculated automatically"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          {showFormula && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-blue-800 mb-1">Formula:</p>
                  <p className="text-blue-700">
                    (Concentration × %Uncertainty) / 100
                  </p>
                  <p className="text-blue-700 mt-1">
                    ({concentration} × {uncertaintyPercent}) / 100 = <strong>{((concentration * uncertaintyPercent) / 100).toFixed(4)}</strong>
                  </p>
                </div>
                <button 
                  className="text-blue-600 hover:text-blue-800 font-semibold text-lg leading-none"
                  onClick={() => setShowFormula(false)}
                  title="Close formula"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block font-semibold mb-1 text-gray-700">Due Date</label>
          <DatePicker
            selected={dueDate}
            onChange={(date) => setDueDate(date)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            dateFormat="dd-MMM-yy"
            placeholderText="Select due date"
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1 text-gray-700">Certificate File</label>
          
          {/* ✅ IMPROVED: Show existing file preview for edit mode */}
          {certPreview && !certFile && (
            <div className="mb-3">
              {certPreview.endsWith('.pdf') || certPreview.includes('pdf') ? (
                <div className="p-4 bg-gray-100 border border-gray-300 rounded-md">
                  <p className="text-sm text-gray-600">📄 Current Certificate File</p>
                  <a 
                    href={certPreview} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Current Certificate →
                  </a>
                </div>
              ) : (
                <img 
                  src={certPreview} 
                  alt="Current Certificate" 
                  className="w-full h-40 object-contain rounded-md border border-gray-300"
                  onError={() => setCertPreview('')}
                />
              )}
            </div>
          )}
          
          {/* New file preview */}
          {certPreview && certFile && certFile.type.startsWith('image/') && (
            <div className="mb-3">
              <p className="text-xs text-green-600 mb-1">✅ New file selected:</p>
              <img 
                src={certPreview} 
                alt="Certificate Preview" 
                className="w-full h-40 object-contain rounded-md border border-gray-300"
                onError={() => setCertPreview('')}
              />
            </div>
          )}
          
          {/* PDF Preview */}
          {pdfPreviewUrl && certFile && certFile.type === 'application/pdf' && (
            <div className="mb-3">
              <p className="text-xs text-green-600 mb-1">✅ New PDF selected:</p>
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-64 border border-gray-300 rounded-md"
                title="PDF Preview"
              />
              <p className="text-xs text-gray-500 mt-1">PDF Preview - {certFile.name}</p>
            </div>
          )}
          
          {/* Other Files */}
          {certFile && !certFile.type.startsWith('image/') && certFile.type !== 'application/pdf' && (
            <div className="mb-3 p-3 bg-green-50 border border-green-300 rounded-md">
              <p className="text-sm text-green-600">✅ New file selected:</p>
              <p className="text-sm text-gray-600">📄 {certFile.name}</p>
              <p className="text-xs text-gray-500">File selected (preview not available)</p>
            </div>
          )}
          
          <div className="relative">
            <input 
              type="file" 
              accept="image/*,.pdf"
              onChange={handleCertFileChange} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="cert-file"
              disabled={isUploading}
            />
            <label 
              htmlFor="cert-file"
              className={`flex items-center justify-center w-full h-10 px-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 hover:bg-gray-50 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-sm text-gray-600">
                {certFile ? `New file: ${certFile.name}` : 'Choose new certificate file...'}
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1 text-gray-700">Tool Image</label>
          
          {/* ✅ IMPROVED: Show existing image preview for edit mode */}
          {toolImgPreview && !toolImage && (
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-1">Current Tool Image:</p>
              <img 
                src={toolImgPreview} 
                alt="Current Tool Image" 
                className="w-full h-40 object-cover rounded-md border border-gray-300"
                onError={() => setToolImgPreview('')}
              />
            </div>
          )}
          
          {/* New image preview */}
          {toolImgPreview && toolImage && (
            <div className="mb-3">
              <p className="text-xs text-green-600 mb-1">✅ New image selected:</p>
              <img 
                src={toolImgPreview} 
                alt="Tool Image Preview" 
                className="w-full h-40 object-cover rounded-md border border-gray-300" 
              />
            </div>
          )}
          
          <div className="relative">
            <input 
              type="file" 
              accept="image/*"
              onChange={handleToolImageChange} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="tool-image"
              disabled={isUploading}
            />
            <label 
              htmlFor="tool-image"
              className={`flex items-center justify-center w-full h-10 px-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 hover:bg-gray-50 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-sm text-gray-600">
                {toolImage ? `New image: ${toolImage.name}` : 'Choose new tool image...'}
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-3 mt-6 pt-4 border-t">
        <div>
          {/* Delete button - only show when editing */}
          {initialData?.id && onDelete && (
            <button 
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              title="Delete this tool"
              disabled={isUploading}
            >
              🗑️ Delete
            </button>
          )}
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={onRequestClose} 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUploading}
          >
            {isUploading ? '⏳ Uploading...' : (initialData?.id ? 'Update' : 'Save')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ToolModal;