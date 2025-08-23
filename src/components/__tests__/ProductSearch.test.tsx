import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductSearch from '../ProductSearch';

describe('ProductSearch', () => {
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input', () => {
    render(<ProductSearch onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('calls onSearch when typing in search input', () => {
    render(<ProductSearch onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'latte' } });
    
    expect(mockOnSearch).toHaveBeenCalledWith('latte');
  });

  it('clears search when input is empty', () => {
    render(<ProductSearch onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: '' } });
    
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });
});