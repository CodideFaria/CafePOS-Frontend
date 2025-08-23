import React, { useState, useMemo } from 'react';
import { InventoryItem, StockMovement, StockAlert } from '../types/inventory';
import { 
  exportInventoryToCSV, 
  exportLowStockToCSV, 
  exportStockMovementsToCSV, 
  exportAlertsToCSV,
  exportInventoryValuationToCSV,
  exportPurchaseOrderToCSV,
  ExportOptions 
} from '../utils/csvExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItems: InventoryItem[];
  stockMovements: StockMovement[];
  alerts: StockAlert[];
}

type ExportType = 
  | 'full_inventory'
  | 'low_stock_report'
  | 'stock_movements'
  | 'alerts'
  | 'valuation_report'
  | 'purchase_order';

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  inventoryItems,
  stockMovements,
  alerts
}) => {
  const [exportType, setExportType] = useState<ExportType>('full_inventory');
  const [options, setOptions] = useState<ExportOptions>({
    includeHeaders: true,
    dateFormat: 'short',
    filename: ''
  });
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [isExporting, setIsExporting] = useState(false);

  const suppliers = useMemo(() => {
    const uniqueSuppliers = Array.from(new Set(inventoryItems.map(item => item.supplier)));
    return uniqueSuppliers.sort();
  }, [inventoryItems]);

  const filteredMovements = useMemo(() => {
    let filtered = stockMovements;
    
    if (dateRange.startDate) {
      const startDate = new Date(dateRange.startDate);
      filtered = filtered.filter(movement => movement.timestamp >= startDate);
    }
    
    if (dateRange.endDate) {
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(movement => movement.timestamp <= endDate);
    }
    
    return filtered;
  }, [stockMovements, dateRange]);

  const getExportTypeInfo = (type: ExportType) => {
    switch (type) {
      case 'full_inventory':
        return {
          title: 'Full Inventory Export',
          description: 'Complete inventory list with all items, stock levels, and details',
          icon: '📦',
          recordCount: inventoryItems.length
        };
      case 'low_stock_report':
        return {
          title: 'Low Stock Report',
          description: 'Items that are low or out of stock requiring immediate attention',
          icon: '⚠️',
          recordCount: inventoryItems.filter(item => 
            item.status === 'low_stock' || item.status === 'out_of_stock'
          ).length
        };
      case 'stock_movements':
        return {
          title: 'Stock Movements',
          description: 'Historical record of all inventory movements and transactions',
          icon: '📋',
          recordCount: filteredMovements.length
        };
      case 'alerts':
        return {
          title: 'Stock Alerts',
          description: 'All current and historical alerts with acknowledgment status',
          icon: '🚨',
          recordCount: alerts.length
        };
      case 'valuation_report':
        return {
          title: 'Inventory Valuation',
          description: 'Financial valuation report organized by category with totals',
          icon: '💰',
          recordCount: inventoryItems.length
        };
      case 'purchase_order':
        return {
          title: 'Purchase Order',
          description: 'Suggested purchase order for items needing restocking',
          icon: '🛒',
          recordCount: inventoryItems.filter(item => 
            item.status === 'low_stock' || item.status === 'out_of_stock'
          ).length
        };
      default:
        return {
          title: 'Export',
          description: '',
          icon: '📄',
          recordCount: 0
        };
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const exportOptions = {
        ...options,
        filename: options.filename || getDefaultFilename(exportType)
      };

      switch (exportType) {
        case 'full_inventory':
          exportInventoryToCSV(inventoryItems, exportOptions);
          break;
        case 'low_stock_report':
          exportLowStockToCSV(inventoryItems, exportOptions);
          break;
        case 'stock_movements':
          exportStockMovementsToCSV(filteredMovements, inventoryItems, exportOptions);
          break;
        case 'alerts':
          exportAlertsToCSV(alerts, inventoryItems, exportOptions);
          break;
        case 'valuation_report':
          exportInventoryValuationToCSV(inventoryItems, exportOptions);
          break;
        case 'purchase_order':
          exportPurchaseOrderToCSV(inventoryItems, selectedSupplier || undefined, exportOptions);
          break;
      }
      
      // Close modal after successful export
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  const getDefaultFilename = (type: ExportType): string => {
    switch (type) {
      case 'full_inventory': return 'inventory_complete';
      case 'low_stock_report': return 'low_stock_report';
      case 'stock_movements': return 'stock_movements';
      case 'alerts': return 'stock_alerts';
      case 'valuation_report': return 'inventory_valuation';
      case 'purchase_order': return 'purchase_order';
      default: return 'export';
    }
  };

  if (!isOpen) return null;

  const typeInfo = getExportTypeInfo(exportType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-full overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Export Data to CSV</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
            aria-label="Close export modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {([
                'full_inventory',
                'low_stock_report',
                'stock_movements',
                'alerts',
                'valuation_report',
                'purchase_order'
              ] as ExportType[]).map((type) => {
                const info = getExportTypeInfo(type);
                return (
                  <button
                    key={type}
                    onClick={() => setExportType(type)}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      exportType === type
                        ? 'border-orange-500 bg-orange-50 text-orange-900'
                        : 'border-gray-300 hover:border-gray-400 text-gray-700'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{info.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium">{info.title}</div>
                        <div className="text-sm text-gray-600 mt-1">{info.description}</div>
                        <div className="text-xs text-gray-500 mt-2">
                          {info.recordCount} record{info.recordCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Export Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{typeInfo.icon}</span>
              <div>
                <h3 className="font-medium text-gray-900">{typeInfo.title}</h3>
                <p className="text-sm text-gray-600">{typeInfo.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Will export {typeInfo.recordCount} record{typeInfo.recordCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Export Options</h3>
            
            {/* Filename */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filename (optional)
              </label>
              <input
                type="text"
                value={options.filename}
                onChange={(e) => setOptions(prev => ({ ...prev, filename: e.target.value }))}
                placeholder={getDefaultFilename(exportType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to use default filename with timestamp
              </p>
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Format
              </label>
              <select
                value={options.dateFormat}
                onChange={(e) => setOptions(prev => ({ 
                  ...prev, 
                  dateFormat: e.target.value as ExportOptions['dateFormat']
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="short">Short (Jan 15, 2024)</option>
                <option value="long">Long (Jan 15, 2024 2:30 PM)</option>
                <option value="iso">ISO (2024-01-15T14:30:00.000Z)</option>
              </select>
            </div>

            {/* Include Headers */}
            <div className="flex items-center">
              <input
                id="include-headers"
                type="checkbox"
                checked={options.includeHeaders}
                onChange={(e) => setOptions(prev => ({ ...prev, includeHeaders: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="include-headers" className="text-sm text-gray-700">
                Include column headers in export
              </label>
            </div>

            {/* Supplier Filter for Purchase Orders */}
            {exportType === 'purchase_order' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Supplier (optional)
                </label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">All Suppliers</option>
                  {suppliers.map(supplier => (
                    <option key={supplier} value={supplier}>{supplier}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range for Movements */}
            {exportType === 'stock_movements' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date (optional)
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isExporting}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || typeInfo.recordCount === 0}
              className={`px-6 py-2 rounded-md transition-colors ${
                isExporting || typeInfo.recordCount === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {isExporting ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Exporting...</span>
                </div>
              ) : (
                `📁 Export ${typeInfo.recordCount} Record${typeInfo.recordCount !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;