/** @jsxImportSource react */
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'

// Mock data for testing
export const mockMenuItems = [
  { id: '1', name: 'Latte', size: 'Medium', price: 4.50, isActive: true },
  { id: '2', name: 'Cappuccino', size: 'Large', price: 5.00, isActive: true },
  { id: '3', name: 'Espresso', size: 'Small', price: 2.50, isActive: true },
  { id: '4', name: 'Americano', size: 'Medium', price: 3.50, isActive: true },
  { id: '5', name: 'Mocha', size: 'Large', price: 5.50, isActive: true },
];

export const mockCartItems = [
  { product: mockMenuItems[0], quantity: 2 },
  { product: mockMenuItems[1], quantity: 1 },
];

export const mockNetworkAdapter = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
};

// Custom render function that includes providers if needed
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };