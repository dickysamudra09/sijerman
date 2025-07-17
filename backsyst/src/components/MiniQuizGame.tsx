"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Zap, 
  Trophy, 
  Clock, 
  Users, 
  Play,
  Crown,
  Medal,
  Target,
  Gamepad2,
  Timer,
  Star
} from "lucide-react";

interface Player {
  id: string;
  name: string;
  score: number;
  streak: number;
  avatar: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  timeLimit: number;
}

const sampleQuestions: QuizQuestion[] = [
  {
    id: "1",
    question: "Wie sagt man 'Hello' auf Deutsch?",
    options: ["Hallo", "Tschüss", "Danke", "Bitte"],
    correct: 0,
    timeLimit: 10
  },
  {
    id: "2", 
    question: "Der Artikel von 'Haus' ist:",
    options: ["der", "die", "das", "den"],
    correct: 2,
    timeLimit: 15
  },
  {
    id: "3",
    question: "Was ist das Gegenteil von 'groß'?",
    options: ["schnell", "klein", "alt", "neu"],
    correct: 1,
    timeLimit: 10
  },
  {
    id: "4",
    question: "Welche Farbe hat die deutsche Flagge NICHT?",
    options: ["Schwarz", "Rot", "Gold", "Blau"],
    correct: 3,
    timeLimit: 12
  },
  {
    id: "5",
    question: "'Ich ___ aus Deutschland' - Welches Verb passt?",
    options: ["bin", "komme", "gehe", "haben"],
    correct: 1,
    timeLimit: 15
  }
];

interface MiniQuizGameProps {
  onBack: () => void;
}

export function MiniQuizGame({ onBack }: MiniQuizGameProps) {
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'question' | 'results' | 'final'>('lobby');
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "Alex M.", score: 0, streak: 0, avatar: "AM" },
    { id: "2", name: "Sarah K.", score: 0, streak: 0, avatar: "SK" },
    { id: "3", name: "Tom B.", score: 0, streak: 0, avatar: "TB" },
    { id: "4", name: "Lisa W.", score: 0, streak: 0, avatar: "LW" }
  ]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [playerAnswers, setPlayerAnswers] = useState<{[key: string]: number}>({});
  const [gameCode] = useState("QUIZ" + Math.random().toString(36).substring(2, 6).toUpperCase());

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (gameState === 'question' && timeLeft > 0 && !showAnswer) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'question') {
      handleTimeUp();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState, timeLeft, showAnswer]);

  const startGame = () => {
    setGameState('playing');
    setCurrentQuestion(0);
    setPlayers(players.map(p => ({ ...p, score: 0, streak: 0 })));
    startQuestion();
  };

  const startQuestion = () => {
    const question = sampleQuestions[currentQuestion];
    setTimeLeft(question.timeLimit);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setPlayerAnswers({});
    setGameState('question');
    
    // Simulate other players answering
    setTimeout(() => {
      simulatePlayerAnswers();
    }, Math.random() * 5000 + 2000);
  };

  const simulatePlayerAnswers = () => {
    const answers: {[key: string]: number} = {};
    players.forEach(player => {
      if (player.id !== "1") { // Assuming player 1 is the current user
        answers[player.id] = Math.floor(Math.random() * 4);
      }
    });
    setPlayerAnswers(answers);
  };

  const handleAnswer = (answerIndex: number) => {
    if (showAnswer) return;
    setSelectedAnswer(answerIndex);
    setPlayerAnswers({...playerAnswers, "1": answerIndex});
  };

  const handleTimeUp = () => {
    if (!showAnswer) {
      setShowAnswer(true);
      calculateScores();
      setTimeout(() => {
        nextQuestion();
      }, 3000);
    }
  };

  const calculateScores = () => {
    const question = sampleQuestions[currentQuestion];
    const newPlayers = players.map(player => {
      const answer = playerAnswers[player.id];
      const isCorrect = answer === question.correct;
      const timeBonus = Math.max(0, timeLeft * 10);
      const basePoints = isCorrect ? 1000 : 0;
      const streakBonus = isCorrect ? player.streak * 100 : 0;
      const points = basePoints + timeBonus + streakBonus;

      return {
        ...player,
        score: player.score + points,
        streak: isCorrect ? player.streak + 1 : 0
      };
    });
    setPlayers(newPlayers);
  };

  const nextQuestion = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      startQuestion();
    } else {
      setGameState('final');
    }
  };

  const resetGame = () => {
    setGameState('lobby');
    setCurrentQuestion(0);
    setPlayers(players.map(p => ({ ...p, score: 0, streak: 0 })));
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Lobby View
  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack}>
              ← Zurück
            </Button>
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              <h1>Live Quiz Arena</h1>
            </div>
          </div>

          <div className="text-center space-y-6">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Quiz bereit zum Start!</CardTitle>
                <CardDescription>Spieler warten auf den Beginn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-2xl font-bold text-primary">{gameCode}</div>
                  <p className="text-sm text-muted-foreground">
                    Teilen Sie diesen Code mit anderen Spielern
                  </p>
                  <Badge variant="secondary">
                    {sampleQuestions.length} Fragen • {players.length} Spieler
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {players.map((player, index) => (
                <Card key={player.id}>
                  <CardContent className="p-4 text-center">
                    <Avatar className="mx-auto mb-2">
                      <AvatarFallback>{player.avatar}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{player.name}</p>
                    <Badge variant="outline" className="mt-1">Bereit</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button size="lg" onClick={startGame} className="min-w-48">
              <Play className="h-5 w-5 mr-2" />
              Quiz starten
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Question View
  if (gameState === 'question') {
    const question = sampleQuestions[currentQuestion];
    const answeredCount = Object.keys(playerAnswers).length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                Frage {currentQuestion + 1}/{sampleQuestions.length}
              </Badge>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{answeredCount}/{players.length} geantwortet</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              <span className={`text-2xl font-mono ${timeLeft <= 5 ? 'text-red-600' : ''}`}>
                {timeLeft}
              </span>
            </div>
          </div>

          {/* Progress */}
          <Progress value={(timeLeft / question.timeLimit) * 100} className="h-3" />

          {/* Question */}
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl">{question.question}</CardTitle>
            </CardHeader>
          </Card>

          {/* Answer Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.options.map((option, index) => {
              const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];
              const isSelected = selectedAnswer === index;
              const isCorrect = showAnswer && index === question.correct;
              const isWrong = showAnswer && selectedAnswer === index && index !== question.correct;
              
              return (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-20 text-lg font-medium transition-all ${
                    isSelected ? 'ring-4 ring-primary' : ''
                  } ${isCorrect ? 'bg-green-100 border-green-400' : ''} ${
                    isWrong ? 'bg-red-100 border-red-400' : ''
                  }`}
                  onClick={() => handleAnswer(index)}
                  disabled={showAnswer}
                >
                  <div className={`w-8 h-8 rounded-full ${colors[index]} text-white flex items-center justify-center mr-3 text-base font-bold`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  {option}
                </Button>
              );
            })}
          </div>

          {/* Live Player Status */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">{player.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{player.name}</p>
                      <div className="flex items-center gap-1">
                        {playerAnswers[player.id] !== undefined ? (
                          <Badge variant="secondary" className="text-xs">Geantwortet</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Wartet...</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Final Results View
  if (gameState === 'final') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
              <Trophy className="h-10 w-10 text-yellow-600" />
            </div>
            <h1>Quiz beendet!</h1>
            <p className="text-muted-foreground">Hier sind die Endergebnisse</p>
          </div>

          {/* Podium */}
          <div className="flex justify-center items-end gap-4 mb-8">
            {sortedPlayers.slice(0, 3).map((player, index) => (
              <div key={player.id} className="text-center">
                <div className={`w-20 h-${24 - index * 4} ${
                  index === 0 ? 'bg-yellow-200' : 
                  index === 1 ? 'bg-gray-200' : 'bg-orange-200'
                } rounded-t-lg flex items-end justify-center pb-4`}>
                  <div className="text-center">
                    <Avatar className="mx-auto mb-2">
                      <AvatarFallback>{player.avatar}</AvatarFallback>
                    </Avatar>
                    {index === 0 && <Crown className="h-6 w-6 text-yellow-600 mx-auto" />}
                    {index === 1 && <Medal className="h-6 w-6 text-gray-600 mx-auto" />}
                    {index === 2 && <Medal className="h-6 w-6 text-orange-600 mx-auto" />}
                  </div>
                </div>
                <div className="mt-2">
                  <p className="font-medium">{player.name}</p>
                  <p className="text-sm text-muted-foreground">{player.score.toLocaleString()} Punkte</p>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Detaillierte Ergebnisse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedPlayers.map((player, index) => (
                  <div key={player.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <Avatar>
                        <AvatarFallback>{player.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-muted-foreground">
                            Max Streak: {player.streak}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xl font-bold">{player.score.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Punkte</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4">
            <Button onClick={resetGame} size="lg">
              Nochmal spielen
            </Button>
            <Button variant="outline" size="lg" onClick={onBack}>
              Zurück zum Menü
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}