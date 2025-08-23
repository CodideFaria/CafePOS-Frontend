export interface SalesMetrics {
  totalRevenue: number;
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  totalTransactions: number;
  dailyTransactions: number;
  averageOrderValue: number;
  totalCustomers: number;
  returningCustomers: number;
  newCustomers: number;
}

export interface ChartDataPoint {
  date: string;
  revenue: number;
  transactions: number;
  averageOrderValue: number;
}

export interface TopSellingProduct {
  id: string;
  name: string;
  category: string;
  quantitySold: number;
  revenue: number;
  profitMargin: number;
  image?: string;
}

export interface SalesData {
  metrics: SalesMetrics;
  chartData: ChartDataPoint[];
  topProducts: TopSellingProduct[];
  categoryBreakdown: CategorySalesData[];
  hourlyBreakdown: HourlySalesData[];
  comparisonData: ComparisonData;
}

export interface CategorySalesData {
  category: string;
  revenue: number;
  percentage: number;
  transactions: number;
  averageOrderValue: number;
  color: string;
}

export interface HourlySalesData {
  hour: number;
  revenue: number;
  transactions: number;
  label: string;
}

export interface ComparisonData {
  previousPeriod: {
    revenue: number;
    transactions: number;
    averageOrderValue: number;
  };
  percentageChange: {
    revenue: number;
    transactions: number;
    averageOrderValue: number;
  };
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

export type ChartType = 'line' | 'bar' | 'pie' | 'area';
export type MetricsPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface DashboardFilters {
  dateRange: DateRange;
  period: MetricsPeriod;
  category?: string;
  paymentMethod?: 'cash' | 'card' | 'all';
  staffMember?: string;
}

export interface DashboardSettings {
  refreshInterval: number; // in seconds
  defaultChartType: ChartType;
  showComparisons: boolean;
  showProfitability: boolean;
  autoRefresh: boolean;
  chartAnimations: boolean;
}

// Mock data generation utilities
export interface MockDataConfig {
  startDate: Date;
  endDate: Date;
  baseRevenue: number;
  fluctuation: number;
  weekendMultiplier: number;
  peakHours: number[];
}

// Performance monitoring
export interface DashboardPerformance {
  loadTime: number;
  dataFetchTime: number;
  renderTime: number;
  chartRenderTime: number;
  totalMemoryUsage: number;
  timestamp: Date;
}

// Real-time updates
export interface RealTimeUpdate {
  type: 'new_sale' | 'refund' | 'inventory_alert' | 'system_event';
  data: any;
  timestamp: Date;
  userId?: string;
}