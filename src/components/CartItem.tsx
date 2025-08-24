import React, { useState, useCallback } from 'react';
import { CartItem as CartItemType } from '../types/cart';

interface CartItemProps {
  cartItem: CartItemType;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onAddNote?: (note: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ 
  cartItem, 
  onQuantityChange, 
  onRemove,
  onAddNote 
}) => {
  const [showNotes, setShowNotes] = useState(false);
  const [noteValue, setNoteValue] = useState(cartItem.notes || '');

  const handleQuantityChange = useCallback((newQuantity: number) => {
    if (newQuantity < 0) return;
    onQuantityChange(newQuantity);
  }, [onQuantityChange]);

  const handleNoteSubmit = useCallback(() => {
    if (onAddNote) {
      onAddNote(noteValue);
      setShowNotes(false);
    }
  }, [noteValue, onAddNote]);

  const itemTotal = cartItem.product.price * cartItem.quantity;

  return (
    <div className="select-none bg-gray-50 rounded-lg w-full text-gray-700 p-3 border border-gray-200">
      {/* Main Item Row */}
      <div className="flex items-center">
        {/* Product Info */}
        <div className="flex-grow">
          <h5 className="text-sm font-medium">{cartItem.product.name}</h5>
          <p className="text-xs text-gray-500">
            {cartItem.product.size} • €{cartItem.product.price.toFixed(2)} each
          </p>
          {cartItem.notes && (
            <p className="text-xs text-blue-600 mt-1 italic">Note: {cartItem.notes}</p>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 ml-4">
          <button 
            onClick={() => handleQuantityChange(cartItem.quantity - 1)}
            className="w-8 h-8 rounded-lg text-center text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            aria-label="Decrease quantity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
            </svg>
          </button>
          
          <input 
            value={cartItem.quantity} 
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
            type="number"
            min="0"
            className="w-16 bg-white rounded-lg text-center shadow focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm py-1"
            aria-label="Quantity"
          />
          
          <button 
            onClick={() => handleQuantityChange(cartItem.quantity + 1)}
            className="w-8 h-8 rounded-lg text-center text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            aria-label="Increase quantity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>

        {/* Item Total */}
        <div className="ml-4 text-right">
          <p className="text-sm font-semibold">€{itemTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
        <div className="flex gap-2">
          {onAddNote && (
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`text-xs px-2 py-1 rounded-md transition-colors ${
                showNotes || cartItem.notes
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Add note"
            >
              <svg className="w-3 h-3 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Note
            </button>
          )}
        </div>
        
        <button
          onClick={onRemove}
          className="text-xs px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors"
          title="Remove item"
        >
          <svg className="w-3 h-3 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Remove
        </button>
      </div>

      {/* Notes Input */}
      {showNotes && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              placeholder="Add a note (e.g., extra hot, no foam)"
              className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              maxLength={100}
            />
            <button
              onClick={handleNoteSubmit}
              className="text-xs px-3 py-1 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setNoteValue(cartItem.notes || '');
                setShowNotes(false);
              }}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartItem;