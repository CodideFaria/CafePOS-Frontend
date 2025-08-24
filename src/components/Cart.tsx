import React, { useMemo, useCallback } from 'react';
import CartItem from './CartItem';
import { CartItem as CartItemType, calculateCartTotals, Discount } from '../types/cart';

interface CartProps {
  items: CartItemType[];
  discount?: Discount | null;
  onCartUpdate: (items: CartItemType[]) => void;
  onItemRemove?: (itemId: string) => void;
  onDiscountClick?: () => void;
  showTotals?: boolean;
}

const Cart: React.FC<CartProps> = ({ 
  items, 
  discount,
  onCartUpdate, 
  onItemRemove,
  onDiscountClick,
  showTotals = false 
}) => {
  const totals = useMemo(() => calculateCartTotals(items, discount), [items, discount]);

  const handleQuantityChange = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or negative
      const updatedItems = items.filter(item => item.id !== itemId);
      onCartUpdate(updatedItems);
      return;
    }

    const updatedItems = items.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    onCartUpdate(updatedItems);
  }, [items, onCartUpdate]);

  const handleRemoveItem = useCallback((itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    onCartUpdate(updatedItems);
    if (onItemRemove) {
      onItemRemove(itemId);
    }
  }, [items, onCartUpdate, onItemRemove]);

  const handleAddNote = useCallback((itemId: string, note: string) => {
    const updatedItems = items.map(item => 
      item.id === itemId 
        ? { ...item, notes: note.trim() || undefined }
        : item
    );
    onCartUpdate(updatedItems);
  }, [items, onCartUpdate]);

  if (!items.length) {
    return (
      <div className="flex-1 w-full p-4 opacity-25 select-none flex flex-col flex-wrap content-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="mt-2 font-medium text-gray-500">CART EMPTY</p>
        <p className="text-sm text-gray-400">Add items from the menu to get started</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col">
      {/* Cart Items */}
      <div className="flex-1 px-4 overflow-auto">
        <div className="space-y-2">
          {items.map((cartItem) => (
            <CartItem
              key={cartItem.id}
              cartItem={cartItem}
              onQuantityChange={(newQuantity) => handleQuantityChange(cartItem.id, newQuantity)}
              onRemove={() => handleRemoveItem(cartItem.id)}
              onAddNote={(note) => handleAddNote(cartItem.id, note)}
            />
          ))}
        </div>
      </div>

      {/* Cart Summary */}
      {showTotals && items.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal ({totals.itemCount} items):</span>
              <span>€{totals.subtotal.toFixed(2)}</span>
            </div>
            
            {/* Discount Section */}
            {discount ? (
              <div className="flex justify-between text-green-600">
                <span>
                  Discount ({discount.type === 'percentage' ? `${discount.value}%` : `€${discount.value}`}):
                  <span className="text-xs text-gray-500 ml-1">({discount.reason})</span>
                </span>
                <span>-€{totals.discountAmount.toFixed(2)}</span>
              </div>
            ) : onDiscountClick && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <button
                  onClick={onDiscountClick}
                  className="text-orange-600 hover:text-orange-700 text-xs font-medium"
                >
                  Apply Discount
                </button>
              </div>
            )}
            
            <div className="flex justify-between">
              <span>Tax (8%):</span>
              <span>€{totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t pt-1">
              <span>Total:</span>
              <span>€{totals.total.toFixed(2)}</span>
            </div>
            
            {/* Discount Actions */}
            {discount && onDiscountClick && (
              <div className="pt-2 border-t">
                <button
                  onClick={onDiscountClick}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Modify Discount
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;