
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Clock,
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
};

export default function InteractiveQuiz() {
  const router = useRouter();
  const params = useParams();
  const exerciseSetId = params.id as string;
  const [state, setState] = useState<QuizState>(initialQuizState);
  const [timeLeft, setTimeLeft] = useState(30);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [availablePieces, setAvailablePieces] = useState<Option[]>([]);
  const [blankPositions, setBlankPositions] = useState<BlankPositionState[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (!state.showResult && timeLeft > 0 && !state.quizCompleted) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && !state.showResult && !state.quizCompleted) {
      handleSubmitAnswer();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.showResult, timeLeft, state.quizCompleted]);

  useEffect(() => {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    if (currentQuestion?.question_type === 'sentence_arrangement') {
      console.log('Setting up sentence arrangement (Fill-in-the-Blank) for question:', currentQuestion);
      
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
        
        setAvailablePieces(pieces);
        setBlankPositions(initialBlankPositions);
        setState(s => ({ ...s, sentenceArrangement: [] }));
        
        console.log('Loaded question config:', currentQuestion); 
      } else {
        console.warn('No sentence_arrangement_config found for sentence_arrangement question');
      }
    } else {
      setAvailablePieces([]);
      setBlankPositions([]);
      setState(s => ({ ...s, sentenceArrangement: [] }));
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

      const response = await fetch('/api/ai-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('AI feedback response status:', response.status);
      const result = await response.json();
      console.log('AI feedback result:', result);

      if (result.success) {
        setState(s => ({ 
          ...s, 
          aiFeedback: result.data,
          isLoadingFeedback: false 
        }));
        
        if (result.warning) {
          console.warn('AI Feedback warning:', result.warning);
        }
      } else {
        // Fallback saat AI gagal
        const fallbackReferences = [
            { title: "Deutsche Grammatik - Goethe Institut", url: "https://www.goethe.de/de/spr/ueb/gram.html", description: "Panduan tata bahasa Jerman resmi dari Goethe Institut" },
            { title: "Leo Dictionary - Deutsch-Englisch", url: "https://dict.leo.org/german-english/", description: "Kamus online Jerman-Inggris yang komprehensif" },
            { title: "Verbformen.de", url: "https://www.verbformen.de/", description: "Database konjugasi lengkap untuk semua kata kerja Jerman" }
        ];

        setState(s => ({ 
            ...s, 
            aiFeedback: {
                feedback_text: result.data?.feedback_text || "Maaf, feedback AI tidak dapat dimuat saat ini.",
                explanation: result.data?.explanation || "Silakan lanjutkan dengan pertanyaan berikutnya.",
                reference_materials: result.data?.reference_materials || fallbackReferences
            },
            isLoadingFeedback: false 
        }));
        toast.error(result.error || "Gagal memuat feedback AI");
      }

    } catch (error: unknown) {
      console.error('Error generating AI feedback:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setState(s => ({ 
        ...s, 
        aiFeedback: {
          feedback_text: "Maaf, feedback AI tidak dapat dimuat saat ini.",
          explanation: "Silakan lanjutkan dengan pertanyaan berikutnya.",
          reference_materials: []
        },
        isLoadingFeedback: false 
      }));
      
      toast.error("Gagal memuat feedback AI: " + errorMessage);
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
        if (timeLeft === 0) {
          selectedOptionId = currentQuestion.options[0]?.id || null;
          setState(s => ({ ...s, selectedOptionId }));
          toast.info("Waktu habis! Jawaban otomatis dipilih.");
        } else {
          toast.warning("Silakan pilih salah satu jawaban.");
          return;
        }
      } else {
        selectedOptionId = state.selectedOptionId;
      }
      
      const selectedOption = currentQuestion.options.find(opt => opt.id === selectedOptionId);
      isCorrect = selectedOption?.is_correct ?? false;
      pointsEarned = isCorrect ? currentQuestion.points : 0;
      
    } else if (currentQuestion.question_type === 'essay') {
      if (!state.essayAnswer.trim()) {
        if (timeLeft === 0) {
          toast.info("Waktu habis! Jawaban kosong akan disubmit.");
        } else {
          toast.warning("Silakan isi jawaban essay.");
          return;
        }
      }
      
      textAnswer = state.essayAnswer.trim();
      isCorrect = textAnswer.length > 0;
      pointsEarned = isCorrect ? currentQuestion.points * 0.8 : 0;
      
    } else if (currentQuestion.question_type === 'sentence_arrangement') {
      
      if (blankPositions.some(pos => pos.piece === null)) {
        if (timeLeft === 0) {
          toast.info("Waktu habis! Susunan kalimat yang belum lengkap akan disubmit.");
        } else {
          toast.warning("Silakan lengkapi susunan kalimat.");
          return;
        }
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
      setTimeLeft(30);
    } else {
      await completeExerciseAttempt();
      
      setState(s => ({ ...s, quizCompleted: true }));
    }
  };

  const resetQuiz = () => {
    setState(initialQuizState);
    setTimeLeft(30);
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
            {currentQuestion.question_text}
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
                        Hasil: **{getFilledSentence()}**
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

    // Default multiple choice rendering
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
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              )}
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white shadow-2xl border-0 rounded-2xl">
            <CardContent className="flex items-center justify-center p-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Memuat latihan soal...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (state.error || !state.questions.length) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white shadow-2xl border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-red-600 text-xl flex items-center gap-3">
                <XCircle className="h-6 w-6" />
                Terjadi Kesalahan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-6">{state.error || "Tidak ada pertanyaan yang tersedia."}</p>
              <Button 
                onClick={() => router.back()} 
                className="bg-sky-500 hover:bg-sky-600 text-white shadow-md"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
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
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-gray-100 p-8">
              <div className="text-center">
                <div className="p-4 bg-sky-500 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <Trophy className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Latihan Selesai!</CardTitle>
                <CardDescription className="text-gray-600 mt-2">Berikut adalah hasil latihan Anda</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="p-3 bg-green-500 rounded-full w-fit mx-auto mb-3">
                          <Award className="h-6 w-6 text-white" />
                        </div>
                        <div className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                          {state.score}/{maxPossibleScore}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Skor Anda</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="p-3 bg-blue-500 rounded-full w-fit mx-auto mb-3">
                          <Target className="h-6 w-6 text-white" />
                        </div>
                        <div className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                          {percentage}%
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Persentase</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="p-3 bg-purple-500 rounded-full w-fit mx-auto mb-3">
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-purple-600">{totalQuestions}</div>
                        <p className="text-sm text-gray-500 mt-1">Total Soal</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex gap-4">
                    <Button 
                      onClick={resetQuiz} 
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-3 text-lg"
                      size="lg"
                    >
                      <RotateCcw className="h-5 w-5 mr-2" />
                      Coba Lagi
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => router.back()} 
                      className="flex-1 border-gray-300 text-gray-600 shadow-md hover:bg-gray-50 py-3 text-lg"
                      size="lg"
                    >
                      Kembali ke Kelas
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progress = ((state.currentQuestionIndex + 1) / totalQuestions) * 100;
  const questionTypeInfo = getQuestionTypeInfo(currentQuestion.question_type);
  const QuestionIcon = questionTypeInfo.icon;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Main Card Container */}
        <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-gray-100 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => router.back()}
                  className="border-gray-300 text-gray-600 shadow-sm hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-500 rounded-full shadow-lg">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Latihan Soal Interaktif</h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700 px-4 py-2 text-lg font-medium">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className={`font-mono ${timeLeft <= 10 ? 'text-red-600' : ''}`}>
                    {timeLeft}s
                  </span>
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Progress Section */}
              <Card className="bg-gray-50 border border-gray-200 shadow-lg rounded-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Pertanyaan {state.currentQuestionIndex + 1} dari {totalQuestions}
                      </h3>
                      <p className="text-gray-600">Skor saat ini: {state.score} poin</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={`${questionTypeInfo.color} border-2`}>
                        <QuestionIcon className="h-4 w-4 mr-1" />
                        {questionTypeInfo.label}
                      </Badge>
                      <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                        {currentQuestion.points} Poin
                      </Badge>
                    </div>
                  </div>
                  <Progress value={progress} className="h-3 bg-gray-200" />
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="p-3 bg-blue-500 rounded-full w-fit mx-auto mb-3">
                        <Timer className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{state.currentQuestionIndex + 1}</div>
                      <p className="text-sm text-gray-500 mt-1">Soal Saat Ini</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="p-3 bg-green-500 rounded-full w-fit mx-auto mb-3">
                        <Award className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-green-600">{state.score}</div>
                      <p className="text-sm text-gray-500 mt-1">Skor</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="p-3 bg-purple-500 rounded-full w-fit mx-auto mb-3">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-purple-600">{totalQuestions}</div>
                      <p className="text-sm text-gray-500 mt-1">Total Soal</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="p-3 bg-orange-500 rounded-full w-fit mx-auto mb-3">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-600' : 'text-orange-600'}`}>
                        {timeLeft}s
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Waktu Tersisa</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Question Card */}
              <Card className="bg-gray-50 border border-gray-200 shadow-lg rounded-xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                    <div className="p-2 bg-sky-500 rounded-lg">
                      <QuestionIcon className="h-5 w-5 text-white" />
                    </div>
                    Soal {questionTypeInfo.label}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {currentQuestion.question_type === 'essay' && "Tulis jawaban essay yang lengkap dan jelas"}
                    {currentQuestion.question_type === 'sentence_arrangement' && "Seret dan lepas potongan kata untuk menyusun kalimat yang benar"}
                    {(currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'true_false') && "Pilih jawaban yang paling tepat untuk soal di bawah ini"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {renderQuestionContent(currentQuestion)}

                  {state.showResult && currentQuestion.explanation && (
                    <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">Penjelasan:</h4>
                      </div>
                      <p className="text-blue-800 leading-relaxed">{currentQuestion.explanation}</p>
                    </div>
                  )}

                  {state.showResult && (
                    <div className="space-y-4">
                      {state.isLoadingFeedback ? (
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
                      ) : state.aiFeedback && (
                        <Card className="border-purple-200 bg-purple-50/50 shadow-lg">
                          <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-500 rounded-lg">
                                <Lightbulb className="h-5 w-5 text-white" />
                              </div>
                              <CardTitle className="text-lg text-purple-900">AI Feedback</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <h5 className="font-semibold text-purple-900 mb-3">Feedback:</h5>
                              <p className="text-purple-800 bg-white/80 p-4 rounded-lg border border-purple-200 leading-relaxed">
                                {state.aiFeedback.feedback_text}
                              </p>
                            </div>
                            {state.aiFeedback.explanation && (
                              <div>
                                <h5 className="font-semibold text-purple-900 mb-3">Penjelasan Detail:</h5>
                                <p className="text-purple-800 bg-white/80 p-4 rounded-lg border border-purple-200 leading-relaxed">
                                  {state.aiFeedback.explanation}
                                </p>
                              </div>
                            )}

                            {state.aiFeedback.reference_materials && state.aiFeedback.reference_materials.length > 0 && (
                              <div>
                                <h5 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  Referensi Belajar:
                                </h5>
                                <div className="space-y-3">
                                  {state.aiFeedback.reference_materials.map((ref, index) => (
                                    <div key={index} className="bg-white/90 p-4 rounded-lg border border-purple-200 shadow-sm">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                          <h6 className="font-semibold text-purple-900 mb-1">
                                            {ref.title}
                                          </h6>
                                          <p className="text-sm text-purple-700 leading-relaxed">
                                            {ref.description}
                                          </p>
                                        </div>
                                        {ref.url && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="shrink-0 border-purple-300 text-purple-700 hover:bg-purple-100 shadow-sm"
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

                            {state.aiFeedback.ai_model && process.env.NODE_ENV === 'development' && (
                              <div className="text-xs text-purple-600 pt-3 border-t border-purple-200">
                                Powered by {state.aiFeedback.ai_model}
                                {state.aiFeedback.processing_time_ms && 
                                  ` • Generated in ${state.aiFeedback.processing_time_ms}ms`
                                }
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex justify-end">
                      {!state.showResult ? (
                        <Button 
                          onClick={handleSubmitAnswer} 
                          disabled={
                            (currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'true_false') && !state.selectedOptionId ||
                            currentQuestion.question_type === 'essay' && !state.essayAnswer.trim() ||
                            currentQuestion.question_type === 'sentence_arrangement' && blankPositions.some(pos => pos.piece === null) // Cek apakah semua posisi terisi
                          }
                          className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-lg font-medium"
                          size="lg"
                        >
                          Submit Jawaban
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleNextQuestion} 
                          className="bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-lg font-medium"
                          size="lg"
                          disabled={state.isLoadingFeedback}
                        >
                          {state.currentQuestionIndex < totalQuestions - 1 ? (
                            <>
                              Soal Berikutnya <ArrowRight className="h-5 w-5 ml-2" />
                            </>
                          ) : (
                            <>
                              Selesai <CheckCircle2 className="h-5 w-5 ml-2" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}