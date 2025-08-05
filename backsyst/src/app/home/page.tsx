"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
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
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  email: string;
  progress: number;
  last_active: string;
  completed_quizzes: number;
  average_score: number;
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
  const [userRole, setUserRole] = useState<"teacher" | "student" | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [classrooms, setClassrooms] = useState<ClassRoom[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      console.log("Fetching user data...");

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("Session response:", { sessionData, error: sessionError });

      if (sessionError || !sessionData.session?.user) {
        setError("No session found. Please log in.");
        setIsLoading(false);
        router.push("/login");
        return;
      }

      const userId = sessionData.session.user.id;
      setUserId(userId);

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("name, role")
        .eq("id", userId)
        .single();
      console.log("User data response:", { userData, error: userError });

      if (userError) {
        setError("Error fetching user data: " + userError.message);
        setIsLoading(false);
        return;
      }

      if (userData) {
        setUserRole(userData.role);
        setUserName(userData.name);
      }

      setIsLoading(false);
    };

    fetchUserData();
  }, [router]);

  const handleLogout = async () => {
    console.log("Attempting logout...");
    const { error } = await supabase.auth.signOut();
    console.log("Logout response:", { error });

    if (error) {
      setError("Error logging out: " + error.message);
      return;
    }
    setUserRole(null);
    setUserName("");
    setUserId(null);
    router.push("/");
  };

  const fetchClassrooms = async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    console.log("Fetching classrooms...");

    const { data, error } = await supabase
      .from("classrooms")
      .select("id, name, code, description, created_at")
      .eq("teacher_id", userId);

    console.log("Classrooms response:", { data, error });

    if (error) {
      setError("Error fetching classrooms: " + error.message);
      setIsLoading(false);
      return;
    }

    if (data) {
      const classroomsWithStudents = await Promise.all(
        data.map(async (classroom) => {
          const { data: students, error: studentsError } = await supabase
            .from("students")
            .select("id, name, email, progress, last_active, completed_quizzes, average_score")
            .eq("classroom_id", classroom.id);

          if (studentsError) {
            console.error("Error fetching students:", studentsError);
            setError("Error fetching students: " + studentsError.message);
            return {
              id: classroom.id,
              name: classroom.name,
              code: classroom.code,
              description: classroom.description || "",
              students: [],
              createdAt: classroom.created_at,
            } as ClassRoom;
          }

          const mappedStudents: Student[] = students.map((student) => ({
            id: student.id,
            name: student.name,
            email: student.email,
            progress: student.progress,
            last_active: student.last_active,
            completed_quizzes: student.completed_quizzes,
            average_score: student.average_score,
          }));

          return {
            id: classroom.id,
            name: classroom.name,
            code: classroom.code,
            description: classroom.description || "",
            students: mappedStudents,
            createdAt: classroom.created_at,
          } as ClassRoom;
        })
      );
      setClassrooms(classroomsWithStudents);
    }
    setIsLoading(false);
  };

  const generateClassCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setJoinCode(code);
    return code;
  };

  const createNewClass = async () => {
    if (!userId || !newClassName.trim()) return;
    setIsLoading(true);
    setError(null);

    const code = generateClassCode();
    const { error } = await supabase.from("classrooms").insert({
      id: crypto.randomUUID(),
      name: newClassName,
      code,
      description: newClassDescription || "",
      teacher_id: userId,
      created_at: new Date().toISOString(),
    });

    if (error) {
      setError("Error creating class: " + error.message);
    } else {
      setNewClassName("");
      setNewClassDescription("");
      setIsModalOpen(false);
      toast.success("Kelas berhasil dibuat!");
      window.location.reload(); // Reload penuh sebagai fallback
    }
    setIsLoading(false);
  };

  const copyClassCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("✅ Kode berhasil disalin!");
    } catch (err) {
      toast.error("❌ Gagal menyalin kode.");
    }
  };

  const joinClass = async () => {
    if (!userId || !joinCode.trim()) return;
    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("classrooms")
      .select("id, teacher_id")
      .eq("code", joinCode)
      .single();

    if (error || !data) {
      setError("Invalid or expired class code.");
    } else if (data.teacher_id === userId) {
      setError("You cannot join your own class.");
    } else {
      const { error: joinError } = await supabase.from("students").insert({
        id: crypto.randomUUID(),
        user_id: userId,
        classroom_id: data.id,
        name: userName,
        email: (await supabase.auth.getUser()).data.user?.email || "",
        progress: 0,
        last_active: new Date().toISOString(),
        completed_quizzes: 0,
        average_score: 0,
      });
      if (joinError) {
        setError("Error joining class: " + joinError.message);
      } else {
        setJoinCode("");
        fetchClassrooms();
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (userRole === "teacher" && userId) {
      fetchClassrooms();
    }
  }, [userRole, userId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button onClick={() => router.push("/login")} className="mt-4">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const createOrUpdateUserProfile = async (name: string, role: "teacher" | "student") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("No authenticated user found.");
      return;
    }

    const { error } = await supabase.from("users").upsert(
      {
        id: user.id,
        name,
        email: user.email || "",
        role,
      },
      { onConflict: "id" } // Mencegah duplikat berdasarkan id
    );

    if (error) {
      console.error("Error creating/updating profile:", error.message);
    } else {
      console.log("Profile created/updated successfully.");
    }
  };

  // Panggil fungsi ini setelah login berhasil, misalnya:
  // useEffect(() => {
  //   if (userId) {
  //     createOrUpdateUserProfile("Nama Pengguna", "teacher"); // Ganti dengan input dinamis jika perlu
  //   }
  // }, [userId]);

  if (userRole === "teacher") {
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
                <h1>Lehrer Dashboard - Selamat Datang, {userName}</h1>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
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
                        {Math.round(selectedClassData.students.reduce((acc, s) => acc + s.average_score, 0) / selectedClassData.students.length) || 0}%
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
                        {selectedClassData.students.reduce((acc, s) => acc + s.completed_quizzes, 0)}
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
                              <Badge variant={student.average_score >= 80 ? "default" : student.average_score >= 60 ? "secondary" : "destructive"}>
                                {student.average_score}% Durchschnitt
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Fortschritt: {student.progress}%</span>
                              <span>{student.completed_quizzes} Quizze abgeschlossen</span>
                            </div>
                            <Progress value={student.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              Zuletzt aktiv: {new Date(student.last_active).toLocaleDateString('de-DE')}
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
                    <Button onClick={() => setIsModalOpen(true)} disabled={!newClassName.trim()} className="bg-blue-600 text-white hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Klasse erstellen
                    </Button>
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>New Classroom</DialogTitle>
                          <DialogDescription>
                            Tambahkan kelas baru untuk memulai sesi belajar Anda
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Nama Kelas"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                          />
                          <Textarea
                            placeholder="Deskripsi Kelas (Opsional)"
                            value={newClassDescription}
                            onChange={(e) => setNewClassDescription(e.target.value)}
                          />
                          <Button onClick={createNewClass} disabled={isLoading} className="bg-blue-600 text-white hover:bg-blue-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Kelas
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
              <h1>Schüler Dashboard - Selamat Datang, {userName}</h1>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
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
              <Button onClick={joinClass} disabled={!joinCode.trim() || isLoading}>
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

export default function HomePage() {
  return <TeacherStudentMode onBack={() => {}} />;
}