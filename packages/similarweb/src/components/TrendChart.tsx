import React from 'react';
import { Line } from 'react-chartjs-2';
import type { TrendData } from '../types';
import { formatNumber, formatPercentageChange } from '../utils';

interface TrendChartProps {
  data: TrendData[];
  title: string;
  color?: string;
  showPercentageChange?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  title,
  color = '#2563eb',
  showPercentageChange = true
}) => {
  // Tính phần trăm thay đổi
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const percentageChange = firstValue !== 0 
    ? ((lastValue - firstValue) / firstValue) * 100 
    : 0;

  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: title,
        data: data.map(item => item.value),
        fill: false,
        borderColor: color,
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${title}: ${formatNumber(context.raw)}`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value: number) => formatNumber(value)
        }
      }
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {showPercentageChange && (
          <div className={`text-sm font-medium ${
            percentageChange > 0 ? 'text-green-600' : 
            percentageChange < 0 ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {formatPercentageChange(percentageChange)}
          </div>
        )}
      </div>
      <Line data={chartData} options={options} />
    </div>
  );
}; 