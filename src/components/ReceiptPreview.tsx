import React, { useState, useCallback } from 'react';
import { CartItem, Discount } from '../types/cart';
import { formatDateTime } from '../utils/dateUtils';

interface ReceiptPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  items: CartItem[];
  discount?: Discount | null;
  subtotal: number;
  discountAmount: number;
  tax: number;
  total: number;
  cashReceived?: number;
  change?: number;
  paymentMethod: 'cash' | 'card';
  orderTimestamp?: Date;
  orderId?: string;
}

const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  isOpen,
  onClose,
  onPrint,
  items,
  discount,
  subtotal,
  discountAmount,
  tax,
  total,
  cashReceived = 0,
  change = 0,
  paymentMethod,
  orderTimestamp = new Date(),
  orderId
}) => {
  const [printOptions, setPrintOptions] = useState({
    includeLogo: true,
    includeFooter: true,
    fontSize: 'normal' as 'small' | 'normal' | 'large'
  });

  const handlePrint = useCallback(() => {
    // Apply print options to receipt before printing
    const receiptElement = document.getElementById('receipt-preview-content');
    if (receiptElement) {
      // Create a temporary print area with the receipt content
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Receipt</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                font-size: ${printOptions.fontSize === 'small' ? '10px' : printOptions.fontSize === 'large' ? '14px' : '12px'};
                margin: 0; 
                padding: 20px;
                line-height: 1.4;
              }
              .receipt { max-width: 300px; margin: 0 auto; }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .divider { border-top: 1px dashed #000; margin: 10px 0; }
              .flex { display: flex; justify-content: space-between; }
              .logo { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
              .footer { margin-top: 20px; font-size: 10px; }
              @media print { body { margin: 0; padding: 10px; } }
            </style>
          </head>
          <body>
            <div class="receipt">
              ${receiptElement.innerHTML}
            </div>
            <script>window.print(); window.close();</script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
    onPrint();
  }, [printOptions, onPrint]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-full overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Receipt Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
            aria-label="Close preview"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex">
          {/* Print Options Panel */}
          <div className="w-1/3 p-6 border-r bg-gray-50">
            <h3 className="font-semibold mb-4 text-gray-800">Print Options</h3>
            
            {/* Font Size */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <select
                value={printOptions.fontSize}
                onChange={(e) => setPrintOptions(prev => ({ 
                  ...prev, 
                  fontSize: e.target.value as 'small' | 'normal' | 'large' 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="small">Small</option>
                <option value="normal">Normal</option>
                <option value="large">Large</option>
              </select>
            </div>

            {/* Logo Option */}
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={printOptions.includeLogo}
                  onChange={(e) => setPrintOptions(prev => ({ 
                    ...prev, 
                    includeLogo: e.target.checked 
                  }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Include Logo</span>
              </label>
            </div>

            {/* Footer Option */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={printOptions.includeFooter}
                  onChange={(e) => setPrintOptions(prev => ({ 
                    ...prev, 
                    includeFooter: e.target.checked 
                  }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Include Footer</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handlePrint}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                🖨️ Print Receipt
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Receipt Preview */}
          <div className="flex-1 p-6">
            <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div 
                id="receipt-preview-content" 
                className={`p-4 font-mono text-sm ${
                  printOptions.fontSize === 'small' ? 'text-xs' : 
                  printOptions.fontSize === 'large' ? 'text-base' : 'text-sm'
                }`}
                style={{ 
                  fontFamily: '"Courier New", monospace',
                  lineHeight: '1.4'
                }}
              >
                {/* Logo/Header */}
                {printOptions.includeLogo && (
                  <>
                    <div className="text-center font-bold text-lg mb-2">
                      ☕ CAFE POS
                    </div>
                    <div className="text-center text-xs mb-4">
                      123 Coffee Street<br />
                      Brewtown, BT 12345<br />
                      Tel: (555) 123-BREW
                    </div>
                    <div className="border-t border-dashed border-gray-400 my-3"></div>
                  </>
                )}

                {/* Order Info */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs">
                    <span>Date:</span>
                    <span>{formatDateTime(orderTimestamp)}</span>
                  </div>
                  {orderId && (
                    <div className="flex justify-between text-xs">
                      <span>Order:</span>
                      <span>#{orderId.slice(-8)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span>Payment:</span>
                    <span>{paymentMethod.toUpperCase()}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-400 my-3"></div>

                {/* Items */}
                <div className="mb-3">
                  {items.map((item, index) => (
                    <div key={index} className="mb-2">
                      <div className="flex justify-between">
                        <span className="flex-1">
                          {item.product.name}
                          {item.product.size !== 'Regular' && ` (${item.product.size})`}
                        </span>
                        <span>${(item.quantity * item.product.price).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>  {item.quantity} x ${item.product.price.toFixed(2)}</span>
                        <span></span>
                      </div>
                      {item.notes && (
                        <div className="text-xs text-gray-600 italic">
                          Note: {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-gray-400 my-3"></div>

                {/* Totals */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  
                  {discount && discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>
                        Discount ({discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}):
                      </span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Tax (8%):</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t border-gray-400 pt-1 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>TOTAL:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {paymentMethod === 'cash' && (
                    <>
                      <div className="flex justify-between mt-2">
                        <span>Cash:</span>
                        <span>${cashReceived.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Change:</span>
                        <span>${change.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                {printOptions.includeFooter && (
                  <>
                    <div className="border-t border-dashed border-gray-400 my-3"></div>
                    <div className="text-center text-xs space-y-1">
                      <div>Thank you for your visit!</div>
                      <div>Please come again soon ☕</div>
                      <div className="mt-2">
                        Follow us @cafepossystem
                      </div>
                      <div className="mt-2 text-xs">
                        Receipt generated on {formatDateTime(new Date())}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreview;