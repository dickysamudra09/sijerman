/**
 * Lesson Form Modal Component
 * STEP 3: Extracted from modules/page.tsx
 * 
 * Renders lesson form for create/edit modes
 * Used inside ModalShell renderEditContent
 */

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LessonContentEditor } from '@/components/LessonContentEditor';
import { AlertCircle } from 'lucide-react';

interface LessonFormData {
  title: string;
  description: string;
  content: string;
  lesson_type: 'explanation' | 'vocabulary' | 'dialogue' | 'reading' | 'listening';
}

interface LessonFormModalProps {
  formData: LessonFormData;
  onChange: (data: LessonFormData) => void;
  error?: string;
  isLoading?: boolean;
}

export function LessonFormModal({
  formData,
  onChange,
  error,
  isLoading = false,
}: LessonFormModalProps) {
  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Lesson Type */}
      <div>
        <Label
          htmlFor="lesson_type"
          className="text-sm font-semibold"
          style={{ color: '#1A1A1A' }}
        >
          Jenis Pelajaran
        </Label>
        <select
          id="lesson_type"
          value={formData.lesson_type}
          onChange={(e) =>
            onChange({
              ...formData,
              lesson_type: e.target.value as any,
            })
          }
          disabled={isLoading}
          className="w-full h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 px-3 mt-1 disabled:opacity-50"
          style={{ backgroundColor: '#FFFFFC', color: '#1A1A1A' }}
        >
          <option value="explanation">Penjelasan</option>
          <option value="vocabulary">Kosakata</option>
          <option value="dialogue">Dialog</option>
          <option value="reading">Membaca</option>
          <option value="listening">Mendengarkan</option>
        </select>
      </div>

      {/* Title */}
      <div>
        <Label
          htmlFor="lesson_title"
          className="text-sm font-semibold"
          style={{ color: '#1A1A1A' }}
        >
          Judul *
        </Label>
        <Input
          id="lesson_title"
          placeholder="cth: Dasar-Dasar Alfabet Jerman"
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
          htmlFor="lesson_description"
          className="text-sm font-semibold"
          style={{ color: '#1A1A1A' }}
        >
          Deskripsi
        </Label>
        <Input
          id="lesson_description"
          placeholder="Deskripsi singkat pelajaran ini"
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

      {/* Content - Rich Editor */}
      <div>
        <Label
          htmlFor="lesson_content"
          className="text-sm font-semibold"
          style={{ color: '#1A1A1A' }}
        >
          Konten dengan Dukungan Media
        </Label>
        <div className="mt-2">
          <LessonContentEditor
            content={formData.content}
            onChange={(content) =>
              onChange({ ...formData, content })
            }
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
