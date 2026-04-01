'use client';

import React from 'react';
import { StatusIcon, type ModuleStatus } from './StatusIcon';
import { ChevronRight, BookOpen, Lock } from 'lucide-react';

export interface ModuleItem {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  moduleType: string; 
  isCompleted: boolean;
  isAvailable: boolean;
  estimatedMinutes?: number;
}

interface ModuleTimelineProps {
  modules: ModuleItem[];
  onModuleClick: (moduleId: string) => void;
  currentModuleId?: string;
}

const getModuleIcon = (moduleType: string) => {
  switch (moduleType.toLowerCase()) {
    case 'kuis':
      return '📋';
    case 'latihan':
      return '✏️';
    case 'materi':
      return '📖';
    default:
      return '📚';
  }
};

const getModuleStatus = (
  isCompleted: boolean,
  isAvailable: boolean,
  moduleType: string
): ModuleStatus => {
  if (isCompleted) return 'completed';
  if (!isAvailable) return 'locked';
  return 'not-started';
};

const getModuleColor = (moduleType: string): string => {
  switch (moduleType.toLowerCase()) {
    case 'materi':
      return 'bg-blue-50 border-blue-200';
    case 'latihan':
      return 'bg-amber-50 border-amber-200';
    case 'kuis':
      return 'bg-purple-50 border-purple-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

export const ModuleTimeline: React.FC<ModuleTimelineProps> = ({
  modules,
  onModuleClick,
  currentModuleId,
}) => {
  return (
    <div className="space-y-4">
      {/* Timeline connecting line for desktop */}
      <div className="hidden md:block absolute left-[calc(50%-1px)] w-0.5 bg-gray-200 h-full" />

      {modules.map((module, index) => {
        const status = getModuleStatus(module.isCompleted, module.isAvailable, module.moduleType);
        const isCurrentModule = currentModuleId === module.id;
        const isClickable = module.isAvailable;

        return (
          <div key={module.id} className="flex gap-4 md:gap-6 relative group">
            {/* Timeline dot for desktop */}
            <div className="hidden md:flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full ring-4 z-10 ${
                  module.isCompleted
                    ? 'bg-green-500 ring-green-100'
                    : module.isAvailable
                      ? 'bg-[#F5C518] ring-yellow-100'
                      : 'bg-gray-300 ring-gray-100'
                }`}
              />
              {index < modules.length - 1 && <div className="w-0.5 bg-gray-200 flex-1 mt-2 mb-2" />}
            </div>

            {/* Module Card */}
            <button
              onClick={() => isClickable && onModuleClick(module.id)}
              disabled={!isClickable}
              className={`w-full text-left rounded-lg border-2 p-4 md:p-5 transition-all duration-200 ${
                getModuleColor(module.moduleType)
              } ${
                isCurrentModule
                  ? 'ring-2 ring-[#F5C518] border-[#F5C518] shadow-lg'
                  : 'border-current hover:border-[#F5C518] hover:shadow-md'
              } ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
            >
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="mt-1">
                  <StatusIcon
                    status={status}
                    size="md"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {`0${module.orderIndex + 1}. ${module.title}`}
                      </h3>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">
                        {getModuleIcon(module.moduleType)} {module.moduleType}
                      </p>
                    </div>

                    {/* Chevron indicator for clickable items */}
                    {isClickable && (
                      <ChevronRight
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                          isCurrentModule ? 'text-[#F5C518] translate-x-1' : ''
                        }`}
                      />
                    )}

                    {/* Lock indicator for locked items */}
                    {!isClickable && <Lock className="w-5 h-5 text-gray-300 flex-shrink-0" />}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2">{module.description}</p>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {module.estimatedMinutes && (
                      <span className="flex items-center gap-1">
                        <span>⏱️</span>
                        {module.estimatedMinutes} menit
                      </span>
                    )}
                    {module.isCompleted && <span className="text-green-600 font-medium">✓ Selesai</span>}
                  </div>
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
};
