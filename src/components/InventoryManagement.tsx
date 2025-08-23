import React, { useState, useMemo, useCallback } from 'react';
import { InventoryItem, StockMovement, StockAlert, calculateStockStatus, getStockAlerts, calculateInventoryStats } from '../types/inventory';
import { formatDateTime, formatDate } from '../utils/dateUtils';
import ExportModal from './ExportModal';
import { useAuth } from '../contexts/AuthContext';

interface InventoryManagementProps {
  onClose: () => void;
}

const InventoryManagement: React.FC<InventoryManagementProps> = ({ onClose }) => {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'alerts' | 'movements'>('overview');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    {
      id: 'inv-001',
      name: 'Coffee Beans (Arabica)',
      category: 'Coffee',
      currentStock: 5,
      minStockLevel: 10,
      maxStockLevel: 50,
      unit: 'kg',
      costPerUnit: 25.00,
      supplier: 'Premium Coffee Co.',
      lastRestocked: new Date(2024, 0, 15),
      expiryDate: new Date(2024, 5, 15),
      status: 'low_stock',
      location: 'Storage A1'
    },
    {
      id: 'inv-002',
      name: 'Milk',
      category: 'Dairy',
      currentStock: 0,
      minStockLevel: 5,
      maxStockLevel: 20,
      unit: 'liters',
      costPerUnit: 3.50,
      supplier: 'Fresh Dairy Ltd.',
      lastRestocked: new Date(2024, 0, 10),
      expiryDate: new Date(2024, 0, 25),
      status: 'out_of_stock',
      location: 'Refrigerator'
    },
    {
      id: 'inv-003',
      name: 'Sugar',
      category: 'Sweeteners',
      currentStock: 15,
      minStockLevel: 5,
      maxStockLevel: 25,
      unit: 'kg',
      costPerUnit: 2.00,
      supplier: 'Sweet Supply Co.',
      lastRestocked: new Date(2024, 0, 20),
      status: 'in_stock',
      location: 'Pantry B2'
    }
  ]);
  
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([
    {
      id: 'mov-001',
      inventoryItemId: 'inv-001',
      type: 'usage',
      quantity: -2,
      reason: 'Daily coffee preparation',
      staffId: 'staff-001',
      timestamp: new Date(),
      notes: 'Morning shift usage'
    },
    {
      id: 'mov-002',
      inventoryItemId: 'inv-002',
      type: 'usage',
      quantity: -3,
      reason: 'Latte and cappuccino orders',
      staffId: 'staff-002',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      notes: 'High demand during lunch'
    }
  ]);

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showStockMovement, setShowStockMovement] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Update item status when data changes
  const updatedItems = useMemo(() => {
    return inventoryItems.map(item => ({
      ...item,
      status: calculateStockStatus(item)
    }));
  }, [inventoryItems]);

  const alerts = useMemo(() => getStockAlerts(updatedItems), [updatedItems]);
  const stats = useMemo(() => calculateInventoryStats(updatedItems), [updatedItems]);

  const filteredItems = useMemo(() => {
    let filtered = updatedItems;
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(item => item.status === filter);
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [updatedItems, filter, searchQuery]);

  const handleAddStockMovement = useCallback((itemId: string, movement: Omit<StockMovement, 'id' | 'inventoryItemId' | 'timestamp'>) => {
    const newMovement: StockMovement = {
      ...movement,
      id: `mov-${Date.now()}`,
      inventoryItemId: itemId,
      timestamp: new Date()
    };

    setStockMovements(prev => [newMovement, ...prev]);
    
    // Update inventory item stock
    setInventoryItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, currentStock: Math.max(0, item.currentStock + movement.quantity) }
        : item
    ));
  }, []);

  const getStatusColor = (status: InventoryItem['status']) => {
    switch (status) {
      case 'in_stock': return 'text-green-600 bg-green-100';
      case 'low_stock': return 'text-yellow-600 bg-yellow-100';
      case 'out_of_stock': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertColor = (severity: StockAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-300';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-full max-h-full overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
          <div className="flex items-center space-x-3">
            {hasPermission('inventory.export') && (
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
              aria-label="Close inventory management"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'items', name: 'Items', icon: '📦' },
              { id: 'alerts', name: 'Alerts', icon: '⚠️', badge: alerts.length },
              { id: 'movements', name: 'Movements', icon: '📋' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.name}
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600">Total Items</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.totalItems}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-yellow-600">Low Stock</p>
                      <p className="text-2xl font-bold text-yellow-900">{stats.lowStockItems}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-red-600">Out of Stock</p>
                      <p className="text-2xl font-bold text-red-900">{stats.outOfStockItems}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600">Total Value</p>
                      <p className="text-2xl font-bold text-green-900">${stats.totalValue.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Critical Alerts */}
              {alerts.filter(alert => alert.severity === 'critical').length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-red-800">🚨 Critical Alerts</h3>
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                    >
                      Export All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {alerts
                      .filter(alert => alert.severity === 'critical')
                      .slice(0, 5)
                      .map(alert => (
                        <div key={alert.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                          <span className="text-red-700">{alert.message}</span>
                          <span className="text-xs text-red-500">{formatDateTime(alert.createdAt)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Recent Items */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Items Requiring Attention</h3>
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    Export Report
                  </button>
                </div>
                <div className="divide-y">
                  {updatedItems
                    .filter(item => item.status !== 'in_stock')
                    .slice(0, 5)
                    .map(item => (
                      <div key={item.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            item.status === 'out_of_stock' ? 'bg-red-500' :
                            item.status === 'low_stock' ? 'bg-yellow-500' :
                            item.status === 'expired' ? 'bg-purple-500' : 'bg-gray-500'
                          }`}></div>
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">{item.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{item.currentStock} {item.unit}</p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                            {item.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Items Tab */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Items</option>
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                {hasPermission('inventory.edit') && (
                  <button
                    onClick={() => setShowAddItem(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    + Add Item
                  </button>
                )}
              </div>

              {/* Items Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500">{item.supplier}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.currentStock} / {item.maxStockLevel} {item.unit}
                            </div>
                            <div className="text-xs text-gray-500">
                              Min: {item.minStockLevel} {item.unit}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                              {item.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${(item.currentStock * item.costPerUnit).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="text-orange-600 hover:text-orange-900 mr-3"
                            >
                              View
                            </button>
                            {hasPermission('inventory.adjust_stock') && (
                              <button
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowStockMovement(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Adjust Stock
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No alerts at this time</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div key={alert.id} className={`border rounded-lg p-4 ${getAlertColor(alert.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium capitalize">{alert.type.replace('_', ' ')}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              alert.severity === 'critical' ? 'bg-red-200 text-red-800' :
                              alert.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                              alert.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-blue-200 text-blue-800'
                            }`}>
                              {alert.severity}
                            </span>
                          </div>
                          <p className="mt-1">{alert.message}</p>
                          <p className="text-xs mt-2">Created: {formatDateTime(alert.createdAt)}</p>
                        </div>
                        <button
                          className="ml-4 px-3 py-1 text-xs bg-white bg-opacity-80 rounded hover:bg-opacity-100 transition-colors"
                          onClick={() => {
                            // Handle acknowledge alert
                          }}
                        >
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Movements Tab */}
          {activeTab === 'movements' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stockMovements.map((movement) => {
                        const item = inventoryItems.find(i => i.id === movement.inventoryItemId);
                        return (
                          <tr key={movement.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDateTime(movement.timestamp)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item?.name || 'Unknown Item'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                movement.type === 'restock' ? 'bg-green-100 text-green-800' :
                                movement.type === 'usage' ? 'bg-blue-100 text-blue-800' :
                                movement.type === 'waste' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {movement.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                                {movement.quantity > 0 ? '+' : ''}{movement.quantity} {item?.unit}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {movement.reason}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {movement.staffId}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          inventoryItems={updatedItems}
          stockMovements={stockMovements}
          alerts={alerts}
        />
      </div>
    </div>
  );
};

export default InventoryManagement;