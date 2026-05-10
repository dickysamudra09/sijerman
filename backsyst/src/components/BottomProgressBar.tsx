"use client";

import { motion } from "framer-motion";

interface BottomProgressBarProps {
  percentage: number;
  showLabel?: boolean;
}

export function BottomProgressBar({ 
  percentage, 
  showLabel = true 
}: BottomProgressBarProps) {
  return (
    <div className="sticky bottom-0 z-40 bg-white border-t border-gray-200">
      {showLabel && (
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
            Progress
          </span>
          <span className="text-xs font-bold" style={{ color: '#E8B824' }}>
            {percentage}%
          </span>
        </div>
      )}
      
      <div className="h-2 bg-gray-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full"
          style={{
            background: percentage === 100 
              ? 'linear-gradient(90deg, #16A34A 0%, #22C55E 100%)'
              : 'linear-gradient(90deg, #E8B824 0%, #F5C518 100%)',
          }}
        />
      </div>
    </div>
  );
}
