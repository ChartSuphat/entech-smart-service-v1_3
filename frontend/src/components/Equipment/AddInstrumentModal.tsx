import React, { useState, useEffect } from 'react';
import { FaTimes, FaCog, FaTrash } from 'react-icons/fa';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (instrumentData: InstrumentFormData) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
  editData?: Equipment | null;
}

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

interface InstrumentFormData {
  instrumentDescription: 'GAS_DETECTOR' | 'GAS_ANALYZER';
  instrumentModel: string;
  instrumentSerialNo: string;
  idNoOrControlNo?: string;
  manufacturer: string;
}

const AddInstrumentModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onDelete,
  isLoading = false,
  editData = null
}) => {
  const [formData, setFormData] = useState<InstrumentFormData>({
    instrumentDescription: 'GAS_DETECTOR',
    instrumentModel: '',
    instrumentSerialNo: '',
    idNoOrControlNo: '',
    manufacturer: ''
  });

  const [errors, setErrors] = useState<Partial<InstrumentFormData>>({});

  // Populate form when editing
  useEffect(() => {
    if (editData) {
      setFormData({
        instrumentDescription: editData.instrumentDescription,
        instrumentModel: editData.instrumentModel,
        instrumentSerialNo: editData.instrumentSerialNo,
        idNoOrControlNo: editData.idNoOrControlNo || '',
        manufacturer: editData.manufacturer
      });
    } else {
      setFormData({
        instrumentDescription: 'GAS_DETECTOR',
        instrumentModel: '',
        instrumentSerialNo: '',
        idNoOrControlNo: '',
        manufacturer: ''
      });
    }
    setErrors({});
  }, [editData, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof InstrumentFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<InstrumentFormData> = {};

    if (!formData.instrumentModel.trim()) {
      newErrors.instrumentModel = 'Instrument model is required';
    }
    if (!formData.instrumentSerialNo.trim()) {
      newErrors.instrumentSerialNo = 'Serial number is required';
    }
    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        ...formData,
        idNoOrControlNo: formData.idNoOrControlNo?.trim() || undefined
      });
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        instrumentDescription: 'GAS_DETECTOR',
        instrumentModel: '',
        instrumentSerialNo: '',
        idNoOrControlNo: '',
        manufacturer: ''
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FaCog className="text-orange-600" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {editData ? 'Edit Instrument' : 'Add New Instrument'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Instrument Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instrument Type *
            </label>
            <select
              name="instrumentDescription"
              value={formData.instrumentDescription}
              onChange={handleInputChange}
              disabled={isLoading}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-colors"
            >
              <option value="GAS_DETECTOR">Gas Detector</option>
              <option value="GAS_ANALYZER">Gas Analyzer</option>
            </select>
          </div>

          {/* Instrument Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instrument Model *
            </label>
            <input
              type="text"
              name="instrumentModel"
              value={formData.instrumentModel}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="e.g., MX43, GX-2009"
              className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                errors.instrumentModel 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300 bg-white'
              }`}
            />
            {errors.instrumentModel && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                {errors.instrumentModel}
              </p>
            )}
          </div>

          {/* Serial Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Serial Number *
            </label>
            <input
              type="text"
              name="instrumentSerialNo"
              value={formData.instrumentSerialNo}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="e.g., 22124ZA-016"
              className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                errors.instrumentSerialNo 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300 bg-white'
              }`}
            />
            {errors.instrumentSerialNo && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                {errors.instrumentSerialNo}
              </p>
            )}
          </div>

          {/* ID/Control Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID No. or Control No.
              <span className="text-gray-400 font-normal ml-1">(Optional)</span>
            </label>
            <input
              type="text"
              name="idNoOrControlNo"
              value={formData.idNoOrControlNo}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="e.g., #01-H2-Detector"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-colors"
            />
          </div>

          {/* Manufacturer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manufacturer *
            </label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="e.g., Oldham Co.,Ltd., Riken Keiki"
              className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                errors.manufacturer 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300 bg-white'
              }`}
            />
            {errors.manufacturer && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                {errors.manufacturer}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            
            {/* Delete Button - Only show when editing */}
            {editData && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete ${editData.instrumentModel}?`)) {
                    onDelete(editData.id);
                    handleClose();
                  }
                }}
                disabled={isLoading}
                className="px-4 py-2.5 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                <FaTrash size={14} />
                Delete
              </button>
            )}
            
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-orange-500 text-white hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {editData ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editData ? 'Update Instrument' : 'Add Instrument'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddInstrumentModal;