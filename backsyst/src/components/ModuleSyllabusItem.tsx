'use client';

import React, { useState } from 'react';
import { ChevronDown, BookOpen, Clock, Zap } from 'lucide-react';

interface ModuleSyllabusItemProps {
  moduleNumber: number;
  title: string;
  moduleType: string;
  durationMinutes?: number;
  learningOutcomes: string;
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

const getModuleTypeConfig = (moduleType: string) => {
  switch (moduleType.toLowerCase()) {
    case 'materi':
      return {
        color: 'from-blue-500 to-blue-600',
        bgLight: 'bg-blue-50',
        borderColor: 'border-l-4 border-l-blue-500',
        badge: 'bg-blue-100 text-blue-700',
        icon: '📖',
      };
    case 'latihan':
      return {
        color: 'from-orange-500 to-amber-600',
        bgLight: 'bg-amber-50',
        borderColor: 'border-l-4 border-l-orange-500',
        badge: 'bg-orange-100 text-orange-700',
        icon: '✏️',
      };
    case 'kuis':
      return {
        color: 'from-purple-500 to-purple-600',
        bgLight: 'bg-purple-50',
        borderColor: 'border-l-4 border-l-purple-500',
        badge: 'bg-purple-100 text-purple-700',
        icon: '📋',
      };
    default:
      return {
        color: 'from-gray-500 to-gray-600',
        bgLight: 'bg-gray-50',
        borderColor: 'border-l-4 border-l-gray-500',
        badge: 'bg-gray-100 text-gray-700',
        icon: '📚',
      };
  }
};

const getDifficultyLevel = (index: number): { level: string; color: string } => {
  if (index < 2) return { level: 'Beginner', color: 'bg-green-100 text-green-700' };
  if (index < 5) return { level: 'Intermediate', color: 'bg-yellow-100 text-yellow-700' };
  return { level: 'Advanced', color: 'bg-red-100 text-red-700' };
};

export const ModuleSyllabusItem: React.FC<ModuleSyllabusItemProps> = ({
  moduleNumber,
  title,
  moduleType,
  durationMinutes,
  learningOutcomes,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = getModuleTypeConfig(moduleType);
  const difficulty = getDifficultyLevel(moduleNumber - 1);

  const outcomes = learningOutcomes
    .split('|')
    .map((outcome) => outcome.trim())
    .filter((outcome) => outcome.length > 0);

  const formattedDuration = durationMinutes
    ? durationMinutes < 60
      ? `${durationMinutes}m`
      : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
    : null;

  return (
    <div
      className={`${config.borderColor} rounded-xl border border-gray-200 overflow-hidden transition-all hover:shadow-xl hover:scale-102 hover:-translate-y-1 duration-300 cursor-pointer bg-white`}
    >
      {/* Header Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/80 transition-colors text-left"
      >
        <div className="flex items-center gap-4 flex-1">
          {/* Module Number Circle with Gradient */}
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${config.color} text-white flex items-center justify-center font-bold flex-shrink-0 shadow-lg`}>
            {String(moduleNumber).padStart(2, '0')}
          </div>

          {/* Module Info */}
          <div className="flex-1 text-left">
            <h3 className="font-bold text-gray-900 mb-2 text-lg">{title}</h3>
            
            {/* Mini Stats Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Badge */}
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.badge}`}>
                {config.icon} {moduleType}
              </span>

              {/* Duration */}
              {formattedDuration && (
                <div className="flex items-center gap-1 text-xs text-gray-600 px-3 py-1 rounded-full bg-gray-100">
                  <Clock className="h-3.5 w-3.5" />
                  {formattedDuration}
                </div>
              )}

              {/* Outcomes Count */}
              {outcomes.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-600 px-3 py-1 rounded-full bg-gray-100">
                  <Zap className="h-3.5 w-3.5" />
                  {outcomes.length} capaian
                </div>
              )}

              {/* Difficulty Badge */}
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${difficulty.color}`}>
                {difficulty.level}
              </span>
            </div>
          </div>
        </div>

        {/* Chevron Icon */}
        <ChevronDown
          className={`h-5 w-5 text-gray-600 flex-shrink-0 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Accordion Content - Learning Outcomes */}
      {isExpanded && outcomes.length > 0 && (
        <div className="border-t border-gray-200 px-6 py-5 bg-gradient-to-br from-white to-gray-50">
          <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${config.color} text-white`}>
              <BookOpen className="h-4 w-4" />
            </div>
            Capaian pada modul ini:
          </h4>
          
          <div className="grid grid-cols-1 gap-3">
            {outcomes.map((outcome, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-white hover:shadow-md transition-all"
              >
                <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${config.color} text-white flex items-center justify-center text-sm font-bold mt-0.5`}>
                  ✓
                </div>
                <span className="text-gray-700 text-sm font-medium leading-relaxed">{outcome}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
