import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RoleBasedWrapper from './RoleBasedWrapper';
import DashboardMetrics from './DashboardMetrics';
import DashboardCharts from './DashboardCharts';
import { 
  SalesData, 
  SalesMetrics,
  DashboardFilters, 
  MetricsPeriod, 
  DashboardPerformance,
  DateRange
} from '../types/dashboard';
import { DashboardUtils } from '../utils/dashboardUtils';
import { formatDateTime } from '../utils/dateUtils';
import { networkAdapter } from '../network/NetworkAdapter';

interface SalesDashboardProps {
  onClose?: () => void;
  initialPeriod?: MetricsPeriod;
}

const SalesDashboard: React.FC<SalesDashboardProps> = ({ 
  onClose, 
  initialPeriod = 'month' 
}) => {
  const { hasPermission } = useAuth();
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: DashboardUtils.getDateRangesForPeriod(initialPeriod),
    period: initialPeriod,
    paymentMethod: 'all'
  });
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // seconds
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [performanceData, setPerformanceData] = useState<DashboardPerformance | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch sales data
  const fetchSalesData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    const startTime = performance.now();
    
    try {
      // Try to fetch from API first
      let data: SalesData;
      
      try {
        const response = await networkAdapter.get('/sales/dashboard', {
          start_date: filters.dateRange.startDate.toISOString(),
          end_date: filters.dateRange.endDate.toISOString(),
          payment_method: filters.paymentMethod,
          category: filters.category
        });
        
        if (response && !response.errors?.length) {
          data = response.data;
        } else {
          throw new Error('API response invalid');
        }
      } catch (apiError) {
        console.warn('API not available, using mock data:', apiError);
        
        // Generate mock data for development
        const mockConfig = {
          startDate: filters.dateRange.startDate,
          endDate: filters.dateRange.endDate,
          baseRevenue: 800,
          fluctuation: 0.3,
          weekendMultiplier: 1.4,
          peakHours: [8, 9, 12, 13, 17, 18]
        };
        
        data = DashboardUtils.generateMockSalesData(mockConfig);
      }
      
      setSalesData(data);
      setLastUpdated(new Date());
      
      // Record performance
      const endTime = performance.now();
      const loadTime = Math.round((endTime - startTime) * 100) / 100;
      
      setPerformanceData({
        loadTime,
        dataFetchTime: loadTime * 0.7,
        renderTime: loadTime * 0.3,
        chartRenderTime: loadTime * 0.2,
        totalMemoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        timestamp: new Date()
      });
      
      if (loadTime > 2000 && process.env.NODE_ENV === 'development') {
        console.warn(`Dashboard load time exceeded 2 seconds: ${loadTime}ms`);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [filters]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchSalesData(false); // Don't show loading spinner for auto-refresh
      }, refreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchSalesData]);

  // Initial data load
  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  // Period change handler
  const handlePeriodChange = useCallback((newPeriod: MetricsPeriod) => {
    const newDateRange = DashboardUtils.getDateRangesForPeriod(newPeriod);
    setFilters(prev => ({
      ...prev,
      period: newPeriod,
      dateRange: newDateRange
    }));
  }, []);

  // Date range change handler
  const handleDateRangeChange = useCallback((startDate: Date, endDate: Date) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        startDate,
        endDate,
        label: 'Custom Range'
      },
      period: 'custom'
    }));
  }, []);

  // Memoized calculations
  const chartData = useMemo(() => {
    if (!salesData) return null;
    
    return {
      labels: salesData.chartData.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Revenue',
          data: salesData.chartData.map(d => d.revenue),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Transactions',
          data: salesData.chartData.map(d => d.transactions),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  }, [salesData]);

  if (!hasPermission('reports.view')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>You don't have permission to view reports</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sales data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-600">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mb-2">Failed to load dashboard data</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={() => fetchSalesData()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!salesData) return null;

  return (
    <RoleBasedWrapper requiredPermissions={['reports.view']}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Sales Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Last updated: {formatDateTime(lastUpdated)}
              {performanceData && performanceData.loadTime > 1000 && (
                <span className="ml-2 text-yellow-600">
                  ⚠️ Load time: {performanceData.loadTime}ms
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Auto-refresh toggle */}
            <div className="flex items-center space-x-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="sr-only"
                />
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoRefresh ? 'bg-orange-600' : 'bg-gray-200'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoRefresh ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
                <span className="ml-2 text-sm text-gray-600">Auto-refresh</span>
              </label>
            </div>
            
            {/* Refresh button */}
            <button
              onClick={() => fetchSalesData()}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Refresh data"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Period selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Period:</label>
              <select
                value={filters.period}
                onChange={(e) => handlePeriodChange(e.target.value as MetricsPeriod)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>

            {/* Payment method filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Payment:</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash Only</option>
                <option value="card">Card Only</option>
              </select>
            </div>

            {/* Export button */}
            <RoleBasedWrapper requiredPermissions={['reports.export']}>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export</span>
              </button>
            </RoleBasedWrapper>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Metrics Cards */}
          <DashboardMetrics
            metrics={salesData.metrics}
            comparison={salesData.comparisonData}
            loading={loading}
          />

          {/* Charts */}
          <DashboardCharts
            revenueData={salesData.chartData}
            categoryData={salesData.categoryBreakdown}
            hourlyData={salesData.hourlyBreakdown}
            loading={loading}
          />

          {/* Top Products Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Products */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🏆 Top Selling Products</h3>
              <div className="space-y-3">
                {salesData.topProducts && salesData.topProducts.length > 0 ? (
                  salesData.topProducts.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-600' :
                        index === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{DashboardUtils.formatCurrency(product.revenue)}</div>
                      <div className="text-sm text-gray-600">{product.quantitySold} sold</div>
                    </div>
                  </div>
                ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📦</div>
                    <p>No top products data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {DashboardUtils.formatCurrency(salesData.metrics.weeklyRevenue)}
                  </div>
                  <div className="text-sm text-gray-600">Weekly Revenue</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {salesData.metrics.dailyTransactions}
                  </div>
                  <div className="text-sm text-gray-600">Today's Orders</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round((salesData.metrics.returningCustomers / salesData.metrics.totalCustomers) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Returning Rate</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {salesData.categoryBreakdown[0]?.category || 'Coffee'}
                  </div>
                  <div className="text-sm text-gray-600">Top Category</div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance indicator */}
          {performanceData && performanceData.loadTime > 1500 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 text-yellow-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Performance Notice</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Dashboard loaded in {performanceData.loadTime}ms. Consider optimizing data queries for better performance.
              </p>
            </div>
          )}
        </div>
      </div>
    </RoleBasedWrapper>
  );
};

export default SalesDashboard;