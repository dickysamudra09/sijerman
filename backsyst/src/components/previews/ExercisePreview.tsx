/**
 * Exercise Preview Component
 * STEP 5: Shows exercise in student view
 * 
 * Displays exercise structure as student would see it
 */

'use client';

import React from 'react';
import { Dumbbell } from 'lucide-react';

interface ExercisePreviewProps {
  formData: {
    title: string;
    description: string;
    exercise_type: 'mcq' | 'essay' | 'puzzle';
    question_count: number;
  };
}

const exerciseTypeLabels: Record<string, string> = {
  mcq: 'Pilihan Ganda',
  essay: 'Esai',
  puzzle: 'Teka-teki',
};

const exerciseTypeColors: Record<string, { bg: string; text: string }> = {
  mcq: { bg: '#FEE2E2', text: '#991B1B' },
  essay: { bg: '#FEF08A', text: '#713F12' },
  puzzle: { bg: '#E0E7FF', text: '#3730A3' },
};

export function ExercisePreview({ formData }: ExercisePreviewProps) {
  const colors = exerciseTypeColors[formData.exercise_type] || exerciseTypeColors.mcq;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Dumbbell className="h-6 w-6 flex-shrink-0 mt-1" style={{ color: '#DC2626' }} />
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>
              {formData.title || 'Untitled Exercise'}
            </h1>
            <p className="text-sm mt-2" style={{ color: '#6B7280' }}>
              {formData.description || 'No description provided'}
            </p>
          </div>
        </div>

        {/* Exercise Type Badge & Question Count */}
        <div className="flex gap-2 flex-wrap">
          <span
            className="inline-block px-3 py-1 rounded-full text-sm font-semibold"
            style={{
              backgroundColor: colors.bg,
              color: colors.text,
            }}
          >
            {exerciseTypeLabels[formData.exercise_type]}
          </span>
          <span
            className="inline-block px-3 py-1 rounded-full text-sm font-semibold"
            style={{
              backgroundColor: '#F3F4F6',
              color: '#374151',
            }}
          >
            {formData.question_count || 0} Soal
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: '#E5E5E5' }} />

      {/* Exercise Info */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Type Info */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: '#F5F5F5',
            }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>
              Format
            </p>
            <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>
              {exerciseTypeLabels[formData.exercise_type]}
            </p>
          </div>

          {/* Question Count */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: '#F5F5F5',
            }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>
              Total Soal
            </p>
            <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>
              {formData.question_count || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Sample Question Structure */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold" style={{ color: '#1A1A1A' }}>
          Struktur Contoh Soal
        </h3>

        {formData.exercise_type === 'mcq' && (
          <div
            className="p-4 rounded-lg border-2 border-dashed"
            style={{
              borderColor: '#FCA5A5',
              backgroundColor: '#FEF2F2',
            }}
          >
            <div className="space-y-2">
              <p className="text-sm font-semibold" style={{ color: '#991B1B' }}>
                Soal 1: [Pertanyaan MCQ]
              </p>
              <div className="space-y-1 ml-4">
                <p className="text-xs">
                  <input type="radio" disabled className="mr-2" />
                  Pilihan A
                </p>
                <p className="text-xs">
                  <input type="radio" disabled className="mr-2" />
                  Pilihan B (Jawaban Benar ✓)
                </p>
                <p className="text-xs">
                  <input type="radio" disabled className="mr-2" />
                  Pilihan C
                </p>
                <p className="text-xs">
                  <input type="radio" disabled className="mr-2" />
                  Pilihan D
                </p>
              </div>
            </div>
          </div>
        )}

        {formData.exercise_type === 'essay' && (
          <div
            className="p-4 rounded-lg border-2 border-dashed"
            style={{
              borderColor: '#FDE047',
              backgroundColor: '#FFFBEB',
            }}
          >
            <p className="text-sm font-semibold mb-2" style={{ color: '#713F12' }}>
              Soal 1: [Pertanyaan Esai]
            </p>
            <textarea
              disabled
              placeholder="Jawaban siswa akan dimasukkan di sini..."
              className="w-full h-20 p-2 border rounded text-xs"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E5E5E5',
                color: '#999999',
              }}
            />
          </div>
        )}

        {formData.exercise_type === 'puzzle' && (
          <div
            className="p-4 rounded-lg border-2 border-dashed"
            style={{
              borderColor: '#C7D2FE',
              backgroundColor: '#F0F4FF',
            }}
          >
            <p className="text-sm font-semibold mb-3" style={{ color: '#3730A3' }}>
              Soal 1: [Teka-teki / Interaktif]
            </p>
            <div
              className="p-3 rounded text-center text-xs"
              style={{
                backgroundColor: '#E0E7FF',
                color: '#3730A3',
              }}
            >
              Elemen interaktif puzzle akan dirender di sini
            </div>
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
          💡 <strong>Catatan:</strong> Dalam pandangan sebenarnya, siswa dapat menjawab soal, menyimpan progress, dan melihat feedback AI di sini. (Diimplementasikan di STEP 6)
        </p>
      </div>
    </div>
  );
}
