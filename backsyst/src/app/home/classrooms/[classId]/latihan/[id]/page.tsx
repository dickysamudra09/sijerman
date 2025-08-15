  "use client";

  import { useState, useEffect } from "react";
  import { useRouter, useSearchParams, useParams } from "next/navigation";
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
  };

  export default function InteractiveQuiz() {
    const router = useRouter();
    const params = useParams();
    const exerciseSetId = params.id as string; 
    const [state, setState] = useState<QuizState>(initialQuizState);
    const [timeLeft, setTimeLeft] = useState(30);

    // --- Timer Logic ---
    useEffect(() => {
      let interval: NodeJS.Timeout | null = null;
      if (!state.showResult && timeLeft > 0 && !state.quizCompleted) {
        interval = setInterval(() => {
          setTimeLeft(prevTime => prevTime - 1);
        }, 1000);
      } else if (timeLeft === 0 && !state.showResult) {
        handleSubmitAnswer();
      }
      return () => {
        if (interval) clearInterval(interval);
      };
    }, [state.showResult, timeLeft, state.quizCompleted]);

    // --- Fetch Data dari Supabase ---
    useEffect(() => {
      const fetchQuestions = async () => {
        if (!exerciseSetId) { 
          setState(s => ({ ...s, error: "ID set latihan tidak ditemukan.", isLoading: false }));
          toast.error("ID set latihan tidak ditemukan.");
          return;
        }
        
        try {
          console.log("Fetching questions for exercise_set_id:", exerciseSetId);
          const { data: exerciseSet, error: exerciseError } = await supabase
            .from("exercise_sets")
            .select("id, judul_latihan")
            .eq("id", exerciseSetId)
            .single();

          if (exerciseError || !exerciseSet) {
            console.error("Exercise set not found:", exerciseError);
            setState(s => ({ ...s, error: "Latihan soal tidak ditemukan.", isLoading: false }));
            toast.error("Latihan soal tidak ditemukan.");
            return;
          }

          console.log("Exercise set found:", exerciseSet);
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
            console.error("Error fetching questions:", error);
            setState(s => ({ ...s, error: `Gagal memuat pertanyaan: ${error.message}`, isLoading: false }));
            toast.error("Gagal memuat pertanyaan.");
            return;
          }

          console.log("Raw questions data:", data);

          if (!data || data.length === 0) {
            setState(s => ({ ...s, error: "Tidak ada pertanyaan untuk latihan ini.", isLoading: false }));
            toast.info("Tidak ada pertanyaan untuk latihan ini.");
            return;
          }
          const questionsData = data.map(question => ({
            ...question,
            options: question.options.sort((a: any, b: any) => a.order_index - b.order_index)
          })) as Question[];
          
          console.log("Formatted questions:", questionsData);
          
          setState(s => ({ 
            ...s, 
            questions: questionsData, 
            isLoading: false,
          }));
        } catch (err) {
          console.error("Unexpected error:", err);
          setState(s => ({ ...s, error: "Terjadi kesalahan yang tidak terduga.", isLoading: false }));
          toast.error("Terjadi kesalahan yang tidak terduga.");
        }
      };

      fetchQuestions();
    }, [exerciseSetId]);

    // --- Fungsionalitas Quiz ---
    const handleSubmitAnswer = () => {
      const currentQuestion = state.questions[state.currentQuestionIndex];
      if (!state.selectedOptionId) {
        toast.warning("Silakan pilih salah satu jawaban.");
        return;
      }
      
      const selectedOption = currentQuestion.options.find(opt => opt.id === state.selectedOptionId);
      const isCorrect = selectedOption?.is_correct ?? false;

      setState(s => ({
        ...s,
        showResult: true,
        score: isCorrect ? s.score + currentQuestion.points : s.score,
      }));
    };

    const handleNextQuestion = () => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        setState(s => ({
          ...s,
          currentQuestionIndex: s.currentQuestionIndex + 1,
          selectedOptionId: null,
          showResult: false,
        }));
        setTimeLeft(30);
      } else {
        setState(s => ({ ...s, quizCompleted: true }));
      }
    };

    const resetQuiz = () => {
      setState(initialQuizState);
      setTimeLeft(30);
      window.location.reload(); 
    };

    const getScoreColor = (percentage: number) => {
      if (percentage >= 80) return 'text-green-600';
      if (percentage >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    // --- Render Logic ---
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
          {/* Header */}
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

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Pertanyaan {state.currentQuestionIndex + 1} dari {totalQuestions}</span>
              <span>Skor: {state.score}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
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