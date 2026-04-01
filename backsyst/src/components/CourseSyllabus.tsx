'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface CourseSyllabusProps {
  courseTitle: string;
  courseDescription: string;
  learningOutcomes: string; 
  totalModules: number;
  estimatedHours?: number;
  progressPercentage?: number;
  teacherName?: string;
  courseId?: string;
}

export const CourseSyllabus: React.FC<CourseSyllabusProps> = ({
  courseTitle,
  courseDescription,
  learningOutcomes,
  totalModules,
  estimatedHours = 0,
  progressPercentage = 0,
  teacherName = 'Instruktur',
  courseId = '',
}) => {
  const outcomes = learningOutcomes
    .split('|')
    .map((outcome) => outcome.trim())
    .filter((outcome) => outcome.length > 0);

  return (
    <div className="w-full mb-4">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6 px-2 md:px-0">
        <Link href="/open-courses" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
          Kursus
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-900 font-medium truncate max-w-xs">{courseTitle}</span>
      </div>

      {/* Progress Card */}
      <div className="w-full bg-white rounded-lg border border-gray-100 p-6 md:p-8 shadow-sm">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-900">Progress Pembelajaran</p>
              <p className="text-lg font-bold" style={{ color: "#14B8A6" }}>{progressPercentage}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%`, backgroundColor: "#14B8A6" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Learning Outcomes */}
      <div className="w-full bg-white rounded-lg border border-gray-100 p-6 md:p-8 shadow-sm mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Apa Yang Akan Kamu Pelajari</h2>
        {outcomes.length > 0 ? (
          <ul className="space-y-3">
            {outcomes.map((outcome, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-sm font-semibold mt-0.5" style={{ backgroundColor: "#14B8A6" }}>
                  ✓
                </div>
                <span className="text-gray-700">{outcome}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">Belum ada learning outcomes yang ditentukan.</p>
        )}
      </div>
    </div>
  );
};
