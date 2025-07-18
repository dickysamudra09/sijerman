"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Award,
  BookOpen,
  Clock,
  Brain,
  Zap,
  Star,
  CheckCircle2,
  AlertTriangle,
  Lightbulb
} from "lucide-react";

// Sample data
const dailyProgress = [
  { date: "Mo", quizzes: 3, score: 85, time: 45 },
  { date: "Di", quizzes: 2, score: 78, time: 30 },
  { date: "Mi", quizzes: 4, score: 92, time: 60 },
  { date: "Do", quizzes: 1, score: 65, time: 15 },
  { date: "Fr", quizzes: 3, score: 88, time: 50 },
  { date: "Sa", quizzes: 5, score: 94, time: 75 },
  { date: "So", quizzes: 2, score: 76, time: 25 }
];

const weeklyProgress = [
  { week: "KW 1", quizzes: 15, avgScore: 82, totalTime: 320 },
  { week: "KW 2", quizzes: 18, avgScore: 86, totalTime: 380 },
  { week: "KW 3", quizzes: 12, avgScore: 79, totalTime: 280 },
  { week: "KW 4", quizzes: 21, avgScore: 91, totalTime: 420 }
];

const topicMastery = [
  { topic: "Grammatik", mastery: 85, total: 120, completed: 102 },
  { topic: "Wortschatz", mastery: 92, total: 80, completed: 74 },
  { topic: "Hörverständnis", mastery: 78, total: 60, completed: 47 },
  { topic: "Leseverständnis", mastery: 88, total: 90, completed: 79 },
  { topic: "Schreiben", mastery: 71, total: 50, completed: 36 }
];

const skillsRadar = [
  { skill: "Grammatik", current: 85, target: 90 },
  { skill: "Wortschatz", current: 92, target: 95 },
  { skill: "Hören", current: 78, target: 85 },
  { skill: "Lesen", current: 88, target: 90 },
  { skill: "Schreiben", current: 71, target: 80 },
  { skill: "Sprechen", current: 75, target: 85 }
];

const pieChartData = [
  { name: "Korrekt", value: 156, color: "#22c55e" },
  { name: "Falsch", value: 44, color: "#ef4444" },
  { name: "Übersprungen", value: 12, color: "#6b7280" }
];

interface StatsTrackingProps {
  onBack: () => void;
}

export function StatsTracking({ onBack }: StatsTrackingProps) {
  const [timeframe, setTimeframe] = useState("week");
  const [selectedTopic, setSelectedTopic] = useState("all");

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />;
    return <TrendingUp className="h-4 w-4 text-red-600 transform rotate-180" />;
  };

  const getMasteryColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-blue-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getMasteryBgColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-100";
    if (percentage >= 75) return "bg-blue-100";
    if (percentage >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              ← Zurück
            </Button>
            <div className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-primary" />
              <h1>Lernstatistiken & Fortschritt</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Diese Woche</SelectItem>
                <SelectItem value="month">Dieser Monat</SelectItem>
                <SelectItem value="year">Dieses Jahr</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamtpunkte</p>
                  <p className="text-2xl font-bold">2,847</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(2847, 2680)}
                    <span className="text-sm text-green-600">+167</span>
                  </div>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Abgeschlossen</p>
                  <p className="text-2xl font-bold">156</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(156, 142)}
                    <span className="text-sm text-green-600">+14</span>
                  </div>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Durchschnitt</p>
                  <p className="text-2xl font-bold">84%</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(84, 79)}
                    <span className="text-sm text-green-600">+5%</span>
                  </div>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lernzeit</p>
                  <p className="text-2xl font-bold">24h</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(24, 21)}
                    <span className="text-sm text-green-600">+3h</span>
                  </div>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="progress">Fortschritt</TabsTrigger>
            <TabsTrigger value="topics">Themen</TabsTrigger>
            <TabsTrigger value="skills">Fähigkeiten</TabsTrigger>
            <TabsTrigger value="recommendations">Empfehlungen</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Progress Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Täglicher Fortschritt
                  </CardTitle>
                  <CardDescription>Quizze und Punktzahl der letzten 7 Tage</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="quizzes" fill="#2F3E75" name="Quizze" />
                      <Bar dataKey="score" fill="#38BDF8" name="Durchschnitt %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Weekly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Wöchentlicher Trend
                  </CardTitle>
                  <CardDescription>Entwicklung über die letzten 4 Wochen</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="avgScore" 
                        stroke="#2F3E75" 
                        strokeWidth={3}
                        name="Durchschnitt %"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="quizzes" 
                        stroke="#38BDF8" 
                        strokeWidth={2}
                        name="Quizze"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Answer Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Antwort-Verteilung
                </CardTitle>
                <CardDescription>Übersicht über alle Antworten</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width={400} height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  {pieChartData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Themen-Beherrschung
                </CardTitle>
                <CardDescription>Ihr Fortschritt in verschiedenen Bereichen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {topicMastery.map((topic, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{topic.topic}</h4>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`${getMasteryBgColor(topic.mastery)} ${getMasteryColor(topic.mastery)} border-0`}
                          >
                            {topic.mastery}%
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {topic.completed}/{topic.total}
                          </span>
                        </div>
                      </div>
                      <Progress value={topic.mastery} className="h-3" />
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-green-600">{topic.completed}</div>
                          <div className="text-muted-foreground">Abgeschlossen</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-blue-600">{topic.total - topic.completed}</div>
                          <div className="text-muted-foreground">Verbleibend</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-purple-600">{topic.total}</div>
                          <div className="text-muted-foreground">Gesamt</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Fähigkeiten-Radar
                </CardTitle>
                <CardDescription>Ihr aktueller Stand vs. Zielwerte</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={skillsRadar}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Aktuell"
                      dataKey="current"
                      stroke="#2F3E75"
                      fill="#2F3E75"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Ziel"
                      dataKey="target"
                      stroke="#38BDF8"
                      fill="#38BDF8"
                      fillOpacity={0.1}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary rounded-full opacity-60" />
                    <span className="text-sm">Aktueller Stand</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-accent rounded-full opacity-60" />
                    <span className="text-sm">Zielwert</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <Award className="h-5 w-5" />
                    Ihre Stärken
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Wortschatz</p>
                        <p className="text-sm text-muted-foreground">92% Beherrschung - Exzellent!</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Leseverständnis</p>
                        <p className="text-sm text-muted-foreground">88% Beherrschung - Sehr gut!</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Grammatik</p>
                        <p className="text-sm text-muted-foreground">85% Beherrschung - Solide Basis!</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Areas for Improvement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="h-5 w-5" />
                    Verbesserungsbereiche
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Schreibfähigkeiten</p>
                        <p className="text-sm text-muted-foreground">71% - Mehr Übung nötig</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Hörverständnis</p>
                        <p className="text-sm text-muted-foreground">78% - Ausbaufähig</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Personalized Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Personalisierte Empfehlungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-primary bg-primary/5">
                    <h4 className="font-medium mb-2">📝 Schreibübungen intensivieren</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Ihre Schreibfähigkeiten liegen bei 71%. Empfohlene tägliche Übungszeit: 15 Minuten
                    </p>
                    <Button size="sm">
                      <Zap className="h-4 w-4 mr-2" />
                      Schreibübungen starten
                    </Button>
                  </div>
                  
                  <div className="p-4 border-l-4 border-accent bg-accent/5">
                    <h4 className="font-medium mb-2">🎧 Hörverständnis verbessern</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Mit 78% haben Sie eine gute Basis. Deutsche Podcasts oder Audiobooks können helfen.
                    </p>
                    <Button size="sm" variant="secondary">
                      Audio-Übungen finden
                    </Button>
                  </div>

                  <div className="p-4 border-l-4 border-secondary bg-secondary/5">
                    <h4 className="font-medium mb-2">🎯 Konsistenz beibehalten</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Sie lernen durchschnittlich 3.4 Stunden pro Woche. Versuchen Sie täglich 30 Minuten zu lernen.
                    </p>
                    <Button size="sm" variant="outline">
                      Lernplan erstellen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}