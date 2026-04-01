'use client';

import React from 'react';
import { WarmProgressBar } from './WarmProgressBar';
import { BookOpen, Clock, Layers, Zap } from 'lucide-react';

interface CourseSyllabusPreviewProps {
  courseTitle: string;
  courseDescription: string;
  teacherName: string;
  classLevel: string;
  totalModules: number;
  estimatedHours: number;
  learningOutcomes: string;
}

export const CourseSyllabusPreview: React.FC<CourseSyllabusPreviewProps> = ({
  courseTitle,
  courseDescription,
  teacherName,
  classLevel,
  totalModules,
  estimatedHours,
  learningOutcomes,
}) => {
  const outcomes = learningOutcomes
    .split('|')
    .map((outcome) => outcome.trim())
    .filter((outcome) => outcome.length > 0);

  // Arc progress visualization (SVG)
  const circumference = 2 * Math.PI * 45;
  const progressPercentage = 0; // Starting at 0%
  const offset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className="w-full space-y-6">
      {/* Hero Section with White Background */}
      <div className="relative overflow-hidden rounded-2xl p-8 md:p-12 shadow-lg bg-white border-2 border-gray-100">
        {/* Content */}
        <div className="relative z-10">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-bold px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                Level {classLevel}
              </span>
              <span className="text-xs font-bold px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                {totalModules} Modul
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 leading-tight">
              {courseTitle}
            </h1>
            
            <p className="text-gray-700 text-lg">
              Diajar oleh <span className="font-semibold text-gray-900">{teacherName}</span>
            </p>
          </div>

          <p className="text-gray-700 leading-relaxed mb-8 text-lg">
            {courseDescription}
          </p>

          {/* Stats Grid - Enhanced with Gradients */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white shadow-md hover:shadow-lg transition-all hover:scale-105">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
                  <Layers className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Total Modul</p>
              </div>
              <p className="text-3xl font-black text-gray-900">{totalModules}</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white shadow-md hover:shadow-lg transition-all hover:scale-105">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-amber-200">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Durasi</p>
              </div>
              <p className="text-3xl font-black text-gray-900">{estimatedHours}h</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white shadow-md hover:shadow-lg transition-all hover:scale-105">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-200">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Capaian</p>
              </div>
              <p className="text-3xl font-black text-gray-900">{outcomes.length}</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white shadow-md hover:shadow-lg transition-all hover:scale-105">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-green-200">
                  <Zap className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Status</p>
              </div>
              <p className="text-sm font-black text-emerald-600">Siap Mulai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Outcomes Section */}
      <div className="rounded-2xl border-2 border-gradient bg-white p-8 shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
            <BookOpen className="h-6 w-6 text-gradient-to-r from-blue-600 to-purple-600" />
          </div>
          Capaian Pembelajaran Kursus
        </h2>

        {outcomes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {outcomes.map((outcome, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold mt-0.5">
                  ✓
                </div>
                <span className="text-gray-700 flex-1">{outcome}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">Belum ada learning outcomes yang ditentukan.</p>
        )}
      </div>
    </div>
  );
};
