/**
 * Exercise Form Modal Component
 * STEP 4: Extracted/created for modal use
 * STEP 6: Added AI feedback config
 * 
 * Renders exercise form for create/edit modes
 * Includes AI feedback configuration
 */

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';
import { AIFeedbackConfig } from '@/components/AIFeedbackConfig';

interface ExerciseFormData {
  title: string;
  description: string;
  exercise_type: 'mcq' | 'essay' | 'puzzle';
  question_count: number;
  ai_feedback_enabled?: boolean;
  ai_feedback_type?: 'instant' | 'delayed' | 'batch';
}

interface ExerciseFormModalProps {
  formData: ExerciseFormData;
  onChange: (data: ExerciseFormData) => void;
  error?: string;
  isLoading?: boolean;
}

export function ExerciseFormModal({
  formData,
  onChange,
  error,
  isLoading = false,
}: ExerciseFormModalProps) {
  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Exercise Type */}
      <div>
        <Label
          htmlFor="exercise_type"
          className="text-sm font-semibold"
          style={{ color: '#1A1A1A' }}
        >
          Tipe Latihan
        </Label>
        <select
          id="exercise_type"
          value={formData.exercise_type}
          onChange={(e) =>
            onChange({
              ...formData,
              exercise_type: e.target.value as any,
            })
          }
          disabled={isLoading}
          className="w-full h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 px-3 mt-1 disabled:opacity-50"
          style={{ backgroundColor: '#FFFFFC', color: '#1A1A1A' }}
        >
          <option value="mcq">Pilihan Ganda (MCQ)</option>
          <option value="essay">Esai</option>
          <option value="puzzle">Teka-teki</option>
        </select>
      </div>

      {/* Title */}
      <div>
        <Label
          htmlFor="exercise_title"
          className="text-sm font-semibold"
          style={{ color: '#1A1A1A' }}
        >
          Judul *
        </Label>
        <Input
          id="exercise_title"
          placeholder="cth: Kosa Kata Dasar Jerman"
          value={formData.title}
          onChange={(e) =>
            onChange({ ...formData, title: e.target.value })
          }
          disabled={isLoading}
          className="h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1 disabled:opacity-50"
          style={{ backgroundColor: '#FFFFFC' }}
        />
      </div>

      {/* Description */}
      <div>
        <Label
          htmlFor="exercise_description"
          className="text-sm font-semibold"
          style={{ color: '#1A1A1A' }}
        >
          Deskripsi
        </Label>
        <Input
          id="exercise_description"
          placeholder="Deskripsi singkat latihan ini"
          value={formData.description}
          onChange={(e) =>
            onChange({
              ...formData,
              description: e.target.value,
            })
          }
          disabled={isLoading}
          className="h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1 disabled:opacity-50"
          style={{ backgroundColor: '#FFFFFC' }}
        />
      </div>

      {/* Question Count */}
      <div>
        <Label
          htmlFor="question_count"
          className="text-sm font-semibold"
          style={{ color: '#1A1A1A' }}
        >
          Jumlah Soal
        </Label>
        <Input
          id="question_count"
          type="number"
          placeholder="Jumlah soal dalam latihan"
          value={formData.question_count}
          onChange={(e) =>
            onChange({
              ...formData,
              question_count: parseInt(e.target.value) || 0,
            })
          }
          disabled={isLoading}
          className="h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1 disabled:opacity-50"
          style={{ backgroundColor: '#FFFFFC' }}
          min="1"
        />
      </div>

      {/* AI Feedback Config - STEP 6 */}
      <AIFeedbackConfig
        enabled={formData.ai_feedback_enabled || false}
        onEnabledChange={(enabled) =>
          onChange({
            ...formData,
            ai_feedback_enabled: enabled,
          })
        }
        feedbackType={formData.ai_feedback_type || 'instant'}
        onFeedbackTypeChange={(type) =>
          onChange({
            ...formData,
            ai_feedback_type: type,
          })
        }
        isLoading={isLoading}
      />
    </div>
  );
}
