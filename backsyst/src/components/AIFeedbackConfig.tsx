/**
 * AI Feedback Config Component
 * STEP 6: AI feedback configuration for exercises
 * 
 * Placeholder component for exercise AI settings
 * Full implementation in future steps
 */

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Lightbulb } from 'lucide-react';

interface AIFeedbackConfigProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  feedbackType?: 'instant' | 'delayed' | 'batch';
  onFeedbackTypeChange?: (type: 'instant' | 'delayed' | 'batch') => void;
  isLoading?: boolean;
}

export function AIFeedbackConfig({
  enabled,
  onEnabledChange,
  feedbackType = 'instant',
  onFeedbackTypeChange,
  isLoading = false,
}: AIFeedbackConfigProps) {
  return (
    <div className="space-y-4 p-4 rounded-lg border-2" style={{ borderColor: '#E8B824', backgroundColor: '#FFFBF0' }}>
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#E8B824' }} />
        <div className="flex-1">
          <h3 className="font-semibold mb-3" style={{ color: '#1A1A1A' }}>
            Konfigurasi Feedback AI (STEP 6)
          </h3>

          {/* Enable AI Feedback */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="ai_feedback_enabled"
                checked={enabled}
                onChange={(e) => onEnabledChange(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 rounded"
                style={{
                  accentColor: '#E8B824',
                }}
              />
              <label
                htmlFor="ai_feedback_enabled"
                className="text-sm font-semibold cursor-pointer"
                style={{ color: '#1A1A1A' }}
              >
                Aktifkan Feedback AI untuk latihan ini
              </label>
            </div>

            {enabled && (
              <div className="ml-7 space-y-3">
                {/* Feedback Type */}
                <div>
                  <Label
                    htmlFor="feedback_type"
                    className="text-sm font-semibold"
                    style={{ color: '#1A1A1A' }}
                  >
                    Jenis Feedback
                  </Label>
                  <select
                    id="feedback_type"
                    value={feedbackType}
                    onChange={(e) =>
                      onFeedbackTypeChange?.(e.target.value as 'instant' | 'delayed' | 'batch')
                    }
                    disabled={isLoading}
                    className="w-full h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 px-3 mt-1 disabled:opacity-50 text-sm"
                    style={{ backgroundColor: '#FFFFFC', color: '#1A1A1A' }}
                  >
                    <option value="instant">Instan (Langsung setelah jawab)</option>
                    <option value="delayed">Tertunda (Setelah semua soal selesai)</option>
                    <option value="batch">Batch (Dikumpulkan untuk diproses)</option>
                  </select>
                </div>

                {/* AI Model Selection - PLACEHOLDER */}
                <div>
                  <Label
                    htmlFor="ai_model"
                    className="text-sm font-semibold"
                    style={{ color: '#1A1A1A' }}
                  >
                    Model AI (Placeholder)
                  </Label>
                  <select
                    id="ai_model"
                    disabled={isLoading}
                    className="w-full h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 px-3 mt-1 disabled:opacity-50 text-sm"
                    style={{ backgroundColor: '#FFFFFC', color: '#1A1A1A' }}
                  >
                    <option value="gpt-4">GPT-4 (Recommended)</option>
                    <option value="gpt-3.5">GPT-3.5</option>
                    <option value="claude">Claude</option>
                  </select>
                </div>

                {/* Feedback Detail Level - PLACEHOLDER */}
                <div>
                  <Label
                    htmlFor="feedback_detail"
                    className="text-sm font-semibold"
                    style={{ color: '#1A1A1A' }}
                  >
                    Level Detail (Placeholder)
                  </Label>
                  <select
                    id="feedback_detail"
                    disabled={isLoading}
                    className="w-full h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 px-3 mt-1 disabled:opacity-50 text-sm"
                    style={{ backgroundColor: '#FFFFFC', color: '#1A1A1A' }}
                  >
                    <option value="brief">Singkat</option>
                    <option value="standard">Standar</option>
                    <option value="detailed">Detail</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <p className="text-xs mt-3 p-2 rounded" style={{ color: '#6B7280', backgroundColor: 'rgba(0,0,0,0.05)' }}>
            💡 Feedback AI akan memberikan wawasan tentang jawaban siswa dan saran perbaikan.
            Konfigurasi penuh akan tersedia setelah integrasi backend AI.
          </p>
        </div>
      </div>
    </div>
  );
}
