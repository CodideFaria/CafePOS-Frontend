import { MenuItem } from '../utils/searchUtils';

export interface CartItem {
  id: string;
  product: MenuItem;
  quantity: number;
  addedAt: Date;
  notes?: string;
}

export interface Discount {
  id: string;
  type: 'percentage' | 'fixed';
  value: number;
  reason: string;
  staffId?: string;
  appliedAt: Date;
}

export interface CartTotals {
  subtotal: number;
  discountAmount: number;
  discountedSubtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

export interface CartState {
  items: CartItem[];
  discount?: Discount | null;
  totals: CartTotals;
  lastUpdated: Date;
}

export interface PaymentData {
  cash: number;
  total: number;
  change: number;
  paymentMethod: 'cash' | 'card';
}

export const TAX_RATE = 0.08; // 8% tax rate

export const calculateDiscountAmount = (discount: Discount, subtotal: number): number => {
  if (discount.type === 'percentage') {
    return Math.min((subtotal * discount.value) / 100, subtotal);
  } else {
    return Math.min(discount.value, subtotal);
  }
};

export const calculateCartTotals = (items: CartItem[], discount?: Discount | null): CartTotals => {
  const subtotal = items.reduce((acc, item) => {
    return acc + (item.product.price * item.quantity);
  }, 0);
  
  const discountAmount = discount ? calculateDiscountAmount(discount, subtotal) : 0;
  const discountedSubtotal = subtotal - discountAmount;
  const tax = discountedSubtotal * TAX_RATE;
  const total = discountedSubtotal + tax;
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    discountedSubtotal: Math.round(discountedSubtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    itemCount
  };
};