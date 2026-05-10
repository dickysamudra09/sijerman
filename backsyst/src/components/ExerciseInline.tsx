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
  Lock,
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
  onAllExercisesCompleted?: (completed: boolean) => void;
  onHasExercises?: (hasExercises: boolean) => void; // NEW: Notify if lesson has exercises
  attemptId?: string | null; // NEW: Current attempt ID for retry system
  onExerciseComplete?: (attemptId: string) => void; // NEW: Callback when exercise is completed
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
  onAllExercisesCompleted,
  onHasExercises,
  attemptId, // NEW: Current attempt ID
  onExerciseComplete, // NEW: Callback when exercise is completed
}: ExerciseInlineProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [questionStates, setQuestionStates] = useState<Record<string, QuestionState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedLessonContent, setFetchedLessonContent] = useState<string>(lessonContent || "");

  // One-by-one navigation state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // ✨ NEW: Track if AI feedback has loaded for current question
  const [feedbackLoadedMap, setFeedbackLoadedMap] = useState<Record<string, boolean>>({});

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
          setFetchedLessonContent(lessonContent || '');
        }

        // ✨ OPTIMIZED: Fetch exercises with nested questions and options in 1 query!
        console.time('[ExerciseInline] Fetch exercises with joins');
        const { data: exercisesData, error: exercisesError } = await supabase
          .from("course_exercises")
          .select(`
            id, 
            title, 
            exercise_number,
            course_questions (
              id,
              pertanyaan,
              question_type,
              points,
              perintah,
              jawaban,
              jawaban_benar,
              order_index,
              course_options (
                id,
                jawaban,
                is_correct,
                order_index
              )
            )
          `)
          .eq("lesson_id", lessonId)
          .eq("is_active", true)
          .order("exercise_number", { ascending: true })
          .order("order_index", { foreignTable: "course_questions", ascending: true })
          .order("order_index", { foreignTable: "course_questions.course_options", ascending: true });
        
        console.timeEnd('[ExerciseInline] Fetch exercises with joins');

        // Check if component is still mounted
        if (!isMounted) return;

        if (exercisesError) {
          console.error('[ExerciseInline] Fetch error:', exercisesError);
          throw exercisesError;
        }
        
        if (!exercisesData || exercisesData.length === 0) {
          console.log('[ExerciseInline] No exercises found for lesson:', lessonId);
          setExercises([]);
          setIsLoading(false);
          return;
        }

        // ✨ OPTIMIZED: Process nested data (no more loops with queries!)
        const allExercises: Exercise[] = [];
        const initialStates: Record<string, QuestionState> = {};

        for (const exerciseRow of exercisesData) {
          const questions = exerciseRow.course_questions || [];
          
          if (questions.length === 0) {
            console.warn('[ExerciseInline] Exercise has no questions:', exerciseRow.id);
            continue;
          }

          for (const question of questions) {
            const options = question.course_options || [];

            // Validate multiple choice questions have options
            if (
              question.question_type === "multiple_choice" &&
              options.length === 0
            ) {
              console.warn('[ExerciseInline] MC question has no options, skipping:', question.id);
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
              options: options.map(opt => ({
                id: opt.id,
                jawaban: opt.jawaban,
                is_correct: opt.is_correct,
                order_index: opt.order_index,
              })),
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
        
        // NEW: Notify parent if this lesson has exercises
        if (onHasExercises) {
          onHasExercises(allExercises.length > 0);
        }
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

      // ✨ NEW: Add attempt_id if available (for retry system)
      if (attemptId) {
        answerData.attempt_id = attemptId;
      }

      if (qState.selectedOptionId && exercise.question_type === "multiple_choice") {
        answerData.selected_option_id = qState.selectedOptionId;
      }
      if (qState.selectedOptionId && exercise.question_type === "true_false") {
        answerData.text_answer = qState.selectedOptionId;
      }
      if (qState.essayAnswer.trim()) {
        answerData.text_answer = qState.essayAnswer.trim();
      }

      const { data: savedAnswer, error: saveError } = await supabase
        .from("course_student_answers")
        .insert([answerData])
        .select()
        .single();

      if (saveError) throw saveError;

      // ✨ NEW: Store studentAnswerId for AI feedback (if needed)
      const studentAnswerId = savedAnswer?.id;

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

  // NEW: Notify parent when all exercises are completed
  useEffect(() => {
    if (onAllExercisesCompleted) {
      onAllExercisesCompleted(allDone);
    }
    
    // ✨ NEW: Complete attempt when all exercises are done
    if (allDone && attemptId && onExerciseComplete) {
      onExerciseComplete(attemptId);
    }
  }, [allDone, onAllExercisesCompleted, attemptId, onExerciseComplete]);

  // ✨ NEW: Check if current question's feedback has loaded
  const currentFeedbackLoaded = currentExercise ? feedbackLoadedMap[currentExercise.id] || false : false;
  
  const canGoNext =
    currentState?.isSubmitted && 
    currentQuestionIndex < totalQuestions - 1 &&
    currentFeedbackLoaded; // ✨ NEW: Only allow next if feedback has loaded
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
    <div className="mt-6 space-y-5 max-w-4xl mx-auto px-4 sm:px-6">
      {/* ── Header: judul + dot breadcrumb ── */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 rounded-2xl" 
        style={{ backgroundColor: "#FFF9E6" }}
      >
        <div className="flex items-center gap-2.5">
          <Brain className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" style={{ color: "#E8B824" }} />
          <span className="font-bold text-base sm:text-lg" style={{ color: "#1A1A1A" }}>
            Latihan Soal
          </span>
        </div>

        {/* Dot navigator */}
        <div className="flex items-center gap-2">
          {exercises.map((ex, idx) => {
            const st = questionStates[ex.id];
            const isActive = idx === currentQuestionIndex;
            const isDone = st?.isSubmitted;
            const isRight = st?.isCorrect;

            return (
              <button
                key={ex.id}
                disabled={true}
                title={`Soal ${idx + 1}${isDone ? (isRight ? " ✓" : " ✗") : ""}`}
                className="rounded-full transition-all duration-200"
                style={{
                  width: isActive ? "28px" : "12px",
                  height: "12px",
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
          <span className="ml-2 text-sm font-semibold" style={{ color: "#6B7280" }}>
            {currentQuestionIndex + 1}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* ── Soal aktif ── */}
      {currentExercise && currentState && (
        <div className="space-y-5">
          {/* Soal header */}
          <div
            className="px-5 sm:px-7 py-5 rounded-2xl"
            style={{ backgroundColor: "#FFFBEB" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>
                Soal {currentQuestionIndex + 1} dari {totalQuestions}
              </span>
              <span
                className="text-xs sm:text-sm px-3 py-1.5 rounded-full font-bold inline-block w-fit"
                style={{ backgroundColor: "#FFF9E6", color: "#E8B824" }}
              >
                {currentExercise.points} poin
              </span>
            </div>
            
            {/* For true_false: show perintah (instruction) first */}
            {currentExercise.question_type === "true_false" && currentExercise.perintah && (
              <p className="text-sm sm:text-base font-medium leading-relaxed mb-4" style={{ color: "#6B7280" }}>
                {currentExercise.perintah}
              </p>
            )}
            
            {/* Main question text */}
            <p className="text-lg sm:text-xl font-bold leading-relaxed" style={{ color: "#1A1A1A" }}>
              {currentExercise.question_text}
            </p>
          </div>

          {/* Soal body */}
          <div className="space-y-5">
            {/* ── Sebelum submit: input jawaban ── */}
            {!currentState.isSubmitted ? (
              <div className="space-y-5">
                {/* Multiple choice */}
                {currentExercise.question_type === "multiple_choice" && (
                  <RadioGroup
                    value={currentState.selectedOptionId || ""}
                    onValueChange={(v) =>
                      updateQuestion(currentExercise.id, { selectedOptionId: v })
                    }
                    className="space-y-3"
                  >
                    {currentExercise.options?.map((option) => (
                      <label
                        key={option.id}
                        htmlFor={`${currentExercise.id}_${option.id}`}
                        className="flex items-center gap-4 px-5 sm:px-6 py-4 sm:py-5 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                        style={{
                          border: `2px solid ${
                            currentState.selectedOptionId === option.id ? "#E8B824" : "#E5E7EB"
                          }`,
                          backgroundColor:
                            currentState.selectedOptionId === option.id ? "#FFFBEB" : "#FFFFFF",
                        }}
                      >
                        <RadioGroupItem
                          value={option.id}
                          id={`${currentExercise.id}_${option.id}`}
                          className="flex-shrink-0"
                        />
                        <span className="text-sm sm:text-base leading-relaxed" style={{ color: "#374151" }}>
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
                    className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                  >
                    {[
                      { value: "true", label: "Richtig (R)" },
                      { value: "false", label: "Falsch (F)" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        htmlFor={`${currentExercise.id}_${opt.value}`}
                        className="flex-1 flex items-center justify-center gap-3 px-6 py-5 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] font-bold text-base sm:text-lg"
                        style={{
                          border: `3px solid ${
                            currentState.selectedOptionId === opt.value ? "#E8B824" : "#E5E7EB"
                          }`,
                          backgroundColor:
                            currentState.selectedOptionId === opt.value ? "#FFFBEB" : "#FFFFFF",
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
                    className="min-h-[120px] sm:min-h-[150px] resize-none text-sm sm:text-base rounded-2xl px-5 py-4"
                    style={{ color: "#1A1A1A", borderColor: "#E5E7EB" }}
                  />
                )}

                <Button
                  onClick={() => handleSubmit(currentExercise)}
                  disabled={currentState.isLoading}
                  className="w-full font-bold text-base sm:text-lg py-6 sm:py-7 rounded-2xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-lg"
                  style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
                >
                  {currentState.isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Mengirim…
                    </>
                  ) : (
                    "Kirim Jawaban"
                  )}
                </Button>
              </div>
            ) : (
              /* ── Setelah submit: hasil ── */
              <div className="space-y-5">
                {/* Status jawaban */}
                <div
                  className="flex items-center gap-4 px-5 sm:px-7 py-5 sm:py-6 rounded-2xl"
                  style={{
                    backgroundColor: currentState.isCorrect ? "#F0FDF4" : "#FFFBEB",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  {currentState.isCorrect ? (
                    <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0" style={{ color: "#16A34A" }} />
                  ) : (
                    <AlertCircle className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0" style={{ color: "#D97706" }} />
                  )}
                  <div>
                    <p
                      className="font-bold text-base sm:text-lg"
                      style={{ color: currentState.isCorrect ? "#15803D" : "#B45309" }}
                    >
                      {currentState.isCorrect
                        ? "Tepat sekali! 🎉"
                        : "Hampir! Jangan menyerah 💪"}
                    </p>
                    <p className="text-sm sm:text-base mt-1" style={{ color: "#6B7280" }}>
                      +{currentState.pointsEarned} dari {currentExercise.points} poin
                    </p>
                  </div>
                </div>

                {/* Tampilkan pilihan jawaban dengan warna (Multiple Choice) */}
                {currentExercise.question_type === "multiple_choice" && (
                  <div className="space-y-3">
                    {currentExercise.options?.map((option) => {
                      const isUserAnswer = option.id === currentState.selectedOptionId;
                      const isCorrectOption = option.is_correct;
                      
                      let bgColor = "#FAFAFA";
                      let textColor = "#374151";
                      let iconColor = "#9CA3AF";
                      let borderColor = "#E5E7EB";
                      
                      if (isCorrectOption) {
                        bgColor = "#F0FDF4";
                        textColor = "#15803D";
                        iconColor = "#16A34A";
                        borderColor = "#BBF7D0";
                      } else if (isUserAnswer && !isCorrectOption) {
                        bgColor = "#FEF2F2";
                        textColor = "#DC2626";
                        iconColor = "#DC2626";
                        borderColor = "#FECACA";
                      }

                      return (
                        <div
                          key={option.id}
                          className="flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-4 sm:py-5 rounded-2xl"
                          style={{
                            backgroundColor: bgColor,
                            border: `1px solid ${borderColor}`,
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {isCorrectOption && (
                              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" style={{ color: iconColor }} />
                            )}
                            {isUserAnswer && !isCorrectOption && (
                              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" style={{ color: iconColor }} />
                            )}
                            <span className="text-sm sm:text-base font-medium leading-relaxed" style={{ color: textColor }}>
                              {option.jawaban}
                            </span>
                          </div>
                          {isUserAnswer && (
                            <span
                              className="text-xs sm:text-sm px-2.5 py-1 rounded-full font-bold flex-shrink-0"
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
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    {[
                      { value: "true", label: "Richtig (R)" },
                      { value: "false", label: "Falsch (F)" },
                    ].map((opt) => {
                      const isUserAnswer = currentState.selectedOptionId === opt.value;
                      const isCorrectOption = currentState.correctAnswer === opt.value;
                      
                      let bgColor = "#FAFAFA";
                      let textColor = "#374151";
                      let iconColor = "#9CA3AF";
                      let borderColor = "#E5E7EB";
                      
                      if (isCorrectOption) {
                        bgColor = "#F0FDF4";
                        textColor = "#15803D";
                        iconColor = "#16A34A";
                        borderColor = "#BBF7D0";
                      } else if (isUserAnswer && !isCorrectOption) {
                        bgColor = "#FEF2F2";
                        textColor = "#DC2626";
                        iconColor = "#DC2626";
                        borderColor = "#FECACA";
                      }

                      return (
                        <div
                          key={opt.value}
                          className="flex-1 flex flex-col items-center justify-center gap-3 px-5 py-5 sm:py-6 rounded-2xl"
                          style={{
                            backgroundColor: bgColor,
                            border: `1px solid ${borderColor}`,
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            {isCorrectOption && (
                              <CheckCircle className="h-6 w-6" style={{ color: iconColor }} />
                            )}
                            {isUserAnswer && !isCorrectOption && (
                              <AlertCircle className="h-6 w-6" style={{ color: iconColor }} />
                            )}
                            <span className="text-base sm:text-lg font-bold" style={{ color: textColor }}>
                              {opt.label}
                            </span>
                          </div>
                          {isUserAnswer && (
                            <span
                              className="text-xs sm:text-sm px-2.5 py-1 rounded-full font-bold"
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
                    className="px-5 sm:px-7 py-5 sm:py-6 rounded-2xl"
                    style={{
                      backgroundColor: currentState.isCorrect ? "#F0FDF4" : "#FFFBEB",
                      border: "1px solid #E5E7EB",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wide" style={{ color: "#6B7280" }}>
                        Jawabanmu:
                      </span>
                    </div>
                    <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#374151" }}>
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
                      attemptId={attemptId} // ✨ NEW: Pass attemptId for retry system
                      onFeedbackLoaded={() => {
                        // ✨ NEW: Mark feedback as loaded for this question
                        console.log('[DEBUG] Feedback loaded for:', uniqueExerciseKey);
                        setFeedbackLoadedMap(prev => ({
                          ...prev,
                          [uniqueExerciseKey]: true
                        }));
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
              className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3 rounded-2xl"
              style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
            >
              <button
                onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                disabled={!canGoPrev}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm sm:text-base transition-all duration-200"
                style={{
                  backgroundColor: canGoPrev ? '#FFFFFF' : 'transparent',
                  color: canGoPrev ? '#4B5563' : '#D1D5DB',
                  border: canGoPrev ? '1px solid #E5E7EB' : 'none',
                  cursor: canGoPrev ? 'pointer' : 'not-allowed',
                  opacity: canGoPrev ? 1 : 0.5,
                }}
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Sebelumnya</span>
                <span className="sm:hidden">Prev</span>
              </button>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => {
                      if (canGoNext) {
                        setCurrentQuestionIndex((i) => i + 1);
                      }
                    }}
                    disabled={!canGoNext}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md"
                    style={{
                      background: canGoNext 
                        ? 'linear-gradient(135deg, #E8B824 0%, #F5C518 100%)'
                        : 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)',
                      color: canGoNext ? '#1A1A1A' : '#9CA3AF',
                      cursor: canGoNext ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {!currentFeedbackLoaded && currentState.isSubmitted && (
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                    <span className="hidden sm:inline">
                      {!currentFeedbackLoaded && currentState.isSubmitted ? 'Tunggu Feedback AI' : 'Soal Berikutnya'}
                    </span>
                    <span className="sm:hidden">
                      {!currentFeedbackLoaded && currentState.isSubmitted ? 'Tunggu AI' : 'Next'}
                    </span>
                    {canGoNext && <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </button>
                  {!currentFeedbackLoaded && currentState.isSubmitted && (
                    <span className="text-xs text-gray-500 px-2">
                      ⏳ Menunggu analisis AI...
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm sm:text-base font-bold px-4 py-2 rounded-xl"
                  style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}>
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Selesai!</span>
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
