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
    <div className="w-full space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg p-8 md:p-10" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        {/* Content */}
        <div className="relative z-10">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#0F766E" }}>
                Level {classLevel}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: "#FFFBEB", color: "#B45309" }}>
                {totalModules} Modul
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight" style={{ color: "#1A1A1A" }}>
              {courseTitle}
            </h1>
            
            <p style={{ color: "#64748B" }}>
              Diajar oleh <span className="font-semibold" style={{ color: "#1A1A1A" }}>{teacherName}</span>
            </p>
          </div>

          <p className="leading-relaxed mb-8 text-base" style={{ color: "#4A4A4A" }}>
            {courseDescription}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg p-4" style={{ backgroundColor: "#F0FAFB", border: "1px solid #E2E8F0" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "#EFF6FF" }}>
                  <Layers className="h-5 w-5" style={{ color: "#0F766E" }} />
                </div>
                <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: "#64748B" }}>Total Modul</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>{totalModules}</p>
            </div>

            <div className="rounded-lg p-4" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FECACA" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "#FEF3C7" }}>
                  <Clock className="h-5 w-5" style={{ color: "#B45309" }} />
                </div>
                <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: "#64748B" }}>Durasi</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>{estimatedHours}h</p>
            </div>

            <div className="rounded-lg p-4" style={{ backgroundColor: "#F0FAFB", border: "1px solid #E2E8F0" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "#EFF6FF" }}>
                  <BookOpen className="h-5 w-5" style={{ color: "#0F766E" }} />
                </div>
                <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: "#64748B" }}>Capaian</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>{outcomes.length}</p>
            </div>

            <div className="rounded-lg p-4" style={{ backgroundColor: "#F0FAFB", border: "1px solid #E2E8F0" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "#EFF6FF" }}>
                  <Zap className="h-5 w-5" style={{ color: "#0F766E" }} />
                </div>
                <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: "#64748B" }}>Status</p>
              </div>
              <p className="text-sm font-semibold" style={{ color: "#0F766E" }}>Siap Mulai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Outcomes Section */}
      <div className="rounded-lg p-8" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: "#1A1A1A" }}>
          <div className="p-2 rounded-lg" style={{ backgroundColor: "#EFF6FF" }}>
            <BookOpen className="h-6 w-6" style={{ color: "#0F766E" }} />
          </div>
          Capaian Pembelajaran Kursus
        </h2>

        {outcomes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {outcomes.map((outcome, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg transition-colors"
                style={{ backgroundColor: "#F0FAFB" }}
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-sm font-bold mt-0.5" style={{ backgroundColor: "#14B8A6" }}>
                  ✓
                </div>
                <span style={{ color: "#1A1A1A" }} className="flex-1">{outcome}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#64748B" }} className="italic">Belum ada learning outcomes yang ditentukan.</p>
        )}
      </div>
    </div>
  );
};
