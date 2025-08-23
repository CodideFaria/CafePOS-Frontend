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
  height = 300
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  // Calculate chart dimensions
  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const minRevenue = Math.min(...data.map(d => d.revenue));
  const range = maxRevenue - minRevenue;
  const padding = 40;
  const chartWidth = 600;
  const chartHeight = height - padding * 2;

  // Generate SVG path
  const pathData = data
    .map((point, index) => {
      const x = (index / (data.length - 1)) * chartWidth + padding;
      const y = chartHeight - ((point.revenue - minRevenue) / range) * chartHeight + padding;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate area path (for fill)
  const areaData = `${pathData} L ${chartWidth + padding} ${chartHeight + padding} L ${padding} ${chartHeight + padding} Z`;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      <div className="relative">
        <svg width={chartWidth + padding * 2} height={height} className="overflow-visible">
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
              />
              <text
                x={padding - 10}
                y={chartHeight * (1 - ratio) + padding + 4}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
              >
                {DashboardUtils.formatCurrency(minRevenue + range * ratio)}
              </text>
            </g>
          ))}
          
          {/* Area fill */}
          <path
            d={areaData}
            fill={`${color}20`}
            stroke="none"
          />
          
          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * chartWidth + padding;
            const y = chartHeight - ((point.revenue - minRevenue) / range) * chartHeight + padding;
            
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                />
                
                {/* X-axis labels */}
                {index % Math.ceil(data.length / 6) === 0 && (
                  <text
                    x={x}
                    y={height - 10}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#6b7280"
                  >
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
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
  size = 200
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.revenue, 0);
  const radius = size / 2 - 20;
  const centerX = size / 2;
  const centerY = size / 2;

  let cumulativePercentage = 0;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      <div className="flex items-center justify-between">
        <svg width={size} height={size}>
          {data.map((segment, index) => {
            const percentage = segment.revenue / total;
            const startAngle = cumulativePercentage * 2 * Math.PI - Math.PI / 2;
            const endAngle = (cumulativePercentage + percentage) * 2 * Math.PI - Math.PI / 2;
            
            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);
            
            const largeArc = percentage > 0.5 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            cumulativePercentage += percentage;
            
            return (
              <path
                key={index}
                d={pathData}
                fill={segment.color}
                stroke="white"
                strokeWidth="2"
                opacity={hoveredSegment === index ? 0.8 : 1}
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
                style={{ cursor: 'pointer' }}
              />
            );
          })}
        </svg>
        
        {/* Legend */}
        <div className="ml-6 space-y-2">
          {data.map((segment, index) => (
            <div 
              key={index} 
              className="flex items-center space-x-2 text-sm cursor-pointer"
              onMouseEnter={() => setHoveredSegment(index)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: segment.color }}
              ></div>
              <span className="font-medium">{segment.category}</span>
              <span className="text-gray-600">
                {DashboardUtils.formatCurrency(segment.revenue)} ({segment.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
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
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const chartHeight = 200;
  const barWidth = 20;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      <div className="flex items-end space-x-1 overflow-x-auto pb-4" style={{ height: chartHeight + 40 }}>
        {data.map((point, index) => {
          const barHeight = (point.revenue / maxRevenue) * chartHeight;
          const isBusinessHour = point.hour >= 7 && point.hour <= 19;
          
          return (
            <div key={index} className="flex flex-col items-center space-y-2">
              <div
                className={`rounded-t transition-all duration-300 hover:opacity-80 ${
                  isBusinessHour ? 'bg-orange-500' : 'bg-gray-300'
                }`}
                style={{ 
                  width: barWidth, 
                  height: Math.max(barHeight, 2),
                  minHeight: '2px'
                }}
                title={`${point.label}: ${DashboardUtils.formatCurrency(point.revenue)} (${point.transactions} transactions)`}
              ></div>
              <span className="text-xs text-gray-600 transform -rotate-45 origin-center">
                {point.label}
              </span>
            </div>
          );
        })}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Chart type selector */}
      <div className="mb-6">
        <div className="flex space-x-4 border-b">
          {[
            { key: 'revenue', label: 'Revenue Trend', icon: '📈' },
            { key: 'category', label: 'Category Breakdown', icon: '🥧' },
            { key: 'hourly', label: 'Hourly Sales', icon: '⏰' }
          ].map(chart => (
            <button
              key={chart.key}
              onClick={() => setActiveChart(chart.key as any)}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeChart === chart.key
                  ? 'text-orange-600 border-orange-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{chart.icon}</span>
              {chart.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeChart === 'revenue' && (
          <>
            <SimpleLineChart
              data={revenueData}
              title="Revenue Over Time"
              color="#f59e0b"
            />
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Insights</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Peak Day:</span>
                  <span className="font-medium">
                    {revenueData.length > 0 && 
                      new Date(revenueData.reduce((max, day) => day.revenue > max.revenue ? day : max).date)
                        .toLocaleDateString()
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Best Revenue:</span>
                  <span className="font-medium">
                    {revenueData.length > 0 && 
                      DashboardUtils.formatCurrency(Math.max(...revenueData.map(d => d.revenue)))
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Daily:</span>
                  <span className="font-medium">
                    {revenueData.length > 0 && 
                      DashboardUtils.formatCurrency(
                        revenueData.reduce((sum, d) => sum + d.revenue, 0) / revenueData.length
                      )
                    }
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeChart === 'category' && (
          <>
            <SimplePieChart
              data={categoryData}
              title="Sales by Category"
            />
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Category Performance</h3>
              <div className="space-y-3">
                {categoryData.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="font-medium">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{DashboardUtils.formatCurrency(category.revenue)}</div>
                      <div className="text-sm text-gray-600">{category.transactions} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeChart === 'hourly' && (
          <>
            <SimpleBarChart
              data={hourlyData}
              title="Hourly Sales Distribution"
            />
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Peak Hours Analysis</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Peak Hour:</span>
                  <span className="font-medium">
                    {hourlyData.length > 0 && 
                      hourlyData.reduce((max, hour) => hour.revenue > max.revenue ? hour : max).label
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Business Hours (7AM-7PM):</span>
                  <span className="font-medium">
                    {DashboardUtils.formatCurrency(
                      hourlyData
                        .filter(h => h.hour >= 7 && h.hour <= 19)
                        .reduce((sum, h) => sum + h.revenue, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">After Hours:</span>
                  <span className="font-medium">
                    {DashboardUtils.formatCurrency(
                      hourlyData
                        .filter(h => h.hour < 7 || h.hour > 19)
                        .reduce((sum, h) => sum + h.revenue, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardCharts;