import React, { useState, useRef } from 'react';
import { networkAdapter } from '../network/NetworkAdapter';
import { MenuItem } from '../utils/searchUtils';

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

interface CSVImportProps {
  onImportComplete?: () => void;
  onClose?: () => void;
}

interface ParsedMenuItem {
  name: string;
  size: string;
  price: number;
  rowIndex: number;
}

const CSVImport: React.FC<CSVImportProps> = ({ onImportComplete, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ParsedMenuItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const expectedHeaders = ['name', 'size', 'price'];
  const csvTemplate = 'name,size,price\nLatte,Medium,4.50\nCappuccino,Large,5.00\nEspresso,Small,2.50';

  const parseCSV = (content: string): ParsedMenuItem[] => {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) {
      throw new Error('CSV must contain at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate headers
    const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const nameIndex = headers.indexOf('name');
    const sizeIndex = headers.indexOf('size');
    const priceIndex = headers.indexOf('price');

    const items: ParsedMenuItem[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const rowNum = i + 1;

      try {
        if (values.length !== headers.length) {
          errors.push(`Row ${rowNum}: Expected ${headers.length} columns, got ${values.length}`);
          continue;
        }

        const name = values[nameIndex];
        const size = values[sizeIndex];
        const priceStr = values[priceIndex];

        // Validate data
        if (!name) {
          errors.push(`Row ${rowNum}: Name is required`);
          continue;
        }
        if (name.length > 50) {
          errors.push(`Row ${rowNum}: Name must be 50 characters or less`);
          continue;
        }
        if (!size) {
          errors.push(`Row ${rowNum}: Size is required`);
          continue;
        }

        const price = parseFloat(priceStr);
        if (isNaN(price) || price <= 0) {
          errors.push(`Row ${rowNum}: Price must be a positive number`);
          continue;
        }

        items.push({ name, size, price, rowIndex: i });
      } catch (err) {
        errors.push(`Row ${rowNum}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    if (errors.length > 0 && items.length === 0) {
      throw new Error(`No valid rows found:\n${errors.join('\n')}`);
    }

    return items;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setImportResult(null);
    setShowPreview(false);
    setPreviewData([]);

    // Read and preview the file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = parseCSV(content);
        setPreviewData(parsedData);
        setShowPreview(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
        setSelectedFile(null);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setSelectedFile(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!selectedFile || previewData.length === 0) return;

    setIsImporting(true);
    setError(null);

    try {
      const result: ImportResult = {
        imported: 0,
        skipped: 0,
        errors: []
      };

      for (const item of previewData) {
        try {
          const response = await networkAdapter.post('/menu_items', {
            name: item.name,
            size: item.size,
            price: item.price
          });

          if (response && !response.errors) {
            result.imported++;
          } else {
            result.skipped++;
            result.errors.push(`Row ${item.rowIndex + 1}: ${response.errors?.join(', ') || 'Unknown error'}`);
          }
        } catch (err: any) {
          result.skipped++;
          if (err.message.includes('duplicate') || err.message.includes('exists')) {
            result.errors.push(`Row ${item.rowIndex + 1}: Item already exists (${item.name} - ${item.size})`);
          } else {
            result.errors.push(`Row ${item.rowIndex + 1}: ${err.message || 'Failed to import'}`);
          }
        }
      }

      setImportResult(result);
      
      if (result.imported > 0 && onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'menu-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const reset = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setShowPreview(false);
    setImportResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Import Menu Items</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {!importResult && (
        <>
          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Import Instructions</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• CSV must contain columns: <code className="bg-blue-100 px-1 rounded">name</code>, <code className="bg-blue-100 px-1 rounded">size</code>, <code className="bg-blue-100 px-1 rounded">price</code></li>
              <li>• Name must be 50 characters or less</li>
              <li>• Price must be a positive number</li>
              <li>• Duplicate items will be skipped</li>
            </ul>
            <button
              onClick={downloadTemplate}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Download CSV template
            </button>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Choose CSV File
              </button>
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded whitespace-pre-line">
          {error}
        </div>
      )}

      {/* Preview */}
      {showPreview && previewData.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">
            Preview ({previewData.length} items)
          </h3>
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-700">Size</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-700">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-4">{item.name}</td>
                      <td className="py-2 px-4">{item.size}</td>
                      <td className="py-2 px-4">${item.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Import Results</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>{importResult.imported} items imported successfully</span>
            </div>
            
            {importResult.skipped > 0 && (
              <div className="flex items-center gap-2 text-yellow-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{importResult.skipped} items skipped</span>
              </div>
            )}

            {importResult.errors.length > 0 && (
              <div className="mt-4">
                <details className="cursor-pointer">
                  <summary className="text-red-600 font-medium">
                    View errors ({importResult.errors.length})
                  </summary>
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="mb-1">{error}</div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {importResult ? (
          <button
            onClick={reset}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Import Another File
          </button>
        ) : (
          <>
            <button
              onClick={reset}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isImporting}
            >
              Reset
            </button>
            <button
              onClick={handleImport}
              disabled={!showPreview || previewData.length === 0 || isImporting}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Importing...' : `Import ${previewData.length} Items`}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CSVImport;