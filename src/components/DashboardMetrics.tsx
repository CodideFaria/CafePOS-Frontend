import React from 'react';
import { SalesMetrics, ComparisonData } from '../types/dashboard';
import { DashboardUtils } from '../utils/dashboardUtils';

interface DashboardMetricsProps {
  metrics: SalesMetrics;
  comparison?: ComparisonData;
  loading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
    color: string;
  };
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-gray-100">
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
        
        {trend && (
          <div className={`text-right ${trend.color}`}>
            <div className="flex items-center space-x-1">
              <span className="text-lg">
                {trend.direction === 'up' ? '📈' : trend.direction === 'down' ? '📉' : '➡️'}
              </span>
              <span className="font-semibold">
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
            </div>
            <p className="text-xs text-gray-500">vs previous period</p>
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  metrics,
  comparison,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const getTrend = (current: number, previous?: number) => {
    if (!previous) return undefined;
    
    const change = DashboardUtils.calculatePercentageChange(current, previous);
    const indicator = DashboardUtils.getTrendIndicator(change);
    
    return {
      value: change,
      direction: indicator.direction,
      color: indicator.color
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Revenue */}
      <MetricCard
        title="Total Revenue"
        value={DashboardUtils.formatCurrency(metrics.totalRevenue)}
        subtitle={`Daily: ${DashboardUtils.formatCurrency(metrics.dailyRevenue)}`}
        icon={
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        }
        trend={getTrend(metrics.totalRevenue, comparison?.previousPeriod.revenue)}
        className="border-green-500"
      />

      {/* Total Transactions */}
      <MetricCard
        title="Transactions"
        value={metrics.totalTransactions.toLocaleString()}
        subtitle={`Today: ${metrics.dailyTransactions}`}
        icon={
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
        trend={getTrend(metrics.totalTransactions, comparison?.previousPeriod.transactions)}
        className="border-blue-500"
      />

      {/* Average Order Value */}
      <MetricCard
        title="Avg Order Value"
        value={DashboardUtils.formatCurrency(metrics.averageOrderValue)}
        subtitle="Per transaction"
        icon={
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1.2 12H6.2L5 9z" />
          </svg>
        }
        trend={getTrend(metrics.averageOrderValue, comparison?.previousPeriod.averageOrderValue)}
        className="border-orange-500"
      />

      {/* Total Customers */}
      <MetricCard
        title="Customers"
        value={metrics.totalCustomers.toLocaleString()}
        subtitle={`${metrics.returningCustomers} returning, ${metrics.newCustomers} new`}
        icon={
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
        className="border-purple-500"
      />
    </div>
  );
};

export default DashboardMetrics;