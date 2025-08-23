export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  unit: string; // 'kg', 'liters', 'pieces', 'boxes', etc.
  costPerUnit: number;
  supplier: string;
  lastRestocked: Date;
  expiryDate?: Date;
  barcode?: string;
  description?: string;
  location?: string; // Storage location
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  type: 'restock' | 'usage' | 'waste' | 'adjustment';
  quantity: number; // positive for add, negative for remove
  reason: string;
  staffId: string;
  timestamp: Date;
  cost?: number; // total cost for the movement
  supplier?: string; // for restock movements
  notes?: string;
}

export interface StockAlert {
  id: string;
  inventoryItemId: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringItems: number;
  totalValue: number;
  lastUpdated: Date;
}

export const calculateStockStatus = (item: InventoryItem): InventoryItem['status'] => {
  if (item.expiryDate && item.expiryDate < new Date()) {
    return 'expired';
  }
  if (item.currentStock <= 0) {
    return 'out_of_stock';
  }
  if (item.currentStock <= item.minStockLevel) {
    return 'low_stock';
  }
  return 'in_stock';
};

export const getStockAlerts = (items: InventoryItem[]): StockAlert[] => {
  const alerts: StockAlert[] = [];
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

  items.forEach(item => {
    const status = calculateStockStatus(item);
    
    // Out of stock alert
    if (status === 'out_of_stock') {
      alerts.push({
        id: `alert-${item.id}-out-of-stock`,
        inventoryItemId: item.id,
        type: 'out_of_stock',
        message: `${item.name} is out of stock`,
        severity: 'critical',
        createdAt: now,
        acknowledged: false
      });
    }
    
    // Low stock alert
    if (status === 'low_stock') {
      alerts.push({
        id: `alert-${item.id}-low-stock`,
        inventoryItemId: item.id,
        type: 'low_stock',
        message: `${item.name} is running low (${item.currentStock} ${item.unit} remaining)`,
        severity: 'high',
        createdAt: now,
        acknowledged: false
      });
    }
    
    // Expiry alerts
    if (item.expiryDate) {
      if (item.expiryDate < now) {
        alerts.push({
          id: `alert-${item.id}-expired`,
          inventoryItemId: item.id,
          type: 'expired',
          message: `${item.name} has expired`,
          severity: 'critical',
          createdAt: now,
          acknowledged: false
        });
      } else if (item.expiryDate < threeDaysFromNow) {
        alerts.push({
          id: `alert-${item.id}-expiring`,
          inventoryItemId: item.id,
          type: 'expiring_soon',
          message: `${item.name} expires on ${item.expiryDate.toLocaleDateString()}`,
          severity: 'medium',
          createdAt: now,
          acknowledged: false
        });
      }
    }
  });

  return alerts;
};

export const calculateInventoryStats = (items: InventoryItem[]): InventoryStats => {
  return {
    totalItems: items.length,
    lowStockItems: items.filter(item => calculateStockStatus(item) === 'low_stock').length,
    outOfStockItems: items.filter(item => calculateStockStatus(item) === 'out_of_stock').length,
    expiringItems: items.filter(item => {
      if (!item.expiryDate) return false;
      const threeDaysFromNow = new Date(Date.now() + (3 * 24 * 60 * 60 * 1000));
      return item.expiryDate < threeDaysFromNow;
    }).length,
    totalValue: items.reduce((total, item) => total + (item.currentStock * item.costPerUnit), 0),
    lastUpdated: new Date()
  };
};