"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Brain,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  HelpCircle,
  MessageSquare,
  ThumbsUp,
  Sparkles,
} from "lucide-react";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface AIFeedback {
  id?: string;
  feedback_text: string;
  explanation?: string;
  reference_materials?: { title: string; url: string; description: string }[];
  processing_time_ms?: number;
  ai_model?: string;
}

interface FeedbackSection {
  label: string;
  content: string;
}

interface FeedbackState {
  feedback: AIFeedback | null;
  isLoading: boolean;
  error: string | null;
  isExpanded: boolean;
  hasGenerated: boolean;
}

export interface AIFeedbackInlineProps {
  exerciseId: string; // course_exercise_id (for API)
  questionId?: string;
  lessonId: string;
  courseId: string;
  userId: string;
  userAnswer: string;
  selectedOptionId?: string | null;
  lessonContent?: string;
  isCorrect: boolean;
  pointsEarned: number;
  questionType: "multiple_choice" | "true_false" | "essay";
  existingFeedback?: AIFeedback | null;
  onFeedbackGenerated?: (feedback: AIFeedback) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse content section menjadi paragraf dan bullet points
 * Dibuat lebih robust untuk menangani berbagai format AI output
 */
function parseContentWithBullets(content: string): { type: 'text' | 'list'; items: string[] }[] {
  if (!content) return [];

  const result: { type: 'text' | 'list'; items: string[] }[] = [];
  
  // Split by line breaks (single or double)
  const lines = content.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
  
  let currentParagraph: string[] = [];
  let currentList: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        result.push({ type: 'text', items: [text] });
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      result.push({ type: 'list', items: currentList });
      currentList = [];
    }
  };

  for (const line of lines) {
    // Detect bullet points: starts with -, •, *, or number followed by . or )
    const bulletMatch = line.match(/^([-•*]|\d+[.)])\s+(.+)/);
    
    if (bulletMatch) {
      flushParagraph();
      const cleaned = bulletMatch[2].trim();
      if (cleaned) {
        currentList.push(cleaned);
      }
    } else {
      // Regular text line
      flushList();
      currentParagraph.push(line);
    }
  }

  flushParagraph();
  flushList();

  // If result is empty but content exists, treat entire content as one paragraph
  if (result.length === 0 && content.trim()) {
    result.push({ type: 'text', items: [content.trim()] });
  }

  return result;
}

/**
 * Parse feedback_text menjadi sections.
 * Dibuat lebih robust untuk menangani berbagai format AI output.
 */
function parseFeedbackSections(feedbackText: string): FeedbackSection[] {
  if (!feedbackText) return [];

  // Try to parse numbered sections first: "1. LABEL: content"
  // Use [\s\S] instead of . with s flag for ES5 compatibility
  const numberedSectionRegex = /(\d+)\.\s+([A-ZÀÁÂ][A-ZÀÁÂ\s]+?):\s*([\s\S]*?)(?=\s*\d+\.\s+[A-Z]|$)/g;
  const sections: FeedbackSection[] = [];
  let match;

  while ((match = numberedSectionRegex.exec(feedbackText)) !== null) {
    const label = match[2].trim();
    const content = match[3].trim();
    if (content) {
      sections.push({ label, content });
    }
  }

  // If numbered sections found, return them
  if (sections.length > 0) {
    return sections;
  }

  // Fallback: Try to detect sections by keywords
  const keywordSections = [
    { keyword: /(?:^|\n)(RESPONS|Respons|HASIL|Hasil)[:：]/i, label: 'RESPONS' },
    { keyword: /(?:^|\n)(KENAPA SALAH|Kenapa Salah)[:：]/i, label: 'KENAPA SALAH' },
    { keyword: /(?:^|\n)(YANG PERLU DIPERBAIKI|Yang Perlu Diperbaiki)[:：]/i, label: 'YANG PERLU DIPERBAIKI' },
    { keyword: /(?:^|\n)(PERTANYAAN|Pertanyaan|SOAL|Soal)[:：]/i, label: 'PERTANYAAN' },
    { keyword: /(?:^|\n)(JAWABAN KAMU|Jawaban Kamu|JAWABANMU|Jawabanmu)[:：]/i, label: 'JAWABAN KAMU' },
    { keyword: /(?:^|\n)(JAWABAN TEPAT|Jawaban Tepat|JAWABAN BENAR|Jawaban Benar)[:：]/i, label: 'JAWABAN TEPAT' },
    { keyword: /(?:^|\n)(YUK PELAJARI|Yuk Pelajari|PELAJARI|Pelajari)[:：]/i, label: 'YUK PELAJARI' },
    { keyword: /(?:^|\n)(TIPS|Tips|TIPS BELAJAR|Tips Belajar)[:：]/i, label: 'TIPS' },
  ];

  const foundSections: { label: string; start: number; end: number }[] = [];
  
  for (const { keyword, label } of keywordSections) {
    const match = feedbackText.match(keyword);
    if (match && match.index !== undefined) {
      foundSections.push({ label, start: match.index, end: -1 });
    }
  }

  // Sort by position and set end positions
  foundSections.sort((a, b) => a.start - b.start);
  for (let i = 0; i < foundSections.length; i++) {
    foundSections[i].end = i < foundSections.length - 1 
      ? foundSections[i + 1].start 
      : feedbackText.length;
  }

  // Extract content for each section
  for (const { label, start, end } of foundSections) {
    const content = feedbackText.substring(start, end)
      .replace(/^[^:：]+[:：]\s*/, '') // Remove label
      .trim();
    if (content) {
      sections.push({ label, content });
    }
  }

  // If still no sections, treat entire text as one section
  if (sections.length === 0 && feedbackText.trim()) {
    sections.push({ label: 'Feedback AI', content: feedbackText.trim() });
  }

  return sections;
}

/** Mapping label ke konfigurasi tampilan */
function getSectionConfig(label: string, isCorrect: boolean) {
  const upper = label.toUpperCase();

  if (upper.includes("RESPONS")) {
    return {
      icon: isCorrect ? CheckCircle : AlertCircle,
      iconColor: isCorrect ? "#16A34A" : "#D97706",
      bgColor: isCorrect ? "#F0FDF4" : "#FFFBEB",
      borderColor: isCorrect ? "#BBF7D0" : "#FDE68A",
      labelColor: isCorrect ? "#15803D" : "#B45309",
      show: true,
    };
  }
  if (upper.includes("PERTANYAAN")) {
    return {
      icon: HelpCircle,
      iconColor: "#3B82F6",
      bgColor: "#EFF6FF",
      borderColor: "#BFDBFE",
      labelColor: "#1D4ED8",
      show: true,
    };
  }
  if (upper.includes("JAWABAN KAMU")) {
    return {
      icon: MessageSquare,
      iconColor: "#8B5CF6",
      bgColor: "#F5F3FF",
      borderColor: "#DDD6FE",
      labelColor: "#6D28D9",
      show: true,
    };
  }
  if (upper.includes("JAWABAN TEPAT")) {
    return {
      icon: CheckCircle,
      iconColor: "#059669",
      bgColor: "#ECFDF5",
      borderColor: "#A7F3D0",
      labelColor: "#047857",
      show: !isCorrect, // Hanya tampil jika salah
    };
  }
  if (upper.includes("YOHK") || upper.includes("YUK") || upper.includes("PELAJARI") || upper.includes("ANALISIS") || upper.includes("KENAPA") || upper.includes("YANG PERLU")) {
    return {
      icon: Lightbulb,
      iconColor: "#D97706",
      bgColor: "#FFFBEB",
      borderColor: "#FDE68A",
      labelColor: "#92400E",
      show: !isCorrect,
    };
  }
  if (upper.includes("TIPS")) {
    return {
      icon: Sparkles,
      iconColor: "#EC4899",
      bgColor: "#FDF2F8",
      borderColor: "#FBCFE8",
      labelColor: "#9D174D",
      show: true,
    };
  }

  // Default
  return {
    icon: MessageSquare,
    iconColor: "#6B7280",
    bgColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    labelColor: "#374151",
    show: true,
  };
}

/** Label Indonesia yang ramah untuk ditampilkan */
function getFriendlyLabel(rawLabel: string): string {
  const upper = rawLabel.toUpperCase();
  if (upper.includes("RESPONS")) return "Hasil";
  if (upper.includes("KENAPA")) return "Kenapa salah? 🤔";
  if (upper.includes("YANG PERLU")) return "Yang perlu diperbaiki 💡";
  if (upper.includes("PERTANYAAN")) return "Soalnya";
  if (upper.includes("JAWABAN KAMU")) return "Jawaban kamu";
  if (upper.includes("JAWABAN TEPAT")) return "Jawaban yang tepat";
  if (upper.includes("YOHK") || upper.includes("YUK") || upper.includes("PELAJARI")) return "Yuk, kita pelajari 💡";
  if (upper.includes("ANALISIS")) return "Analisis";
  if (upper.includes("TIPS")) return "Tips untuk kamu ✨";
  return rawLabel;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AIFeedbackInline({
  exerciseId,
  questionId,
  lessonId,
  courseId,
  userId,
  userAnswer,
  selectedOptionId,
  isCorrect,
  pointsEarned,
  questionType,
  lessonContent,
  existingFeedback,
  onFeedbackGenerated,
}: AIFeedbackInlineProps) {
  const [state, setState] = useState<FeedbackState>({
    feedback: null,
    isLoading: false,
    error: null,
    isExpanded: true,
    hasGenerated: false,
  });

  // ── Load existing feedback OR generate new feedback ───────────────────────

  useEffect(() => {
    // If existing feedback is provided, use it (parent already checked by unique key)
    if (existingFeedback) {
      console.log(`[AIFeedback] Loading existing feedback`);
      setState({
        feedback: existingFeedback,
        isLoading: false,
        error: null,
        isExpanded: true,
        hasGenerated: true,
      });
      return;
    }

    // Otherwise, generate new feedback
    console.log(`[AIFeedback] No existing feedback, generating new...`);
    setState({
      feedback: null,
      isLoading: false,
      error: null,
      isExpanded: true,
      hasGenerated: false,
    });
    generateAIFeedback();
  }, [existingFeedback]); // Only depend on existingFeedback (parent handles unique key)

  // ── Generate AI Feedback ───────────────────

  const generateAIFeedback = async () => {
    if (!exerciseId) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simpan jawaban ke course_student_answers
      const answerData: Record<string, unknown> = {
        course_exercise_id: exerciseId,
        user_id: userId,
        lesson_id: lessonId,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        answered_at: new Date().toISOString(),
      };

      if (selectedOptionId && selectedOptionId !== "true" && selectedOptionId !== "false") {
        answerData.selected_option_id = selectedOptionId;
      }
      if (selectedOptionId && (selectedOptionId === "true" || selectedOptionId === "false")) {
        answerData.text_answer = selectedOptionId;
      }
      if (userAnswer.trim()) {
        answerData.text_answer = userAnswer.trim();
      }

      const { data: savedAnswer, error: saveError } = await supabase
        .from("course_student_answers")
        .insert([answerData])
        .select("id")
        .single();

      let studentAnswerId: string | undefined = savedAnswer?.id;

      if (saveError) {
        const { data: existingAnswer } = await supabase
          .from("course_student_answers")
          .select("id")
          .eq("course_exercise_id", exerciseId)
          .eq("user_id", userId)
          .order("answered_at", { ascending: false })
          .limit(1)
          .single();

        if (!existingAnswer) throw saveError;
        studentAnswerId = existingAnswer.id;
      }

      // Panggil API AI Feedback
      const payload = {
        studentAnswerId,
        questionId: questionId || exerciseId,
        attemptId: courseId,
        selectedOptionId: selectedOptionId || null,
        lessonContent,
        questionType,
        isCorrect,
        pointsEarned,
        textAnswer: userAnswer || null,
        selectedOptionsArray: null,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch("/api/ai-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) throw new Error("Server sedang sibuk. Coba lagi sebentar ya.");
        if (response.status >= 500) throw new Error("Server sedang maintenance. Coba lagi nanti.");
        throw new Error(`Error ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText?.trim()) throw new Error("Respons kosong dari server");

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error("Respons server tidak valid.");
      }

      if (result.data?.feedback_text && result.data.feedback_text.length > 10) {
        setState((prev) => ({
          ...prev,
          feedback: result.data,
          isLoading: false,
          hasGenerated: true,
          isExpanded: true,
        }));
        if (onFeedbackGenerated) onFeedbackGenerated(result.data);
      } else {
        throw new Error("Feedback tidak lengkap dari AI");
      }
    } catch (error: unknown) {
      let errorMessage = "Terjadi kesalahan tak terduga";

      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.name === "AbortError") {
          errorMessage = "Waktunya habis — AI feedback membutuhkan terlalu lama. Coba lagi ya!";
        }
      }

      setState((prev) => ({
        ...prev,
        feedback: {
          feedback_text: `Maaf, feedback AI belum bisa dimuat saat ini. ${errorMessage}`,
          explanation: "Silakan lanjutkan ke soal berikutnya dan coba lagi nanti.",
          reference_materials: [],
        },
        isLoading: false,
        hasGenerated: true,
        isExpanded: true,
      }));

      toast.error("Gagal memuat feedback AI: " + errorMessage);
    }
  };

  // ── Guard: jangan render kalau data tidak valid ─────────────────────────

  if (!exerciseId || !userId) return null;

  // ── Loading state ────────────────────────────────────────────────────────

  if (state.isLoading) {
    return (
      <div
        className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ backgroundColor: "#F0F9FF", border: "1px solid #BAE6FD" }}
      >
        <Brain className="h-4 w-4 animate-pulse" style={{ color: "#0EA5E9" }} />
        <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#0EA5E9" }} />
        <span className="text-sm" style={{ color: "#0369A1" }}>
          AI sedang menganalisis jawaban kamu…
        </span>
      </div>
    );
  }

  // ── Tidak ada feedback ───────────────────────────────────────────────────

  if (!state.feedback) return null;

  // ── Parse sections ───────────────────────────────────────────────────────

  const sections = parseFeedbackSections(state.feedback.feedback_text);
  
  // Jika hanya 1 section (fallback), tampilkan sebagai feedback sederhana
  const isSimpleFeedback = sections.length === 1 && sections[0].label === 'Feedback AI';

  // ── Render feedback yang sudah di-generate ───────────────────────────────

  return (
    <div
      className="mt-4 rounded-xl overflow-hidden"
      style={{
        border: "1px solid #E5E7EB",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header toggle */}
      <button
        onClick={() => setState((prev) => ({ ...prev, isExpanded: !prev.isExpanded }))}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors duration-150 hover:bg-gray-50"
        style={{ borderBottom: state.isExpanded ? "1px solid #E5E7EB" : "none" }}
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4" style={{ color: "#E8B824" }} />
          <span className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
            Analisis AI
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: isCorrect ? "#D1FAE5" : "#FEF3C7",
              color: isCorrect ? "#065F46" : "#92400E",
            }}
          >
            {isCorrect ? "✓ Tepat" : "💪 Hampir!"}
          </span>
        </div>
        {state.isExpanded ? (
          <ChevronUp className="h-4 w-4" style={{ color: "#9CA3AF" }} />
        ) : (
          <ChevronDown className="h-4 w-4" style={{ color: "#9CA3AF" }} />
        )}
      </button>

      {/* Content */}
      {state.isExpanded && (
        <div className="p-4">
          {isSimpleFeedback ? (
            /* Simple feedback without sections */
            <div className="space-y-3">
              <div
                className="pl-4 py-3"
                style={{
                  borderLeft: `3px solid ${isCorrect ? "#16A34A" : "#E8B824"}`,
                }}
              >
                <div className="text-sm leading-relaxed space-y-2" style={{ color: "#374151" }}>
                  {parseContentWithBullets(sections[0].content).map((block, blockIdx) => {
                    if (block.type === 'text') {
                      return (
                        <p key={blockIdx}>
                          {block.items[0]}
                        </p>
                      );
                    } else {
                      return (
                        <ul key={blockIdx} className="space-y-1.5 ml-4 mt-2">
                          {block.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex items-start gap-2">
                              <span className="text-purple-600 font-bold mt-0.5 flex-shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Structured feedback with sections - Flat with Accent Bars */
            <div className="space-y-0">
              {sections.map((section, idx) => {
                const config = getSectionConfig(section.label, isCorrect);
                if (!config.show) return null;

                const IconComp = config.icon;
                const friendlyLabel = getFriendlyLabel(section.label);
                const parsedContent = parseContentWithBullets(section.content);
                const isLastSection = idx === sections.filter(s => getSectionConfig(s.label, isCorrect).show).length - 1;

                return (
                  <div key={idx}>
                    <div
                      className="pl-4 py-3"
                      style={{
                        borderLeft: `3px solid ${config.iconColor}`,
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <IconComp className="h-4 w-4 flex-shrink-0" style={{ color: config.iconColor }} />
                        <span className="text-sm font-bold" style={{ color: config.labelColor }}>
                          {friendlyLabel}
                        </span>
                      </div>
                      
                      {/* Render parsed content with bullets */}
                      <div className="text-sm leading-relaxed space-y-2" style={{ color: "#374151" }}>
                        {parsedContent.map((block, blockIdx) => {
                          if (block.type === 'text') {
                            return (
                              <p key={blockIdx}>
                                {block.items[0]}
                              </p>
                            );
                          } else {
                            return (
                              <ul key={blockIdx} className="space-y-1.5 ml-4">
                                {block.items.map((item, itemIdx) => (
                                  <li key={itemIdx} className="flex items-start gap-2">
                                    <span className="font-bold mt-0.5 flex-shrink-0" style={{ color: config.iconColor }}>•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            );
                          }
                        })}
                      </div>
                    </div>
                    
                    {/* Divider between sections */}
                    {!isLastSection && (
                      <div className="border-t" style={{ borderColor: "#F3F4F6" }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer info */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t" style={{ borderColor: "#F3F4F6" }}>
            <div className="flex items-center gap-1.5">
              <ThumbsUp className="h-3 w-3" style={{ color: "#D1D5DB" }} />
              <span className="text-xs" style={{ color: "#9CA3AF" }}>
                Dibuat oleh AI · {state.feedback.ai_model || "Llama 3.3"}
              </span>
            </div>
            {state.feedback.processing_time_ms && (
              <span className="text-xs" style={{ color: "#D1D5DB" }}>
                {(state.feedback.processing_time_ms / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
