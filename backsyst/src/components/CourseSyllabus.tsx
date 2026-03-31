'use client';

import React from 'react';

interface CourseSyllabusProps {
  courseTitle: string;
  courseDescription: string;
  learningOutcomes: string; 
  totalModules: number;
  estimatedHours?: number;
  progressPercentage?: number;
  teacherName?: string;
}

export const CourseSyllabus: React.FC<CourseSyllabusProps> = ({
  courseTitle,
  courseDescription,
  learningOutcomes,
  totalModules,
  estimatedHours = 0,
  progressPercentage = 0,
  teacherName = 'Instruktur',
}) => {
  const outcomes = learningOutcomes
    .split('|')
    .map((outcome) => outcome.trim())
    .filter((outcome) => outcome.length > 0);

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100 p-6 md:p-8 shadow-sm">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{courseTitle}</h1>
            <p className="text-sm text-gray-600">Diajar oleh <span className="font-semibold">{teacherName}</span></p>
          </div>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Modul</p>
            <p className="text-2xl font-bold text-gray-900">{totalModules}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Waktu Estimasi</p>
            <p className="text-2xl font-bold text-gray-900">{estimatedHours}j</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Progress Mu</p>
            <p className="text-2xl font-bold text-[#F5C518]">{progressPercentage}%</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
            <p className="text-lg font-bold text-blue-600">Sedang Belajar</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-[#F5C518] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Course Description */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Deskripsi Kursus</h2>
        <p className="text-gray-700 leading-relaxed">{courseDescription}</p>
      </div>

      {/* Learning Outcomes */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Apa Yang Akan Kamu Pelajari</h2>
        {outcomes.length > 0 ? (
          <ul className="space-y-3">
            {outcomes.map((outcome, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#F5C518] text-[#2F3E75] flex items-center justify-center text-sm font-semibold mt-0.5">
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
