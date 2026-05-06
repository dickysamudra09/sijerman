'use client';

import React, { useState } from 'react';
import { ChevronDown, BookOpen, Clock, Zap } from 'lucide-react';

interface ModuleSyllabusItemProps {
  moduleNumber: number;
  title: string;
  moduleType: string;
  durationMinutes?: number;
  learningOutcomes: string;
  lessons?: Array<{
    id: string;
    title: string;
    lesson_type: string;
    order_index: number;
  }>;
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
        color: 'from-amber-700 to-amber-800',
        bgLight: 'bg-amber-50',
        borderColor: 'border-l-4 border-l-amber-700',
        badge: 'bg-amber-100 text-amber-800',
        icon: '📖',
      };
    case 'latihan':
      return {
        color: 'from-orange-600 to-orange-700',
        bgLight: 'bg-orange-50',
        borderColor: 'border-l-4 border-l-orange-600',
        badge: 'bg-orange-100 text-orange-800',
        icon: '✏️',
      };
    case 'kuis':
      return {
        color: 'from-yellow-600 to-yellow-700',
        bgLight: 'bg-yellow-50',
        borderColor: 'border-l-4 border-l-yellow-600',
        badge: 'bg-yellow-100 text-yellow-800',
        icon: '📋',
      };
    default:
      return {
        color: 'from-stone-600 to-stone-700',
        bgLight: 'bg-stone-50',
        borderColor: 'border-l-4 border-l-stone-600',
        badge: 'bg-stone-100 text-stone-800',
        icon: '📚',
      };
  }
};

const getDifficultyLevel = (index: number): { level: string; color: string } => {
  if (index < 2) return { level: 'Pemula', color: 'bg-green-100 text-green-700' };
  if (index < 5) return { level: 'Menengah', color: 'bg-yellow-100 text-yellow-700' };
  return { level: 'Lanjutan', color: 'bg-red-100 text-red-700' };
};

export const ModuleSyllabusItem: React.FC<ModuleSyllabusItemProps> = ({
  moduleNumber,
  title,
  moduleType,
  durationMinutes,
  learningOutcomes,
  lessons = [],
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
      className={`${config.borderColor} rounded-xl border overflow-hidden transition-all hover:shadow-xl hover:scale-102 hover:-translate-y-1 duration-300 cursor-pointer`}
      style={{ backgroundColor: "#FAFAF7", borderColor: "#E0DDD0" }}
    >
      {/* Header Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-4 md:px-6 md:py-5 flex items-center justify-between hover:bg-white/80 transition-colors text-left"
      >
        <div className="flex items-center gap-3 md:gap-4 flex-1">
          {/* Module Number Circle with Gradient */}
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br ${config.color} text-white flex items-center justify-center font-bold flex-shrink-0 shadow-lg text-sm md:text-base`}>
            {String(moduleNumber).padStart(2, '0')}
          </div>

          {/* Module Info */}
          <div className="flex-1 text-left">
            <h3 className="font-bold text-gray-900 mb-1.5 md:mb-2 text-base md:text-lg">{title}</h3>
            
            {/* Mini Stats Row */}
            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
              {/* Type Badge */}
              <span className={`inline-flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-10px md:text-xs font-semibold ${config.badge}`}>
                {config.icon} {moduleType}
              </span>

              {/* Duration */}
              {formattedDuration && (
                <div className="flex items-center gap-1 text-10px md:text-xs text-gray-600 px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-gray-100">
                  <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  {formattedDuration}
                </div>
              )}

              {/* Outcomes Count */}
              {outcomes.length > 0 && (
                <div className="flex items-center gap-1 text-10px md:text-xs text-gray-600 px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-gray-100">
                  <Zap className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  {outcomes.length} capaian
                </div>
              )}

              {/* Difficulty Badge */}
              <span className={`inline-flex px-2 md:px-3 py-0.5 md:py-1 rounded-full text-10px md:text-xs font-semibold ${difficulty.color}`}>
                {difficulty.level}
              </span>
            </div>
          </div>
        </div>

        {/* Chevron Icon */}
        <ChevronDown
          className={`h-4 w-4 md:h-5 md:w-5 text-gray-600 flex-shrink-0 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Accordion Content - Learning Outcomes & Lessons */}
      {isExpanded && (
        <div className="border-t px-4 py-4 md:px-6 md:py-5 space-y-4 md:space-y-6" style={{ borderColor: "#E0DDD0", backgroundColor: "#F5F5F0" }}>
          {/* Lessons Section */}
          {lessons.length > 0 && (
            <div>
              <h4 className="text-xs md:text-sm font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                <div className={`p-1.5 md:p-2 rounded-lg bg-gradient-to-br ${config.color} text-white`}>
                  <BookOpen className="h-3 w-3 md:h-4 md:w-4" />
                </div>
                Pelajaran dalam modul ini ({lessons.length}):
              </h4>
              
              <div className="grid grid-cols-1 gap-2">
                {lessons
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="flex items-start gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg hover:shadow-md transition-all border"
                      style={{ backgroundColor: "#FAFAF7", borderColor: "#E0DDD0" }}
                    >
                      <div className={`flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br ${config.color} text-white flex items-center justify-center text-10px md:text-xs font-bold`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 text-xs md:text-sm font-semibold">{lesson.title}</p>
                        <span className="inline-flex mt-1 px-2 py-0.5 rounded text-10px md:text-xs font-medium" style={{ backgroundColor: '#E8B824', color: '#1A1A1A' }}>
                          {lesson.lesson_type}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Learning Outcomes */}
          {outcomes.length > 0 && (
            <div>
              <h4 className="text-xs md:text-sm font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                <div className={`p-1.5 md:p-2 rounded-lg bg-gradient-to-br ${config.color} text-white`}>
                  <BookOpen className="h-3 w-3 md:h-4 md:w-4" />
                </div>
                Capaian pada modul ini:
              </h4>
              
              <div className="grid grid-cols-1 gap-2 md:gap-3">
                {outcomes.map((outcome, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg hover:shadow-md transition-all"
                    style={{ backgroundColor: "#FAFAF7" }}
                  >
                    <div className={`flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br ${config.color} text-white flex items-center justify-center text-10px md:text-sm font-bold mt-0.5`}>
                      ✓
                    </div>
                    <span className="text-gray-700 text-xs md:text-sm font-medium leading-relaxed">{outcome}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
