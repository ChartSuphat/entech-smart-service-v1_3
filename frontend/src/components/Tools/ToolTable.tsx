import React, { useState } from 'react';
import { FaRegEdit } from "react-icons/fa";
import { HiOutlineDocumentText } from 'react-icons/hi';
import { ImFilePicture } from 'react-icons/im';
import { BiSolidUpArrow, BiSolidDownArrow } from 'react-icons/bi';

// Format date function
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Tool interface (replacing the import)
interface Tool {
  id: number;
  certificateNumber: string;
  gasName: string;
  gasUnit: string;
  vendorName: string;
  concentration: number;
  uncertaintyPercent: number;
  dueDate: string;
  toolImage?: string;
  certFile?: string;
  [key: string]: any; // Allow additional properties
}

type Props = {
  tools: Tool[];
  onEdit?: (tool: Tool) => void; // Made optional
  canModify?: boolean; // Add permission prop
};

const ToolTable: React.FC<Props> = ({ tools, onEdit, canModify = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'gasName' | 'certificateNumber' | 'vendorName' | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Add debugging and safety check
  console.log('ToolTable received tools:', tools, 'Type:', typeof tools, 'IsArray:', Array.isArray(tools));

  // Ensure tools is always an array
  const safeTools = Array.isArray(tools) ? tools : [];

  const filtered = safeTools.filter((tool) =>
    tool.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.gasName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.gasUnit?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const valA = a[sortKey] || '';
    const valB = b[sortKey] || '';
    return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  const handleSort = (key: 'gasName' | 'certificateNumber' | 'vendorName') => {
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

  // Updated sort icon to match EquipmentTable style
  const getSortIcon = (key: 'gasName' | 'certificateNumber' | 'vendorName') => {
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

  // Improved file detection and debugging
  const handleFileView = (fileUrl: string | undefined, fileName: string | undefined) => {
    console.log('Debug file view:', { fileUrl, fileName });
    
    if (!fileUrl || !fileName) {
      alert('No file available');
      return;
    }

    // Improved: Check if URL starts with /uploads/ (our fixed format)
    const isValidUrl = fileUrl.startsWith('/uploads/') || 
                      fileUrl.startsWith('blob:') || 
                      fileUrl.startsWith('http://') || 
                      fileUrl.startsWith('https://');

    if (!isValidUrl) {
      alert(`File "${fileName}" is not available for preview. This file was uploaded before the file server was set up. Please edit this tool and re-upload the file.`);
      return;
    }
    
    // Critical: Construct the correct URL for your backend
    let fullUrl = fileUrl;

    if (fileUrl.startsWith('/uploads/')) {
      // Your backend is running on port 5000, not 3001
      fullUrl = `https://entech-online.com${fileUrl}`;
    }
    
    console.log('Opening file at:', fullUrl);
    window.open(fullUrl, '_blank');
  };

  const today = new Date();

  return (
    <div>
      {/* Updated search box with your requested placeholder */}
      <input
        type="text"
        placeholder="Cert No. or Gas Name"
        className="border mb-4 px-3 py-2 w-64 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Updated table with column separators */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-blue-500 text-white">
            <tr>
              {/* Cert No - Sortable */}
              <th className="px-4 py-3 text-left font-medium border-r border-blue-400">
                <button
                  onClick={() => handleSort('certificateNumber')}
                  className="flex items-center justify-between hover:text-blue-200 w-full"
                >
                  <span>Cert No.</span>
                  {getSortIcon('certificateNumber')}
                </button>
              </th>

              {/* Gas Name - Sortable */}
              <th className="px-4 py-3 text-left font-medium border-r border-blue-400">
                <button
                  onClick={() => handleSort('gasName')}
                  className="flex items-center justify-between hover:text-blue-200 w-full"
                >
                  <span>Gas Name</span>
                  {getSortIcon('gasName')}
                </button>
              </th>

              {/* Vendor - Sortable */}
              <th className="px-4 py-3 text-left font-medium border-r border-blue-400">
                <button
                  onClick={() => handleSort('vendorName')}
                  className="flex items-center justify-between hover:text-blue-200 w-full"
                >
                  <span>Vendor</span>
                  {getSortIcon('vendorName')}
                </button>
              </th>

              {/* Non-sortable columns */}
              <th className="px-4 py-3 text-left font-medium border-r border-blue-400">Concentration</th>
              <th className="px-4 py-3 text-left font-medium border-r border-blue-400">Gas Unit</th>
              <th className="px-4 py-3 text-left font-medium border-r border-blue-400">Uncertainty %</th>
              <th className="px-4 py-3 text-left font-medium border-r border-blue-400">Uncertainty of Standard</th>
              <th className="px-4 py-3 text-left font-medium border-r border-blue-400">Due Date</th>
              <th className="px-4 py-3 text-center font-medium border-r border-blue-400">Tool Image</th>
              <th className="px-4 py-3 text-center font-medium border-r border-blue-400">Cert File</th>
              <th className="px-4 py-3 text-center font-medium border-r border-blue-400">Status</th>
              
              {/* Only show Action column if user can modify */}
              {canModify && (
                <th className="px-4 py-3 text-center font-medium">Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((tool, index) => {
              const isExpired = new Date(tool.dueDate) < today;
              const statusColor = isExpired ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700';
              const ucc = ((tool.concentration * tool.uncertaintyPercent) / 100).toFixed(3);

              // Alternating row colors
              const rowBgColor = index % 2 === 0 ? 'bg-white' : 'bg-gray-100';

              return (
                <tr key={tool.id} className={`border-b hover:bg-blue-50 ${rowBgColor}`}>
                  <td className="px-4 py-3 border-r border-gray-200">{tool.certificateNumber}</td>
                  <td className="px-4 py-3 border-r border-gray-200">{tool.gasName}</td>
                  <td className="px-4 py-3 border-r border-gray-200">{tool.vendorName}</td>
                  <td className="px-4 py-3 border-r border-gray-200">{Number(tool.concentration).toFixed(3)}</td>
                  <td className="px-4 py-3 border-r border-gray-200">{tool.gasUnit || 'ppm'}</td>
                  <td className="px-4 py-3 border-r border-gray-200">{tool.uncertaintyPercent}</td>
                  <td className="px-4 py-3 cursor-help text-blue-700 border-r border-gray-200" title="(Concentration × %Uncertainty) / 100">
                    {ucc}
                  </td>
                  <td className="px-4 py-3 border-r border-gray-200">{formatDate(tool.dueDate)}</td>
                  
                  {/* Tool Image with ImFilePicture icon */}
                  <td className="px-4 py-3 text-center border-r border-gray-200">
                    {tool.toolImage ? (
                      <button
                        onClick={() => handleFileView(tool.toolImage, 'Tool Image')}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer p-1 rounded hover:bg-blue-100 flex items-center justify-center mx-auto"
                        title={`View tool image: ${tool.toolImage}`}
                      >
                        <ImFilePicture className="w-6 h-6" />
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  
                  {/* Certificate File with HiOutlineDocumentText icon */}
                  <td className="px-4 py-3 text-center border-r border-gray-200">
                    {tool.certFile ? (
                      <button
                        onClick={() => handleFileView(tool.certFile, 'Certificate')}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer p-1 rounded hover:bg-blue-100 flex items-center justify-center mx-auto"
                        title={`View certificate: ${tool.certFile}`}
                      >
                        <HiOutlineDocumentText className="w-6 h-6" />
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3 text-center border-r border-gray-200">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                      {isExpired ? 'Expired' : 'Valid'}
                    </span>
                  </td>
                  
                  {/* Only show Action column if user can modify */}
                  {canModify && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onEdit?.(tool)}
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        title={`Edit ${tool.gasName}`}
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
            {searchTerm ? 'No tools found matching your search criteria.' : 'No tools found.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolTable;