import React, { useState, useEffect } from 'react';
import { FaTimes, FaUsers, FaTrash } from 'react-icons/fa';

interface Customer {
  customerId: string;
  companyName: string;
  address: string;
  companyNameTH?: string;
  addressTH?: string;
  contactPerson: string;
  email: string;
  phone: string;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customer: Customer) => Promise<void>;
  onDelete?: (customerId: string) => Promise<void>;
  customer?: Customer | null;
  isLoading?: boolean;
};

const CustomersModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  customer = null,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Customer>({
    customerId: "",
    companyName: "",
    address: "",
    companyNameTH: "",
    addressTH: "",
    contactPerson: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState<Partial<Customer>>({});
  const isEditMode = !!customer;

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setFormData({
          customerId: customer.customerId || "",
          companyName: customer.companyName || "",
          address: customer.address || "",
          companyNameTH: customer.companyNameTH || "",
          addressTH: customer.addressTH || "",
          contactPerson: customer.contactPerson || "",
          email: customer.email || "",
          phone: customer.phone || "",
        });
      } else {
        setFormData({
          customerId: "",
          companyName: "",
          address: "",
          companyNameTH: "",
          addressTH: "",
          contactPerson: "",
          email: "",
          phone: "",
        });
      }
      setErrors({});
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name as keyof Customer]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Customer> = {};
    if (!formData.customerId.trim()) newErrors.customerId = 'Customer ID is required';
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        await onSubmit({
          customerId: formData.customerId.trim(),
          companyName: formData.companyName.trim(),
          address: formData.address.trim(),
          companyNameTH: formData.companyNameTH?.trim(),
          addressTH: formData.addressTH?.trim(),
          contactPerson: formData.contactPerson.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        });
      } catch (error) {
        console.error('Error submitting customer:', error);
      }
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        customerId: "",
        companyName: "",
        address: "",
        companyNameTH: "",
        addressTH: "",
        contactPerson: "",
        email: "",
        phone: "",
      });
      setErrors({});
      onClose();
    }
  };

  const handleDelete = async () => {
    if (customer && onDelete && customer.customerId) {
      if (window.confirm(`Delete ${customer.companyName}?`)) {
        try {
          await onDelete(customer.customerId);
          handleClose();
        } catch (error) {
          console.error('Error deleting customer:', error);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaUsers className="text-blue-600" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {isEditMode ? 'Edit Customer' : 'Add New Customer'}
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
          <form onSubmit={handleSubmit} className="space-y-5">
           {/* Customer ID */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Customer ID *</label>
  <input
    type="text"
    name="customerId"
    value={formData.customerId}
    onChange={handleInputChange}
    disabled={isLoading}
    readOnly={isEditMode} // Lock the field in edit mode
    placeholder="Customer ID"
    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
      errors.customerId
        ? 'border-red-500 bg-red-50'
        : isEditMode
        ? 'border-gray-300 bg-gray-200 cursor-not-allowed'
        : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
    }`}
  />
  {errors.customerId && (
    <p className="mt-1.5 text-sm text-red-600 break-words">{errors.customerId}</p>
  )}
</div>
            {/* Company Name (EN) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name (EN) *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Company Name (EN)"
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.companyName ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {errors.companyName && (
                <p className="mt-1.5 text-sm text-red-600 break-words">{errors.companyName}</p>
              )}
            </div>

            {/* Company Name (TH) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name (TH)</label>
              <input
                type="text"
                name="companyNameTH"
                value={formData.companyNameTH || ''}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Company Name (TH)"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>

            {/* Address (EN) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address (EN) *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Address (EN)"
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {errors.address && (
                <p className="mt-1.5 text-sm text-red-600 break-words">{errors.address}</p>
              )}
            </div>

            {/* Address (TH) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address (TH)</label>
              <input
                type="text"
                name="addressTH"
                value={formData.addressTH || ''}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Address (TH)"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person *</label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Contact Person"
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.contactPerson ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {errors.contactPerson && (
                <p className="mt-1.5 text-sm text-red-600 break-words">{errors.contactPerson}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Email"
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600 break-words">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Phone"
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {errors.phone && (
                <p className="mt-1.5 text-sm text-red-600 break-words">{errors.phone}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-white pb-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="w-full sm:flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>

              {isEditMode && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-4 py-2.5 bg-red-500 text-white hover:bg-red-600 rounded-lg flex items-center justify-center gap-2"
                >
                  <FaTrash size={14} />
                  Delete
                </button>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:flex-1 px-4 py-2.5 bg-blue-500 text-white hover:bg-blue-600 rounded-lg flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isEditMode ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  isEditMode ? 'Update Customer' : 'Add Customer'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomersModal;