"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Brain, 
  Target,
  Trophy,
  RotateCcw,
  ArrowRight
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

const sampleQuestions: Question[] = [
  {
    id: "1",
    question: "Welches Wort ist ein Synonym für 'schnell'?",
    options: ["langsam", "rasch", "groß", "klein"],
    correct: 1,
    explanation: "Das Wort 'rasch' ist ein Synonym für 'schnell' und bedeutet 'mit hoher Geschwindigkeit'.",
    difficulty: "easy",
    topic: "Vocabulary"
  },
  {
    id: "2", 
    question: "Wählen Sie die richtige Deklination: 'Ich gebe ___ Kind das Buch.'",
    options: ["das", "der", "dem", "den"],
    correct: 2,
    explanation: "'dem Kind' ist Dativ (3. Fall), da 'geben' ein Verb mit Dativ-Objekt ist.",
    difficulty: "medium",
    topic: "Grammar"
  },
  {
    id: "3",
    question: "Was ist die korrekte Pluralform von 'das Auto'?",
    options: ["die Autos", "die Auten", "die Autoen", "der Autos"],
    correct: 0,
    explanation: "Der Plural von 'das Auto' ist 'die Autos'. Viele Fremdwörter bilden den Plural mit -s.",
    difficulty: "easy",
    topic: "Grammar"
  },
  {
    id: "4",
    question: "Welcher Satz ist grammatisch korrekt?",
    options: [
      "Ich bin gestern ins Kino gegangen.",
      "Ich bin gestern zum Kino gegangen.",
      "Ich habe gestern ins Kino gegangen.",
      "Ich war gestern ins Kino gegangen."
    ],
    correct: 0,
    explanation: "'Ins Kino gehen' verwendet 'sein' als Hilfsverb, da es Bewegung ausdrückt.",
    difficulty: "hard",
    topic: "Grammar"
  },
  {
    id: "5",
    question: "Was bedeutet 'Fernweh'?",
    options: [
      "Schmerzen in den Füßen",
      "Sehnsucht nach fernen Orten",
      "Angst vor dem Reisen", 
      "Müdigkeit nach langen Reisen"
    ],
    correct: 1,
    explanation: "'Fernweh' ist ein deutsches Wort für die Sehnsucht nach fernen, unbekannten Orten.",
    difficulty: "medium",
    topic: "Vocabulary"
  }
];

interface InteractiveQuizProps {
  onBack: () => void;
}

export function InteractiveQuiz({ onBack }: InteractiveQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0 && !showResult) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && !showResult) {
      handleSubmitAnswer();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, showResult]);

  const handleSubmitAnswer = () => {
    const answerIndex = parseInt(selectedAnswer);
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);

    if (answerIndex === sampleQuestions[currentQuestion].correct) {
      setScore(score + 1);
    }

    setShowResult(true);
    setIsActive(false);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer("");
      setShowResult(false);
      setTimeLeft(30);
      setIsActive(true);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer("");
    setShowResult(false);
    setScore(0);
    setTimeLeft(30);
    setIsActive(true);
    setAnswers([]);
    setQuizCompleted(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (quizCompleted) {
    const percentage = Math.round((score / sampleQuestions.length) * 100);
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Quiz Abgeschlossen!</CardTitle>
              <CardDescription>Hier sind deine Ergebnisse</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(percentage)}`}>
                  {score}/{sampleQuestions.length}
                </div>
                <p className="text-muted-foreground">Richtige Antworten</p>
                <div className={`text-2xl font-semibold ${getScoreColor(percentage)}`}>
                  {percentage}%
                </div>
              </div>

              <div className="space-y-4">
                <h3>Detaillierte Ergebnisse:</h3>
                {sampleQuestions.map((question, index) => (
                  <div key={question.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {answers[index] === question.correct ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">Frage {index + 1}</p>
                        <p className="text-sm text-muted-foreground">{question.topic}</p>
                      </div>
                    </div>
                    <Badge className={getDifficultyColor(question.difficulty)}>
                      {question.difficulty}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button onClick={resetQuiz} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Nochmals versuchen
                </Button>
                <Button variant="outline" onClick={onBack} className="flex-1">
                  Zurück zum Menü
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const question = sampleQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / sampleQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            ← Zurück
          </Button>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">A2 Level</Badge>
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
            <span>Frage {currentQuestion + 1} von {sampleQuestions.length}</span>
            <span>Punkte: {score}/{currentQuestion}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <Badge className={getDifficultyColor(question.difficulty)}>
                  {question.difficulty}
                </Badge>
                <Badge variant="outline">{question.topic}</Badge>
              </div>
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="mb-4">{question.question}</h2>
              
              <RadioGroup 
                value={selectedAnswer} 
                onValueChange={setSelectedAnswer}
                disabled={showResult}
              >
                {question.options.map((option, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                      showResult 
                        ? index === question.correct 
                          ? 'bg-green-50 border-green-200' 
                          : parseInt(selectedAnswer) === index && index !== question.correct
                            ? 'bg-red-50 border-red-200'
                            : ''
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                      {showResult && index === question.correct && (
                        <CheckCircle2 className="inline h-4 w-4 text-green-600 ml-2" />
                      )}
                      {showResult && parseInt(selectedAnswer) === index && index !== question.correct && (
                        <XCircle className="inline h-4 w-4 text-red-600 ml-2" />
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {showResult && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Erklärung:</h4>
                <p className="text-sm text-muted-foreground">{question.explanation}</p>
              </div>
            )}

            <div className="flex justify-end">
              {!showResult ? (
                <Button 
                  onClick={handleSubmitAnswer} 
                  disabled={!selectedAnswer}
                  className="min-w-32"
                >
                  Antworten
                </Button>
              ) : (
                <Button onClick={handleNextQuestion} className="min-w-32">
                  {currentQuestion < sampleQuestions.length - 1 ? (
                    <>
                      Weiter <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    'Quiz beenden'
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