"use client";

import { motion } from "framer-motion";
import { Brain, Lightbulb, Sparkles, CheckCircle, XCircle } from "lucide-react";

interface MobileAIFeedbackProps {
  isCorrect: boolean;
  pointsEarned: number;
  feedbackText: string;
  isLoading?: boolean;
}

export function MobileAIFeedback({
  isCorrect,
  pointsEarned,
  feedbackText,
  isLoading = false,
}: MobileAIFeedbackProps) {
  if (isLoading) {
    return (
      <section className="px-6 py-8 bg-blue-50">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <Brain className="h-6 w-6" style={{ color: '#3B82F6' }} />
          </motion.div>
          <p className="text-sm font-medium" style={{ color: '#1E40AF' }}>
            AI sedang menganalisis jawaban kamu...
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Success/Error Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full py-4 px-6 flex items-center justify-center gap-3"
        style={{
          background: isCorrect
            ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
            : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          color: '#FFFFFF',
        }}
      >
        {isCorrect ? (
          <>
            <CheckCircle className="h-6 w-6" />
            <span className="text-lg font-bold">
              Benar! +{pointsEarned} poin 🎉
            </span>
          </>
        ) : (
          <>
            <XCircle className="h-6 w-6" />
            <span className="text-lg font-bold">
              Belum tepat, yuk belajar lagi! 💪
            </span>
          </>
        )}
      </motion.div>

      {/* Feedback Content */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-6 py-8"
        style={{
          backgroundColor: isCorrect ? '#F0FDF4' : '#FEF2F2',
        }}
      >
        {/* AI Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
            }}
          >
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
              Analisis AI 🤖
            </h3>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              Dibuat oleh Llama 4 Scout
            </p>
          </div>
        </div>

        {/* Feedback Sections */}
        <div className="space-y-6">
          {parseFeedbackSections(feedbackText).map((section, index) => (
            <FeedbackSection
              key={index}
              label={section.label}
              content={section.content}
              isCorrect={isCorrect}
            />
          ))}
        </div>
      </motion.section>
    </>
  );
}

// Helper: Parse feedback into sections
function parseFeedbackSections(feedbackText: string): Array<{ label: string; content: string }> {
  if (!feedbackText) return [];

  // Try numbered sections: "1. LABEL: content"
  const numberedRegex = /(\d+)\.\s+([^:]+):\s*([\s\S]*?)(?=\s*\d+\.\s+|$)/g;
  const sections: Array<{ label: string; content: string }> = [];
  let match;

  while ((match = numberedRegex.exec(feedbackText)) !== null) {
    const label = match[2].trim();
    const content = match[3].trim();
    if (content) {
      sections.push({ label, content });
    }
  }

  if (sections.length > 0) return sections;

  // Fallback: treat as single section
  return [{ label: 'Feedback', content: feedbackText }];
}

// Feedback Section Component
interface FeedbackSectionProps {
  label: string;
  content: string;
  isCorrect: boolean;
}

function FeedbackSection({ label, content, isCorrect }: FeedbackSectionProps) {
  const getIcon = () => {
    const upper = label.toUpperCase();
    if (upper.includes('KENAPA') || upper.includes('ANALISIS')) return Lightbulb;
    if (upper.includes('TIPS')) return Sparkles;
    return Brain;
  };

  const getColors = () => {
    const upper = label.toUpperCase();
    if (upper.includes('TIPS')) {
      return {
        icon: '#EC4899',
        bg: '#FDF2F8',
        border: '#FBCFE8',
        text: '#9D174D',
      };
    }
    if (upper.includes('KENAPA') || upper.includes('ANALISIS')) {
      return {
        icon: '#D97706',
        bg: '#FFFBEB',
        border: '#FDE68A',
        text: '#92400E',
      };
    }
    return {
      icon: '#8B5CF6',
      bg: '#F5F3FF',
      border: '#DDD6FE',
      text: '#6D28D9',
    };
  };

  const Icon = getIcon();
  const colors = getColors();

  return (
    <div
      className="p-4 rounded-xl border-l-4"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: colors.icon }} />
        <div className="flex-1">
          <h4 className="font-bold mb-2" style={{ color: colors.text }}>
            {getFriendlyLabel(label)}
          </h4>
          <div
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: '#374151' }}
          >
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper: Get friendly label
function getFriendlyLabel(rawLabel: string): string {
  const upper = rawLabel.toUpperCase();
  if (upper.includes('RESPONS') || upper.includes('HASIL')) return 'Hasil';
  if (upper.includes('KENAPA')) return 'Kenapa salah? 🤔';
  if (upper.includes('YANG PERLU')) return 'Yang perlu diperbaiki 💡';
  if (upper.includes('TIPS')) return 'Tips untuk kamu ✨';
  if (upper.includes('ANALISIS')) return 'Analisis';
  return rawLabel;
}
