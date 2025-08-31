import React, { useState } from 'react';
import { ChartDataPoint, CategorySalesData, HourlySalesData } from '../types/dashboard';
import { DashboardUtils } from '../utils/dashboardUtils';

interface DashboardChartsProps {
  revenueData: ChartDataPoint[];
  categoryData: CategorySalesData[];
  hourlyData: HourlySalesData[];
  loading?: boolean;
}

interface SimpleLineChartProps {
  data: ChartDataPoint[];
  title: string;
  color: string;
  height?: number;
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  title,
  color,
  height = 280
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 001.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p>No chart data available</p>
        </div>
      </div>
    );
  }

  // Calculate responsive chart dimensions
  const padding = 50;
  const chartWidth = 480; // Fixed width for consistency
  const chartHeight = height - padding * 2;

  // Calculate data range with padding for better visualization
  const revenues = data.map(d => d.revenue);
  const maxRevenue = Math.max(...revenues);
  const minRevenue = Math.min(...revenues);
  const range = maxRevenue - minRevenue;
  const adjustedMin = range > 0 ? minRevenue - range * 0.1 : minRevenue - 1;
  const adjustedMax = range > 0 ? maxRevenue + range * 0.1 : maxRevenue + 1;
  const adjustedRange = adjustedMax - adjustedMin;

  // Generate SVG path with proper scaling
  const pathData = data
    .map((point, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * chartWidth + padding;
      const y = chartHeight - ((point.revenue - adjustedMin) / adjustedRange) * chartHeight + padding;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate area path for gradient fill
  const areaData = `${pathData} L ${chartWidth + padding} ${chartHeight + padding} L ${padding} ${chartHeight + padding} Z`;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
          <span className="text-sm text-gray-600">Revenue</span>
        </div>
      </div>
      
      <div className="relative overflow-hidden" style={{ height: height }}>
        <svg width="100%" height={height} className="w-full">
          <defs>
            <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.05 }} />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <g key={ratio}>
              <line
                x1={padding}
                y1={chartHeight * (1 - ratio) + padding}
                x2={chartWidth + padding}
                y2={chartHeight * (1 - ratio) + padding}
                stroke="#f3f4f6"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <text
                x={padding - 10}
                y={chartHeight * (1 - ratio) + padding + 4}
                textAnchor="end"
                fontSize="11"
                fill="#9ca3af"
                className="font-mono"
              >
                {DashboardUtils.formatCurrency(adjustedMin + adjustedRange * ratio)}
              </text>
            </g>
          ))}
          
          {/* Area fill with gradient */}
          <path
            d={areaData}
            fill={`url(#gradient-${color.replace('#', '')})`}
            stroke="none"
          />
          
          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
          />
          
          {/* Data points with hover effects */}
          {data.map((point, index) => {
            const x = (index / Math.max(data.length - 1, 1)) * chartWidth + padding;
            const y = chartHeight - ((point.revenue - adjustedMin) / adjustedRange) * chartHeight + padding;
            
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="white"
                  stroke={color}
                  strokeWidth="3"
                  className="drop-shadow-sm hover:r-6 transition-all cursor-pointer"
                >
                  <title>{`${new Date(point.date).toLocaleDateString()}: ${DashboardUtils.formatCurrency(point.revenue)}`}</title>
                </circle>
                
                {/* X-axis labels - show fewer labels for better readability */}
                {(data.length <= 7 || index % Math.max(1, Math.ceil(data.length / 5)) === 0) && (
                  <text
                    x={x}
                    y={height - 15}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#6b7280"
                    className="font-medium"
                  >
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Chart stats */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-500">Peak</div>
            <div className="font-semibold text-green-600">
              {DashboardUtils.formatCurrency(maxRevenue)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Average</div>
            <div className="font-semibold text-blue-600">
              {DashboardUtils.formatCurrency(revenues.reduce((a, b) => a + b, 0) / revenues.length)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Total Days</div>
            <div className="font-semibold text-gray-600">{data.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PieChartProps {
  data: CategorySalesData[];
  title: string;
  size?: number;
}

const SimplePieChart: React.FC<PieChartProps> = ({
  data,
  title,
  size = 220
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 001.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p>No category data available</p>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.revenue, 0);
  const radius = size / 2 - 30;
  const innerRadius = radius * 0.4;
  const centerX = size / 2;
  const centerY = size / 2;

  // Enhanced color palette for better visual distinction
  const enhancedData = data.map((item, index) => ({
    ...item,
    color: item.color === '#999999' ? 
      ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'][index % 7] : 
      item.color
  }));

  let cumulativePercentage = 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="text-sm text-gray-500">
          Total: {DashboardUtils.formatCurrency(total)}
        </div>
      </div>
      
      <div className="flex items-start justify-between">
        {/* Donut Chart */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="drop-shadow-sm">
            <defs>
              {enhancedData.map((segment, index) => (
                <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: segment.color, stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: segment.color, stopOpacity: 0.8 }} />
                </linearGradient>
              ))}
            </defs>
            
            {enhancedData.map((segment, index) => {
              const percentage = segment.revenue / total;
              const startAngle = cumulativePercentage * 2 * Math.PI - Math.PI / 2;
              const endAngle = (cumulativePercentage + percentage) * 2 * Math.PI - Math.PI / 2;
              
              const x1 = centerX + radius * Math.cos(startAngle);
              const y1 = centerY + radius * Math.sin(startAngle);
              const x2 = centerX + radius * Math.cos(endAngle);
              const y2 = centerY + radius * Math.sin(endAngle);
              
              const innerX1 = centerX + innerRadius * Math.cos(startAngle);
              const innerY1 = centerY + innerRadius * Math.sin(startAngle);
              const innerX2 = centerX + innerRadius * Math.cos(endAngle);
              const innerY2 = centerY + innerRadius * Math.sin(endAngle);
              
              const largeArc = percentage > 0.5 ? 1 : 0;
              
              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                `L ${innerX2} ${innerY2}`,
                `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerX1} ${innerY1}`,
                'Z'
              ].join(' ');
              
              cumulativePercentage += percentage;
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={`url(#gradient-${index})`}
                  stroke="white"
                  strokeWidth="3"
                  opacity={hoveredSegment === null || hoveredSegment === index ? 1 : 0.7}
                  transform={hoveredSegment === index ? `translate(${Math.cos(startAngle + (endAngle - startAngle) / 2) * 5}, ${Math.sin(startAngle + (endAngle - startAngle) / 2) * 5})` : ''}
                  onMouseEnter={() => setHoveredSegment(index)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                >
                  <title>{`${segment.category}: ${DashboardUtils.formatCurrency(segment.revenue)} (${segment.percentage.toFixed(1)}%)`}</title>
                </path>
              );
            })}
            
            {/* Center text */}
            <text x={centerX} y={centerY - 5} textAnchor="middle" className="text-lg font-bold fill-gray-700">
              {enhancedData.length}
            </text>
            <text x={centerX} y={centerY + 15} textAnchor="middle" className="text-sm fill-gray-500">
              Categories
            </text>
          </svg>
        </div>
        
        {/* Compact Legend */}
        <div className="ml-6 flex-1 min-w-0">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {enhancedData.map((segment, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  hoveredSegment === index ? 'bg-gray-50 shadow-sm' : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                    style={{ backgroundColor: segment.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">{segment.category}</div>
                    <div className="text-xs text-gray-500">{segment.transactions} orders</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="font-semibold text-gray-900">
                    {DashboardUtils.formatCurrency(segment.revenue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {segment.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface BarChartProps {
  data: HourlySalesData[];
  title: string;
}

const SimpleBarChart: React.FC<BarChartProps> = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 001.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p>No hourly data available</p>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const chartHeight = 220;
  const barWidth = Math.min(24, (600 - 40) / data.length - 8);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-orange-400 to-orange-500"></div>
            <span className="text-gray-600">Business Hours</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-gray-300 to-gray-400"></div>
            <span className="text-gray-600">Off Hours</span>
          </div>
        </div>
      </div>
      
      <div className="relative">
        {/* Chart container with proper height */}
        <div className="flex items-end justify-center space-x-2 overflow-x-auto pb-8" 
             style={{ height: chartHeight + 40 }}>
          {data.map((point, index) => {
            const barHeight = maxRevenue > 0 ? (point.revenue / maxRevenue) * chartHeight : 0;
            const isBusinessHour = point.hour >= 7 && point.hour <= 19;
            const isPeakHour = point.hour >= 8 && point.hour <= 9 || point.hour >= 12 && point.hour <= 13 || point.hour >= 17 && point.hour <= 18;
            
            return (
              <div key={index} className="flex flex-col items-center group">
                {/* Bar with gradient and hover effects */}
                <div
                  className={`rounded-t-lg shadow-sm transition-all duration-300 cursor-pointer relative ${
                    isPeakHour ? 'ring-2 ring-orange-200' : ''
                  }`}
                  style={{ 
                    width: barWidth,
                    height: Math.max(barHeight, 3),
                    background: isBusinessHour 
                      ? 'linear-gradient(to top, #ea580c, #fb923c)' 
                      : 'linear-gradient(to top, #6b7280, #9ca3af)',
                    minHeight: '3px'
                  }}
                  title={`${point.label}: ${DashboardUtils.formatCurrency(point.revenue)} (${point.transactions} orders)`}
                >
                  {/* Value label on hover */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {DashboardUtils.formatCurrency(point.revenue)}
                  </div>
                </div>
                
                {/* Hour label */}
                <div className="mt-2 text-xs text-gray-600 font-medium transform">
                  <div className="writing-mode-vertical text-center">
                    {point.hour}h
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-4">
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <div key={ratio} className="text-right font-mono">
              {DashboardUtils.formatCurrency(maxRevenue * ratio)}
            </div>
          ))}
        </div>
      </div>
      
      {/* Summary stats */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-semibold text-orange-600">
              {DashboardUtils.formatCurrency(
                data.filter(h => h.hour >= 7 && h.hour <= 19).reduce((sum, h) => sum + h.revenue, 0)
              )}
            </div>
            <div className="text-gray-500">Business Hours</div>
          </div>
          <div>
            <div className="font-semibold text-blue-600">
              {data.reduce((max, hour) => hour.revenue > max.revenue ? hour : max).label}
            </div>
            <div className="text-gray-500">Peak Hour</div>
          </div>
          <div>
            <div className="font-semibold text-gray-600">
              {data.filter(h => h.revenue > 0).length}h
            </div>
            <div className="text-gray-500">Active Hours</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardCharts: React.FC<DashboardChartsProps> = ({
  revenueData,
  categoryData,
  hourlyData,
  loading = false
}) => {
  const [activeChart, setActiveChart] = useState<'revenue' | 'category' | 'hourly'>('revenue');

  if (loading) {
    return (
      <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse border border-gray-100">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="mt-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Enhanced Chart Navigation */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
          <div className="flex space-x-1">
            {[
              { key: 'revenue', label: 'Revenue Trend', icon: '📈', description: 'Daily revenue performance' },
              { key: 'category', label: 'Category Breakdown', icon: '🥧', description: 'Sales by product category' },
              { key: 'hourly', label: 'Hourly Sales', icon: '⏰', description: 'Peak hours analysis' }
            ].map(chart => (
              <button
                key={chart.key}
                onClick={() => setActiveChart(chart.key as any)}
                className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeChart === chart.key
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">{chart.icon}</span>
                  <span className="font-semibold">{chart.label}</span>
                </div>
                {activeChart === chart.key && (
                  <div className="text-xs text-orange-100 mt-1">{chart.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Content with Better Layout */}
      <div className="space-y-6">
        {activeChart === 'revenue' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <SimpleLineChart
                data={revenueData}
                title="Daily Revenue Trend"
                color="#f59e0b"
              />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center space-x-2 mb-6">
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 001.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-800">Revenue Insights</h3>
              </div>
              <div className="space-y-4">
                {revenueData.length > 0 && (
                  <>
                    <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <div className="text-sm text-green-600 font-medium">Best Performance</div>
                      <div className="text-lg font-bold text-green-800">
                        {DashboardUtils.formatCurrency(Math.max(...revenueData.map(d => d.revenue)))}
                      </div>
                      <div className="text-xs text-green-600">
                        {new Date(revenueData.reduce((max, day) => day.revenue > max.revenue ? day : max).date)
                          .toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                        }
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <div className="text-sm text-blue-600 font-medium">Daily Average</div>
                      <div className="text-lg font-bold text-blue-800">
                        {DashboardUtils.formatCurrency(
                          revenueData.reduce((sum, d) => sum + d.revenue, 0) / revenueData.length
                        )}
                      </div>
                      <div className="text-xs text-blue-600">Across {revenueData.length} days</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                      <div className="text-sm text-orange-600 font-medium">Total Revenue</div>
                      <div className="text-lg font-bold text-orange-800">
                        {DashboardUtils.formatCurrency(revenueData.reduce((sum, d) => sum + d.revenue, 0))}
                      </div>
                      <div className="text-xs text-orange-600">For selected period</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeChart === 'category' && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-3">
              <SimplePieChart
                data={categoryData}
                title="Sales Distribution by Category"
              />
            </div>
            <div className="xl:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center space-x-2 mb-6">
                <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-800">Top Categories</h3>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {categoryData
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-sm transition-all">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div 
                            className="w-5 h-5 rounded-full shadow-sm"
                            style={{ backgroundColor: category.color === '#999999' ? 
                              ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'][index % 7] : 
                              category.color 
                            }}
                          />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                            {index + 1}
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{category.category}</div>
                          <div className="text-xs text-gray-500">{category.transactions} orders • Avg: {DashboardUtils.formatCurrency(category.averageOrderValue)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{DashboardUtils.formatCurrency(category.revenue)}</div>
                        <div className="text-xs font-medium text-gray-500">{category.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {activeChart === 'hourly' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <SimpleBarChart
                data={hourlyData}
                title="Sales Activity Throughout the Day"
              />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center space-x-2 mb-6">
                <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-800">Hour Analysis</h3>
              </div>
              <div className="space-y-4">
                {hourlyData.length > 0 && (
                  <>
                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-100">
                      <div className="text-sm text-indigo-600 font-medium">Peak Hour</div>
                      <div className="text-2xl font-bold text-indigo-800">
                        {hourlyData.reduce((max, hour) => hour.revenue > max.revenue ? hour : max).label}
                      </div>
                      <div className="text-sm text-indigo-600">
                        {DashboardUtils.formatCurrency(Math.max(...hourlyData.map(h => h.revenue)))} revenue
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="text-sm font-medium text-orange-700">Business Hours</span>
                        <span className="font-bold text-orange-800">
                          {DashboardUtils.formatCurrency(
                            hourlyData.filter(h => h.hour >= 7 && h.hour <= 19).reduce((sum, h) => sum + h.revenue, 0)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Off Hours</span>
                        <span className="font-bold text-gray-800">
                          {DashboardUtils.formatCurrency(
                            hourlyData.filter(h => h.hour < 7 || h.hour > 19).reduce((sum, h) => sum + h.revenue, 0)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium text-green-700">Active Hours</span>
                        <span className="font-bold text-green-800">
                          {hourlyData.filter(h => h.revenue > 0).length} hours
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCharts;