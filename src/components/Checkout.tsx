import React, { useState, useMemo } from 'react';
import { CartItem as CartItemType, calculateCartTotals, Discount, PaymentData } from '../types/cart';

interface CheckoutProps {
  items: CartItemType[];
  discount?: Discount | null;
  onSubmit: (paymentData: PaymentData) => void;
  onDiscountClick?: () => void;
  disabled?: boolean;
}

const Checkout: React.FC<CheckoutProps> = ({ 
  items, 
  discount, 
  onSubmit, 
  onDiscountClick,
  disabled = false 
}) => {
  const [cash, setCash] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  
  const totals = useMemo(() => calculateCartTotals(items, discount), [items, discount]);
  const change = cash - totals.total;
  const isValidPayment = paymentMethod === 'card' || cash >= totals.total;

  const quickAmounts = [5, 10, 20, 50, 100];

  const handleSubmit = () => {
    if (!isValidPayment || totals.total <= 0) return;
    
    const paymentData: PaymentData = {
      cash: paymentMethod === 'cash' ? cash : totals.total,
      total: totals.total,
      change: paymentMethod === 'cash' ? change : 0
    };
    
    onSubmit(paymentData);
  };

  const addCashAmount = (amount: number) => {
    setCash(prev => prev + amount);
  };

  const setExactCash = () => {
    setCash(totals.total);
  };

  const clearCash = () => {
    setCash(0);
  };

  if (totals.total <= 0) {
    return (
      <div className="select-none h-auto w-full text-center pt-3 pb-4 px-4">
        <div className="text-gray-400 py-8">
          <p>Add items to cart to checkout</p>
        </div>
      </div>
    );
  }

  return (
    <div className="select-none h-auto w-full text-center pt-3 pb-4 px-4 space-y-4">
      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-3 text-left">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal ({totals.itemCount} items):</span>
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>
          
          {/* Discount Display */}
          {discount ? (
            <div className="flex justify-between text-green-600">
              <span>
                Discount ({discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}):
                <div className="text-xs text-gray-500">
                  {discount.reason} • Staff: {discount.staffId}
                </div>
              </span>
              <div className="text-right">
                <div>-${totals.discountAmount.toFixed(2)}</div>
                {onDiscountClick && (
                  <button
                    onClick={onDiscountClick}
                    className="text-xs text-blue-600 hover:text-blue-700 underline"
                  >
                    Modify
                  </button>
                )}
              </div>
            </div>
          ) : onDiscountClick && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <button
                onClick={onDiscountClick}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium underline"
              >
                Apply Discount
              </button>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Tax (8%):</span>
            <span>${totals.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2 text-gray-800">
            <span>TOTAL:</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="flex gap-2">
        <button
          onClick={() => setPaymentMethod('cash')}
          className={`flex-1 py-2 px-3 rounded-lg border-2 transition-colors ${
            paymentMethod === 'cash'
              ? 'border-orange-500 bg-orange-50 text-orange-700'
              : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
          }`}
        >
          💵 Cash
        </button>
        <button
          onClick={() => setPaymentMethod('card')}
          className={`flex-1 py-2 px-3 rounded-lg border-2 transition-colors ${
            paymentMethod === 'card'
              ? 'border-orange-500 bg-orange-50 text-orange-700'
              : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
          }`}
        >
          💳 Card
        </button>
      </div>

      {/* Cash Payment Section */}
      {paymentMethod === 'cash' && (
        <div className="bg-gray-50 rounded-lg p-3 text-gray-700">
          <div className="flex text-lg font-semibold mb-3">
            <div className="flex-grow text-left">CASH RECEIVED:</div>
            <div className="flex text-right items-center">
              <span className="mr-2">$</span>
              <input 
                value={cash || ''} 
                type="number" 
                step="0.01"
                onChange={(event) => setCash(parseFloat(event.target.value) || 0)}
                className="w-24 text-right bg-white shadow rounded-lg focus:ring-2 focus:ring-orange-500 px-2 py-1 focus:outline-none" 
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {quickAmounts.map(amount => (
              <button 
                key={amount}
                className="bg-white rounded-lg shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 px-2 py-2 text-sm transition-all"
                onClick={() => addCashAmount(amount)}
              >
                +${amount}
              </button>
            ))}
            <button 
              className="bg-white rounded-lg shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 px-2 py-2 text-sm transition-all"
              onClick={clearCash}
            >
              Clear
            </button>
            <button 
              className="bg-white rounded-lg shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 px-2 py-2 text-sm transition-all"
              onClick={setExactCash}
            >
              Exact
            </button>
          </div>

          {/* Change Display */}
          {cash > 0 && (
            <div className={`flex text-lg font-semibold rounded-lg py-2 px-3 ${
              change >= 0 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              <div className="flex-grow text-left">
                {change >= 0 ? 'CHANGE:' : 'INSUFFICIENT:'}
              </div>
              <div className="text-right">
                ${Math.abs(change).toFixed(2)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Card Payment Message */}
      {paymentMethod === 'card' && (
        <div className="bg-blue-50 rounded-lg p-3 text-blue-700 text-center">
          <p className="font-semibold">Card Payment</p>
          <p className="text-sm">Process payment of ${totals.total.toFixed(2)}</p>
        </div>
      )}

      {/* Submit Button */}
      <button 
        onClick={handleSubmit}
        disabled={disabled || !isValidPayment}
        className={`w-full py-3 rounded-2xl text-lg font-semibold transition-colors focus:outline-none focus:ring-4 focus:ring-orange-300 ${
          disabled || !isValidPayment
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-orange-500 hover:bg-orange-600 text-white'
        }`}
      >
        {paymentMethod === 'cash' ? 'PROCESS CASH PAYMENT' : 'PROCESS CARD PAYMENT'}
      </button>

      {/* Payment Validation Message */}
      {!isValidPayment && paymentMethod === 'cash' && cash > 0 && (
        <p className="text-red-600 text-sm">
          Insufficient cash. Need ${(totals.total - cash).toFixed(2)} more.
        </p>
      )}
    </div>
  );
};

export default Checkout;