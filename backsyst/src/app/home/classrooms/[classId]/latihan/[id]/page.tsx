"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";

interface Option {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  points: number;
  explanation: string;
  options: Option[];
}

interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  selectedOptionId: string | null;
  showResult: boolean;
  score: number;
  quizCompleted: boolean;
  isLoading: boolean;
  error: string | null;
  attemptId: string | null;
  hasInitialized: boolean;
}

const initialQuizState: QuizState = {
  questions: [],
  currentQuestionIndex: 0,
  selectedOptionId: null,
  showResult: false,
  score: 0,
  quizCompleted: false,
  isLoading: true,
  error: null,
  attemptId: null,
  hasInitialized: false,
};

export default function InteractiveQuiz() {
  const router = useRouter();
  const params = useParams();
  const exerciseSetId = params.id as string;
  const [state, setState] = useState<QuizState>(initialQuizState);
  const [timeLeft, setTimeLeft] = useState(30);
  const [startTime, setStartTime] = useState<Date | null>(null);

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

  const createExerciseAttempt = async (userId: string) => {
    try {
      if (!exerciseSetId) {
        throw new Error("Exercise set ID is missing.");
      }
      
      const { data: existingAttempt, error: checkError } = await supabase
        .from("exercise_attempts")
        .select("id")
        .eq("exercise_set_id", exerciseSetId)
        .eq("student_id", userId)
        .eq("status", "in_progress")
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing attempt:", checkError.message);
      }

      if (existingAttempt) {
        console.log("Found existing in_progress attempt:", existingAttempt.id);
        toast.info("Melanjutkan sesi latihan yang belum selesai.");
        return existingAttempt.id;
      }
      
      const { data: maxAttemptData, error: maxAttemptError } = await supabase
        .from("exercise_attempts")
        .select("attempt_number")
        .eq("exercise_set_id", exerciseSetId)
        .eq("student_id", userId)
        .order("attempt_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxAttemptError && maxAttemptError.code !== 'PGRST116') {
        console.error("Error getting max attempt number:", maxAttemptError.message);
        throw new Error(`Failed to get attempt history: ${maxAttemptError.message}`);
      }

      const nextAttemptNumber = maxAttemptData ? maxAttemptData.attempt_number + 1 : 1;
      
      console.log(`Creating new attempt with number: ${nextAttemptNumber}`);
      
      const attemptData = {
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
        console.error("Error details:", JSON.stringify(insertError, null, 2));
        
        if (insertError.code === '23505') {
          console.log("Duplicate key error, trying to find existing attempt...");
          const { data: existingDuplicate, error: findError } = await supabase
            .from("exercise_attempts")
            .select("id")
            .eq("exercise_set_id", exerciseSetId)
            .eq("student_id", userId)
            .eq("attempt_number", nextAttemptNumber)
            .maybeSingle();
            
          if (!findError && existingDuplicate) {
            console.log("Found existing attempt with same number:", existingDuplicate.id);
            return existingDuplicate.id;
          }
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

  const saveStudentAnswer = async (questionId: string, selectedOptionId: string | null, isCorrect: boolean, pointsEarned: number) => {
    if (!state.attemptId) {
      console.error("No attempt ID available for saving answer");
      return;
    }

    try {
      const answerData = {
        attempt_id: state.attemptId,
        question_id: questionId,
        selected_option_id: selectedOptionId,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        answered_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("student_answers")
        .upsert([answerData], { onConflict: 'attempt_id, question_id' });

      if (error) {
        console.error("Error saving student answer:", error.message);
        console.error("Insert error details:", JSON.stringify(error, null, 2));
        toast.error(`Gagal menyimpan jawaban: ${error.message}`);
        return;
      }
    } catch (err) {
      console.error("Unexpected error saving answer:", err);
      toast.error("Terjadi kesalahan saat menyimpan jawaban");
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

      const { data: analytics, error: analyticsError } = await supabase
        .from("exercise_analytics")
        .select("total_attempts, total_submissions, average_score, average_time_minutes, highest_score, lowest_score")
        .eq("exercise_set_id", exerciseSetId)
        .maybeSingle();
      
      let newAnalyticsData;
      if (analytics) {
        const currentTotalScore = (analytics.average_score / 100) * analytics.total_submissions * totalMaxScore;
        const currentTotalTime = analytics.average_time_minutes * analytics.total_submissions;
        const newTotalSubmissions = (analytics.total_submissions || 0) + 1;

        newAnalyticsData = {
          total_attempts: (analytics.total_attempts || 0) + 1,
          total_submissions: newTotalSubmissions,
          average_score: parseFloat((((currentTotalScore + totalScore) / newTotalSubmissions / totalMaxScore) * 100).toFixed(2)),
          average_time_minutes: Math.round((currentTotalTime + timeSpentMinutes) / newTotalSubmissions), // Round to integer
          highest_score: parseFloat(Math.max(analytics.highest_score || 0, totalScore).toFixed(2)),
          lowest_score: parseFloat(Math.min(analytics.lowest_score || Infinity, totalScore).toFixed(2)),
          updated_at: new Date().toISOString(),
        };
      } else {
        newAnalyticsData = {
          exercise_set_id: exerciseSetId,
          total_attempts: 1,
          total_submissions: 1,
          average_score: parseFloat((totalMaxScore > 0 ? (totalScore / totalMaxScore * 100) : 0).toFixed(2)),
          average_time_minutes: Math.max(timeSpentMinutes, 1), // Ensure at least 1 minute and integer
          highest_score: parseFloat(totalScore.toFixed(2)),
          lowest_score: parseFloat(totalScore.toFixed(2)),
          updated_at: new Date().toISOString(),
        };
      }

      console.log("Analytics data to upsert:", newAnalyticsData);

      const { error: upsertError } = await supabase
        .from("exercise_analytics")
        .upsert(newAnalyticsData, { onConflict: 'exercise_set_id' });

      if (upsertError) {
        console.error("Error upserting exercise analytics:", upsertError.message);
        throw new Error(`Gagal menyimpan data analitik: ${upsertError.message}`);
      }

      toast.success("Latihan berhasil diselesaikan!");

    } catch (err: any) {
      console.error("Unexpected error completing attempt:", err.message);
      toast.error(err.message || "Terjadi kesalahan yang tidak terduga saat menyelesaikan latihan");
    }
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!exerciseSetId || state.hasInitialized) {
        if (!exerciseSetId) {
          setState(s => ({ ...s, error: "ID set latihan tidak ditemukan.", isLoading: false }));
          toast.error("ID set latihan tidak ditemukan.");
        }
        return;
      }
      
      setState(s => ({ ...s, hasInitialized: true }));

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
            options (id, option_text, is_correct, order_index)
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
        
        setState(s => ({ ...s, questions: questionsData, isLoading: false }));
      } catch (err: any) {
        console.error("Unexpected error in fetchQuestions:", err.message);
        setState(s => ({ ...s, error: err.message || "Terjadi kesalahan yang tidak terduga.", isLoading: false }));
        toast.error(err.message || "Terjadi kesalahan yang tidak terduga.");
      }
    };

    fetchQuestions();
  }, [exerciseSetId, state.hasInitialized]);

  const handleSubmitAnswer = async () => {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    
    let selectedOptionId = state.selectedOptionId;
    if (!selectedOptionId) {
      if (timeLeft === 0) {
        selectedOptionId = currentQuestion.options[0]?.id || null;
        setState(s => ({ ...s, selectedOptionId }));
        toast.info("Waktu habis! Jawaban otomatis dipilih.");
      } else {
        toast.warning("Silakan pilih salah satu jawaban.");
        return;
      }
    }
    
    const selectedOption = currentQuestion.options.find(opt => opt.id === selectedOptionId);
    const isCorrect = selectedOption?.is_correct ?? false;
    const pointsEarned = isCorrect ? currentQuestion.points : 0;

    await saveStudentAnswer(currentQuestion.id, selectedOptionId, isCorrect, pointsEarned);

    setState(s => ({
      ...s,
      showResult: true,
      score: s.score + pointsEarned,
    }));
  };

  const handleNextQuestion = async () => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      setState(s => ({
        ...s,
        currentQuestionIndex: s.currentQuestionIndex + 1,
        selectedOptionId: null,
        showResult: false,
      }));
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
    router.refresh();
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p>Memuat pertanyaan...</p>
        </div>
      </div>
    );
  }

  if (state.error || !state.questions.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Terjadi Kesalahan</h1>
        <p className="text-muted-foreground mb-4">{state.error || "Tidak ada pertanyaan yang tersedia."}</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      </div>
    );
  }

  const totalQuestions = state.questions.length;
  const currentQuestion = state.questions[state.currentQuestionIndex];
  const maxPossibleScore = state.questions.reduce((sum, q) => sum + q.points, 0);

  if (state.quizCompleted) {
    const percentage = maxPossibleScore > 0 ? Math.round((state.score / maxPossibleScore) * 100) : 0;
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Kuis Selesai!</CardTitle>
              <CardDescription>Berikut adalah hasil Anda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(percentage)}`}>
                  {state.score}/{maxPossibleScore}
                </div>
                <p className="text-muted-foreground">Skor Anda</p>
                <div className={`text-2xl font-semibold ${getScoreColor(percentage)}`}>
                  {percentage}%
                </div>
              </div>
              <div className="flex gap-4">
                <Button onClick={resetQuiz} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Coba Lagi
                </Button>
                <Button variant="outline" onClick={() => router.back()} className="flex-1">
                  Kembali
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progress = ((state.currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className={`font-mono ${timeLeft <= 10 ? 'text-red-600' : ''}`}>
                {timeLeft}s
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Pertanyaan {state.currentQuestionIndex + 1} dari {totalQuestions}</span>
            <span>Skor: {state.score}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <Badge variant="outline">{currentQuestion.question_type}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Poin: {currentQuestion.points}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="mb-4 text-lg font-medium">{currentQuestion.question_text}</h2>
              <RadioGroup 
                value={state.selectedOptionId ?? ""} 
                onValueChange={(value) => setState(s => ({ ...s, selectedOptionId: value }))}
                disabled={state.showResult}
              >
                {currentQuestion.options.map((option) => (
                  <div 
                    key={option.id} 
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                      state.showResult 
                        ? option.is_correct 
                          ? 'bg-green-50 border-green-200' 
                          : state.selectedOptionId === option.id
                            ? 'bg-red-50 border-red-200'
                            : ''
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                    <Label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer">
                      {option.option_text}
                    </Label>
                    {state.showResult && option.is_correct && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    {state.showResult && state.selectedOptionId === option.id && !option.is_correct && (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>

            {state.showResult && currentQuestion.explanation && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Penjelasan:</h4>
                <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
              </div>
            )}

            <div className="flex justify-end">
              {!state.showResult ? (
                <Button 
                  onClick={handleSubmitAnswer} 
                  disabled={!state.selectedOptionId}
                  className="min-w-32"
                >
                  Submit
                </Button>
              ) : (
                <Button onClick={handleNextQuestion} className="min-w-32">
                  {state.currentQuestionIndex < totalQuestions - 1 ? (
                    <>
                      Selanjutnya <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    'Selesai'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}