import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import SalesDashboard from '../SalesDashboard';
import { AuthProvider } from '../../contexts/AuthContext';
import { networkAdapter } from '../../network/NetworkAdapter';
import { DashboardUtils } from '../../utils/dashboardUtils';

// Mock the NetworkAdapter
vi.mock('../../network/NetworkAdapter', () => ({
  networkAdapter: {
    get: vi.fn()
  }
}));

// Mock performance.now for consistent testing
const mockPerformance = {
  now: vi.fn(() => 1000),
  memory: {
    usedJSHeapSize: 1000000
  }
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
});

// Mock AuthContext
const mockAuthContext = {
  user: {
    id: 'manager-001',
    username: 'manager',
    firstName: 'Test',
    lastName: 'Manager',
    email: 'manager@test.com',
    role: 'manager',
    permissions: ['reports.view', 'reports.export'],
    isActive: true,
    createdAt: new Date(),
    lastLogin: new Date()
  },
  isAuthenticated: true,
  loading: false,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  hasPermission: vi.fn((permission) => ['reports.view', 'reports.export'].includes(permission)),
  hasAnyPermission: vi.fn(),
  hasAllPermissions: vi.fn(),
  updateUser: vi.fn(),
  switchUser: vi.fn()
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock DashboardUtils
const mockSalesData = {
  metrics: {
    totalRevenue: 15750.50,
    dailyRevenue: 850.25,
    weeklyRevenue: 5500.75,
    monthlyRevenue: 15750.50,
    totalTransactions: 245,
    dailyTransactions: 18,
    averageOrderValue: 64.29,
    totalCustomers: 180,
    returningCustomers: 108,
    newCustomers: 72
  },
  chartData: [
    { date: '2024-01-01', revenue: 800, transactions: 15, averageOrderValue: 53.33 },
    { date: '2024-01-02', revenue: 950, transactions: 18, averageOrderValue: 52.78 },
    { date: '2024-01-03', revenue: 1200, transactions: 22, averageOrderValue: 54.55 }
  ],
  topProducts: [
    { id: '1', name: 'Latte', category: 'Coffee', quantitySold: 45, revenue: 180, profitMargin: 65 },
    { id: '2', name: 'Cappuccino', category: 'Coffee', quantitySold: 38, revenue: 152, profitMargin: 60 }
  ],
  categoryBreakdown: [
    { category: 'Coffee', revenue: 10000, percentage: 63.5, transactions: 150, averageOrderValue: 66.67, color: '#8B4513' },
    { category: 'Pastries', revenue: 3000, percentage: 19.0, transactions: 60, averageOrderValue: 50.0, color: '#DEB887' }
  ],
  hourlyBreakdown: [
    { hour: 8, revenue: 450, transactions: 8, label: '08:00' },
    { hour: 12, revenue: 680, transactions: 12, label: '12:00' },
    { hour: 17, revenue: 520, transactions: 10, label: '17:00' }
  ],
  comparisonData: {
    previousPeriod: {
      revenue: 14250.0,
      transactions: 220,
      averageOrderValue: 64.77
    },
    percentageChange: {
      revenue: 10.5,
      transactions: 11.4,
      averageOrderValue: -0.7
    }
  }
};

vi.mock('../../utils/dashboardUtils', () => ({
  DashboardUtils: {
    generateMockSalesData: vi.fn(() => mockSalesData),
    getDateRangesForPeriod: vi.fn(() => ({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      label: 'This Month'
    })),
    formatCurrency: vi.fn((amount) => `$${amount.toFixed(2)}`),
    calculatePercentageChange: vi.fn(() => 10.5),
    getTrendIndicator: vi.fn(() => ({ direction: 'up', color: 'text-green-600', icon: '📈' }))
  }
}));

describe('SalesDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (networkAdapter.get as any).mockRejectedValue(new Error('API not available'));
  });

  describe('Permission-based Rendering', () => {
    it('should render dashboard when user has reports.view permission', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sales Dashboard')).toBeInTheDocument();
      });
    });

    it('should show permission denied when user lacks reports.view permission', async () => {
      mockAuthContext.hasPermission = vi.fn(() => false);

      render(<SalesDashboard />);

      expect(screen.getByText("You don't have permission to view reports")).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner initially', () => {
      render(<SalesDashboard />);

      expect(screen.getByText('Loading sales data...')).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Loading spinner
    });

    it('should hide loading spinner after data loads', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading sales data...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should attempt to fetch from API first', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        expect(networkAdapter.get).toHaveBeenCalledWith('/sales/dashboard', expect.any(Object));
      });
    });

    it('should fallback to mock data when API fails', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        expect(DashboardUtils.generateMockSalesData).toHaveBeenCalled();
      });
    });

    it('should display error message when data fetching fails completely', async () => {
      (DashboardUtils.generateMockSalesData as any).mockImplementation(() => {
        throw new Error('Mock data generation failed');
      });

      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
      });
    });
  });

  describe('Metrics Display', () => {
    it('should display key metrics correctly', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.getByText('$15,750.50')).toBeInTheDocument(); // Total Revenue
        expect(screen.getByText('245')).toBeInTheDocument(); // Total Transactions
        expect(screen.getByText('$64.29')).toBeInTheDocument(); // Average Order Value
        expect(screen.getByText('180')).toBeInTheDocument(); // Total Customers
      });
    });

    it('should show trend indicators', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.getByText('📈')).toBeInTheDocument(); // Trend indicator
        expect(screen.getByText('+10.5%')).toBeInTheDocument(); // Percentage change
      });
    });
  });

  describe('Filters and Controls', () => {
    it('should render period selector', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('month')).toBeInTheDocument();
      });
    });

    it('should render payment method filter', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('all')).toBeInTheDocument();
      });
    });

    it('should handle period change', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        const periodSelect = screen.getByDisplayValue('month');
        fireEvent.change(periodSelect, { target: { value: 'week' } });
      });

      expect(DashboardUtils.getDateRangesForPeriod).toHaveBeenCalledWith('week');
    });

    it('should show export button for users with reports.export permission', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });
    });

    it('should hide export button for users without reports.export permission', async () => {
      mockAuthContext.hasPermission = vi.fn((permission) => permission === 'reports.view');

      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Export')).not.toBeInTheDocument();
      });
    });
  });

  describe('Auto-refresh Functionality', () => {
    it('should render auto-refresh toggle', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Auto-refresh')).toBeInTheDocument();
      });
    });

    it('should enable auto-refresh when toggle is clicked', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        const autoRefreshToggle = screen.getByRole('checkbox');
        fireEvent.click(autoRefreshToggle);
        expect(autoRefreshToggle).toBeChecked();
      });
    });
  });

  describe('Charts and Visualizations', () => {
    it('should display chart navigation tabs', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.getByText('📈 Revenue Trend')).toBeInTheDocument();
        expect(screen.getByText('🥧 Category Breakdown')).toBeInTheDocument();
        expect(screen.getByText('⏰ Hourly Sales')).toBeInTheDocument();
      });
    });

    it('should switch between chart types', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        const categoryTab = screen.getByText('🥧 Category Breakdown');
        fireEvent.click(categoryTab);
        expect(screen.getByText('Sales by Category')).toBeInTheDocument();
      });
    });
  });

  describe('Top Products Section', () => {
    it('should display top selling products', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.getByText('🏆 Top Selling Products')).toBeInTheDocument();
        expect(screen.getByText('Latte')).toBeInTheDocument();
        expect(screen.getByText('Cappuccino')).toBeInTheDocument();
      });
    });

    it('should show product rankings', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument(); // First place
        expect(screen.getByText('2')).toBeInTheDocument(); // Second place
      });
    });
  });

  describe('Quick Stats', () => {
    it('should display quick stats section', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.getByText('📊 Quick Stats')).toBeInTheDocument();
        expect(screen.getByText('Weekly Revenue')).toBeInTheDocument();
        expect(screen.getByText("Today's Orders")).toBeInTheDocument();
        expect(screen.getByText('Returning Rate')).toBeInTheDocument();
        expect(screen.getByText('Top Category')).toBeInTheDocument();
      });
    });

    it('should calculate returning customer rate correctly', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        // 108 returning out of 180 total = 60%
        expect(screen.getByText('60%')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should display performance warning for slow load times', async () => {
      (mockPerformance.now as any)
        .mockReturnValueOnce(0)  // Start time
        .mockReturnValueOnce(2500); // End time (2.5 seconds)

      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Load time: \d+ms/)).toBeInTheDocument();
      });
    });

    it('should not show performance warning for fast load times', async () => {
      (mockPerformance.now as any)
        .mockReturnValueOnce(0)  // Start time
        .mockReturnValueOnce(800); // End time (0.8 seconds)

      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Performance Notice')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show retry button when data loading fails', async () => {
      (DashboardUtils.generateMockSalesData as any).mockImplementation(() => {
        throw new Error('Data generation failed');
      });

      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should retry data fetching when retry button is clicked', async () => {
      (DashboardUtils.generateMockSalesData as any)
        .mockImplementationOnce(() => { throw new Error('First attempt failed'); })
        .mockImplementationOnce(() => mockSalesData);

      render(<SalesDashboard />);

      await waitFor(() => {
        const retryButton = screen.getByText('Retry');
        fireEvent.click(retryButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Sales Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should handle mobile viewport gracefully', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sales Dashboard')).toBeInTheDocument();
        // Should still render all key components
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('main') || screen.getByRole('region')).toBeInTheDocument();
      });
    });

    it('should be keyboard navigable', async () => {
      render(<SalesDashboard />);

      await waitFor(() => {
        const refreshButton = screen.getByTitle('Refresh data');
        refreshButton.focus();
        expect(refreshButton).toHaveFocus();
      });
    });
  });

  describe('Integration with AdminPanel', () => {
    it('should handle close callback properly', async () => {
      const mockOnClose = vi.fn();
      render(<SalesDashboard onClose={mockOnClose} />);

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });
});