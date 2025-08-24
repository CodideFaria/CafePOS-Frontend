import React, { useState } from 'react';
import ReceiptPreview from './ReceiptPreview';
import { CartItem, Discount, calculateCartTotals } from '../types/cart';

interface ReceiptProps {
  items: CartItem[];
  cash: number;
  total: number;
  change: number;
  discount?: Discount | null;
  paymentMethod?: 'cash' | 'card';
  orderId?: string;
  isReprint?: boolean;
  onProceed: () => void;
  onClose: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ 
  items, 
  cash, 
  total, 
  change, 
  discount,
  paymentMethod = 'cash',
  orderId,
  isReprint = false,
  onProceed, 
  onClose 
}) => {
  const [showPreview, setShowPreview] = useState(false);
  
  const totals = calculateCartTotals(items, discount);
  const receiptNo = orderId || `CAFE-${Date.now()}`;
  const date = new Date();

  return (
    <>
      <div className="fixed w-full h-screen left-0 top-0 z-10 flex flex-wrap justify-center content-center p-24">
        <div className="fixed glass w-full h-screen left-0 top-0 z-0" onClick={onClose}></div>
        <div className="w-96 rounded-3xl bg-white shadow-xl overflow-hidden z-10">
          {/* Header */}
          <div className="p-6 border-b bg-gray-50">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800">Receipt Ready</h2>
              <p className="text-sm text-gray-600 mt-1">Order #{receiptNo.slice(-8)}</p>
            </div>
          </div>

          {/* Quick Receipt Summary */}
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-gray-800">€{total.toFixed(2)}</div>
                <div className="text-sm text-gray-600">
                  {items.reduce((acc, item) => acc + item.quantity, 0)} items • {paymentMethod.toUpperCase()}
                </div>
                {paymentMethod === 'cash' && (
                  <div className="text-sm">
                    <span className="text-gray-600">Cash: €{cash.toFixed(2)} • Change: €{change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button 
                onClick={() => setShowPreview(true)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg px-4 py-3 rounded-2xl transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300"
              >
                📄 Preview & Print
              </button>
              
              <button 
                onClick={() => {
                  setShowPreview(true);
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg px-4 py-3 rounded-2xl transition-colors focus:outline-none focus:ring-4 focus:ring-orange-300"
              >
                🖨️ Quick Print
              </button>
              
              <button 
                onClick={onClose}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-2xl transition-colors focus:outline-none"
              >
                Skip Printing
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Receipt Preview Modal */}
      <ReceiptPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onPrint={() => {
          setShowPreview(false);
          onProceed();
        }}
        items={items}
        discount={discount}
        subtotal={totals.subtotal}
        discountAmount={totals.discountAmount}
        tax={totals.tax}
        total={total}
        cashReceived={cash}
        change={change}
        paymentMethod={paymentMethod}
        orderTimestamp={date}
        orderId={receiptNo}
        isReprint={isReprint}
      />
    </>
  );
};

export default Receipt;