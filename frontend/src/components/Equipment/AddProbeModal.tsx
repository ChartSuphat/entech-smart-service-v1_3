import React, { useState, useEffect } from 'react';
import { FaTimes, FaFlask, FaTrash } from 'react-icons/fa';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (probeData: ProbeFormData) => void;
  isLoading?: boolean;
  editData?: EditProbeData;
  onDelete?: (id: number) => void;
}

interface ProbeFormData {
  probeDescription: string;
  probeModel: string;
  probeSN: string;
}

interface EditProbeData extends ProbeFormData {
  id: number;
}

const AddProbeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  editData,
  onDelete
}) => {
  const [formData, setFormData] = useState<ProbeFormData>({
    probeDescription: 'CATALYTIC SENSOR',
    probeModel: '',
    probeSN: ''
  });

  const [errors, setErrors] = useState<Partial<ProbeFormData>>({});
  const [selectedPreset, setSelectedPreset] = useState<string>('CATALYTIC SENSOR');

  const sensorTypes = [
    { value: 'CATALYTIC SENSOR', label: 'Catalytic Sensor', description: 'For combustible gas detection' },
    { value: 'ELECTROCHEMICAL SENSOR', label: 'Electrochemical Sensor', description: 'For toxic gas detection' },
    { value: 'INFRARED SENSOR', label: 'Infrared Sensor', description: 'For CO2 and hydrocarbon detection' },
    { value: 'ZERCONIA SENSOR', label: 'Zirconia Sensor', description: 'For oxygen concentration measurement' },
    { value: 'CUSTOM', label: 'Custom Type', description: 'Specify your own sensor type' }
  ];

  useEffect(() => {
    if (editData) {
      setFormData({
        probeDescription: editData.probeDescription,
        probeModel: editData.probeModel,
        probeSN: editData.probeSN
      });

      const isPreset = sensorTypes.some(sensor => sensor.value === editData.probeDescription);
      setSelectedPreset(isPreset ? editData.probeDescription : 'CUSTOM');
    } else {
      setFormData({
        probeDescription: 'CATALYTIC SENSOR',
        probeModel: '',
        probeSN: ''
      });
      setSelectedPreset('CATALYTIC SENSOR');
    }
    setErrors({});
  }, [editData, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'presetType') {
      setSelectedPreset(value);
      setFormData(prev => ({
        ...prev,
        probeDescription: value === 'CUSTOM' ? '' : value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (errors[name as keyof ProbeFormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProbeFormData> = {};
    if (!formData.probeDescription.trim()) newErrors.probeDescription = 'Probe description is required';
    if (!formData.probeModel.trim()) newErrors.probeModel = 'Probe model is required';
    if (!formData.probeSN.trim()) newErrors.probeSN = 'Serial number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        probeDescription: formData.probeDescription.trim(),
        probeModel: formData.probeModel.trim(),
        probeSN: formData.probeSN.trim()
      });
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        probeDescription: 'CATALYTIC SENSOR',
        probeModel: '',
        probeSN: ''
      });
      setSelectedPreset('CATALYTIC SENSOR');
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaFlask className="text-blue-600" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {editData ? 'Edit Probe' : 'Add New Probe'}
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

        <div className="p-6 space-y-5">
          {/* Sensor Type Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sensor Type *
            </label>
            <select
              name="presetType"
              value={selectedPreset}
              onChange={handleInputChange}
              disabled={isLoading}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {sensorTypes.map(sensor => (
                <option key={sensor.value} value={sensor.value}>
                  {sensor.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-gray-500">
              {sensorTypes.find(s => s.value === selectedPreset)?.description}
            </p>
          </div>

          {/* Custom Sensor Type */}
          {selectedPreset === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom Sensor Type *</label>
              <input
                type="text"
                name="probeDescription"
                value={formData.probeDescription}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="e.g., Photoionization Detector"
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.probeDescription ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                }`}
              />
              {errors.probeDescription && (
                <p className="mt-1.5 text-sm text-red-600">{errors.probeDescription}</p>
              )}
            </div>
          )}

          {/* Probe Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Probe Model *</label>
            <input
              type="text"
              name="probeModel"
              value={formData.probeModel}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="e.g., OLCT 100"
              className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.probeModel ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
              }`}
            />
            {errors.probeModel && (
              <p className="mt-1.5 text-sm text-red-600">{errors.probeModel}</p>
            )}
          </div>

          {/* Probe Serial Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number *</label>
            <input
              type="text"
              name="probeSN"
              value={formData.probeSN}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="e.g., 22113Z0-071"
              className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.probeSN ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
              }`}
            />
            {errors.probeSN && (
              <p className="mt-1.5 text-sm text-red-600">{errors.probeSN}</p>
            )}
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <strong>Standalone Probe:</strong> This probe will be created independently and can be managed separately from instruments.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>

            {editData && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete ${editData.probeModel}?`)) {
                    onDelete(editData.id);
                    handleClose();
                  }
                }}
                disabled={isLoading}
                className="px-4 py-2.5 bg-red-500 text-white hover:bg-red-600 rounded-lg flex items-center gap-2"
              >
                <FaTrash size={14} />
                Delete
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-blue-500 text-white hover:bg-blue-600 rounded-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {editData ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editData ? 'Update Probe' : 'Add Probe'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProbeModal;
