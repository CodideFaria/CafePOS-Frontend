import { CartItem, Discount } from './cart';

export interface Order {
  id: string;
  items: CartItem[];
  discount?: Discount | null;
  subtotal: number;
  discountAmount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card';
  cashReceived: number;
  change: number;
  timestamp: Date;
  staffId?: string;
  status: 'completed' | 'refunded' | 'voided';
  reprintCount: number;
  lastReprint?: Date;
}

export const REPRINT_TIME_LIMIT_MINUTES = 5;

export const canReprintOrder = (order: Order): boolean => {
  const now = new Date();
  const timeSinceOrder = now.getTime() - order.timestamp.getTime();
  const minutesSinceOrder = timeSinceOrder / (1000 * 60);
  return minutesSinceOrder <= REPRINT_TIME_LIMIT_MINUTES;
};

export const getReprintTimeRemaining = (order: Order): number => {
  const now = new Date();
  const timeSinceOrder = now.getTime() - order.timestamp.getTime();
  const minutesSinceOrder = timeSinceOrder / (1000 * 60);
  return Math.max(0, REPRINT_TIME_LIMIT_MINUTES - minutesSinceOrder);
};