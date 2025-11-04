import { useEffect, useState } from 'react';
import axios from 'axios';
import api from '../utils/axios';

const Printers = () => {
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    api.get('/printer/list')
      .then(res => {
        setPrinters(res.data.printers.map((p: any) => p.name));
      })
      .catch(err => {
        console.error('Failed to load printers:', err);
      });
  }, []);

const handlePrint = () => {
  api.get('/api/printer/print', {
    params: {
      printerName: selectedPrinter,
      fileName
    }
  }).then(() => {
    alert('🖨 Print started');
  }).catch(err => {
    alert('❌ Print failed');
    console.error(err);
  });
};

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🖨 Print PDF</h1>

      <div className="mb-4">
        <label className="block font-semibold">Select Printer</label>
        <select
          className="w-full p-2 border rounded"
          value={selectedPrinter}
          onChange={e => setSelectedPrinter(e.target.value)}
        >
          <option value="">-- Choose Printer --</option>
          {printers.map(printer => (
            <option key={printer} value={printer}>{printer}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block font-semibold">PDF File Name</label>
        <input
          type="text"
          placeholder="e.g. cert-0001.pdf"
          className="w-full p-2 border rounded"
          value={fileName}
          onChange={e => setFileName(e.target.value)}
        />
      </div>

      <button
        onClick={handlePrint}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Print PDF
      </button>
    </div>
  );
};

export default Printers;
