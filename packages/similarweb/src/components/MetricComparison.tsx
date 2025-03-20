import React from 'react';
import type { ComparisonData } from '../types';
import { formatNumber, formatPercentageChange } from '../utils';

interface MetricComparisonProps {
  data: ComparisonData;
  title: string;
  formatValue?: (value: number) => string;
}

export const MetricComparison: React.FC<MetricComparisonProps> = ({
  data,
  title,
  formatValue = formatNumber
}) => {
  const { current, previous, percentageChange, trend } = data;

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      
      <div className="flex justify-between items-center">
        <div>
          <div className="text-2xl font-bold">
            {formatValue(current)}
          </div>
          <div className="text-sm text-gray-500">
            Trước đó: {formatValue(previous)}
          </div>
        </div>

        <div className={`flex items-center text-sm font-medium ${
          trend === 'up' ? 'text-green-600' : 
          trend === 'down' ? 'text-red-600' : 
          'text-gray-600'
        }`}>
          {trend === 'up' && (
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          )}
          {trend === 'down' && (
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          {trend === 'stable' && (
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
          )}
          <span>{formatPercentageChange(percentageChange)}</span>
        </div>
      </div>
    </div>
  );
}; 