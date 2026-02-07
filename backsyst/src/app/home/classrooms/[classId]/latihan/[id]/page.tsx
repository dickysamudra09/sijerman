"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  XCircle,
  Brain,
  Trophy,
  RotateCcw,
  ArrowRight,
  Loader2,
  ChevronLeft,
  BookOpen,
  ExternalLink,
  Lightbulb,
  GraduationCap,
  Target,
  Timer,
  Award,
  Move,
  Edit3,
  FileText,
  Puzzle,
  AlertCircle,
  Menu,
  X,
} from "lucide-react";

interface Option {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
  is_puzzle_piece?: boolean;
  puzzle_order?: number;
  is_blank_position?: boolean;
  sentence_fragment?: string;
  correct_order?: number;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  points: number;
  explanation: string;
  options: Option[];
  essay_subtype?: string;
  essay_config?: any;
  sentence_arrangement_config?: {
    complete_sentence?: string;
    sentence_with_blanks?: string;
    blank_words?: string[]; 
    distractor_words?: string[];
  };
}

interface AIFeedback {
  id?: string;
  feedback_text: string;
  explanation: string;
  reference_materials: {
    title: string;
    url: string;
    description: string;
  }[];
  processing_time_ms?: number;
  ai_model?: string;
}

interface BlankPositionState {
    piece: Option | null;
    isCorrect: boolean | null; 
    correctWord: string; 
}

interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  selectedOptionId: string | null;
  essayAnswer: string;
  sentenceArrangement: string[];
  showResult: boolean;
  score: number;
  quizCompleted: boolean;
  isLoading: boolean;
  error: string | null;
  attemptId: string | null;
  hasInitialized: boolean;
  aiFeedback: AIFeedback | null;
  isLoadingFeedback: boolean;
  answeredQuestions: Set<number>;
}

const initialQuizState: QuizState = {
  questions: [],
  currentQuestionIndex: 0,
  selectedOptionId: null,
  essayAnswer: "",
  sentenceArrangement: [],
  showResult: false,
  score: 0,
  quizCompleted: false,
  isLoading: true,
  error: null,
  attemptId: null,
  hasInitialized: false,
  aiFeedback: null,
  isLoadingFeedback: false,
  answeredQuestions: new Set<number>(),
};

const formatExplanationText = (text: string) => {
  if (!text) return text;
  
  const parts = text.split('•').filter(part => part.trim());
  
  if (parts.length <= 1) {
    return (
      <div 
        className="text-purple-800 bg-white/80 p-4 rounded-lg border border-purple-200 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }
  
  return (
    <div className="text-purple-800 bg-white/80 p-4 rounded-lg border border-purple-200 leading-relaxed">
      {parts[0].trim() && <p className="mb-3">{parts[0].trim()}</p>}
      <ul className="space-y-2 ml-4">
        {parts.slice(1).map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-purple-600 font-bold mt-1 flex-shrink-0">•</span>
            <span dangerouslySetInnerHTML={{ __html: item.trim() }} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function InteractiveQuiz() {
  const router = useRouter();
  const params = useParams();
  const exerciseSetId = params.id as string;
  const [state, setState] = useState<QuizState>(initialQuizState);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [availablePieces, setAvailablePieces] = useState<Option[]>([]);
  const [blankPositions, setBlankPositions] = useState<BlankPositionState[]>([]);
  const [showConfirmBack, setShowConfirmBack] = useState(false);
  const [showConfirmRefresh, setShowConfirmRefresh] = useState(false);
  const [feedbackRunId, setFeedbackRunId] = useState<string | null>(null);
  const [showSoalList, setShowSoalList] = useState(false);
  const initializedRef = useRef(false);

  const clearExerciseCache = () => {
    if (!exerciseSetId) return;
    
    console.log('🧹 Clearing exercise cache for:', exerciseSetId);

    const keys = Object.keys(sessionStorage);
    
    keys.forEach(key => {
      if (key.includes(exerciseSetId) || key.includes('puzzle_') || key.includes('sentence_')) {
        console.log('Deleting cache key:', key);
        sessionStorage.removeItem(key);
      }
    });
    
    const stateKeys = ['quiz_state', 'current_question_index', 'answered_questions'];
    stateKeys.forEach(key => {
      if (sessionStorage.getItem(key)?.includes(exerciseSetId)) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('Exercise cache cleared');
  };

  const handleBackClick = () => {
    clearExerciseCache();
    router.back();
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.questions.length > 0 && !state.quizCompleted && (state.answeredQuestions.size > 0 || state.selectedOptionId || state.essayAnswer)) {
        e.preventDefault();
        e.returnValue = '';
        setShowConfirmRefresh(true);
        return false;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state]);

  useEffect(() => {
    if (!exerciseSetId) return;
    try {
      const runKey = `feedback_run_${exerciseSetId}`;
      let run = sessionStorage.getItem(runKey);
      if (!run) {
        run = crypto.randomUUID();
        sessionStorage.setItem(runKey, run);
      }
      setFeedbackRunId(run);
    } catch (e) {
      console.warn('sessionStorage tidak tersedia untuk run id:', e);
      setFeedbackRunId(null);
    }
  }, [exerciseSetId]);

  useEffect(() => {
    if (state.aiFeedback && state.currentQuestionIndex >= 0) {
      const owner = state.attemptId ?? feedbackRunId;
      if (!owner) return;
      const cacheKey = `feedback_${exerciseSetId}_owner_${owner}_q${state.currentQuestionIndex}`;
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(state.aiFeedback));
      } catch (e) {
        console.warn('Gagal menyimpan feedback ke sessionStorage:', e);
      }
    }
  }, [state.aiFeedback, state.currentQuestionIndex, exerciseSetId, state.attemptId, feedbackRunId]);

  useEffect(() => {
    if (state.currentQuestionIndex < 0 || state.questions.length === 0) return;
    
    const owner = state.attemptId ?? feedbackRunId;
    if (!owner) {
      setState(s => ({ ...s, aiFeedback: null, selectedOptionId: null, essayAnswer: "" }));
      setBlankPositions([]);
      setAvailablePieces([]);
      return;
    }

    const answerKey = `answer_${exerciseSetId}_owner_${owner}_q${state.currentQuestionIndex}`;
    const cachedAnswer = sessionStorage.getItem(answerKey);

    if (cachedAnswer) {
      try {
        const parsedAnswer = JSON.parse(cachedAnswer);
        
        setState(s => ({
          ...s,
          selectedOptionId: parsedAnswer.selectedOptionId ?? null,
          essayAnswer: parsedAnswer.essayAnswer ?? "",
          showResult: !!parsedAnswer.showResult
        }));
        console.log('Restored answer:', { selectedOptionId: parsedAnswer.selectedOptionId, essayAnswer: parsedAnswer.essayAnswer, showResult: parsedAnswer.showResult });
        
        if (parsedAnswer.showResult) {
          const feedbackKey = `feedback_${exerciseSetId}_owner_${owner}_q${state.currentQuestionIndex}`;
          const cachedFeedback = sessionStorage.getItem(feedbackKey);
          if (cachedFeedback) {
            try {
              const parsedFeedback = JSON.parse(cachedFeedback) as AIFeedback;
              setState(s => ({ ...s, aiFeedback: parsedFeedback }));
              console.log('Loaded feedback for answered question', state.currentQuestionIndex);
            } catch (e) {
              console.error('Error parsing cached feedback:', e);
            }
          }
        }
        
        const currentQuestion = state.questions[state.currentQuestionIndex];
        if (currentQuestion?.question_type === 'sentence_arrangement' && parsedAnswer.blankPositions) {
          const allPieces = buildPiecesFromQuestion(currentQuestion);
          const restoredBlankPositions: BlankPositionState[] = parsedAnswer.blankPositions.map((bp: any, idx: number) => ({
            piece: bp.pieceId ? allPieces.find(p => p.id === bp.pieceId) ?? null : null,
            isCorrect: bp.isCorrect ?? null,
            correctWord: currentQuestion.sentence_arrangement_config?.blank_words?.[idx] ?? ''
          }));
          const restoredAvailable = (parsedAnswer.availablePieceIds || []).map((pid: string) => allPieces.find(p => p.id === pid)).filter(Boolean) as Option[];
          
          console.log('Restored puzzle:', { blanks: restoredBlankPositions.length, available: restoredAvailable.length });
          setBlankPositions(restoredBlankPositions);
          setAvailablePieces(restoredAvailable);
        }
      } catch (e) {
        console.error('Error in consolidated load/restore:', e);
        setState(s => ({ ...s, aiFeedback: null }));
      }
    } else {
      setState(s => ({ ...s, aiFeedback: null, selectedOptionId: null, essayAnswer: "", showResult: false }));
      setBlankPositions([]);
      setAvailablePieces([]);
      console.log('No answer cached for question', state.currentQuestionIndex);
    }
  }, [state.currentQuestionIndex, state.questions, state.attemptId, feedbackRunId, exerciseSetId]);

  useEffect(() => {
    if (state.currentQuestionIndex < 0 || state.questions.length === 0) return;

    const currentQuestion = state.questions[state.currentQuestionIndex];
    if (!currentQuestion || currentQuestion.question_type !== 'sentence_arrangement') return;

    const owner = state.attemptId ?? feedbackRunId;
    if (!owner) return;

    const answerKey = `answer_${exerciseSetId}_owner_${owner}_q${state.currentQuestionIndex}`;
    const cachedAnswer = sessionStorage.getItem(answerKey);

    if (cachedAnswer) {
      try {
        const parsedAnswer = JSON.parse(cachedAnswer);
      
        if (parsedAnswer.blankPositions && parsedAnswer.availablePieceIds) {
          const timeoutId = setTimeout(() => {
            const allPieces = buildPiecesFromQuestion(currentQuestion);
            const restoredBlankPositions: BlankPositionState[] = parsedAnswer.blankPositions.map((bp: any, idx: number) => ({
              piece: bp.pieceId ? allPieces.find(p => p.id === bp.pieceId) ?? null : null,
              isCorrect: bp.isCorrect ?? null,
              correctWord: currentQuestion.sentence_arrangement_config?.blank_words?.[idx] ?? ''
            }));
            const restoredAvailable = (parsedAnswer.availablePieceIds || []).map((pid: string) => allPieces.find(p => p.id === pid)).filter(Boolean) as Option[];
            
            console.log('Restored puzzle from cache:', { blanks: restoredBlankPositions.length, available: restoredAvailable.length });
            setBlankPositions(restoredBlankPositions);
            setAvailablePieces(restoredAvailable);
          }, 10);
          
          return () => clearTimeout(timeoutId);
        }
      } catch (e) {
        console.error('Error restoring puzzle from cache:', e);
      }
    }
  }, [state.currentQuestionIndex, state.questions, state.attemptId, feedbackRunId, exerciseSetId]);
  const buildPiecesFromQuestion = (question: Question | undefined) => {
    if (!question || !question.sentence_arrangement_config) return [] as Option[];
    const config = question.sentence_arrangement_config;
    const correctWords = config.blank_words || [];
    const distractorWords = config.distractor_words || [];
    const allWords = [...correctWords, ...distractorWords];
    return allWords.map((word, index) => ({
      id: `word-${index}-${word.replace(/\s/g, '-')}`,
      option_text: word,
      is_correct: correctWords.includes(word),
      order_index: index + 1,
    } as Option));
  };

  useEffect(() => {
    if (state.currentQuestionIndex < 0 || state.questions.length === 0) return;
    const owner = state.attemptId ?? feedbackRunId;
    if (!owner) return;
    const answerKey = `answer_${exerciseSetId}_owner_${owner}_q${state.currentQuestionIndex}`;

    const payload: any = {
      selectedOptionId: state.selectedOptionId ?? null,
      essayAnswer: state.essayAnswer ?? "",
      showResult: state.showResult || false,
    };

    // save puzzle state
    if (state.questions[state.currentQuestionIndex]?.question_type === 'sentence_arrangement') {
      payload.blankPositions = blankPositions.map(bp => ({
        pieceId: bp.piece?.id ?? null,
        isCorrect: bp.isCorrect
      }));
      payload.availablePieceIds = availablePieces.map(p => p.id);
    }

    try {
      sessionStorage.setItem(answerKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('Gagal menyimpan answer state ke sessionStorage:', e);
    }
  }, [state.currentQuestionIndex, state.selectedOptionId, state.essayAnswer, state.showResult, blankPositions, availablePieces, state.attemptId, feedbackRunId, exerciseSetId, state.questions]);

  const clearFeedbackCacheForExercise = () => {
    try {
      const prefix = `feedback_${exerciseSetId}_`;
      const answerPrefix = `answer_${exerciseSetId}_`;
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && (k.startsWith(prefix) || k.startsWith(answerPrefix))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => {
        console.log('Clearing cache key:', k);
        sessionStorage.removeItem(k);
      });
      const runKey = `feedback_run_${exerciseSetId}`;
      const newRun = crypto.randomUUID();
      sessionStorage.setItem(runKey, newRun);
      setFeedbackRunId(newRun);
      console.log('Cache cleared. New run ID:', newRun);
    } catch (e) {
      console.warn('Gagal membersihkan feedback cache:', e);
    }
  };

  useEffect(() => {
    if (state.currentQuestionIndex < 0 || state.questions.length === 0) {
      setAvailablePieces([]);
      setBlankPositions([]);
      return;
    }

    const currentQuestion = state.questions[state.currentQuestionIndex];
    if (!currentQuestion) return;

    if (currentQuestion.question_type === 'sentence_arrangement') {
      console.log('Setting up sentence arrangement for question:', state.currentQuestionIndex, currentQuestion);
      
      if (currentQuestion.sentence_arrangement_config) {
        const config = currentQuestion.sentence_arrangement_config;
        const correctWords = config.blank_words || [];
        const distractorWords = config.distractor_words || [];
        
        const allWords = [...correctWords, ...distractorWords];
        const pieces = allWords.map((word, index) => ({
          id: `word-${index}-${word.replace(/\s/g, '-')}`, 
          option_text: word,
          is_correct: correctWords.includes(word),
          order_index: index + 1,
        } as Option));
        
        const initialBlankPositions: BlankPositionState[] = correctWords.map((word) => ({
            piece: null,
            isCorrect: null,
            correctWord: word 
        }));
        
        console.log('Initialized puzzle:', { blanks: initialBlankPositions.length, pieces: pieces.length });
        setAvailablePieces(pieces);
        setBlankPositions(initialBlankPositions);
        setState(s => ({ ...s, sentenceArrangement: [] }));
      } else {
        console.warn('No sentence_arrangement_config found for question:', state.currentQuestionIndex);
        setAvailablePieces([]);
        setBlankPositions([]);
      }
    } else {
      setAvailablePieces([]);
      setBlankPositions([]);
    }
  }, [state.currentQuestionIndex, state.questions]);

  const createExerciseAttempt = async (userId: string) => {
    try {
      if (!exerciseSetId) {
        throw new Error("Exercise set ID is missing.");
      }
      
      const { data: existingAttempts, error: checkError } = await supabase
        .from("exercise_attempts")
        .select("id, attempt_number, status")
        .eq("exercise_set_id", exerciseSetId)
        .eq("student_id", userId)
        .order("attempt_number", { ascending: false });

      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking existing attempts:", checkError.message);
        throw new Error(`Failed to check existing attempts: ${checkError.message}`);
      }

      const inProgressAttempt = existingAttempts?.find(attempt => attempt.status === 'in_progress');
      if (inProgressAttempt) {
        console.log("Found existing in_progress attempt:", inProgressAttempt.id);
        toast.info("Melanjutkan sesi latihan yang belum selesai.");
        return inProgressAttempt.id;
      }

      const maxAttemptNumber = existingAttempts && existingAttempts.length > 0 
        ? existingAttempts[0].attempt_number 
        : 0;
      const nextAttemptNumber = maxAttemptNumber + 1;
      
      console.log(`Creating new attempt with number: ${nextAttemptNumber}`);
      
      const tempAttemptId = crypto.randomUUID();
      const attemptData = {
        id: tempAttemptId,
        exercise_set_id: exerciseSetId,
        student_id: userId,
        attempt_number: nextAttemptNumber,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        total_score: 0.00,
        max_possible_score: 0.00,
        percentage: 0.00,
        time_spent_minutes: 0,
      };

      const { data: attempt, error: insertError } = await supabase
        .from("exercise_attempts")
        .insert([attemptData])
        .select("id")
        .single();

      if (insertError) {
        console.error("Error creating exercise attempt:", insertError.message);
        
        if (insertError.code === '23505') {
          console.log("Duplicate key error detected, searching for existing attempt...");
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const { data: raceAttempt, error: raceError } = await supabase
            .from("exercise_attempts")
            .select("id")
            .eq("exercise_set_id", exerciseSetId)
            .eq("student_id", userId)
            .eq("status", "in_progress")
            .maybeSingle();
            
          if (!raceError && raceAttempt) {
            console.log("Found attempt created by race condition:", raceAttempt.id);
            return raceAttempt.id;
          }
          
          const finalAttemptData = {
            ...attemptData,
            id: crypto.randomUUID(),
            attempt_number: nextAttemptNumber + 1,
          };
          
          const { data: finalAttempt, error: finalError } = await supabase
            .from("exercise_attempts")
            .insert([finalAttemptData])
            .select("id")
            .single();
            
          if (finalError) {
            throw new Error(`Failed to create attempt after handling race condition: ${finalError.message}`);
          }
          
          return finalAttempt.id;
        }
        
        throw new Error(`Gagal membuat sesi latihan: ${insertError.message}`);
      }

      console.log("Created new attempt:", attempt.id);
      return attempt.id;
    } catch (err: any) {
      console.error("Unexpected error creating attempt:", err.message);
      toast.error(err.message || "Terjadi kesalahan saat memulai latihan");
      return null;
    }
  };

  const saveStudentAnswer = async (questionId: string, selectedOptionId: string | null, isCorrect: boolean, pointsEarned: number, textAnswer?: string, selectedOptionsArray?: string[]) => {
    if (!state.attemptId) {
      console.error("No attempt ID available for saving answer");
      return null;
    }

    try {
      const answerData: any = {
        attempt_id: state.attemptId,
        question_id: questionId,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        answered_at: new Date().toISOString(),
      };

      if (selectedOptionId) {
        answerData.selected_option_id = selectedOptionId;
      }

      if (textAnswer) {
        answerData.text_answer = textAnswer;
        
        const currentQuestion = state.questions.find(q => q.id === questionId);
        if (currentQuestion?.question_type === 'essay') {
            answerData.essay_response = textAnswer;
        }
      }
      
      if (selectedOptionsArray) {
        answerData.sentence_arrangement_answer = JSON.stringify(selectedOptionsArray);
      }

      const { data, error } = await supabase
        .from("student_answers")
        .upsert([answerData], { onConflict: 'attempt_id, question_id' })
        .select('id')
        .single();

      if (error) {
        console.error("Error saving student answer:", error.message);
        console.error("Insert error details:", JSON.stringify(error, null, 2));
        toast.error(`Gagal menyimpan jawaban: ${error.message}`);
        return null;
      }

      return data.id;
    } catch (err) {
      console.error("Unexpected error saving answer:", err);
      toast.error("Terjadi kesalahan saat menyimpan jawaban");
      return null;
    }
  };

  const generateAIFeedback = async (
    studentAnswerId: string, 
    questionId: string, 
    selectedOptionId: string | null, 
    isCorrect: boolean, 
    textAnswer?: string, 
    selectedOptionsArray?: string[]
  ) => {
    if (!studentAnswerId) return;

    setState(s => ({ ...s, isLoadingFeedback: true }));

    try {
      const payload: any = {
        studentAnswerId,
        questionId,
        attemptId: state.attemptId,
        selectedOptionId: selectedOptionId || null,
        isCorrect,
        textAnswer: textAnswer || null,
        selectedOptionsArray: selectedOptionsArray || null,
      };
      
      console.log('Sending AI feedback request with payload:', payload);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch('/api/ai-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('AI feedback response status:', response.status);
      console.log('AI feedback response headers:', {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Server sedang sibuk (rate limit). Coba lagi dalam beberapa saat.');
        } else if (response.status >= 500) {
          throw new Error('Server sedang maintenance. Silakan coba lagi nanti.');
        } else {
          throw new Error(`API error: ${response.status}`);
        }
      }

      const responseText = await response.text();
      console.log('Raw response text length:', responseText.length);
      console.log('Raw response first 300 chars:', responseText.substring(0, 300));

      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Menerima respons kosong dari server');
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response:', e);
        console.log('Response text:', responseText);
        throw new Error('Response dari server tidak valid. Server sedang mengalami masalah.');
      }

      console.log('AI feedback result:', result);
      console.log('Feedback text length:', result?.data?.feedback_text?.length || 0);

      if (result.data?.feedback_text && result.data.feedback_text.length > 10) {
        setTimeout(() => {
          setState(s => ({ 
            ...s, 
            aiFeedback: result.data,
            isLoadingFeedback: false 
          }));
          
          if (result.warning) {
            console.warn('AI Feedback warning:', result.warning);
          }
        }, 2500);
      } else {
        throw new Error('Feedback tidak lengkap diterima dari AI');
      }

    } catch (error: unknown) {
      console.error('Error generating AI feedback:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.name === 'AbortError') {
          errorMessage = 'Permintaan timeout - AI feedback memakan waktu terlalu lama. Silakan coba lagi.';
        }
      }
      
      setTimeout(() => {
        setState(s => ({ 
          ...s, 
          aiFeedback: {
            feedback_text: "Maaf, feedback AI tidak dapat dimuat saat ini. " + errorMessage,
            explanation: "Silakan lanjutkan dengan pertanyaan berikutnya.",
            reference_materials: []
          },
          isLoadingFeedback: false 
        }));
        
        toast.error("Gagal memuat feedback AI: " + errorMessage);
      }, 2500);
    }
  };

  const completeExerciseAttempt = async () => {
    if (!state.attemptId) {
      console.error("Missing attempt ID for completion");
      toast.error("Sesi latihan tidak valid.");
      return;
    }

    try {
      const { data: answers, error: answersError } = await supabase
        .from("student_answers")
        .select("points_earned")
        .eq("attempt_id", state.attemptId);

      if (answersError) {
        console.error("Error fetching answers:", answersError.message);
        throw new Error("Gagal mengambil jawaban untuk menyelesaikan latihan.");
      }

      const totalScore = answers?.reduce((sum, answer) => sum + answer.points_earned, 0) || 0;
      const totalMaxScore = state.questions.reduce((sum, q) => sum + q.points, 0);
      const percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

      const endTime = new Date();
      const timeSpentMinutes = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) : 0;
      
      const { error: updateAttemptError } = await supabase
        .from("exercise_attempts")
        .update({
          submitted_at: endTime.toISOString(),
          time_spent_minutes: Math.max(timeSpentMinutes, 1),
          status: 'submitted',
          total_score: totalScore,
          max_possible_score: totalMaxScore,
          percentage: percentage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.attemptId);

      if (updateAttemptError) {
        console.error("Error updating exercise attempt:", updateAttemptError.message);
        throw new Error(`Gagal menyelesaikan latihan: ${updateAttemptError.message}`);
      }

      try {
        const { error: analyticsError } = await supabase.rpc('update_exercise_analytics_manual', {
          p_exercise_set_id: exerciseSetId,
          p_total_score: totalScore,
          p_max_score: totalMaxScore,
          p_percentage: percentage,
          p_time_minutes: Math.max(timeSpentMinutes, 1)
        });

        if (analyticsError) {
          console.error("Error updating analytics via RPC:", analyticsError.message);
          console.warn("Analytics update failed, but quiz completion succeeded");
        }
      } catch (analyticsErr) {
        console.error("Analytics update failed:", analyticsErr);
      }

      toast.success("Latihan berhasil diselesaikan!");

    } catch (err: any) {
      console.error("Unexpected error completing attempt:", err.message);
      toast.error(err.message || "Terjadi kesalahan yang tidak terduga saat menyelesaikan latihan");
    }
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!exerciseSetId || initializedRef.current) {
        if (!exerciseSetId) {
          setState(s => ({ ...s, error: "ID set latihan tidak ditemukan.", isLoading: false }));
          toast.error("ID set latihan tidak ditemukan.");
        }
        return;
      }
      
      initializedRef.current = true;

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session?.user) {
          console.error("Session error:", sessionError?.message);
          setState(s => ({ ...s, error: "Sesi tidak ditemukan. Silakan login.", isLoading: false }));
          toast.error("Sesi tidak ditemukan. Silakan login.");
          return;
        }

        const userId = sessionData.session.user.id;
        
        const attemptId = await createExerciseAttempt(userId);
        if (!attemptId) {
          setState(s => ({ ...s, isLoading: false }));
          return;
        }

        setState(s => ({ ...s, attemptId }));
        setStartTime(new Date());

        const { data, error } = await supabase
          .from("questions")
          .select(`
            id, 
            question_text, 
            question_type,
            points,
            explanation,
            essay_subtype,
            essay_config,
            sentence_arrangement_config,
            options (id, option_text, is_correct, order_index, is_puzzle_piece, puzzle_order, is_blank_position, sentence_fragment, correct_order)
          `)
          .eq("exercise_set_id", exerciseSetId)
          .order('order_index', { ascending: true });

        if (error) {
          console.error("Error fetching questions:", error.message);
          setState(s => ({ ...s, error: `Gagal memuat pertanyaan: ${error.message}`, isLoading: false }));
          toast.error("Gagal memuat pertanyaan.");
          return;
        }

        if (!data || data.length === 0) {
          setState(s => ({ ...s, error: "Tidak ada pertanyaan untuk latihan ini.", isLoading: false }));
          toast.info("Tidak ada pertanyaan untuk latihan ini.");
          return;
        }

        const questionsData = data.map(question => ({
          ...question,
          options: (question.options as Option[]).sort((a, b) => a.order_index - b.order_index)
        })) as Question[];
        
        console.log('Loaded questions:', questionsData);
        
        setState(s => ({ ...s, questions: questionsData, isLoading: false }));
      } catch (err: any) {
        console.error("Unexpected error in fetchQuestions:", err.message);
        setState(s => ({ ...s, error: err.message || "Terjadi kesalahan yang tidak terduga.", isLoading: false }));
        toast.error(err.message || "Terjadi kesalahan yang tidak terduga.");
      }
    };

    fetchQuestions();
  }, [exerciseSetId]);

  const handleDragStart = (e: React.DragEvent, item: Option) => {
    setDraggedItem(item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnBlank = (e: React.DragEvent, blankIndex: number) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    const draggedPiece = availablePieces.find(piece => piece.id === draggedItem);
    
    if (!draggedPiece) {
        const sourceBlankIndex = blankPositions.findIndex(pos => pos.piece?.id === draggedItem);
        
        if (sourceBlankIndex !== -1) {
            const sourcePiece = blankPositions[sourceBlankIndex].piece;
            if (!sourcePiece) return;
            
            const existingTargetPiece = blankPositions[blankIndex].piece;
            const newBlankPositions = [...blankPositions];
            
            if (existingTargetPiece) {
                newBlankPositions[sourceBlankIndex].piece = existingTargetPiece;
                newBlankPositions[sourceBlankIndex].isCorrect = null; 
            } else {
                newBlankPositions[sourceBlankIndex].piece = null;
                newBlankPositions[sourceBlankIndex].isCorrect = null; 
            }
            
            newBlankPositions[blankIndex].piece = sourcePiece;
            newBlankPositions[blankIndex].isCorrect = null; 
            
            setBlankPositions(newBlankPositions);
            setDraggedItem(null);
            return;
        }
        return;
    }
    
    setAvailablePieces(prev => prev.filter(piece => piece.id !== draggedItem));
    
    const existingTargetPiece = blankPositions[blankIndex].piece;
    if (existingTargetPiece) {
      setAvailablePieces(prev => [...prev, existingTargetPiece]);
    }
    
    const newBlankPositions = [...blankPositions];
    newBlankPositions[blankIndex].piece = draggedPiece;
    newBlankPositions[blankIndex].isCorrect = null; 
    setBlankPositions(newBlankPositions);
    
    setDraggedItem(null);
  };

  const handleDropOnAvailable = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    const blankIndex = blankPositions.findIndex(pos => pos.piece?.id === draggedItem);
    
    if (blankIndex === -1) return;
    
    const draggedPiece = blankPositions[blankIndex].piece;
    if (!draggedPiece) return;
    
    const newBlankPositions = [...blankPositions];
    newBlankPositions[blankIndex].piece = null;
    newBlankPositions[blankIndex].isCorrect = null;
    setBlankPositions(newBlankPositions);
    
    setAvailablePieces(prev => [...prev, draggedPiece]);
    
    setDraggedItem(null);
  };
  
  const getFilledSentence = () => {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    let sentenceWithBlanks = currentQuestion.sentence_arrangement_config?.sentence_with_blanks || "";
    const blankWords = blankPositions.map(pos => pos.piece?.option_text || '___');
    let filledSentence = sentenceWithBlanks;
    blankWords.forEach(word => {
        filledSentence = filledSentence.replace('___', word); 
    });
    if (sentenceWithBlanks === filledSentence) {
        let parts = sentenceWithBlanks.split('_'); 
        if (parts.length > 1) {
            let finalSentence = '';
            for (let i = 0; i < parts.length; i++) {
                finalSentence += parts[i];
                if (i < blankWords.length) {
                    finalSentence += blankWords[i];
                }
            }
            return finalSentence.trim();
        }
    }

    return filledSentence.trim();
  };

  const handleSubmitAnswer = async () => {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    let isCorrect = false;
    let pointsEarned = 0;
    let selectedOptionId: string | null = null;
    let textAnswer: string | undefined;
    let selectedOptionsArray: string[] | undefined;

    if (currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'true_false') {
      if (!state.selectedOptionId) {
        toast.warning("Silakan pilih salah satu jawaban.");
        return;
      } else {
        selectedOptionId = state.selectedOptionId;
      }
      
      const selectedOption = currentQuestion.options.find(opt => opt.id === selectedOptionId);
      isCorrect = selectedOption?.is_correct ?? false;
      pointsEarned = isCorrect ? currentQuestion.points : 0;
      
    } else if (currentQuestion.question_type === 'essay') {
      if (!state.essayAnswer.trim()) {
        toast.warning("Silakan isi jawaban essay.");
        return;
      }
      
      textAnswer = state.essayAnswer.trim();
      isCorrect = textAnswer.length > 0;
      pointsEarned = isCorrect ? currentQuestion.points * 0.8 : 0;
      
    } else if (currentQuestion.question_type === 'sentence_arrangement') {
      
      if (blankPositions.some(pos => pos.piece === null)) {
        toast.warning("Silakan lengkapi susunan kalimat.");
        return;
      }
      
      let totalCorrectPieces = 0;
      let newBlankPositions = [...blankPositions];

      newBlankPositions.forEach((pos, index) => {
          const userWord = pos.piece?.option_text.trim().toLowerCase();
          const correctWord = pos.correctWord.trim().toLowerCase();

          if (userWord === correctWord) {
              pos.isCorrect = true;
              totalCorrectPieces++;
          } else {
              pos.isCorrect = false;
          }
      });
      
      setBlankPositions(newBlankPositions); 

      const totalBlanks = blankPositions.length;
      isCorrect = totalCorrectPieces === totalBlanks;
      pointsEarned = isCorrect ? currentQuestion.points : Math.round((totalCorrectPieces / totalBlanks) * currentQuestion.points * 0.8); // Skor parsial
      
      textAnswer = getFilledSentence(); 
      selectedOptionsArray = blankPositions.map(pos => pos.piece?.id || ''); 
    }

    const studentAnswerId = await saveStudentAnswer(
      currentQuestion.id, 
      selectedOptionId, 
      isCorrect, 
      pointsEarned, 
      textAnswer, 
      selectedOptionsArray
    );

    setState(s => ({
      ...s,
      showResult: true,
      score: s.score + pointsEarned,
      aiFeedback: null, 
    }));

    if (studentAnswerId) {
      await generateAIFeedback(
        studentAnswerId, 
        currentQuestion.id, 
        selectedOptionId, 
        isCorrect,
        textAnswer, 
        selectedOptionsArray
      );
    }
  };

  const handleNextQuestion = async () => {
    setState(s => ({
      ...s,
      answeredQuestions: new Set([...s.answeredQuestions, s.currentQuestionIndex])
    }));

    if (state.currentQuestionIndex < state.questions.length - 1) {
      setState(s => ({
        ...s,
        currentQuestionIndex: s.currentQuestionIndex + 1,
        selectedOptionId: null,
        essayAnswer: "",
        sentenceArrangement: [],
        showResult: false,
        aiFeedback: null, 
      }));
      setBlankPositions([]);
      setAvailablePieces([]);
    } else {
      await completeExerciseAttempt();
      
      setState(s => ({ ...s, quizCompleted: true }));
    }
  };

  const handleJumpToQuestion = (questionIndex: number) => {
    setState(s => ({
      ...s,
      currentQuestionIndex: questionIndex,
      selectedOptionId: null,
      essayAnswer: "",
      sentenceArrangement: [],
      showResult: false,
      aiFeedback: null,
    }));
    setBlankPositions([]);
    setAvailablePieces([]);
  };

  const resetQuiz = () => {
    clearFeedbackCacheForExercise();
    setState(initialQuizState);
    setStartTime(null);
    setAvailablePieces([]);
    setBlankPositions([]);
    router.refresh();
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQuestionTypeInfo = (type: string) => {
    switch (type) {
      case 'essay':
        return { icon: FileText, label: 'Essay', color: 'text-green-700 bg-green-50 border-green-200' };
      case 'sentence_arrangement':
        return { icon: Puzzle, label: 'Isian Celah', color: 'text-purple-700 bg-purple-50 border-purple-200' };
      case 'multiple_choice':
        return { icon: Brain, label: 'Pilihan Ganda', color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'true_false':
        return { icon: Brain, label: 'Benar/Salah', color: 'text-orange-700 bg-orange-50 border-orange-200' };
      default:
        return { icon: Brain, label: type, color: 'text-purple-700 bg-purple-50 border-purple-200' };
    }
  };

  const renderAIFeedback = () => {
    if (state.isLoadingFeedback) {
      return (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              <div>
                <h4 className="font-semibold text-blue-900 text-lg">Menghasilkan Feedback AI...</h4>
                <p className="text-blue-700">Mohon tunggu sebentar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!state.aiFeedback) return null;

    const currentQuestion = state.questions[state.currentQuestionIndex];

    return (
      <Card className="border-2" style={{borderColor: '#1A1A1A', backgroundColor: '#FFFFFF'}}>
        <CardHeader style={{backgroundColor: '#1A1A1A'}} className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{backgroundColor: '#E8B824'}}>
              <Lightbulb className="h-5 w-5" style={{color: '#1A1A1A'}} />
            </div>
            <CardTitle style={{color: '#FFFFFC'}} className="text-lg flex items-center gap-2">
              Analisis Feedback Lengkap
              <Badge style={{backgroundColor: '#E8B824', color: '#1A1A1A'}} className="border-opacity-30 text-xs">
                {currentQuestion.question_type === 'essay' && 'Essay'}
                {currentQuestion.question_type === 'sentence_arrangement' && 'Puzzle'}
                {(currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'true_false') && 'Pilihan'}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          {/* Single Comprehensive Feedback Narrative */}
          <div className="p-6 rounded-lg border-2" style={{borderColor: '#1A1A1A', backgroundColor: '#FFFFFF'}}>
            <h5 className="font-bold mb-4 flex items-center gap-2 text-base" style={{color: '#1A1A1A'}}>
              Analisis Detail
            </h5>
            
            {/* Feedback as single comprehensive narrative */}
            {state.aiFeedback.feedback_text && (
              <>
                <div className="leading-relaxed whitespace-pre-wrap mb-3" style={{color: '#1A1A1A'}}>
                  {state.aiFeedback.feedback_text}
                </div>
                {/* Sentence count info */}
                <div className="text-xs mt-4 pt-3 border-t" style={{color: '#1A1A1A', borderTopColor: '#E5E5E5'}}>
                  <span className="inline-block px-2 py-1 rounded" style={{backgroundColor: '#E8B824', color: '#1A1A1A'}}>
                    {(() => {
                      const sentences = state.aiFeedback.feedback_text.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
                      return `${sentences.length} kalimat (60-120 ✓)`;
                    })()}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Reference Materials */}
          {state.aiFeedback.reference_materials && state.aiFeedback.reference_materials.length > 0 && (
            <div>
              <h5 className="font-bold mb-3 flex items-center gap-2" style={{color: '#1A1A1A'}}>
                <BookOpen className="h-4 w-4" style={{color: '#E8B824'}} />
                Sumber Belajar Terkait
              </h5>
              <div className="space-y-3">
                {state.aiFeedback.reference_materials.map((ref, index) => (
                  <div key={index} className="p-4 rounded-lg border-2 transition-all" style={{borderColor: '#1A1A1A', backgroundColor: '#FFFFFF'}}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h6 className="font-semibold mb-1 text-base" style={{color: '#1A1A1A'}}>
                          {index + 1}. {ref.title}
                        </h6>
                        <p className="text-sm leading-relaxed" style={{color: '#4A4A4A'}}>
                          {ref.description}
                        </p>
                      </div>
                      {ref.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 shadow-sm transition-colors"
                          style={{borderColor: '#E8B824', color: '#E8B824', backgroundColor: '#FFFFFC'}}
                          onClick={() => window.open(ref.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Info */}
          {state.aiFeedback.ai_model && process.env.NODE_ENV === 'development' && (
            <div className="text-xs pt-3 border-t opacity-75" style={{color: '#1A1A1A', borderTopColor: '#E5E5E5'}}>
              {state.aiFeedback.ai_model}
              {state.aiFeedback.processing_time_ms && 
                ` • Generated in ${state.aiFeedback.processing_time_ms}ms`
              }
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderQuestionContent = (currentQuestion: Question) => {
    if (currentQuestion.question_type === 'essay') {
      return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="mb-6 text-lg font-medium text-gray-900 leading-relaxed">
            {currentQuestion.question_text}
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Edit3 className="h-4 w-4" />
              <span>Tulis jawaban essay Anda di bawah ini:</span>
            </div>
            
            <Textarea
              placeholder="Tulis jawaban Anda di sini..."
              value={state.essayAnswer}
              onChange={(e) => setState(s => ({ ...s, essayAnswer: e.target.value }))}
              disabled={state.showResult}
              className="min-h-[200px] text-base leading-relaxed resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            
            <div className="flex justify-between text-sm text-gray-500">
              <span>{state.essayAnswer.length} karakter</span>
              <span>Minimum: 10 karakter</span>
            </div>
          </div>
        </div>
      );
    }
    
    if (currentQuestion.question_type === 'sentence_arrangement') {
      const config = currentQuestion.sentence_arrangement_config;
      const sentenceParts = config?.sentence_with_blanks?.split('___') || [currentQuestion.question_text];
      
      const sentenceElements: React.ReactNode[] = [];
      sentenceParts.forEach((part, index) => {
          sentenceElements.push(
              <span key={`text-${index}`} className="whitespace-pre-wrap">{part}</span>
          );
          
          if (index < blankPositions.length) {
              const blankState = blankPositions[index];
              const item = blankState.piece;
              
              let borderClass = 'border-gray-300 bg-gray-50';
              let content = <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>; 
              let dropProps = { onDragOver: handleDragOver, onDrop: (e: React.DragEvent) => handleDropOnBlank(e, index) };
              
              if (state.showResult) {
                  if (blankState.isCorrect === true) {
                      borderClass = 'border-green-500 bg-green-100 shadow-lg';
                      content = <CheckCircle2 className="h-4 w-4 text-green-700" />;
                  } else if (blankState.isCorrect === false) {
                      borderClass = 'border-red-500 bg-red-100 shadow-lg';
                      content = (
                          <div className="text-red-700 text-xs text-center">
                              <XCircle className="h-4 w-4 mx-auto" />
                              <span className="font-semibold">{blankState.correctWord}</span>
                          </div>
                      );
                  }
              }
              
              if (item) {
                  content = (
                      <div
                          draggable={!state.showResult}
                          onDragStart={(e) => handleDragStart(e, item)}
                          className={`cursor-move px-3 py-1 rounded border-2 font-medium text-sm transition-colors shadow-md ${
                              state.showResult 
                                ? blankState.isCorrect ? 'bg-green-300 border-green-500 text-gray-900' : 'bg-red-300 border-red-500 text-gray-900'
                                : 'bg-white/90 border-sky-400 text-gray-900 hover:bg-white'
                          }`}
                      >
                          {item.option_text}
                      </div>
                  );
              } else if (!state.showResult) {
                  content = <span className="text-gray-500 text-sm">Celah {index + 1}</span>;
              }
              sentenceElements.push(
                  <span 
                      key={`blank-${index}`}
                      className={`inline-flex items-center justify-center min-w-[100px] h-10 mx-1 p-1 rounded-lg border-2 border-dashed transition-colors align-middle ${
                          !state.showResult ? 'hover:border-sky-500' : ''
                      } ${borderClass}`}
                      {...dropProps}
                  >
                      {content}
                  </span>
              );
          }
      });
      
      return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="mb-6 text-lg font-medium text-gray-900 leading-relaxed">
            Lengkapi kalimat rumpang dibawah ini dengan potongan kata yang benar
          </h2>
          
          {config && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Label className="text-sm font-semibold text-blue-800 mb-2 block">
                  Kalimat yang harus dilengkapi:
                </Label>
                <div className="text-xl text-blue-900 font-medium leading-relaxed flex flex-wrap items-center">
                  {sentenceElements}
                </div>
                {state.showResult && (
                    <div className="mt-4 text-sm text-gray-600">
                        <span className="font-medium">Hasil:</span> <span className="font-bold text-lg text-green-700">{getFilledSentence()}</span>
                    </div>
                )}
              </div>
              
              {/* AVAILABLE PIECES AREA */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">Potongan Kata Tersedia ({availablePieces.length}):</h4>
                <div 
                  className="min-h-[80px] border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-4 flex flex-wrap gap-3 items-start"
                  onDragOver={handleDragOver}
                  onDrop={handleDropOnAvailable}
                >
                  {availablePieces.length > 0 ? (
                    availablePieces.map((piece) => (
                      <div
                        key={piece.id}
                        draggable={!state.showResult}
                        onDragStart={(e) => handleDragStart(e, piece)}
                        className={`px-4 py-2 border border-blue-300 rounded-lg cursor-move transition-colors shadow-sm font-medium ${
                            !state.showResult ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Move className="h-4 w-4" />
                          {piece.option_text}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 italic">Semua potongan sudah digunakan</div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {!config && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-yellow-800">
                Konfigurasi pertanyaan menyusun kalimat belum lengkap.
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="mb-6 text-lg font-medium text-gray-900 leading-relaxed">
          {currentQuestion.question_text}
        </h2>
        
        <RadioGroup 
          value={state.selectedOptionId ?? ""} 
          onValueChange={(value) => setState(s => ({ ...s, selectedOptionId: value }))}
          disabled={state.showResult}
          className="space-y-3"
        >
          {currentQuestion.options.map((option, index) => (
            <div 
              key={option.id} 
              className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                state.showResult 
                  ? option.is_correct 
                    ? 'bg-green-50 border-green-300 shadow-sm' 
                    : state.selectedOptionId === option.id
                      ? 'bg-red-50 border-red-300 shadow-sm'
                      : 'bg-gray-50 border-gray-200'
                  : state.selectedOptionId === option.id
                    ? 'bg-sky-50 border-sky-300 shadow-md'
                    : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <RadioGroupItem value={option.id} id={`option-${option.id}`} />
              <Label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer text-gray-800 font-medium">
                <span className="inline-flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-500 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option.option_text}
                </span>
              </Label>
              {state.showResult && option.is_correct && (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              )}
              {state.showResult && state.selectedOptionId === option.id && !option.is_correct && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-red-600">Jawabanmu:</span>
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                </div>
              )}
              {!state.showResult && state.selectedOptionId === option.id && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-sky-600">Jawabanmu:</span>
                </div>
              )}
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div style={{backgroundColor: '#0D0D0D'}} className="text-white shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold" style={{color: '#FFFFFC'}}>Latihan Soal Interaktif</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex items-center justify-center">
          <Card className="bg-white border border-gray-200 rounded-lg w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-gray-600 font-medium">Memuat latihan soal...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (state.error || !state.questions.length) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div style={{backgroundColor: '#0D0D0D'}} className="text-white shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleBackClick} 
                  className="gap-2"
                  style={{backgroundColor: '#E8B824', color: '#1A1A1A'}}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Kembali
                </Button>
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold" style={{color: '#FFFFFC'}}>Latihan Soal</h1>
              </div>
              <div className="w-32"></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex items-center justify-center">
          <Card className="bg-white border border-gray-200 rounded-lg w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
              <p className="text-gray-600 mb-6">
                {state.error || "Tidak ada pertanyaan yang tersedia."}
              </p>
              <Button 
                onClick={handleBackClick} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Kembali
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalQuestions = state.questions.length;
  const currentQuestion = state.questions[state.currentQuestionIndex];
  const maxPossibleScore = state.questions.reduce((sum, q) => sum + q.points, 0);

  if (state.quizCompleted) {
    const percentage = maxPossibleScore > 0 ? Math.round((state.score / maxPossibleScore) * 100) : 0;
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div style={{backgroundColor: '#0D0D0D'}} className="text-white shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleBackClick} 
                  className="gap-2"
                  style={{backgroundColor: '#E8B824', color: '#1A1A1A'}}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Kembali ke Kelas
                </Button>
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold" style={{color: '#FFFFFC'}}>Latihan Selesai!</h1>
              </div>
              <div className="w-32"></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
          <div className="space-y-6">
            {/* Result Card */}
            <Card className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6" style={{backgroundColor: '#E8B824'}}>
                    <Trophy className="h-12 w-12" style={{color: '#1A1A1A'}} />
                  </div>
                  <p className="text-gray-600 text-lg">Hasil Latihan Anda</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {/* Skor */}
                  <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-sm font-medium mb-2">Skor</p>
                    <p className={`text-4xl font-bold mb-1 ${getScoreColor(percentage)}`}>
                      {state.score}
                    </p>
                    <p className="text-gray-500 text-sm">dari {maxPossibleScore}</p>
                  </div>

                  {/* Persentase */}
                  <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-sm font-medium mb-2">Persentase</p>
                    <p className={`text-4xl font-bold mb-1 ${getScoreColor(percentage)}`}>
                      {percentage}%
                    </p>
                    <p className="text-gray-500 text-sm">Nilai Anda</p>
                  </div>

                  {/* Total Soal */}
                  <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-sm font-medium mb-2">Total Soal</p>
                    <p className="text-4xl font-bold text-blue-600 mb-1">
                      {totalQuestions}
                    </p>
                    <p className="text-gray-500 text-sm">Soal Dikerjakan</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Ringkasan Hasil</p>
                      <p className="text-gray-700 mt-2">
                        Anda telah menyelesaikan latihan dengan skor <span className="font-bold">{state.score}/{maxPossibleScore}</span> ({percentage}%). 
                        {percentage >= 80 ? " Luar biasa! Anda sudah menguasai materi ini." : percentage >= 60 ? " Bagus! Namun masih ada ruang untuk improvement." : " Anda perlu belajar lebih lagi untuk menguasai materi ini."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button 
                    onClick={resetQuiz} 
                    className="flex-1"
                    style={{backgroundColor: '#E8B824', color: '#1A1A1A'}}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Coba Lagi
                  </Button>
                  <Button 
                    onClick={handleBackClick} 
                    className="flex-1"
                    style={{backgroundColor: '#1A1A1A', color: '#FFFFFC'}}
                  >
                    Tutup
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const progress = Math.min((state.answeredQuestions.size / totalQuestions) * 100, 99);
  const questionTypeInfo = getQuestionTypeInfo(currentQuestion.question_type);
  const QuestionIcon = questionTypeInfo.icon;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div style={{backgroundColor: '#0D0D0D', borderBottomWidth: '2px', borderColor: '#E8B824'}} className="text-white shadow-md">
        <div className="w-full px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => setShowConfirmBack(true)}
                className="gap-2"
                style={{backgroundColor: '#E8B824', color: '#1A1A1A'}}
              >
                <ChevronLeft className="h-4 w-4" />
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold" style={{color: '#FFFFFC'}}>Latihan Soal Interaktif</h1>
                <p className="text-sm mt-1" style={{color: '#FFFFFC'}}>Soal {state.currentQuestionIndex + 1} dari {totalQuestions}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm" style={{color: '#FFFFFC'}}>Skor Saat Ini</p>
                <p className="text-3xl font-bold" style={{color: '#E8B824'}}>{state.score}/{maxPossibleScore}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 w-full gap-3 px-4 py-6">
        {/* LEFT SIDEBAR - Collapsible Soal List (15%) */}
        <div className="hidden lg:flex basis-[15%] flex-col flex-shrink-0">
          <Card className="bg-white border border-gray-200 rounded-lg sticky top-8 h-fit">
            <CardHeader className="border-b border-gray-200 p-5 pb-4">
              <CardTitle className="text-sm font-semibold text-gray-800">Daftar Soal</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: totalQuestions }).map((_, index) => {
                  const isCurrentQuestion = index === state.currentQuestionIndex;
                  const isAnswered = state.answeredQuestions.has(index);

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        handleJumpToQuestion(index);
                        setShowSoalList(false);
                      }}
                      className={`
                        h-12 w-full rounded-lg font-bold text-sm transition-all duration-200
                        ${isCurrentQuestion 
                          ? 'text-black ring-2' 
                          : isAnswered 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                      style={isCurrentQuestion ? {backgroundColor: '#E8B824', color: '#1A1A1A', boxShadow: '0 0 0 2px #E8B824'} : {}}
                      disabled={isCurrentQuestion}
                      title={`Soal ${index + 1}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CENTER - Main Question Content (50%) */}
        <div className="basis-1/2 min-w-0">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-medium text-blue-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <Card className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <CardHeader style={{backgroundColor: '#1A1A1A', borderBottomWidth: '1px', borderColor: '#333333'}} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle style={{color: '#FFFFFC'}} className="text-lg">{questionTypeInfo.label}</CardTitle>
                  <CardDescription style={{color: '#CCCCCC'}} className="mt-2">
                    {currentQuestion.question_type === 'essay' && "Tulis jawaban essay yang lengkap dan jelas"}
                    {currentQuestion.question_type === 'sentence_arrangement' && "Lengkapi kalimat rumpang dibawah ini dengan potongan kata yang benar"}
                    {(currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'true_false') && "Pilih jawaban yang paling tepat"}
                  </CardDescription>
                </div>
                <Badge style={{backgroundColor: '#FFFFFC', color: '#1A1A1A'}} className="text-xs font-medium">
                  {currentQuestion.points} Poin
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Question Content */}
                <div>
                  {renderQuestionContent(currentQuestion)}
                </div>

                {/* Explanation - Hidden on mobile */}
                {state.showResult && currentQuestion.explanation && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex gap-2 mb-2">
                      <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <h4 className="font-semibold text-blue-900">Penjelasan:</h4>
                    </div>
                    <div className="text-blue-800 text-sm leading-relaxed ml-7">
                      {formatExplanationText(currentQuestion.explanation)}
                    </div>
                  </div>
                )}

                {/* AI Feedback */}
                {state.showResult && (
                  <div className="lg:hidden">
                    {renderAIFeedback()}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {!state.showResult ? (
                    <Button 
                      onClick={handleSubmitAnswer} 
                      disabled={
                        (currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'true_false') && !state.selectedOptionId ||
                        currentQuestion.question_type === 'essay' && !state.essayAnswer.trim() ||
                        currentQuestion.question_type === 'sentence_arrangement' && blankPositions.some(pos => pos.piece === null)
                      }
                      style={{backgroundColor: '#E8B824', color: '#1A1A1A'}}
                      className="flex-1 font-semibold"
                    >
                      Submit Jawaban
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleNextQuestion} 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={state.isLoadingFeedback}
                    >
                      {state.currentQuestionIndex < totalQuestions - 1 ? (
                        <>
                          Soal Berikutnya <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Selesai <CheckCircle2 className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Toggle Button for Soal List */}
          <div className="lg:hidden mt-6">
            <Button
              onClick={() => setShowSoalList(!showSoalList)}
              className="w-full font-semibold"
              style={{backgroundColor: showSoalList ? '#1A1A1A' : '#E8B824', color: showSoalList ? '#FFFFFC' : '#1A1A1A'}}
            >
              {showSoalList ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Tutup Daftar Soal
                </>
              ) : (
                <>
                  <Menu className="h-4 w-4 mr-2" />
                  Buka Daftar Soal
                </>
              )}
            </Button>
            
            {showSoalList && (
              <Card className="bg-white border border-gray-200 rounded-lg mt-4 animate-in fade-in">
                <CardHeader className="border-b border-gray-200 p-5 pb-4">
                  <CardTitle className="text-sm font-semibold text-gray-800">Daftar Soal</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: totalQuestions }).map((_, index) => {
                      const isCurrentQuestion = index === state.currentQuestionIndex;
                      const isAnswered = state.answeredQuestions.has(index);

                      return (
                        <button
                          key={index}
                          onClick={() => {
                            handleJumpToQuestion(index);
                            setShowSoalList(false);
                          }}
                          className={`
                            h-12 w-full rounded-lg font-bold text-sm transition-all duration-200
                            ${isCurrentQuestion 
                              ? 'text-black ring-2' 
                              : isAnswered 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }
                          `}
                          style={isCurrentQuestion ? {backgroundColor: '#E8B824', color: '#1A1A1A', boxShadow: '0 0 0 2px #E8B824'} : {}}
                          disabled={isCurrentQuestion}
                          title={`Soal ${index + 1}`}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR - AI Feedback (35%) */}
        <div className="hidden lg:flex basis-[35%] flex-col flex-shrink-0">
          {state.showResult && (
            <>
              {renderAIFeedback()}
            </>
          )}
          {!state.showResult && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200 rounded-lg sticky top-8">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-blue-100 mb-4">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-gray-700 text-sm font-semibold">Feedback AI</p>
                <p className="text-gray-500 text-xs mt-3 leading-relaxed">
                  Submit jawaban Anda untuk menerima analisis mendalam dan rekomendasi pembelajaran dari AI
                </p>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Lightbulb className="h-3 w-3 text-yellow-500" />
                      <span>Penjelasan lengkap</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <BookOpen className="h-3 w-3 text-blue-500" />
                      <span>Sumber belajar</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Target className="h-3 w-3 text-green-500" />
                      <span>Tips perbaikan</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirm Back Modal */}
      <Dialog open={showConfirmBack} onOpenChange={setShowConfirmBack}>
        <DialogContent className="bg-white rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Tinggalkan Latihan?</DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Apakah Anda yakin ingin meninggalkan latihan? Kemajuan Anda mungkin tidak tersimpan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline"
              onClick={() => setShowConfirmBack(false)}
              className="flex-1"
            >
              Lanjutkan
            </Button>
            <Button 
              onClick={handleBackClick}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Keluar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Refresh Modal */}
      <Dialog open={showConfirmRefresh} onOpenChange={setShowConfirmRefresh}>
        <DialogContent className="bg-white rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Yakin ingin refresh halaman?
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Memperbarui halaman akan mereset semua jawaban Anda yang belum disimpan. Kami sudah menyimpan feedback untuk setiap soal, tapi jawaban Anda akan hilang.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 my-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 font-semibold flex items-center gap-2">
              Tip: Gunakan tombol "Kembali" jika ingin meninggalkan latihan dengan aman.
            </p>
          </div>
          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline"
              onClick={() => setShowConfirmRefresh(false)}
              className="flex-1"
            >
              Batalkan Refresh
            </Button>
            <Button 
              onClick={() => {
                setShowConfirmRefresh(false);
                window.location.reload();
              }}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              Lanjutkan Refresh
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}