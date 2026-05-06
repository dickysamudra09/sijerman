/**
 * Lesson Preview Component
 * STEP 5: Shows lesson in student view
 * 
 * Displays lesson content as student would see it
 */

'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';

interface LessonPreviewProps {
  formData: {
    title: string;
    description: string;
    content: string;
    lesson_type: 'explanation' | 'vocabulary' | 'dialogue' | 'reading' | 'listening';
  };
}

const lessonTypeLabels: Record<string, string> = {
  explanation: 'Penjelasan',
  vocabulary: 'Kosakata',
  dialogue: 'Dialog',
  reading: 'Membaca',
  listening: 'Mendengarkan',
};

const lessonTypeColors: Record<string, { bg: string; text: string }> = {
  explanation: { bg: '#FEF3C7', text: '#92400E' },
  vocabulary: { bg: '#DBEAFE', text: '#1E40AF' },
  dialogue: { bg: '#FCE7F3', text: '#831843' },
  reading: { bg: '#E0E7FF', text: '#3730A3' },
  listening: { bg: '#E9D5FF', text: '#581C87' },
};

export function LessonPreview({ formData }: LessonPreviewProps) {
  const colors = lessonTypeColors[formData.lesson_type] || lessonTypeColors.explanation;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <BookOpen className="h-6 w-6 flex-shrink-0 mt-1" style={{ color: '#E8B824' }} />
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>
              {formData.title || 'Untitled Lesson'}
            </h1>
            <p className="text-sm mt-2" style={{ color: '#6B7280' }}>
              {formData.description || 'No description provided'}
            </p>
          </div>
        </div>

        {/* Lesson Type Badge */}
        <div className="flex gap-2">
          <span
            className="inline-block px-3 py-1 rounded-full text-sm font-semibold"
            style={{
              backgroundColor: colors.bg,
              color: colors.text,
            }}
          >
            {lessonTypeLabels[formData.lesson_type]}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: '#E5E5E5' }} />

      {/* Content Preview */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
          Materi Pelajaran
        </h2>

        {formData.content ? (
          <div
            className="prose prose-sm max-w-none"
            style={{
              color: '#1A1A1A',
              lineHeight: '1.6',
            }}
            dangerouslySetInnerHTML={{ __html: formData.content }}
          />
        ) : (
          <div
            className="p-4 rounded-lg text-center"
            style={{
              backgroundColor: '#F5F5F5',
              color: '#999999',
            }}
          >
            <p className="text-sm">Belum ada konten dalam pelajaran ini</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div
        className="p-4 rounded-lg text-sm"
        style={{
          backgroundColor: '#F0F9FF',
          color: '#0369A1',
          borderLeft: '4px solid #0369A1',
        }}
      >
        <p>
          💡 <strong>Catatan Student:</strong> Dalam pandangan sebenarnya, siswa akan melihat tombol "Mark as Complete" dan navigasi ke pelajaran berikutnya di sini.
        </p>
      </div>
    </div>
  );
}
