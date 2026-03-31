'use client';

import React from 'react';
import { CheckCircle2, Circle, Lock } from 'lucide-react';

export type ModuleStatus = 'completed' | 'in-progress' | 'locked' | 'not-started';

interface StatusIconProps {
  status: ModuleStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusIcon: React.FC<StatusIconProps> = ({ status, size = 'md' }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const sizeClass = sizeMap[size];

  switch (status) {
    case 'completed':
      return (
        <div className={`${sizeClass} text-green-500 flex-shrink-0`} title="Sudah Selesai">
          <CheckCircle2 className="w-full h-full" />
        </div>
      );

    case 'in-progress':
      return (
        <div className={`${sizeClass} text-[#F5C518] flex-shrink-0 animate-pulse`} title="Sedang Dikerjakan">
          <Circle className="w-full h-full fill-current" />
        </div>
      );

    case 'locked':
      return (
        <div className={`${sizeClass} text-gray-300 flex-shrink-0`} title="Terkunci">
          <Lock className="w-full h-full" />
        </div>
      );

    case 'not-started':
    default:
      return (
        <div className={`${sizeClass} text-gray-300 flex-shrink-0`} title="Belum Dimulai">
          <Circle className="w-full h-full" />
        </div>
      );
  }
};
