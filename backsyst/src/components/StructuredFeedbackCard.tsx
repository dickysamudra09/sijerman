"use client";

import { CheckCircle, XCircle, Lightbulb } from "lucide-react";
import type { StructuredAIFeedback } from "@/types/tree";

interface StructuredFeedbackCardProps {
  feedback: StructuredAIFeedback;
}

export function StructuredFeedbackCard({ feedback }: StructuredFeedbackCardProps) {
  const { correct, verdict, userAnswer, correctAnswer, explanation, tips } = feedback;

  return (
    <div
      className="rounded-2xl p-5 md:p-7 border-2 transition-all space-y-6"
      style={{
        backgroundColor: correct ? '#F0FDF4' : '#FFFBEB',
        borderColor: correct ? '#86EFAC' : '#FDE68A',
      }}
    >
      {/* HASIL - Verdict with icon */}
      <div className="flex items-start gap-3">
        {correct ? (
          <CheckCircle className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0 mt-1" style={{ color: '#16A34A' }} />
        ) : (
          <XCircle className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0 mt-1" style={{ color: '#EA580C' }} />
        )}
        <div className="flex-1">
          <h3 className="font-bold text-lg md:text-xl mb-2" style={{ color: correct ? '#16A34A' : '#EA580C' }}>
            {correct ? 'Hasil' : 'Hasil'}
          </h3>
          <p className="text-base md:text-lg leading-relaxed" style={{ color: correct ? '#166534' : '#92400E' }}>
            {verdict}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t" style={{ borderColor: correct ? '#BBF7D0' : '#FDE68A' }} />

      {/* JAWABANMU - Comparison in narrative style */}
      <div>
        <h3 className="font-bold text-base md:text-lg mb-3" style={{ color: '#1A1A1A' }}>
          Jawabanmu
        </h3>
        <p className="text-sm md:text-base leading-relaxed mb-3" style={{ color: '#374151' }}>
          Kamu menjawab: <span className="font-semibold" style={{ color: '#92400E' }}>"{userAnswer || '(Tidak ada jawaban)'}"</span>
        </p>
        <p className="text-sm md:text-base leading-relaxed" style={{ color: '#374151' }}>
          Jawaban yang benar: <span className="font-semibold" style={{ color: '#065F46' }}>"{correctAnswer}"</span>
        </p>
      </div>

      {/* MENGAPA SALAH - Narrative explanation (only if incorrect) */}
      {!correct && explanation && (
        <>
          <div className="border-t" style={{ borderColor: '#FDE68A' }} />
          <div>
            <h3 className="font-bold text-base md:text-lg mb-3 flex items-center gap-2" style={{ color: '#92400E' }}>
              🤔 Mengapa Salah?
            </h3>
            <p className="text-sm md:text-base leading-relaxed" style={{ color: '#78350F' }}>
              {explanation}
            </p>
          </div>
        </>
      )}

      {/* Divider */}
      <div className="border-t" style={{ borderColor: correct ? '#BBF7D0' : '#FDE68A' }} />

      {/* TIPS - Actionable advice */}
      <div>
        <h3 className="font-bold text-base md:text-lg mb-3 flex items-center gap-2" style={{ color: correct ? '#1E40AF' : '#EA580C' }}>
          <Lightbulb className="h-5 w-5 md:h-6 md:w-6" />
          Tips untuk Kamu
        </h3>
        <p className="text-sm md:text-base leading-relaxed" style={{ color: correct ? '#1E3A8A' : '#92400E' }}>
          {tips}
        </p>
      </div>
    </div>
  );
}
