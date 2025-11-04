import React, { useState } from 'react';
import { FaFlask, FaTools } from 'react-icons/fa';
import { BiEdit } from 'react-icons/bi';

import { BiSolidUpArrow, BiSolidDownArrow } from 'react-icons/bi';

interface Equipment {
  id: string;
  instrumentDescription: 'GAS_ANALYZER' | 'GAS_DETECTOR';
  instrumentModel: string;
  instrumentSerialNo: string;
  idNoOrControlNo?: string;
  manufacturer: string;
  createdAt: string;
  updatedAt: string;
  createdById: number;
}

interface Probe {
  id: string;
  probeDescription: string;
  probeModel: string;
  probeSN: string;
  createdAt: string;
  updatedAt: string;
  createdById: number;
}

type InstrumentSortField = 'instrumentModel' | 'manufacturer' | 'instrumentSerialNo' | 'createdAt';
type ProbeSortField = 'probeDescription' | 'probeModel' | 'probeSN' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface InstrumentSortConfig {
  field: InstrumentSortField | null;
  direction: SortDirection;
}

interface ProbeSortConfig {
  field: ProbeSortField | null;
  direction: SortDirection;
}

type Props = {
  instruments: Equipment[];
  probes: Probe[];
  onEditInstrument?: (equipment: Equipment) => void; // Made optional
  onEditProbe?: (probe: Probe) => void; // Made optional
  onDeleteInstrument?: (id: string) => void;
  onDeleteProbe?: (id: string) => void;
  onAddInstrument?: () => void;
  onAddProbe?: () => void;
  canModify?: boolean; // Add permission prop
  isLoading?: boolean;
};

const EquipmentTable: React.FC<Props> = ({
  instruments,
  probes,
  onEditInstrument,
  onEditProbe,
  onDeleteInstrument,
  onDeleteProbe,
  onAddInstrument,
  onAddProbe,
  canModify = false, // Default to false
  isLoading = false
}) => {
  const [view, setView] = useState<'all' | 'instruments' | 'probes'>('all');
  const [instrumentSearchTerm, setInstrumentSearchTerm] = useState('');
  const [probeSearchTerm, setProbeSearchTerm] = useState('');
  
  // Sorting states
  const [instrumentSortConfig, setInstrumentSortConfig] = useState<InstrumentSortConfig>({
    field: null,
    direction: 'asc'
  });
  
  const [probeSortConfig, setProbeSortConfig] = useState<ProbeSortConfig>({
    field: null,
    direction: 'asc'
  });

  // Sortable header component for instruments
  const InstrumentSortableHeader: React.FC<{
    field: InstrumentSortField;
    children: React.ReactNode;
    className?: string;
  }> = ({ field, children, className = "" }) => {
    const isSorted = instrumentSortConfig.field === field;
    const direction = instrumentSortConfig.direction;

    const handleSort = () => {
      let newDirection: SortDirection = 'asc';
      
      if (instrumentSortConfig.field === field && instrumentSortConfig.direction === 'asc') {
        newDirection = 'desc';
      }
      
      setInstrumentSortConfig({ field, direction: newDirection });
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

  // Sortable header component for probes
  const ProbeSortableHeader: React.FC<{
    field: ProbeSortField;
    children: React.ReactNode;
    className?: string;
  }> = ({ field, children, className = "" }) => {
    const isSorted = probeSortConfig.field === field;
    const direction = probeSortConfig.direction;

    const handleSort = () => {
      let newDirection: SortDirection = 'asc';
      
      if (probeSortConfig.field === field && probeSortConfig.direction === 'asc') {
        newDirection = 'desc';
      }
      
      setProbeSortConfig({ field, direction: newDirection });
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

  // Client-side sorting for instruments
  const sortInstruments = (instruments: Equipment[]): Equipment[] => {
    if (!instrumentSortConfig.field) return instruments;

    return [...instruments].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (instrumentSortConfig.field) {
        case 'instrumentModel':
          aValue = a.instrumentModel || '';
          bValue = b.instrumentModel || '';
          break;
        case 'manufacturer':
          aValue = a.manufacturer || '';
          bValue = b.manufacturer || '';
          break;
        case 'instrumentSerialNo':
          aValue = a.instrumentSerialNo || '';
          bValue = b.instrumentSerialNo || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return instrumentSortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return instrumentSortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Client-side sorting for probes
  const sortProbes = (probes: Probe[]): Probe[] => {
    if (!probeSortConfig.field) return probes;

    return [...probes].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (probeSortConfig.field) {
        case 'probeDescription':
          aValue = a.probeDescription || '';
          bValue = b.probeDescription || '';
          break;
        case 'probeModel':
          aValue = a.probeModel || '';
          bValue = b.probeModel || '';
          break;
        case 'probeSN':
          aValue = a.probeSN || '';
          bValue = b.probeSN || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return probeSortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return probeSortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Apply safety checks and sorting to data
  const safeInstruments = Array.isArray(instruments) ? instruments : [];
  const filteredInstruments = safeInstruments.filter(
    (item) =>
      item.instrumentModel?.toLowerCase().includes(instrumentSearchTerm.toLowerCase()) ||
      item.instrumentSerialNo?.toLowerCase().includes(instrumentSearchTerm.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(instrumentSearchTerm.toLowerCase()) ||
      (item.idNoOrControlNo?.toLowerCase().includes(instrumentSearchTerm.toLowerCase()) ?? false)
  );
  const sortedInstruments = sortInstruments(filteredInstruments);

  const safeProbes = Array.isArray(probes) ? probes : [];
  const filteredProbes = safeProbes.filter((item) =>
    item.probeDescription?.toLowerCase().includes(probeSearchTerm.toLowerCase()) ||
    item.probeModel?.toLowerCase().includes(probeSearchTerm.toLowerCase()) ||
    item.probeSN?.toLowerCase().includes(probeSearchTerm.toLowerCase())
  );
  const sortedProbes = sortProbes(filteredProbes);

  return (
    <div className="space-y-6">
      {/* View Mode Controls */}
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          <button
            className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
              view === 'all' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
            onClick={() => setView('all')}
          >
            All Equipment
          </button>
          <button
            className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
              view === 'instruments' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
            onClick={() => setView('instruments')}
          >
            Instruments Only
          </button>
          <button
            className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
              view === 'probes' 
                ? 'bg-green-600 text-white border-green-600' 
                : 'bg-white border-green-600 text-green-600 hover:bg-green-50'
            }`}
            onClick={() => setView('probes')}
          >
            Probes Only
          </button>
        </div>
      </div>

      {/* Instruments Table */}
      {(view === 'all' || view === 'instruments') && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-blue-700 flex items-center gap-2">
                <FaTools />
                Instruments ({sortedInstruments.length})
              </h2>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search Instrument"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-50 text-sm"
                  value={instrumentSearchTerm}
                  onChange={(e) => setInstrumentSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {sortedInstruments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-500 text-white">
                  <tr>
                    <InstrumentSortableHeader field="instrumentModel">
                      Model
                    </InstrumentSortableHeader>
                    <InstrumentSortableHeader field="manufacturer">
                      Manufacturer
                    </InstrumentSortableHeader>
                    <InstrumentSortableHeader field="instrumentSerialNo">
                      Serial No.
                    </InstrumentSortableHeader>
                    <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider border-r border-blue-400">
                      Control No.
                    </th>
                    <InstrumentSortableHeader field="createdAt">
                      Created Date
                    </InstrumentSortableHeader>
                    <th className="px-4 py-3 text-center text-sm font-medium uppercase tracking-wider border-r border-blue-400">
                      Status
                    </th>
                    
                    {/* Only show Actions column if user can modify */}
                    {canModify && (
                      <th className="px-4 py-3 text-center text-sm font-medium uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedInstruments.map((item, index) => (
                    <tr 
                      key={item.id} 
                      className={`${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-blue-50 transition-colors`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                        {item.instrumentModel}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                        {item.manufacturer}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900 border-r border-gray-200">
                        {item.instrumentSerialNo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                        {item.idNoOrControlNo || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 border-r border-gray-200">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-200">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      
                      {/* Only show Actions column if user can modify */}
                      {canModify && (
                        <td className="px-4 py-3 text-center">
                          <button
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1 text-sm mx-auto"
                            onClick={() => onEditInstrument?.(item)}
                            title={`Edit ${item.instrumentModel}`}
                          >
                            <BiEdit className="w-8 h-6 hover:bg-blue-50" />
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
              <FaTools className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {instrumentSearchTerm ? 'No instruments match your search' : 'No instruments found'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {instrumentSearchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first instrument.'}
              </p>
              {!instrumentSearchTerm && onAddInstrument && canModify && (
                <div className="mt-6">
                  <button
                    onClick={onAddInstrument}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    disabled={isLoading}
                  >
                    + Add Instrument
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Probes Table */}
      {(view === 'all' || view === 'probes') && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-green-700 flex items-center gap-2">
                <FaFlask />
                Probes ({sortedProbes.length})
              </h2>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search Probe"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-50 text-sm"
                  value={probeSearchTerm}
                  onChange={(e) => setProbeSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {sortedProbes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-500 text-white">
                  <tr>
                    <ProbeSortableHeader field="probeDescription">
                      Description
                    </ProbeSortableHeader>
                    <ProbeSortableHeader field="probeModel">
                      Model
                    </ProbeSortableHeader>
                    <ProbeSortableHeader field="probeSN">
                      Serial No.
                    </ProbeSortableHeader>
                    <ProbeSortableHeader field="createdAt">
                      Created Date
                    </ProbeSortableHeader>
                    <th className="px-4 py-3 text-center text-sm font-medium uppercase tracking-wider border-r border-blue-400">
                      Status
                    </th>
                    
                    {/* Only show Actions column if user can modify */}
                    {canModify && (
                      <th className="px-4 py-3 text-center text-sm font-medium uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedProbes.map((item, index) => (
                    <tr 
                      key={item.id} 
                      className={`${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-green-50 transition-colors`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                        {item.probeDescription}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                        {item.probeModel}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900 border-r border-gray-200">
                        {item.probeSN}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 border-r border-gray-200">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-200">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      
                      {/* Only show Actions column if user can modify */}
                      {canModify && (
                        <td className="px-4 py-3 text-center">
                          <button
                            className="text-blue-600 hover:text-blue-800 hover:bg-green-50 px-2 py-1 rounded transition-colors flex items-center gap-1 text-sm mx-auto"
                            onClick={() => onEditProbe?.(item)}
                            title={`Edit ${item.probeModel}`}
                          >
                            <BiEdit className="w-8 h-6 hover:bg-green-50" />
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
              <FaFlask className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {probeSearchTerm ? 'No probes match your search' : 'No probes found'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {probeSearchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first probe.'}
              </p>
              {!probeSearchTerm && onAddProbe && canModify && (
                <div className="mt-6">
                  <button
                    onClick={onAddProbe}
                    className="bg-orange-400 text-white px-4 py-2 rounded-lg hover:bg-orange-500 transition-colors"
                    disabled={isLoading}
                  >
                    + Add Probe
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EquipmentTable;