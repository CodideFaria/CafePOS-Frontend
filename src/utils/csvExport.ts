import { InventoryItem, StockMovement, StockAlert } from '../types/inventory';
import { formatDateTime, formatDate } from './dateUtils';

export interface ExportOptions {
  includeHeaders: boolean;
  dateFormat: 'short' | 'long' | 'iso';
  filename?: string;
}

export const defaultExportOptions: ExportOptions = {
  includeHeaders: true,
  dateFormat: 'short',
  filename: 'export'
};

// CSV utilities
const escapeCSVField = (field: any): string => {
  if (field === null || field === undefined) return '';
  const stringField = String(field);
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

const formatDateForExport = (date: Date | undefined, format: ExportOptions['dateFormat']): string => {
  if (!date) return '';
  
  switch (format) {
    case 'iso':
      return date.toISOString();
    case 'long':
      return formatDateTime(date);
    case 'short':
    default:
      return formatDate(date);
  }
};

const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// Inventory export functions
export const exportInventoryToCSV = (
  items: InventoryItem[], 
  options: Partial<ExportOptions> = {}
): void => {
  const opts = { ...defaultExportOptions, ...options };
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `${opts.filename || 'inventory'}_${timestamp}.csv`;

  const headers = [
    'Item ID',
    'Name',
    'Category',
    'Current Stock',
    'Min Stock Level',
    'Max Stock Level',
    'Unit',
    'Cost Per Unit',
    'Total Value',
    'Supplier',
    'Location',
    'Status',
    'Last Restocked',
    'Expiry Date',
    'Barcode',
    'Description'
  ];

  const rows = items.map(item => [
    item.id,
    item.name,
    item.category,
    item.currentStock,
    item.minStockLevel,
    item.maxStockLevel,
    item.unit,
    item.costPerUnit.toFixed(2),
    (item.currentStock * item.costPerUnit).toFixed(2),
    item.supplier,
    item.location || '',
    item.status.replace('_', ' ').toUpperCase(),
    formatDateForExport(item.lastRestocked, opts.dateFormat),
    formatDateForExport(item.expiryDate, opts.dateFormat),
    item.barcode || '',
    item.description || ''
  ]);

  let csvContent = '';
  
  if (opts.includeHeaders) {
    csvContent += headers.map(escapeCSVField).join(',') + '\n';
  }
  
  csvContent += rows.map(row => row.map(escapeCSVField).join(',')).join('\n');

  downloadCSV(csvContent, filename);
};

export const exportLowStockToCSV = (
  items: InventoryItem[],
  options: Partial<ExportOptions> = {}
): void => {
  const lowStockItems = items.filter(item => 
    item.status === 'low_stock' || item.status === 'out_of_stock'
  );
  
  const opts = { ...defaultExportOptions, ...options };
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `${opts.filename || 'low_stock_report'}_${timestamp}.csv`;

  const headers = [
    'Item ID',
    'Name',
    'Category',
    'Current Stock',
    'Min Stock Level',
    'Units Needed',
    'Unit',
    'Cost Per Unit',
    'Reorder Cost',
    'Supplier',
    'Status',
    'Priority'
  ];

  const rows = lowStockItems.map(item => {
    const unitsNeeded = Math.max(0, item.minStockLevel - item.currentStock);
    const reorderCost = unitsNeeded * item.costPerUnit;
    const priority = item.status === 'out_of_stock' ? 'CRITICAL' : 'HIGH';
    
    return [
      item.id,
      item.name,
      item.category,
      item.currentStock,
      item.minStockLevel,
      unitsNeeded,
      item.unit,
      item.costPerUnit.toFixed(2),
      reorderCost.toFixed(2),
      item.supplier,
      item.status.replace('_', ' ').toUpperCase(),
      priority
    ];
  });

  let csvContent = '';
  
  if (opts.includeHeaders) {
    csvContent += headers.map(escapeCSVField).join(',') + '\n';
  }
  
  csvContent += rows.map(row => row.map(escapeCSVField).join(',')).join('\n');

  downloadCSV(csvContent, filename);
};

export const exportStockMovementsToCSV = (
  movements: StockMovement[],
  items: InventoryItem[],
  options: Partial<ExportOptions> = {}
): void => {
  const opts = { ...defaultExportOptions, ...options };
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `${opts.filename || 'stock_movements'}_${timestamp}.csv`;

  const headers = [
    'Movement ID',
    'Date',
    'Item ID',
    'Item Name',
    'Movement Type',
    'Quantity',
    'Unit',
    'Reason',
    'Staff ID',
    'Cost',
    'Supplier',
    'Notes'
  ];

  const rows = movements.map(movement => {
    const item = items.find(i => i.id === movement.inventoryItemId);
    
    return [
      movement.id,
      formatDateForExport(movement.timestamp, opts.dateFormat),
      movement.inventoryItemId,
      item?.name || 'Unknown Item',
      movement.type.toUpperCase(),
      movement.quantity,
      item?.unit || '',
      movement.reason,
      movement.staffId,
      movement.cost?.toFixed(2) || '',
      movement.supplier || '',
      movement.notes || ''
    ];
  });

  let csvContent = '';
  
  if (opts.includeHeaders) {
    csvContent += headers.map(escapeCSVField).join(',') + '\n';
  }
  
  csvContent += rows.map(row => row.map(escapeCSVField).join(',')).join('\n');

  downloadCSV(csvContent, filename);
};

export const exportAlertsToCSV = (
  alerts: StockAlert[],
  items: InventoryItem[],
  options: Partial<ExportOptions> = {}
): void => {
  const opts = { ...defaultExportOptions, ...options };
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `${opts.filename || 'stock_alerts'}_${timestamp}.csv`;

  const headers = [
    'Alert ID',
    'Created Date',
    'Item ID',
    'Item Name',
    'Alert Type',
    'Severity',
    'Message',
    'Acknowledged',
    'Acknowledged By',
    'Acknowledged Date'
  ];

  const rows = alerts.map(alert => {
    const item = items.find(i => i.id === alert.inventoryItemId);
    
    return [
      alert.id,
      formatDateForExport(alert.createdAt, opts.dateFormat),
      alert.inventoryItemId,
      item?.name || 'Unknown Item',
      alert.type.replace('_', ' ').toUpperCase(),
      alert.severity.toUpperCase(),
      alert.message,
      alert.acknowledged ? 'YES' : 'NO',
      alert.acknowledgedBy || '',
      formatDateForExport(alert.acknowledgedAt, opts.dateFormat)
    ];
  });

  let csvContent = '';
  
  if (opts.includeHeaders) {
    csvContent += headers.map(escapeCSVField).join(',') + '\n';
  }
  
  csvContent += rows.map(row => row.map(escapeCSVField).join(',')).join('\n');

  downloadCSV(csvContent, filename);
};

// Inventory valuation report
export const exportInventoryValuationToCSV = (
  items: InventoryItem[],
  options: Partial<ExportOptions> = {}
): void => {
  const opts = { ...defaultExportOptions, ...options };
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `${opts.filename || 'inventory_valuation'}_${timestamp}.csv`;

  // Group by category for better reporting
  const categorizedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const headers = [
    'Category',
    'Item Name',
    'Current Stock',
    'Unit',
    'Cost Per Unit',
    'Total Value',
    'Status',
    'Stock Level %'
  ];

  const rows: string[][] = [];
  let grandTotal = 0;

  Object.keys(categorizedItems).sort().forEach(category => {
    const categoryItems = categorizedItems[category];
    let categoryTotal = 0;
    
    categoryItems.forEach(item => {
      const totalValue = item.currentStock * item.costPerUnit;
      const stockPercentage = ((item.currentStock / item.maxStockLevel) * 100).toFixed(1);
      
      rows.push([
        category,
        item.name,
        item.currentStock.toString(),
        item.unit,
        item.costPerUnit.toFixed(2),
        totalValue.toFixed(2),
        item.status.replace('_', ' ').toUpperCase(),
        `${stockPercentage}%`
      ]);
      
      categoryTotal += totalValue;
    });
    
    // Add category subtotal
    rows.push([
      `${category} SUBTOTAL`,
      '',
      '',
      '',
      '',
      categoryTotal.toFixed(2),
      '',
      ''
    ]);
    
    grandTotal += categoryTotal;
  });

  // Add grand total
  rows.push([
    'GRAND TOTAL',
    '',
    '',
    '',
    '',
    grandTotal.toFixed(2),
    '',
    ''
  ]);

  let csvContent = '';
  
  if (opts.includeHeaders) {
    csvContent += headers.map(escapeCSVField).join(',') + '\n';
  }
  
  csvContent += rows.map(row => row.map(escapeCSVField).join(',')).join('\n');

  downloadCSV(csvContent, filename);
};

// Purchase order generation
export const exportPurchaseOrderToCSV = (
  items: InventoryItem[],
  supplier?: string,
  options: Partial<ExportOptions> = {}
): void => {
  let itemsToOrder = items.filter(item => 
    item.status === 'low_stock' || item.status === 'out_of_stock'
  );
  
  if (supplier) {
    itemsToOrder = itemsToOrder.filter(item => item.supplier === supplier);
  }

  const opts = { ...defaultExportOptions, ...options };
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const supplierSuffix = supplier ? `_${supplier.replace(/\s+/g, '_').toLowerCase()}` : '';
  const filename = `${opts.filename || 'purchase_order'}${supplierSuffix}_${timestamp}.csv`;

  const headers = [
    'Item Code',
    'Item Name',
    'Supplier',
    'Current Stock',
    'Min Stock Level',
    'Max Stock Level',
    'Suggested Order Qty',
    'Unit',
    'Cost Per Unit',
    'Total Cost',
    'Priority'
  ];

  const rows = itemsToOrder.map(item => {
    // Suggest ordering to max level
    const suggestedQty = item.maxStockLevel - item.currentStock;
    const totalCost = suggestedQty * item.costPerUnit;
    const priority = item.status === 'out_of_stock' ? 'URGENT' : 'NORMAL';
    
    return [
      item.id,
      item.name,
      item.supplier,
      item.currentStock,
      item.minStockLevel,
      item.maxStockLevel,
      suggestedQty,
      item.unit,
      item.costPerUnit.toFixed(2),
      totalCost.toFixed(2),
      priority
    ];
  });

  // Calculate total order value
  const totalOrderValue = rows.reduce((sum, row) => sum + parseFloat(String(row[9])), 0);

  let csvContent = '';
  
  if (opts.includeHeaders) {
    csvContent += headers.map(escapeCSVField).join(',') + '\n';
  }
  
  csvContent += rows.map(row => row.map(escapeCSVField).join(',')).join('\n');
  
  // Add summary row
  csvContent += '\n';
  csvContent += `TOTAL ORDER VALUE,,,,,,,,,€${totalOrderValue.toFixed(2)},\n`;
  csvContent += `GENERATED ON,${formatDateForExport(new Date(), opts.dateFormat)},,,,,,,,\n`;

  downloadCSV(csvContent, filename);
};