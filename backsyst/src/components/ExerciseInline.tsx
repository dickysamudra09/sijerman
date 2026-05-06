"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Brain,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Trophy,
} from "lucide-react";
import AIFeedbackInline from "@/components/AIFeedbackInline";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface ExerciseOption {
  id: string;
  jawaban: string;
  is_correct: boolean;
  order_index: number;
}

interface Exercise {
  id: string;
  questionId?: string;
  title: string;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "essay";
  points: number;
  explanation?: string;
  options?: ExerciseOption[];
  jawaban_benar?: boolean; // For true_false questions
  perintah?: string; // Instruction text for true_false
  jawaban?: string; // Answer text for true_false (the actual question statement)
}

interface QuestionState {
  selectedOptionId: string | null;
  essayAnswer: string;
  isSubmitted: boolean;
  isLoading: boolean;
  isCorrect: boolean | null;
  pointsEarned: number;
  correctAnswer: string | null;
}

interface ExerciseInlineProps {
  lessonId: string;
  courseId: string;
  userId: string;
  lessonContent?: string;
  feedbackMap: Record<string, any>;
  onFeedbackGenerated: (exerciseId: string, feedback: any) => void;
}

const defaultQuestionState = (): QuestionState => ({
  selectedOptionId: null,
  essayAnswer: "",
  isSubmitted: false,
  isLoading: false,
  isCorrect: null,
  pointsEarned: 0,
  correctAnswer: null,
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExerciseInline({
  lessonId,
  courseId,
  userId,
  lessonContent,
  feedbackMap,
  onFeedbackGenerated,
}: ExerciseInlineProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [questionStates, setQuestionStates] = useState<Record<string, QuestionState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedLessonContent, setFetchedLessonContent] = useState<string>(lessonContent || "");

  // One-by-one navigation state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // ── Fetch exercises + questions + options ────────────────────────────────

  useEffect(() => {
    let isMounted = true; // Track if component is still mounted
    
    const fetchExercises = async () => {
      if (!lessonId) {
        setError("Lesson ID tidak valid");
        setIsLoading(false);
        return;
      }

      // Clear exercises immediately to prevent glitch when switching modules
      setExercises([]);
      setQuestionStates({});
      setIsLoading(true);
      setCurrentQuestionIndex(0);
      setError(null);

      try {
        // 1. Fetch lesson content jika belum ada
        let currentLessonContent = lessonContent;
        if (!currentLessonContent) {
          const { data: lessonData } = await supabase
            .from("module_lessons")
            .select("content")
            .eq("id", lessonId)
            .single();
          
          // Check if component is still mounted and lessonId hasn't changed
          if (!isMounted) return;
          
          if (lessonData?.content) {
            currentLessonContent = lessonData.content;
            setFetchedLessonContent(lessonData.content);
          }
        } else {
          setFetchedLessonContent(lessonContent);
        }

        // 2. Fetch semua exercises untuk lesson ini
        const { data: exercisesData, error: exercisesError } = await supabase
          .from("course_exercises")
          .select("id, title, exercise_number")
          .eq("lesson_id", lessonId)
          .eq("is_active", true)
          .order("exercise_number", { ascending: true });

        // Check if component is still mounted
        if (!isMounted) return;

        if (exercisesError) throw exercisesError;
        if (!exercisesData || exercisesData.length === 0) {
          setExercises([]);
          setIsLoading(false);
          return;
        }

        // 3. Per exercise, fetch questions + options
        const allExercises: Exercise[] = [];
        const initialStates: Record<string, QuestionState> = {};

        for (const exerciseRow of exercisesData) {
          const { data: questionsData, error: questionsError } = await supabase
            .from("course_questions")
            .select(
              "id, pertanyaan, question_type, points, perintah, jawaban, jawaban_benar, order_index"
            )
            .eq("exercise_id", exerciseRow.id)
            .order("order_index", { ascending: true });

          if (questionsError) {
            console.warn("Questions fetch error:", exerciseRow.id, questionsError);
            continue;
          }
          if (!questionsData || questionsData.length === 0) continue;

          for (const question of questionsData) {
            const { data: optionsData } = await supabase
              .from("course_options")
              .select("id, jawaban, is_correct, order_index")
              .eq("question_id", question.id)
              .order("order_index", { ascending: true });

            if (
              question.question_type === "multiple_choice" &&
              (!optionsData || optionsData.length === 0)
            ) {
              console.warn("MC question has no options, skipping:", question.id);
              continue;
            }

            const uniqueId = `${exerciseRow.id}_${question.id}`;

            // For true_false: 
            // - perintah = instruction (e.g., "Lies die Sätze und entscheide: Richtig (R) oder Falsch (F)?")
            // - jawaban = the actual question statement (e.g., "Rania kommt aus Jakarta...")
            // - pertanyaan = can be used as fallback
            let questionText = "";
            if (question.question_type === "true_false") {
              // For true_false, use jawaban as the main question
              questionText = question.jawaban || question.pertanyaan || "";
            } else {
              // For other types, use pertanyaan
              questionText = question.pertanyaan || "";
            }
            
            // If still empty, fallback to perintah
            if (!questionText && question.perintah) {
              questionText = question.perintah;
            }

            allExercises.push({
              id: uniqueId,
              questionId: question.id,
              title: exerciseRow.title || "Latihan",
              question_text: questionText,
              question_type: question.question_type || "multiple_choice",
              points: question.points || 10,
              explanation: question.perintah || "",
              options: optionsData || [],
              // Store additional fields for true_false questions
              jawaban_benar: question.question_type === "true_false" ? question.jawaban_benar : undefined,
              perintah: question.question_type === "true_false" ? question.perintah : undefined,
              jawaban: question.question_type === "true_false" ? question.jawaban : undefined,
            });

            initialStates[uniqueId] = defaultQuestionState();
          }
        }

        // Final check before setting state
        if (!isMounted) {
          console.log('[ExerciseInline] Component unmounted, skipping state update');
          return;
        }

        console.log(`[ExerciseInline] Setting ${allExercises.length} exercises for lesson ${lessonId}`);
        setExercises(allExercises);
        setQuestionStates(initialStates);
      } catch (err: unknown) {
        if (!isMounted) return; // Don't set error if unmounted
        
        const message = err instanceof Error ? err.message : "Gagal memuat latihan";
        console.error("Error fetching exercises:", err);
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchExercises();
    
    // Cleanup function
    return () => {
      console.log('[ExerciseInline] Cleanup - lesson changing');
      isMounted = false;
    };
  }, [lessonId, lessonContent]);

  // ── State helpers ────────────────────────────────────────────────────────

  const updateQuestion = (id: string, patch: Partial<QuestionState>) => {
    setQuestionStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  // ── Submit jawaban soal yang sedang aktif ────────────────────────────────

  const handleSubmit = async (exercise: Exercise) => {
    const qState = questionStates[exercise.id];
    if (!qState || qState.isSubmitted) return;

    if (
      (exercise.question_type === "multiple_choice" || exercise.question_type === "true_false") &&
      !qState.selectedOptionId
    ) {
      toast.warning("Pilih salah satu jawaban dulu ya.");
      return;
    }
    if (exercise.question_type === "essay" && !qState.essayAnswer.trim()) {
      toast.warning("Tulis jawabanmu dulu ya.");
      return;
    }

    updateQuestion(exercise.id, { isLoading: true });

    try {
      let isCorrect = false;
      let pointsEarned = 0;
      let correctAnswer: string | null = null;

      if (exercise.question_type === "multiple_choice") {
        const selected = exercise.options?.find((o) => o.id === qState.selectedOptionId);
        isCorrect = selected?.is_correct || false;
        pointsEarned = isCorrect ? exercise.points : 0;
      } else if (exercise.question_type === "true_false") {
        // Use jawaban_benar field from database
        const correctVal = exercise.jawaban_benar ? "true" : "false";
        correctAnswer = correctVal;
        isCorrect = qState.selectedOptionId === correctVal;
        pointsEarned = isCorrect ? exercise.points : 0;
      } else if (exercise.question_type === "essay") {
        isCorrect = qState.essayAnswer.trim().length > 0;
        pointsEarned = isCorrect ? Math.round(exercise.points * 0.8) : 0;
      }

      const [courseExerciseId] = exercise.id.split("_");

      const answerData: Record<string, unknown> = {
        course_exercise_id: courseExerciseId,
        user_id: userId,
        lesson_id: lessonId,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        answered_at: new Date().toISOString(),
      };

      if (qState.selectedOptionId && exercise.question_type === "multiple_choice") {
        answerData.selected_option_id = qState.selectedOptionId;
      }
      if (qState.selectedOptionId && exercise.question_type === "true_false") {
        answerData.text_answer = qState.selectedOptionId;
      }
      if (qState.essayAnswer.trim()) {
        answerData.text_answer = qState.essayAnswer.trim();
      }

      const { error: saveError } = await supabase
        .from("course_student_answers")
        .insert([answerData]);

      if (saveError) throw saveError;

      updateQuestion(exercise.id, {
        isSubmitted: true,
        isCorrect,
        pointsEarned,
        correctAnswer,
        isLoading: false,
      });

      toast.success(isCorrect ? "Benar! 🎉" : "Jawaban dikirim!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal mengirim jawaban";
      console.error("Error submitting answer:", err);
      updateQuestion(exercise.id, { isLoading: false });
      toast.error(message);
    }
  };

  // ── Derived values ───────────────────────────────────────────────────────

  const totalQuestions = exercises.length;
  const currentExercise = exercises[currentQuestionIndex];
  const currentState = currentExercise ? questionStates[currentExercise.id] : null;
  const effectiveLessonContent = fetchedLessonContent || lessonContent || "";

  const answeredCount = exercises.filter((ex) => questionStates[ex.id]?.isSubmitted).length;
  const correctCount = exercises.filter((ex) => questionStates[ex.id]?.isCorrect === true).length;
  const allDone = answeredCount === totalQuestions && totalQuestions > 0;

  const canGoNext =
    currentState?.isSubmitted && currentQuestionIndex < totalQuestions - 1;
  const canGoPrev = currentQuestionIndex > 0;

  // ── Loading / Error / Empty ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        className="mt-6 rounded-xl p-6 flex items-center justify-center gap-3"
        style={{ backgroundColor: "#FFFBF0", border: "1px solid #FDE68A" }}
      >
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#E8B824" }} />
        <span className="text-sm" style={{ color: "#92400E" }}>
          Memuat latihan soal…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="mt-6 rounded-xl p-4 flex items-center gap-2"
        style={{ backgroundColor: "#FFF5F5", border: "1px solid #FCA5A5" }}
      >
        <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: "#DC2626" }} />
        <span className="text-sm" style={{ color: "#DC2626" }}>
          {error}
        </span>
      </div>
    );
  }

  if (totalQuestions === 0) return null;

  // ── Ringkasan setelah semua soal selesai ─────────────────────────────────

  if (allDone && currentQuestionIndex === totalQuestions - 1 && currentState?.isSubmitted) {
    // Tetap tampilkan soal terakhir + feedback, plus panel ringkasan di bawah
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mt-8 space-y-6 rounded-xl p-6" style={{ backgroundColor: "#FFF9E6", border: "1px solid #FDE68A" }}>
      {/* ── Header: judul + dot breadcrumb ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5" style={{ color: "#E8B824" }} />
          <span className="font-bold text-base" style={{ color: "#1A1A1A" }}>
            Latihan Soal
          </span>
        </div>

        {/* Dot navigator */}
        <div className="flex items-center gap-1.5">
          {exercises.map((ex, idx) => {
            const st = questionStates[ex.id];
            const isActive = idx === currentQuestionIndex;
            const isDone = st?.isSubmitted;
            const isRight = st?.isCorrect;

            return (
              <button
                key={ex.id}
                disabled={true} // Linear Strict: tidak bisa loncat
                title={`Soal ${idx + 1}${isDone ? (isRight ? " ✓" : " ✗") : ""}`}
                className="rounded-full transition-all duration-200"
                style={{
                  width: isActive ? "24px" : "10px",
                  height: "10px",
                  backgroundColor: isDone
                    ? isRight
                      ? "#16A34A"
                      : "#D97706"
                    : isActive
                    ? "#E8B824"
                    : "#E5E7EB",
                  cursor: "default",
                }}
              />
            );
          })}
          <span className="ml-2 text-xs font-medium" style={{ color: "#6B7280" }}>
            {currentQuestionIndex + 1}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* ── Soal aktif ── */}
      {currentExercise && currentState && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: "1px solid #FDE68A",
            backgroundColor: "#FFFFFF",
            boxShadow: "0 2px 12px rgba(232,184,36,0.08)",
          }}
        >
          {/* Soal header */}
          <div
            className="px-5 py-4 border-b"
            style={{ borderColor: "#FEF3C7", backgroundColor: "#FFFBEB" }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>
                Soal {currentQuestionIndex + 1} dari {totalQuestions}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: "#FFF9E6", color: "#E8B824" }}
              >
                {currentExercise.points} poin
              </span>
            </div>
            
            {/* For true_false: show perintah (instruction) first */}
            {currentExercise.question_type === "true_false" && currentExercise.perintah && (
              <p className="text-sm font-medium leading-snug mb-3" style={{ color: "#6B7280" }}>
                {currentExercise.perintah}
              </p>
            )}
            
            {/* Main question text */}
            <p className="text-base font-semibold leading-snug" style={{ color: "#1A1A1A" }}>
              {currentExercise.question_text}
            </p>
          </div>

          {/* Soal body */}
          <div className="px-5 py-4">
            {/* ── Sebelum submit: input jawaban ── */}
            {!currentState.isSubmitted ? (
              <div className="space-y-4">
                {/* Multiple choice */}
                {currentExercise.question_type === "multiple_choice" && (
                  <RadioGroup
                    value={currentState.selectedOptionId || ""}
                    onValueChange={(v) =>
                      updateQuestion(currentExercise.id, { selectedOptionId: v })
                    }
                    className="space-y-2"
                  >
                    {currentExercise.options?.map((option) => (
                      <label
                        key={option.id}
                        htmlFor={`${currentExercise.id}_${option.id}`}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-150"
                        style={{
                          border: `2px solid ${
                            currentState.selectedOptionId === option.id ? "#E8B824" : "#E5E7EB"
                          }`,
                          backgroundColor:
                            currentState.selectedOptionId === option.id ? "#FFFBEB" : "#FAFAFA",
                        }}
                      >
                        <RadioGroupItem
                          value={option.id}
                          id={`${currentExercise.id}_${option.id}`}
                          className="flex-shrink-0"
                        />
                        <span className="text-sm" style={{ color: "#374151" }}>
                          {option.jawaban}
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                )}

                {/* True / False */}
                {currentExercise.question_type === "true_false" && (
                  <RadioGroup
                    value={currentState.selectedOptionId || ""}
                    onValueChange={(v) =>
                      updateQuestion(currentExercise.id, { selectedOptionId: v })
                    }
                    className="flex gap-3"
                  >
                    {[
                      { value: "true", label: "Richtig (R)" },
                      { value: "false", label: "Falsch (F)" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        htmlFor={`${currentExercise.id}_${opt.value}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-all duration-150 font-semibold text-sm"
                        style={{
                          border: `2px solid ${
                            currentState.selectedOptionId === opt.value ? "#E8B824" : "#E5E7EB"
                          }`,
                          backgroundColor:
                            currentState.selectedOptionId === opt.value ? "#FFFBEB" : "#FAFAFA",
                          color: "#374151",
                        }}
                      >
                        <RadioGroupItem
                          value={opt.value}
                          id={`${currentExercise.id}_${opt.value}`}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </RadioGroup>
                )}

                {/* Essay */}
                {currentExercise.question_type === "essay" && (
                  <Textarea
                    placeholder="Tulis jawabanmu di sini…"
                    value={currentState.essayAnswer}
                    onChange={(e) =>
                      updateQuestion(currentExercise.id, { essayAnswer: e.target.value })
                    }
                    className="min-h-[100px] resize-none text-sm"
                    style={{ color: "#1A1A1A", borderColor: "#E5E7EB" }}
                  />
                )}

                <Button
                  onClick={() => handleSubmit(currentExercise)}
                  disabled={currentState.isLoading}
                  className="w-full font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                  style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
                >
                  {currentState.isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mengirim…
                    </>
                  ) : (
                    "Kirim Jawaban"
                  )}
                </Button>
              </div>
            ) : (
              /* ── Setelah submit: hasil ── */
              <div className="space-y-3">
                {/* Status jawaban */}
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-lg"
                  style={{
                    backgroundColor: currentState.isCorrect ? "#F0FDF4" : "#FFFBEB",
                    border: `1px solid ${currentState.isCorrect ? "#BBF7D0" : "#FDE68A"}`,
                  }}
                >
                  {currentState.isCorrect ? (
                    <CheckCircle className="h-5 w-5 flex-shrink-0" style={{ color: "#16A34A" }} />
                  ) : (
                    <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: "#D97706" }} />
                  )}
                  <div>
                    <p
                      className="font-semibold text-sm"
                      style={{ color: currentState.isCorrect ? "#15803D" : "#B45309" }}
                    >
                      {currentState.isCorrect
                        ? "Tepat sekali! 🎉"
                        : "Hampir! Jangan menyerah 💪"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                      +{currentState.pointsEarned} dari {currentExercise.points} poin
                    </p>
                  </div>
                </div>

                {/* Tampilkan pilihan jawaban dengan warna (Multiple Choice) */}
                {currentExercise.question_type === "multiple_choice" && (
                  <div className="space-y-2">
                    {currentExercise.options?.map((option) => {
                      const isUserAnswer = option.id === currentState.selectedOptionId;
                      const isCorrectOption = option.is_correct;
                      
                      let borderColor = "#E5E7EB";
                      let bgColor = "#FAFAFA";
                      let textColor = "#374151";
                      
                      if (isCorrectOption) {
                        borderColor = "#86EFAC";
                        bgColor = "#F0FDF4";
                        textColor = "#15803D";
                      } else if (isUserAnswer && !isCorrectOption) {
                        borderColor = "#FCA5A5";
                        bgColor = "#FEF2F2";
                        textColor = "#DC2626";
                      }

                      return (
                        <div
                          key={option.id}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg"
                          style={{
                            border: `2px solid ${borderColor}`,
                            backgroundColor: bgColor,
                          }}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {isCorrectOption && (
                              <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#16A34A" }} />
                            )}
                            {isUserAnswer && !isCorrectOption && (
                              <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#DC2626" }} />
                            )}
                            <span className="text-sm font-medium" style={{ color: textColor }}>
                              {option.jawaban}
                            </span>
                          </div>
                          {isUserAnswer && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{
                                backgroundColor: isCorrectOption ? "#D1FAE5" : "#FEE2E2",
                                color: isCorrectOption ? "#065F46" : "#991B1B",
                              }}
                            >
                              Jawabanmu
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tampilkan pilihan jawaban dengan warna (True/False) */}
                {currentExercise.question_type === "true_false" && (
                  <div className="flex gap-3">
                    {[
                      { value: "true", label: "Richtig (R)" },
                      { value: "false", label: "Falsch (F)" },
                    ].map((opt) => {
                      const isUserAnswer = currentState.selectedOptionId === opt.value;
                      const isCorrectOption = currentState.correctAnswer === opt.value;
                      
                      let borderColor = "#E5E7EB";
                      let bgColor = "#FAFAFA";
                      let textColor = "#374151";
                      
                      if (isCorrectOption) {
                        borderColor = "#86EFAC";
                        bgColor = "#F0FDF4";
                        textColor = "#15803D";
                      } else if (isUserAnswer && !isCorrectOption) {
                        borderColor = "#FCA5A5";
                        bgColor = "#FEF2F2";
                        textColor = "#DC2626";
                      }

                      return (
                        <div
                          key={opt.value}
                          className="flex-1 flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-lg"
                          style={{
                            border: `2px solid ${borderColor}`,
                            backgroundColor: bgColor,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {isCorrectOption && (
                              <CheckCircle className="h-4 w-4" style={{ color: "#16A34A" }} />
                            )}
                            {isUserAnswer && !isCorrectOption && (
                              <AlertCircle className="h-4 w-4" style={{ color: "#DC2626" }} />
                            )}
                            <span className="text-sm font-semibold" style={{ color: textColor }}>
                              {opt.label}
                            </span>
                          </div>
                          {isUserAnswer && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{
                                backgroundColor: isCorrectOption ? "#D1FAE5" : "#FEE2E2",
                                color: isCorrectOption ? "#065F46" : "#991B1B",
                              }}
                            >
                              Jawabanmu
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tampilkan jawaban essay (read-only) */}
                {currentExercise.question_type === "essay" && (
                  <div
                    className="px-4 py-3 rounded-lg"
                    style={{
                      backgroundColor: currentState.isCorrect ? "#F0FDF4" : "#FFFBEB",
                      border: `1px solid ${currentState.isCorrect ? "#BBF7D0" : "#FDE68A"}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>
                        Jawabanmu:
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
                      {currentState.essayAnswer}
                    </p>
                  </div>
                )}

                {/* AI Feedback — collapsed by default, manual trigger */}
                {(() => {
                  // Use full exercise ID (exercise_id + question_id) as unique key
                  const uniqueExerciseKey = currentExercise.id; // e.g., "ex1_q1", "ex1_q2", etc.
                  const [courseExerciseId] = currentExercise.id.split("_");
                  const existingFb = feedbackMap[uniqueExerciseKey]; // Use full ID as key!
                  
                  console.log('[DEBUG ExerciseInline] Current exercise:', {
                    uniqueKey: uniqueExerciseKey,
                    courseExerciseId: courseExerciseId,
                    hasExistingFeedback: !!existingFb,
                    feedbackMapKeys: Object.keys(feedbackMap)
                  });
                  
                  return (
                    <AIFeedbackInline
                      key={uniqueExerciseKey}
                      exerciseId={courseExerciseId}
                      questionId={currentExercise.questionId}
                      lessonId={lessonId}
                      courseId={courseId}
                      userId={userId}
                      userAnswer={currentState.essayAnswer}
                      selectedOptionId={currentState.selectedOptionId}
                      isCorrect={currentState.isCorrect || false}
                      pointsEarned={currentState.pointsEarned}
                      questionType={currentExercise.question_type}
                      lessonContent={effectiveLessonContent}
                      existingFeedback={existingFb}
                      onFeedbackGenerated={(feedback) => {
                        console.log('[DEBUG] Feedback generated for:', uniqueExerciseKey);
                        onFeedbackGenerated(uniqueExerciseKey, feedback); // Save with full ID!
                      }}
                    />
                  );
                })()}
              </div>
            )}
          </div>

          {/* ── Navigasi Prev / Next ── */}
          {currentState.isSubmitted && (
            <div
              className="px-5 py-3 flex items-center justify-between border-t"
              style={{ borderColor: "#FEF3C7", backgroundColor: "#FFFBEB" }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                disabled={!canGoPrev}
                className="flex items-center gap-1.5 text-sm font-medium"
                style={{ color: canGoPrev ? "#4B5563" : "#D1D5DB" }}
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </Button>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <Button
                  size="sm"
                  onClick={() => setCurrentQuestionIndex((i) => i + 1)}
                  disabled={!canGoNext}
                  className="flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    backgroundColor: canGoNext ? "#E8B824" : "#E5E7EB",
                    color: canGoNext ? "#1A1A1A" : "#9CA3AF",
                  }}
                >
                  Soal Berikutnya
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}>
                  <CheckCircle className="h-4 w-4" />
                  Selesai!
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Ringkasan setelah semua soal selesai ── */}
      {allDone && (
        <div
          className="rounded-2xl px-6 py-6 shadow-lg"
          style={{
            background: correctCount === totalQuestions
              ? "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)"
              : "linear-gradient(135deg, #FFFBEB 0%, #FEF9C3 100%)",
            border: correctCount === totalQuestions
              ? "2px solid #86EFAC"
              : "2px solid #FDE68A",
            animation: "fadeIn 0.5s ease-out"
          }}
        >
          <div className="flex items-center gap-5">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
              style={{ 
                backgroundColor: correctCount === totalQuestions ? "#D1FAE5" : "#FEF3C7"
              }}
            >
              <Trophy 
                className="h-8 w-8" 
                style={{ color: correctCount === totalQuestions ? "#16A34A" : "#D97706" }} 
              />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg mb-1" style={{ 
                color: correctCount === totalQuestions ? "#15803D" : "#92400E" 
              }}>
                {correctCount === totalQuestions 
                  ? "Sempurna! Semua jawaban benar! 🎉" 
                  : "Latihan selesai! 🎉"}
              </p>
              <p className="text-sm" style={{ 
                color: correctCount === totalQuestions ? "#166534" : "#B45309" 
              }}>
                Kamu menjawab{" "}
                <span className="font-bold" style={{ 
                  color: correctCount === totalQuestions ? "#15803D" : "#16A34A" 
                }}>
                  {correctCount}
                </span> dari{" "}
                <span className="font-bold">{totalQuestions}</span> soal dengan benar.
              </p>
              {correctCount < totalQuestions && (
                <p className="text-xs mt-1" style={{ color: "#92400E" }}>
                  💪 Terus berlatih untuk hasil yang lebih baik!
                </p>
              )}
            </div>
            <div className="text-center px-4 py-3 rounded-xl" style={{
              backgroundColor: correctCount === totalQuestions ? "#BBF7D0" : "#FEF3C7",
            }}>
              <p className="text-3xl font-black mb-1" style={{ 
                color: correctCount === totalQuestions ? "#15803D" : "#E8B824" 
              }}>
                {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%
              </p>
              <p className="text-xs font-semibold" style={{ 
                color: correctCount === totalQuestions ? "#166534" : "#B45309" 
              }}>
                SKOR
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
