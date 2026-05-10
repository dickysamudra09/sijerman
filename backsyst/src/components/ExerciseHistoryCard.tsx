'use client';

import React, { useState, useEffect } from 'react';
import { ExerciseAttemptSummary } from '@/types/tree';

interface ExerciseHistoryCardProps {
  exerciseId: string;
  exerciseTitle: string;
  userId: string;
  onStartExercise: () => void;
  className?: string;
  isStarting?: boolean; // NEW: Loading state when starting exercise
}

export default function ExerciseHistoryCard({
  exerciseId,
  exerciseTitle,
  userId,
  onStartExercise,
  className = '',
  isStarting = false // NEW: Loading state
}: ExerciseHistoryCardProps) {
  const [summary, setSummary] = useState<ExerciseAttemptSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExerciseSummary();
  }, [exerciseId, userId]);

  const fetchExerciseSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/exercise-attempts/summary?exerciseId=${exerciseId}&userId=${userId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch exercise summary');
      }

      const result = await response.json();
      if (result.success) {
        setSummary(result.data);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching exercise summary:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatLastAttemptDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Baru saja';
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return '1 hari lalu';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`bg-[#FAFAF7] border border-[#E0DDD0] rounded-xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-[#E0DDD0] rounded w-3/4 mb-3"></div>
          <div className="h-3 bg-[#E0DDD0] rounded w-1/2 mb-4"></div>
          <div className="h-10 bg-[#E0DDD0] rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-[#FAFAF7] border border-[#E0DDD0] rounded-xl p-6 ${className}`}>
        <div className="text-center">
          <p className="text-red-600 text-sm mb-4">Error: {error}</p>
          <button
            onClick={onStartExercise}
            disabled={isStarting}
            className="w-full bg-[#92400E] hover:bg-[#7C2D12] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg"
          >
            {isStarting ? '⏳ Memulai...' : '🚀 Mulai Latihan'}
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  // SCENARIO 1: First Time (No attempts)
  if (!summary.has_attempts) {
    return (
      <div className={`bg-[#FAFAF7] border border-[#E0DDD0] rounded-xl p-6 hover:shadow-lg transition-all duration-300 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[#1F2937] mb-2">
            🎯 Latihan Soal
          </h3>
          <p className="text-[#6B7280] text-sm mb-1 font-medium">
            {exerciseTitle}
          </p>
          <p className="text-[#6B7280] text-xs mb-6">
            10 soal • ±15 menit
          </p>
          
          <button
            onClick={onStartExercise}
            disabled={isStarting}
            className="w-full bg-[#16A34A] hover:bg-[#15803D] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            {isStarting ? '⏳ Memulai...' : '🚀 Mulai Latihan'}
          </button>
        </div>
      </div>
    );
  }

  // SCENARIO 2: Has attempts but not passed
  if (summary.has_attempts && !summary.is_passed) {
    return (
      <div className={`bg-[#FAFAF7] border border-[#E0DDD0] rounded-xl p-6 hover:shadow-lg transition-all duration-300 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[#1F2937] mb-2">
            📊 Riwayat Latihan
          </h3>
          <p className="text-[#6B7280] text-sm mb-4 font-medium">
            {exerciseTitle}
          </p>
          
          <div className="space-y-2 mb-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#6B7280]">🔄 Percobaan:</span>
              <span className="font-medium text-[#1F2937]">{summary.total_attempts}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#6B7280]">📈 Skor terbaik:</span>
              <span className="font-medium text-[#E8B824]">{Math.round(summary.best_score)}%</span>
            </div>
            <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-3 mt-4">
              <p className="text-[#92400E] text-xs font-medium">
                ⚠️ Perlu skor ≥60% untuk lulus
              </p>
            </div>
            {summary.last_attempt_date && (
              <p className="text-[#6B7280] text-xs mt-2">
                Percobaan terakhir: {formatLastAttemptDate(summary.last_attempt_date)}
              </p>
            )}
          </div>
          
          <button
            onClick={onStartExercise}
            disabled={isStarting}
            className="w-full bg-[#E8B824] hover:bg-[#D97706] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            {isStarting ? '⏳ Memulai...' : '🔄 Coba Lagi'}
          </button>
        </div>
      </div>
    );
  }

  // SCENARIO 3: Passed but can still retry
  if (summary.has_attempts && summary.is_passed) {
    return (
      <div className={`bg-[#FAFAF7] border border-[#E0DDD0] rounded-xl p-6 hover:shadow-lg transition-all duration-300 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[#16A34A] mb-2">
            ✅ Latihan Selesai
          </h3>
          <p className="text-[#6B7280] text-sm mb-4 font-medium">
            {exerciseTitle}
          </p>
          
          <div className="space-y-2 mb-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#6B7280]">🏆 Percobaan:</span>
              <span className="font-medium text-[#1F2937]">{summary.total_attempts}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#6B7280]">🎯 Skor terbaik:</span>
              <span className="font-medium text-[#16A34A]">{Math.round(summary.best_score)}% (Lulus!)</span>
            </div>
            <div className="bg-[#D1FAE5] border border-[#10B981] rounded-lg p-3 mt-4">
              <p className="text-[#065F46] text-xs font-medium">
                ⭐ Kamu bisa mengulang untuk skor yang lebih baik
              </p>
            </div>
            {summary.last_attempt_date && (
              <p className="text-[#6B7280] text-xs mt-2">
                Selesai: {formatLastAttemptDate(summary.last_attempt_date)}
              </p>
            )}
          </div>
          
          <button
            onClick={onStartExercise}
            disabled={isStarting}
            className="w-full bg-[#16A34A] hover:bg-[#15803D] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            {isStarting ? '⏳ Memulai...' : '🎯 Coba Lagi'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}