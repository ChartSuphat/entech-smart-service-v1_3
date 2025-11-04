import React, { useState } from 'react';
import { FaRegEdit, FaUsers } from "react-icons/fa";
import { BiSolidUpArrow, BiSolidDownArrow } from 'react-icons/bi';

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

type CustomerSortField = 'customerId' | 'companyName' | 'contactPerson';
type SortDirection = 'asc' | 'desc';

interface CustomerSortConfig {
  field: CustomerSortField | null;
  direction: SortDirection;
}

type Props = {
  customers: Customer[];
  onEdit?: (customer: Customer) => void;
  onDelete?: (customerId: string) => void;
  onAdd?: () => void;
  canModify?: boolean;
  isLoading?: boolean;
};

const CustomersTable: React.FC<Props> = ({
  customers,
  onEdit,
  onDelete,
  onAdd,
  canModify = false,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<CustomerSortConfig>({
    field: null,
    direction: 'asc'
  });

  // Sortable header component
  const SortableHeader: React.FC<{
    field: CustomerSortField;
    children: React.ReactNode;
    className?: string;
  }> = ({ field, children, className = "" }) => {
    const isSorted = sortConfig.field === field;
    const direction = sortConfig.direction;

    const handleSort = () => {
      let newDirection: SortDirection = 'asc';
      
      if (sortConfig.field === field && sortConfig.direction === 'asc') {
        newDirection = 'desc';
      }
      
      setSortConfig({ field, direction: newDirection });
    };

    return (
      <th 
        className={`px-4 py-3 text-left text-sm font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-600 border-r border-blue-400 ${className}`}
        onClick={handleSort}
      >
        <div className="flex items-center justify-between">
          <span>{children}</span>
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

  // Client-side sorting
  const sortCustomers = (customers: Customer[]): Customer[] => {
    if (!sortConfig.field) return customers;

    return [...customers].sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortConfig.field) {
        case 'customerId':
          aValue = a.customerId || '';
          bValue = b.customerId || '';
          break;
        case 'companyName':
          aValue = a.companyName || '';
          bValue = b.companyName || '';
          break;
        case 'contactPerson':
          aValue = a.contactPerson || '';
          bValue = b.contactPerson || '';
          break;
        default:
          return 0;
      }

      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Apply safety checks and sorting to data
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const filteredCustomers = safeCustomers.filter(
    (customer) =>
      customer.customerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const sortedCustomers = sortCustomers(filteredCustomers);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-blue-700 flex items-center gap-2">
          <FaUsers />
          Customers ({sortedCustomers.length})
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search Customer"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {canModify && (
            <button
              onClick={onAdd}
              className="bg-orange-400 text-white px-4 py-2 rounded-lg hover:bg-orange-500 transition-colors"
              disabled={isLoading}
            >
              + New Customer
            </button>
          )}
        </div>
      </div>

     {/* Table */}
<div className="bg-white rounded-lg shadow-sm border">
  {sortedCustomers.length > 0 ? (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[700px]"> {/* enforce min width for scrolling */}
        <thead className="bg-blue-500 text-white">
          <tr>
            <SortableHeader field="customerId">
              Customer ID
            </SortableHeader>
            <SortableHeader field="companyName">
              Company Name
            </SortableHeader>
            <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider border-r border-blue-400">
              Address
            </th>
            <SortableHeader field="contactPerson">
              Contact Person
            </SortableHeader>
            <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider border-r border-blue-400">
              Email
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider border-r border-blue-400">
              Phone
            </th>
            {canModify && (
              <th className="px-4 py-3 text-center text-sm font-medium uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedCustomers.map((customer, index) => (
            <tr
              key={customer.customerId}
              className={`${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              } hover:bg-blue-50 transition-colors`}
            >
              <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                {customer.customerId}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                {customer.companyName}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                {customer.address}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                {customer.contactPerson}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                {customer.email}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                {customer.phone}
              </td>
              {canModify && (
                <td className="px-4 py-3 text-center">
                  <button
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1 text-sm mx-auto"
                    onClick={() => onEdit?.(customer)}
                    title={`Edit ${customer.companyName}`}
                  >
                    <FaRegEdit className="w-4 h-4" />
                    Edit
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
          <div className="text-center py-12">
            <FaUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm ? 'No customers match your search' : 'No customers found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first customer.'}
            </p>
            {!searchTerm && onAdd && canModify && (
              <div className="mt-6">
                <button
                  onClick={onAdd}
                  className="bg-orange-400 text-white px-4 py-2 rounded-lg hover:bg-orange-500 transition-colors"
                  disabled={isLoading}
                >
                  + New Customer
                </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

export default CustomersTable;