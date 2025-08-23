import {
  SalesData,
  SalesMetrics,
  ChartDataPoint,
  TopSellingProduct,
  CategorySalesData,
  HourlySalesData,
  ComparisonData,
  DateRange,
  MetricsPeriod,
  MockDataConfig,
  DashboardPerformance
} from '../types/dashboard';
import { Order } from '../types/order';

export class DashboardUtils {
  /**
   * Generate mock sales data for development and testing
   */
  static generateMockSalesData(config: MockDataConfig): SalesData {
    const { startDate, endDate, baseRevenue, fluctuation, weekendMultiplier, peakHours } = config;
    
    const chartData: ChartDataPoint[] = [];
    const dailyData: Record<string, { revenue: number; transactions: number }> = {};
    
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      const multiplier = isWeekend ? weekendMultiplier : 1;
      
      const dayRevenue = baseRevenue * multiplier * (1 + (Math.random() - 0.5) * fluctuation);
      const dayTransactions = Math.floor(dayRevenue / (15 + Math.random() * 30)); // Average order $15-45
      
      chartData.push({
        date: dateStr,
        revenue: Math.round(dayRevenue * 100) / 100,
        transactions: dayTransactions,
        averageOrderValue: Math.round((dayRevenue / dayTransactions) * 100) / 100
      });
      
      dailyData[dateStr] = { revenue: dayRevenue, transactions: dayTransactions };
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const totalRevenue = chartData.reduce((sum, day) => sum + day.revenue, 0);
    const totalTransactions = chartData.reduce((sum, day) => sum + day.transactions, 0);
    const averageOrderValue = totalRevenue / totalTransactions;
    
    const metrics: SalesMetrics = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      dailyRevenue: chartData[chartData.length - 1]?.revenue || 0,
      weeklyRevenue: Math.round(chartData.slice(-7).reduce((sum, day) => sum + day.revenue, 0) * 100) / 100,
      monthlyRevenue: Math.round(chartData.slice(-30).reduce((sum, day) => sum + day.revenue, 0) * 100) / 100,
      totalTransactions,
      dailyTransactions: chartData[chartData.length - 1]?.transactions || 0,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      totalCustomers: Math.floor(totalTransactions * 0.7), // Assuming some repeat customers
      returningCustomers: Math.floor(totalTransactions * 0.3),
      newCustomers: Math.floor(totalTransactions * 0.4)
    };
    
    const topProducts = this.generateMockTopProducts();
    const categoryBreakdown = this.generateMockCategoryBreakdown(totalRevenue);
    const hourlyBreakdown = this.generateMockHourlyBreakdown(peakHours);
    const comparisonData = this.generateMockComparisonData(metrics);
    
    return {
      metrics,
      chartData,
      topProducts,
      categoryBreakdown,
      hourlyBreakdown,
      comparisonData
    };
  }
  
  /**
   * Calculate sales metrics from order data
   */
  static calculateMetricsFromOrders(orders: Order[]): SalesMetrics {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalTransactions = orders.length;
    
    const dailyOrders = orders.filter(order => new Date(order.timestamp) >= today);
    const weeklyOrders = orders.filter(order => new Date(order.timestamp) >= weekAgo);
    const monthlyOrders = orders.filter(order => new Date(order.timestamp) >= monthAgo);
    
    const dailyRevenue = dailyOrders.reduce((sum, order) => sum + order.total, 0);
    const weeklyRevenue = weeklyOrders.reduce((sum, order) => sum + order.total, 0);
    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.total, 0);
    
    // Calculate unique customers (simplified - using staffId as customer identifier for demo)
    const uniqueCustomers = new Set(orders.map(order => order.staffId)).size;
    
    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      dailyRevenue: Math.round(dailyRevenue * 100) / 100,
      weeklyRevenue: Math.round(weeklyRevenue * 100) / 100,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      totalTransactions,
      dailyTransactions: dailyOrders.length,
      averageOrderValue: Math.round((totalRevenue / totalTransactions || 0) * 100) / 100,
      totalCustomers: uniqueCustomers,
      returningCustomers: Math.floor(uniqueCustomers * 0.6),
      newCustomers: Math.floor(uniqueCustomers * 0.4)
    };
  }
  
  /**
   * Generate date ranges for common periods
   */
  static getDateRangesForPeriod(period: MetricsPeriod): DateRange {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return {
          startDate: today,
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
          label: 'Today'
        };
      
      case 'week':
        const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
        return {
          startDate: weekStart,
          endDate: weekEnd,
          label: 'This Week'
        };
      
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return {
          startDate: monthStart,
          endDate: monthEnd,
          label: 'This Month'
        };
      
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59);
        return {
          startDate: quarterStart,
          endDate: quarterEnd,
          label: 'This Quarter'
        };
      
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        return {
          startDate: yearStart,
          endDate: yearEnd,
          label: 'This Year'
        };
      
      default:
        // Last 30 days for custom/default
        return {
          startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
          endDate: today,
          label: 'Last 30 Days'
        };
    }
  }
  
  /**
   * Format currency values
   */
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
  
  /**
   * Calculate percentage change
   */
  static calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  }
  
  /**
   * Get trend indicator
   */
  static getTrendIndicator(change: number): { direction: 'up' | 'down' | 'stable'; color: string; icon: string } {
    if (change > 2) {
      return { direction: 'up', color: 'text-green-600', icon: '📈' };
    } else if (change < -2) {
      return { direction: 'down', color: 'text-red-600', icon: '📉' };
    } else {
      return { direction: 'stable', color: 'text-gray-600', icon: '➡️' };
    }
  }
  
  /**
   * Performance monitoring
   */
  static measurePerformance<T>(operation: () => T, label: string): { result: T; time: number } {
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    const time = Math.round((end - start) * 100) / 100;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Dashboard Performance - ${label}: ${time}ms`);
    }
    
    return { result, time };
  }
  
  /**
   * Generate chart colors
   */
  static generateChartColors(count: number): string[] {
    const baseColors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
      '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
      '#4BC0C0', '#FF6384'
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
  }
  
  private static generateMockTopProducts(): TopSellingProduct[] {
    const products = [
      { name: 'Latte', category: 'Coffee', baseQuantity: 45, baseRevenue: 180 },
      { name: 'Cappuccino', category: 'Coffee', baseQuantity: 38, baseRevenue: 152 },
      { name: 'Americano', category: 'Coffee', baseQuantity: 32, baseRevenue: 96 },
      { name: 'Croissant', category: 'Pastry', baseQuantity: 28, baseRevenue: 84 },
      { name: 'Espresso', category: 'Coffee', baseQuantity: 25, baseRevenue: 75 },
      { name: 'Muffin', category: 'Pastry', baseQuantity: 22, baseRevenue: 66 },
      { name: 'Flat White', category: 'Coffee', baseQuantity: 20, baseRevenue: 80 },
      { name: 'Tea', category: 'Tea', baseQuantity: 18, baseRevenue: 54 }
    ];
    
    return products.map((product, index) => ({
      id: `product-${index}`,
      name: product.name,
      category: product.category,
      quantitySold: product.baseQuantity + Math.floor(Math.random() * 10),
      revenue: product.baseRevenue + Math.floor(Math.random() * 30),
      profitMargin: 60 + Math.floor(Math.random() * 20)
    }));
  }
  
  private static generateMockCategoryBreakdown(totalRevenue: number): CategorySalesData[] {
    const categories = [
      { name: 'Coffee', percentage: 0.65, color: '#8B4513' },
      { name: 'Pastries', percentage: 0.20, color: '#DEB887' },
      { name: 'Tea', percentage: 0.10, color: '#228B22' },
      { name: 'Other', percentage: 0.05, color: '#778899' }
    ];
    
    return categories.map(category => ({
      category: category.name,
      revenue: Math.round(totalRevenue * category.percentage * 100) / 100,
      percentage: category.percentage * 100,
      transactions: Math.floor(totalRevenue * category.percentage / 4), // Assume $4 average per item
      averageOrderValue: 4 + Math.random() * 2,
      color: category.color
    }));
  }
  
  private static generateMockHourlyBreakdown(peakHours: number[]): HourlySalesData[] {
    const hours = [];
    for (let hour = 0; hour < 24; hour++) {
      const isPeak = peakHours.includes(hour);
      const baseRevenue = isPeak ? 120 : 30;
      const revenue = baseRevenue + Math.random() * 40;
      const transactions = Math.floor(revenue / 12); // $12 average order
      
      hours.push({
        hour,
        revenue: Math.round(revenue * 100) / 100,
        transactions,
        label: `${hour.toString().padStart(2, '0')}:00`
      });
    }
    
    return hours;
  }
  
  private static generateMockComparisonData(metrics: SalesMetrics): ComparisonData {
    const previousPeriod = {
      revenue: metrics.totalRevenue * (0.85 + Math.random() * 0.3),
      transactions: Math.floor(metrics.totalTransactions * (0.9 + Math.random() * 0.2)),
      averageOrderValue: metrics.averageOrderValue * (0.95 + Math.random() * 0.1)
    };
    
    return {
      previousPeriod,
      percentageChange: {
        revenue: this.calculatePercentageChange(metrics.totalRevenue, previousPeriod.revenue),
        transactions: this.calculatePercentageChange(metrics.totalTransactions, previousPeriod.transactions),
        averageOrderValue: this.calculatePercentageChange(metrics.averageOrderValue, previousPeriod.averageOrderValue)
      }
    };
  }
}