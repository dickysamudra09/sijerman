"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  GraduationCap, 
  Plus, 
  Share2, 
  Eye, 
  CheckCircle2,
  Clock,
  BookOpen,
  Target,
  TrendingUp,
  UserPlus,
  Copy,
  Send
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  progress: number;
  lastActive: string;
  completedQuizzes: number;
  averageScore: number;
}

interface ClassRoom {
  id: string;
  name: string;
  code: string;
  description: string;
  students: Student[];
  createdAt: string;
}

interface TeacherStudentModeProps {
  onBack: () => void;
}

export function TeacherStudentMode({ onBack }: TeacherStudentModeProps) {
  const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);
  const [classrooms, setClassrooms] = useState<ClassRoom[]>([
    {
      id: "1",
      name: "Deutsch A2 - Anfänger",
      code: "DEU2024A",
      description: "Grundkurs für deutsche Sprache Level A2",
      createdAt: "2025-01-10",
      students: [
        {
          id: "1",
          name: "Anna Schmidt",
          email: "anna@example.com",
          progress: 75,
          lastActive: "2025-01-15",
          completedQuizzes: 8,
          averageScore: 85
        },
        {
          id: "2", 
          name: "Max Mueller",
          email: "max@example.com",
          progress: 60,
          lastActive: "2025-01-14",
          completedQuizzes: 6,
          averageScore: 72
        },
        {
          id: "3",
          name: "Lisa Weber",
          email: "lisa@example.com", 
          progress: 90,
          lastActive: "2025-01-15",
          completedQuizzes: 12,
          averageScore: 92
        }
      ]
    }
  ]);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const generateClassCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createNewClass = () => {
    if (!newClassName.trim()) return;
    
    const newClass: ClassRoom = {
      id: Date.now().toString(),
      name: newClassName,
      code: generateClassCode(),
      description: newClassDescription,
      students: [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    setClassrooms([...classrooms, newClass]);
    setNewClassName("");
    setNewClassDescription("");
  };

  const copyClassCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  const joinClass = () => {
    if (!joinCode.trim()) return;
    // In a real app, this would make an API call
    console.log("Joining class with code:", joinCode);
    setJoinCode("");
  };

  if (!userRole) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-6">
            ← Zurück
          </Button>
          
          <div className="text-center space-y-8">
            <div>
              <h1 className="mb-4">Lehrer & Schüler Modus</h1>
              <p className="text-muted-foreground">
                Wählen Sie Ihre Rolle aus, um loszulegen
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                onClick={() => setUserRole('teacher')}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <GraduationCap className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Ich bin Lehrer</CardTitle>
                  <CardDescription>
                    Erstellen Sie Klassen, teilen Sie Übungen und verfolgen Sie den Fortschritt Ihrer Schüler
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Klassen erstellen und verwalten</li>
                    <li>• Übungen und Quizze zuweisen</li>
                    <li>• Schülerfortschritt verfolgen</li>
                    <li>• Detaillierte Berichte</li>
                  </ul>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                onClick={() => setUserRole('student')}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-accent" />
                  </div>
                  <CardTitle>Ich bin Schüler</CardTitle>
                  <CardDescription>
                    Treten Sie Klassen bei, absolvieren Sie Übungen und verfolgen Sie Ihren eigenen Fortschritt
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Klassen mit Code beitreten</li>
                    <li>• Übungen absolvieren</li>
                    <li>• Fortschritt verfolgen</li>
                    <li>• Mit Mitschülern vergleichen</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userRole === 'teacher') {
    const selectedClassData = classrooms.find(c => c.id === selectedClass);

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
                <GraduationCap className="h-5 w-5 text-primary" />
                <h1>Lehrer Dashboard</h1>
              </div>
            </div>
            <Button variant="outline" onClick={() => setUserRole(null)}>
              Rolle wechseln
            </Button>
          </div>

          {selectedClass && selectedClassData ? (
            /* Class Detail View */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2>{selectedClassData.name}</h2>
                  <p className="text-muted-foreground">{selectedClassData.description}</p>
                </div>
                <Button variant="ghost" onClick={() => setSelectedClass(null)}>
                  ← Zurück zu Klassen
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{selectedClassData.students.length}</div>
                      <p className="text-sm text-muted-foreground">Schüler</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(selectedClassData.students.reduce((acc, s) => acc + s.averageScore, 0) / selectedClassData.students.length) || 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">Durchschnitt</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedClassData.code}</div>
                      <p className="text-sm text-muted-foreground">Klassencode</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedClassData.students.reduce((acc, s) => acc + s.completedQuizzes, 0)}
                      </div>
                      <p className="text-sm text-muted-foreground">Quizze gesamt</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Schülerfortschritt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedClassData.students.map((student) => (
                      <div key={student.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Avatar>
                          <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant={student.averageScore >= 80 ? "default" : student.averageScore >= 60 ? "secondary" : "destructive"}>
                                {student.averageScore}% Durchschnitt
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Fortschritt: {student.progress}%</span>
                              <span>{student.completedQuizzes} Quizze abgeschlossen</span>
                            </div>
                            <Progress value={student.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              Zuletzt aktiv: {new Date(student.lastActive).toLocaleDateString('de-DE')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Class Overview */
            <Tabs defaultValue="classes" className="w-full">
              <TabsList>
                <TabsTrigger value="classes">Meine Klassen</TabsTrigger>
                <TabsTrigger value="create">Neue Klasse</TabsTrigger>
              </TabsList>

              <TabsContent value="classes" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classrooms.map((classroom) => (
                    <Card key={classroom.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {classroom.name}
                          <Badge variant="outline">{classroom.students.length} Schüler</Badge>
                        </CardTitle>
                        <CardDescription>{classroom.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Klassencode:</span>
                            <div className="flex items-center gap-2">
                              <code className="bg-muted px-2 py-1 rounded text-sm">{classroom.code}</code>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => copyClassCode(classroom.code)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => setSelectedClass(classroom.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ansehen
                            </Button>
                            <Button size="sm" variant="outline">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="create" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Neue Klasse erstellen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block mb-2">Klassenname</label>
                      <Input
                        placeholder="z.B. Deutsch A2 - Fortgeschritten"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block mb-2">Beschreibung</label>
                      <Textarea
                        placeholder="Kurze Beschreibung der Klasse..."
                        value={newClassDescription}
                        onChange={(e) => setNewClassDescription(e.target.value)}
                      />
                    </div>
                    <Button onClick={createNewClass} disabled={!newClassName.trim()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Klasse erstellen
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    );
  }

  // Student View
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              ← Zurück
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              <h1>Schüler Dashboard</h1>
            </div>
          </div>
          <Button variant="outline" onClick={() => setUserRole(null)}>
            Rolle wechseln
          </Button>
        </div>

        {/* Join Class Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Klasse beitreten
            </CardTitle>
            <CardDescription>
              Geben Sie den Klassencode ein, den Sie von Ihrem Lehrer erhalten haben
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Klassencode eingeben..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1"
              />
              <Button onClick={joinClass} disabled={!joinCode.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Beitreten
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Student Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Meine Punkte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">856</div>
                <p className="text-sm text-muted-foreground">Gesamtpunkte</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Abgeschlossen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">12</div>
                <p className="text-sm text-muted-foreground">Quizze</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Durchschnitt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">78%</div>
                <p className="text-sm text-muted-foreground">Erfolgsrate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Letzte Aktivität
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: "Grammatik Quiz A2", score: 85, date: "Heute" },
                { title: "Wortschatz Übung", score: 92, date: "Gestern" },
                { title: "Hörverständnis Test", score: 76, date: "2 Tage her" }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                  <Badge variant={activity.score >= 80 ? "default" : "secondary"}>
                    {activity.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}