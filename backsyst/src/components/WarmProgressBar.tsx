'use client';

import React from 'react';

interface WarmProgressBarProps {
  percentage: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  height?: 'sm' | 'md' | 'lg';
}

export const WarmProgressBar: React.FC<WarmProgressBarProps> = ({
  percentage,
  label,
  showPercentage = true,
  height = 'md',
}) => {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  const heightMap = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const heightClass = heightMap[height];

  return (
    <div className="w-full">
      {/* Label & Percentage */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
          {showPercentage && (
            <span className="text-sm font-semibold text-[#F5C518]">{clampedPercentage}%</span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className="h-full bg-[#F5C518] rounded-full transition-all duration-300 ease-out shadow-sm"
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
};
