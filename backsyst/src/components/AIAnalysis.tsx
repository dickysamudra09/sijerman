"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Lightbulb, 
  Target, 
  TrendingUp, 
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Zap,
  MessageSquare,
  Send,
  Clock,
  User
} from "lucide-react";

interface AnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  grammar_errors: Array<{
    error: string;
    correction: string;
    explanation: string;
  }>;
  vocabulary_suggestions: Array<{
    word: string;
    better_alternatives: string[];
    usage_example: string;
  }>;
  next_steps: string[];
}

interface AIAnalysisProps {
  onBack: () => void;
}

export function AIAnalysis({ onBack }: AIAnalysisProps) {
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Mock AI analysis function
  const analyzeText = async (text: string): Promise<AnalysisResult> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      score: 78,
      strengths: [
        "Gute Verwendung von Präpositionen",
        "Vielfältige Satzstrukturen",
        "Korrekte Verwendung von Modalverben"
      ],
      weaknesses: [
        "Unregelmäßige Artikel-Deklination",
        "Schwierigkeiten bei der Wortstellung in Nebensätzen",
        "Begrenzte Verwendung von Konjunktionen"
      ],
      grammar_errors: [
        {
          error: "Ich gehe zu dem Schule",
          correction: "Ich gehe zur Schule",
          explanation: "Bei 'Schule' (feminin) mit Präposition 'zu' wird 'zu der' zu 'zur' kontrahiert."
        },
        {
          error: "Das Auto, das ich gesehen haben",
          correction: "Das Auto, das ich gesehen habe",
          explanation: "In Nebensätzen mit Perfekt steht das Hilfsverb am Ende: 'gesehen habe'."
        }
      ],
      vocabulary_suggestions: [
        {
          word: "gut",
          better_alternatives: ["ausgezeichnet", "hervorragend", "fantastisch"],
          usage_example: "Das Essen war ausgezeichnet! (statt: Das Essen war gut!)"
        },
        {
          word: "machen",
          better_alternatives: ["erstellen", "durchführen", "verwirklichen"],
          usage_example: "Ich erstelle ein Projekt. (statt: Ich mache ein Projekt.)"
        }
      ],
      next_steps: [
        "Üben Sie Artikel-Deklinationen mit Online-Übungen",
        "Lesen Sie deutsche Texte und achten Sie auf Satzstellung",
        "Verwenden Sie ein Deutsch-Wörterbuch für Synonyme",
        "Praktizieren Sie Nebensätze mit 'dass', 'weil', 'wenn'"
      ]
    };
  };

  const handleAnalysis = async () => {
    if (!inputText.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeText(inputText);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            ← Zurück
          </Button>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h1>KI-Sprachanalyse</h1>
          </div>
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Text zur Analyse eingeben
            </CardTitle>
            <CardDescription>
              Schreiben Sie einen deutschen Text (mindestens 50 Wörter) für eine detaillierte KI-Analyse
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Schreiben Sie hier Ihren deutschen Text... 

Beispiel: Gestern bin ich mit meinen Freunden in die Stadt gegangen. Wir haben einen schönen Tag verbracht und viele interessante Dinge gesehen. Am Ende sind wir in einem Restaurant essen gegangen, wo das Essen sehr lecker war."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-32"
              disabled={isAnalyzing}
            />
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {inputText.split(' ').filter(word => word.length > 0).length} Wörter
              </div>
              <Button 
                onClick={handleAnalysis}
                disabled={inputText.trim().length < 50 || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analysiere...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Text analysieren
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-6">
            {/* Score Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Gesamtbewertung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${getScoreBgColor(analysisResult.score)}`}>
                    <span className={`text-2xl font-bold ${getScoreColor(analysisResult.score)}`}>
                      {analysisResult.score}
                    </span>
                  </div>
                  <div className="flex-1">
                    <Progress value={analysisResult.score} className="h-3 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {analysisResult.score >= 80 ? 'Ausgezeichnet! Ihr Deutsch ist sehr gut.' :
                       analysisResult.score >= 60 ? 'Gut! Es gibt noch Raum für Verbesserungen.' :
                       'Sie machen Fortschritte. Weiter so!'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analysis */}
            <Tabs defaultValue="strengths" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="strengths">Stärken</TabsTrigger>
                <TabsTrigger value="grammar">Grammatik</TabsTrigger>
                <TabsTrigger value="vocabulary">Wortschatz</TabsTrigger>
                <TabsTrigger value="recommendations">Empfehlungen</TabsTrigger>
              </TabsList>

              <TabsContent value="strengths" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        Stärken
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisResult.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-600">
                        <AlertCircle className="h-5 w-5" />
                        Verbesserungsbereiche
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisResult.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="grammar" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Grammatik-Korrekturen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysisResult.grammar_errors.map((error, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-red-600 mb-1">Fehler:</p>
                              <p className="text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded border-l-4 border-red-400">
                                {error.error}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-green-600 mb-1">Korrektur:</p>
                              <p className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded border-l-4 border-green-400">
                                {error.correction}
                              </p>
                            </div>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Erklärung:</p>
                            <p className="text-sm text-blue-700 dark:text-blue-200">{error.explanation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="vocabulary" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Wortschatz-Verbesserungen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysisResult.vocabulary_suggestions.map((suggestion, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-3">
                          <div>
                            <Badge variant="outline" className="mb-2">{suggestion.word}</Badge>
                            <p className="text-sm text-muted-foreground">
                              Versuchen Sie stattdessen:
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {suggestion.better_alternatives.map((alt, altIndex) => (
                                <Badge key={altIndex} variant="secondary">
                                  {alt}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="bg-accent/10 p-3 rounded">
                            <p className="text-sm font-medium mb-1">Beispiel:</p>
                            <p className="text-sm text-muted-foreground">{suggestion.usage_example}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Empfohlene nächste Schritte
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResult.next_steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {index + 1}
                          </div>
                          <p className="text-sm">{step}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button className="flex-1">
                <Zap className="h-4 w-4 mr-2" />
                Personalisierte Übungen starten
              </Button>
              <Button variant="outline" onClick={() => {
                setInputText("");
                setAnalysisResult(null);
              }}>
                Neue Analyse
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}