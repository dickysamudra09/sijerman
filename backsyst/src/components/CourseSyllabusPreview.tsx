'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Layers, Zap } from 'lucide-react';

interface CourseSyllabusPreviewProps {
  courseTitle: string;
  courseDescription: string;
  teacherName: string;
  classLevel: string;
  totalModules: number;
  estimatedHours: number;
  learningOutcomes: string;
  courseId?: string;
}

export const CourseSyllabusPreview: React.FC<CourseSyllabusPreviewProps> = ({
  courseTitle,
  courseDescription,
  teacherName,
  classLevel,
  totalModules,
  estimatedHours,
  learningOutcomes,
  courseId = '',
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
    <div className="w-full space-y-4 md:space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg p-6 md:p-8 lg:p-10" style={{ backgroundColor: "#FAFAF7", border: "1px solid #E0DDD0" }}>
        {/* Content */}
        <div className="relative z-10">
          <div className="mb-4 md:mb-6">
            <div className="flex items-center gap-2 mb-3 md:mb-4 flex-wrap">
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: "#F5F1E8", color: "#92400E" }}>
                Level {classLevel}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: "#FEF3C7", color: "#B45309" }}>
                {totalModules} Modul
              </span>
            </div>
            
            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 md:mb-3 leading-tight" style={{ color: "#1A1A1A" }}>
              {courseTitle}
            </h1>
            
            <p className="text-sm md:text-base" style={{ color: "#64748B" }}>
              Diajar oleh <span className="font-semibold" style={{ color: "#1A1A1A" }}>{teacherName}</span>
            </p>
          </div>

          <p className="leading-relaxed mb-6 md:mb-8 text-sm md:text-base" style={{ color: "#4A4A4A" }}>
            {courseDescription}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="rounded-lg p-3 md:p-4" style={{ backgroundColor: "#F5F1E8", border: "1px solid #E0DDD0" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 md:p-2 rounded-lg" style={{ backgroundColor: "#FEF3C7" }}>
                  <Layers className="h-4 w-4 md:h-5 md:w-5" style={{ color: "#92400E" }} />
                </div>
                <p className="text-10px md:text-xs uppercase tracking-wide font-semibold" style={{ color: "#64748B" }}>Total Modul</p>
              </div>
              <p className="text-xl md:text-2xl font-bold" style={{ color: "#1A1A1A" }}>{totalModules}</p>
            </div>

            <div className="rounded-lg p-3 md:p-4" style={{ backgroundColor: "#FEF3C7", border: "1px solid #E0DDD0" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 md:p-2 rounded-lg" style={{ backgroundColor: "#FDE68A" }}>
                  <Clock className="h-4 w-4 md:h-5 md:w-5" style={{ color: "#B45309" }} />
                </div>
                <p className="text-10px md:text-xs uppercase tracking-wide font-semibold" style={{ color: "#64748B" }}>Durasi</p>
              </div>
              <p className="text-xl md:text-2xl font-bold" style={{ color: "#1A1A1A" }}>{estimatedHours}h</p>
            </div>

            <div className="rounded-lg p-3 md:p-4" style={{ backgroundColor: "#F5F1E8", border: "1px solid #E0DDD0" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 md:p-2 rounded-lg" style={{ backgroundColor: "#FEF3C7" }}>
                  <BookOpen className="h-4 w-4 md:h-5 md:w-5" style={{ color: "#92400E" }} />
                </div>
                <p className="text-10px md:text-xs uppercase tracking-wide font-semibold" style={{ color: "#64748B" }}>Capaian</p>
              </div>
              <p className="text-xl md:text-2xl font-bold" style={{ color: "#1A1A1A" }}>{outcomes.length}</p>
            </div>

            <div className="rounded-lg p-3 md:p-4" style={{ backgroundColor: "#F5F1E8", border: "1px solid #E0DDD0" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 md:p-2 rounded-lg" style={{ backgroundColor: "#FEF3C7" }}>
                  <Zap className="h-4 w-4 md:h-5 md:w-5" style={{ color: "#92400E" }} />
                </div>
                <p className="text-10px md:text-xs uppercase tracking-wide font-semibold" style={{ color: "#64748B" }}>Status</p>
              </div>
              <p className="text-xs md:text-sm font-semibold" style={{ color: "#92400E" }}>Siap Mulai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Outcomes Section */}
      <div className="rounded-lg p-6 md:p-8" style={{ backgroundColor: "#FAFAF7", border: "1px solid #E0DDD0" }}>
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2 md:gap-3" style={{ color: "#1A1A1A" }}>
          <div className="p-1.5 md:p-2 rounded-lg" style={{ backgroundColor: "#F5F1E8" }}>
            <BookOpen className="h-5 w-5 md:h-6 md:w-6" style={{ color: "#92400E" }} />
          </div>
          Capaian Pembelajaran Kursus
        </h2>

        {outcomes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            {outcomes.map((outcome, index) => (
              <div
                key={index}
                className="flex items-start gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg transition-colors"
                style={{ backgroundColor: "#F5F1E8" }}
              >
                <div className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full text-white flex items-center justify-center text-xs md:text-sm font-bold mt-0.5" style={{ backgroundColor: "#92400E" }}>
                  ✓
                </div>
                <span style={{ color: "#1A1A1A" }} className="flex-1 text-sm md:text-base">{outcome}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#64748B" }} className="italic text-sm md:text-base">Belum ada learning outcomes yang ditentukan.</p>
        )}
      </div>
    </div>
  );
};
