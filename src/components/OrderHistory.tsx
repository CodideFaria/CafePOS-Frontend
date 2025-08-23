import React, { useState, useMemo, useCallback } from 'react';
import { Order, canReprintOrder, getReprintTimeRemaining } from '../types/order';
import { formatTime } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';

interface OrderHistoryProps {
  orders: Order[];
  onReprintReceipt: (order: Order) => void;
  onClose: () => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ 
  orders, 
  onReprintReceipt, 
  onClose 
}) => {
  const { hasPermission } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const sortedOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50); // Show last 50 orders
  }, [orders]);

  const handleReprintClick = useCallback((order: Order) => {
    if (canReprintOrder(order)) {
      onReprintReceipt(order);
    }
  }, [onReprintReceipt]);

  const formatOrderTime = useCallback((timestamp: Date) => {
    return formatTime(timestamp);
  }, []);

  const getOrderTotal = useCallback((order: Order) => {
    return order.total.toFixed(2);
  }, []);

  const getItemCount = useCallback((order: Order) => {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }, []);

  if (selectedOrder) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-full overflow-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Order Details</h2>
            <button
              onClick={() => setSelectedOrder(null)}
              className="text-gray-500 hover:text-gray-700 p-1"
              aria-label="Close details"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Order Details */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Order ID:</span> {selectedOrder.id}
              </div>
              <div>
                <span className="font-medium">Time:</span> {formatOrderTime(selectedOrder.timestamp)}
              </div>
              <div>
                <span className="font-medium">Payment:</span> {selectedOrder.paymentMethod}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                  selectedOrder.status === 'refunded' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedOrder.status}
                </span>
              </div>
              {selectedOrder.staffId && (
                <div>
                  <span className="font-medium">Staff ID:</span> {selectedOrder.staffId}
                </div>
              )}
              <div>
                <span className="font-medium">Reprints:</span> {selectedOrder.reprintCount}
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="font-medium mb-2">Order Items</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 grid grid-cols-12 gap-2 text-sm font-medium">
                  <div className="col-span-6">Item</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="px-4 py-2 border-t grid grid-cols-12 gap-2 text-sm">
                    <div className="col-span-6">
                      <div className="font-medium">{item.product.name}</div>
                      {item.product.size !== 'Regular' && (
                        <div className="text-gray-500 text-xs">{item.product.size}</div>
                      )}
                      {item.notes && (
                        <div className="text-blue-600 text-xs italic">Note: {item.notes}</div>
                      )}
                    </div>
                    <div className="col-span-2 text-center">{item.quantity}</div>
                    <div className="col-span-2 text-right">${item.product.price.toFixed(2)}</div>
                    <div className="col-span-2 text-right">${(item.quantity * item.product.price).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Totals */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              {selectedOrder.discount && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    Discount ({selectedOrder.discount.type === 'percentage' ? `${selectedOrder.discount.value}%` : `$${selectedOrder.discount.value}`}):
                    <div className="text-xs text-gray-500">{selectedOrder.discount.reason}</div>
                  </span>
                  <span>-${selectedOrder.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>${selectedOrder.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>TOTAL:</span>
                <span>${selectedOrder.total.toFixed(2)}</span>
              </div>
              {selectedOrder.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Cash Received:</span>
                    <span>${selectedOrder.cashReceived.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Change:</span>
                    <span>${selectedOrder.change.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Reprint Section */}
            <div className="pt-4 border-t">
              {canReprintOrder(selectedOrder) && hasPermission('receipts.reprint') ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Reprint available for {getReprintTimeRemaining(selectedOrder).toFixed(1)} more minutes
                    </span>
                    <button
                      onClick={() => handleReprintClick(selectedOrder)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Reprint Receipt
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-gray-500 text-sm">
                    {!hasPermission('receipts.reprint') 
                      ? 'Insufficient permissions to reprint receipts'
                      : 'Reprint window has expired (5 minutes after order)'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-full overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Order History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
            aria-label="Close order history"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Orders List */}
        <div className="p-6">
          {sortedOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No orders found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedOrders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Order Info */}
                    <div className="col-span-3">
                      <div className="font-medium text-sm">{formatOrderTime(order.timestamp)}</div>
                      <div className="text-xs text-gray-500">#{order.id.slice(-8)}</div>
                    </div>
                    
                    {/* Items Count */}
                    <div className="col-span-2 text-sm">
                      {getItemCount(order)} item{getItemCount(order) !== 1 ? 's' : ''}
                    </div>
                    
                    {/* Payment Method */}
                    <div className="col-span-2 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {order.paymentMethod}
                      </span>
                    </div>
                    
                    {/* Total */}
                    <div className="col-span-2 text-sm font-medium">
                      ${getOrderTotal(order)}
                    </div>
                    
                    {/* Status & Actions */}
                    <div className="col-span-3 flex items-center justify-between">
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'refunded' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          Details
                        </button>
                        
                        {canReprintOrder(order) && hasPermission('receipts.reprint') && (
                          <button
                            onClick={() => handleReprintClick(order)}
                            className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                            title={`${getReprintTimeRemaining(order).toFixed(1)} minutes remaining`}
                          >
                            Reprint
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;