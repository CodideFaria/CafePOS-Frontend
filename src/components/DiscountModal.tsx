import React, { useState, useCallback, useMemo } from 'react';

export interface Discount {
  id: string;
  type: 'percentage' | 'fixed';
  value: number;
  reason: string;
  staffId?: string;
  appliedAt: Date;
}

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDiscount: (discount: Discount) => void;
  subtotal: number;
  currentDiscount?: Discount | null;
}

const DiscountModal: React.FC<DiscountModalProps> = ({
  isOpen,
  onClose,
  onApplyDiscount,
  subtotal,
  currentDiscount
}) => {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [reason, setReason] = useState('');
  const [staffId, setStaffId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Preset discount options
  const presetDiscounts = [
    { type: 'percentage' as const, value: 10, reason: 'Student Discount' },
    { type: 'percentage' as const, value: 15, reason: 'Senior Discount' },
    { type: 'percentage' as const, value: 20, reason: 'Employee Discount' },
    { type: 'fixed' as const, value: 5, reason: 'Loyalty Reward' },
    { type: 'fixed' as const, value: 2, reason: 'Promotion' },
  ];

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate discount value
    const value = parseFloat(discountValue);
    if (!discountValue.trim()) {
      newErrors.discountValue = 'Discount value is required';
    } else if (isNaN(value) || value <= 0) {
      newErrors.discountValue = 'Discount value must be a positive number';
    } else if (discountType === 'percentage' && value >= 100) {
      newErrors.discountValue = 'Percentage discount must be less than 100%';
    } else if (discountType === 'fixed' && value >= subtotal) {
      newErrors.discountValue = 'Fixed discount cannot exceed subtotal';
    }

    // Validate reason
    if (!reason.trim()) {
      newErrors.reason = 'Discount reason is required';
    } else if (reason.length > 100) {
      newErrors.reason = 'Reason must be 100 characters or less';
    }

    // Validate staff ID
    if (!staffId.trim()) {
      newErrors.staffId = 'Staff ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [discountValue, discountType, reason, staffId, subtotal]);

  const calculateDiscountAmount = useCallback((type: 'percentage' | 'fixed', value: number): number => {
    if (type === 'percentage') {
      return (subtotal * value) / 100;
    } else {
      return Math.min(value, subtotal);
    }
  }, [subtotal]);

  const previewDiscountAmount = useMemo(() => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) return 0;
    return calculateDiscountAmount(discountType, value);
  }, [discountType, discountValue, calculateDiscountAmount]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const value = parseFloat(discountValue);
    const discount: Discount = {
      id: `discount-${Date.now()}`,
      type: discountType,
      value,
      reason: reason.trim(),
      staffId: staffId.trim(),
      appliedAt: new Date()
    };

    onApplyDiscount(discount);
    handleClose();
  }, [validateForm, discountType, discountValue, reason, staffId, onApplyDiscount]);

  const handleClose = useCallback(() => {
    setDiscountValue('');
    setReason('');
    setStaffId('');
    setErrors({});
    onClose();
  }, [onClose]);

  const applyPresetDiscount = useCallback((preset: typeof presetDiscounts[0]) => {
    setDiscountType(preset.type);
    setDiscountValue(preset.value.toString());
    setReason(preset.reason);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-full overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {currentDiscount ? 'Update Discount' : 'Apply Discount'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 p-1"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Discount Display */}
          {currentDiscount && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Current Discount:</strong> {currentDiscount.type === 'percentage' ? `${currentDiscount.value}%` : `€${currentDiscount.value}`} - {currentDiscount.reason}
              </p>
            </div>
          )}

          {/* Subtotal Display */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Preset Discounts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Apply:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presetDiscounts.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => applyPresetDiscount(preset)}
                  className="p-2 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  {preset.type === 'percentage' ? `${preset.value}%` : `€${preset.value}`}
                  <br />
                  <span className="text-blue-600">{preset.reason}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Discount Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Type *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="percentage"
                  checked={discountType === 'percentage'}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage')}
                  className="mr-2"
                />
                Percentage (%)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="fixed"
                  checked={discountType === 'fixed'}
                  onChange={(e) => setDiscountType(e.target.value as 'fixed')}
                  className="mr-2"
                />
                Fixed Amount (€)
              </label>
            </div>
          </div>

          {/* Discount Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Value *
            </label>
            <div className="relative">
              <input
                type="number"
                step={discountType === 'percentage' ? '1' : '0.01'}
                min="0"
                max={discountType === 'percentage' ? '99' : subtotal.toString()}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.discountValue ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={discountType === 'percentage' ? '10' : '5.00'}
              />
              <div className="absolute right-3 top-2 text-gray-500">
                {discountType === 'percentage' ? '%' : '€'}
              </div>
            </div>
            {errors.discountValue && (
              <p className="text-red-500 text-sm mt-1">{errors.discountValue}</p>
            )}
          </div>

          {/* Preview */}
          {previewDiscountAmount > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Discount Amount:</span>
                <span className="font-semibold text-green-700">-€{previewDiscountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>New Total:</span>
                <span className="font-semibold">€{(subtotal - previewDiscountAmount).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.reason ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Student discount, Loyalty reward"
              maxLength={100}
            />
            {errors.reason && (
              <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
            )}
          </div>

          {/* Staff ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff ID *
            </label>
            <input
              type="text"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.staffId ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Your staff ID"
            />
            {errors.staffId && (
              <p className="text-red-500 text-sm mt-1">{errors.staffId}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
            >
              {currentDiscount ? 'Update Discount' : 'Apply Discount'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiscountModal;