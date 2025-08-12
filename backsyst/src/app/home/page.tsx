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
  teacherName?: string;
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
  const [isJoinConfirmOpen, setIsJoinConfirmOpen] = useState(false);
  const [selectedClassToJoin, setSelectedClassToJoin] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      console.log("Mengambil data pengguna...");

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("Respons sesi:", { sessionData, error: sessionError });

      if (sessionError || !sessionData.session?.user) {
        setError("Tidak ada sesi ditemukan. Silakan masuk.");
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
      console.log("Respons data pengguna:", { userData, error: userError });

      if (userError) {
        setError("Gagal mengambil data pengguna: " + userError.message);
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
    console.log("Mencoba keluar...");
    const { error } = await supabase.auth.signOut();
    console.log("Respons keluar:", { error });

    if (error) {
      setError("Gagal keluar: " + error.message);
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
    console.log("Mengambil kelas untuk pengguna:", userId, "Peran:", userRole);

    if (userRole === "teacher") {
      const { data, error } = await supabase
        .from("classrooms")
        .select("id, name, code, description, created_at")
        .eq("teacher_id", userId);

      console.log("Respons kelas guru:", { data, error });

      if (error) {
        setError("Gagal mengambil kelas: " + error.message);
        setIsLoading(false);
        return;
      }

      if (data) {
        const classroomsWithStudents = await Promise.all(
          data.map(async (classroom) => {
            const { data: registrations, error: regError } = await supabase
              .from("classroom_registrations")
              .select("student_id")
              .eq("classroom_id", classroom.id);

            if (regError) {
              console.error("Gagal mengambil registrasi:", regError.message);
              setError("Gagal mengambil registrasi: " + regError.message);
              return {
                id: classroom.id,
                name: classroom.name,
                code: classroom.code,
                description: classroom.description || "",
                students: [],
                createdAt: classroom.created_at,
              } as ClassRoom;
            }

            const studentIds = registrations.map(reg => reg.student_id);
            let students: Student[] = [];
            if (studentIds.length > 0) {
              const { data: studentData, error: studentError } = await supabase
                .from("users")
                .select("id, name, email")
                .in("id", studentIds);

              if (studentError) {
                console.error("Gagal mengambil data siswa:", studentError.message);
                setError("Gagal mengambil data siswa: " + studentError.message);
              } else {
                students = studentData.map(student => ({
                  id: student.id,
                  name: student.name,
                  email: student.email,
                  progress: 0,
                  last_active: new Date().toISOString(),
                  completed_quizzes: 0,
                  average_score: 0,
                }));
              }
            }

            return {
              id: classroom.id,
              name: classroom.name,
              code: classroom.code,
              description: classroom.description || "",
              students,
              createdAt: classroom.created_at,
            } as ClassRoom;
          })
        );
        setClassrooms(classroomsWithStudents);
        console.log("Kelas guru yang di-set:", classroomsWithStudents);
      }
    } else if (userRole === "student") {
      const { data: registrations, error: regError } = await supabase
        .from("classroom_registrations")
        .select("classroom_id, joined_at")
        .eq("student_id", userId);

      console.log("Respons registrasi siswa:", { registrations, error: regError });

      if (regError) {
        console.error("Gagal mengambil registrasi siswa:", regError.message);
        setError("Gagal mengambil kelas yang diikuti: " + regError.message);
        setClassrooms([]);
        setIsLoading(false);
        return;
      }

      if (!registrations || registrations.length === 0) {
        console.log("Tidak ada kelas yang diikuti oleh siswa.");
        setClassrooms([]);
        setIsLoading(false);
        return;
      }

      const classroomIds = registrations.map(reg => reg.classroom_id);
      console.log("ID kelas yang diikuti:", classroomIds);

      const { data: classroomData, error: classError } = await supabase
        .from("classrooms")
        .select("id, name, code, description, created_at, teacher_id")
        .in("id", classroomIds);

      console.log("Respons data kelas siswa:", { classroomData, error: classError });

      if (classError) {
        console.error("Gagal mengambil detail kelas:", classError.message);
        setError("Gagal mengambil detail kelas: " + classError.message);
        setClassrooms([]);
        setIsLoading(false);
        return;
      }

      if (!classroomData || classroomData.length === 0) {
        console.log("Tidak ada data kelas yang ditemukan untuk ID:", classroomIds);
        setClassrooms([]);
        setIsLoading(false);
        return;
      }

      const classroomsWithTeacher = await Promise.all(
        classroomData.map(async (classroom) => {
          let teacherName = "Guru Tidak Dikenal";
          try {
            const { data: teacherData, error: teacherError } = await supabase
              .from("users")
              .select("name")
              .eq("id", classroom.teacher_id)
              .single();

            console.log("Respons data guru untuk kelas", classroom.id, ":", { teacherData, error: teacherError });

            if (!teacherError && teacherData) {
              teacherName = teacherData.name || "Guru Tidak Dikenal";
            }
          } catch (err) {
            console.warn("Kesalahan saat mengambil data guru untuk kelas", classroom.id, ":", err);
          }

          return {
            id: classroom.id,
            name: classroom.name,
            code: classroom.code,
            description: classroom.description || "Tidak ada deskripsi",
            students: [],
            createdAt: classroom.created_at,
            teacherName,
          } as ClassRoom;
        })
      );
      setClassrooms(classroomsWithTeacher);
      console.log("Kelas siswa yang di-set:", classroomsWithTeacher);
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
      setError("Gagal membuat kelas: " + error.message);
    } else {
      setNewClassName("");
      setNewClassDescription("");
      setIsModalOpen(false);
      toast.success("Kelas berhasil dibuat!");
      await fetchClassrooms();
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

    console.log("Mencoba bergabung dengan kode kelas:", joinCode.trim());

    const { data, error } = await supabase
      .from("classrooms")
      .select("id, name, description, created_at, teacher_id")
      .eq("code", joinCode.trim())
      .single();

    console.log("Respons query kelas:", { data, error });

    if (error || !data) {
      setError("Kode kelas tidak valid atau telah kedaluwarsa. Pastikan kode benar dan coba lagi.");
      setIsLoading(false);
      return;
    }

    let teacherName = "Guru Tidak Dikenal";
    try {
      const { data: teacherData, error: teacherError } = await supabase
        .from("users")
        .select("name")
        .eq("id", data.teacher_id)
        .single();

      console.log("Respons query guru:", { teacherData, error: teacherError });

      if (teacherError) {
        console.warn("Gagal mengambil data guru:", teacherError.message || "Tidak ada pesan error");
      } else if (teacherData) {
        teacherName = teacherData.name || "Guru Tidak Dikenal";
      }
    } catch (err) {
      console.warn("Kesalahan tak terduga saat mengambil data guru:", err);
    }

    setSelectedClassToJoin({
      id: data.id,
      name: data.name,
      description: data.description || "Tidak ada deskripsi",
      createdAt: data.created_at,
      teacherName,
    });
    setIsJoinConfirmOpen(true);
    setIsLoading(false);
  };

  const confirmJoinClass = async () => {
    if (!userId || !selectedClassToJoin) return;
    setIsLoading(true);
    setError(null);

    console.log("Mengkonfirmasi bergabung ke kelas:", selectedClassToJoin);

    const { data, error: fetchError } = await supabase
      .from("classrooms")
      .select("id, teacher_id")
      .eq("id", selectedClassToJoin.id)
      .single();

    console.log("Respons verifikasi kelas:", { data, error: fetchError });

    if (fetchError || !data) {
      setError("Kelas tidak ditemukan.");
      setIsLoading(false);
      setIsJoinConfirmOpen(false);
      return;
    }

    if (data.teacher_id === userId) {
      setError("Anda tidak bisa bergabung dengan kelas Anda sendiri.");
      setIsLoading(false);
      setIsJoinConfirmOpen(false);
      return;
    }

    const { data: existingRegistration, error: checkError } = await supabase
      .from("classroom_registrations")
      .select("id")
      .eq("classroom_id", selectedClassToJoin.id)
      .eq("student_id", userId)
      .single();

    console.log("Pemeriksaan registrasi yang ada:", { existingRegistration, error: checkError });

    if (existingRegistration) {
      setError("Anda sudah terdaftar di kelas ini.");
      setIsLoading(false);
      setIsJoinConfirmOpen(false);
      return;
    }

    const { error: joinError } = await supabase.from("classroom_registrations").insert({
      id: crypto.randomUUID(),
      classroom_id: selectedClassToJoin.id,
      student_id: userId,
      joined_at: new Date().toISOString(),
    });

    console.log("Respons insert registrasi:", { error: joinError });

    if (joinError) {
      setError("Gagal bergabung ke kelas: " + joinError.message);
    } else {
      setJoinCode("");
      toast.success("Berhasil bergabung ke kelas!");
      await fetchClassrooms();
      setIsJoinConfirmOpen(false);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (userId && userRole) {
      fetchClassrooms();
    }
  }, [userRole, userId]);

  if (isLoading) {
    return <div>Memuat...</div>;
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
              Ke Halaman Masuk
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const createOrUpdateUserProfile = async (name: string, role: "teacher" | "student") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("Tidak ada pengguna terautentikasi ditemukan.");
      return;
    }

    const { error } = await supabase.from("users").upsert(
      {
        id: user.id,
        name,
        email: user.email || "",
        role,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("Gagal membuat/memperbarui profil:", error.message);
    } else {
      console.log("Profil berhasil dibuat/diperbarui.");
    }
  };

  if (userRole === "teacher") {
    const selectedClassData = classrooms.find(c => c.id === selectedClass);

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                ← Kembali
              </Button>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h1>Dashboard Guru - Selamat Datang, {userName}</h1>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Keluar
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
                  ← Kembali ke Kelas
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{selectedClassData.students.length}</div>
                      <p className="text-sm text-muted-foreground">Siswa</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(selectedClassData.students.reduce((acc, s) => acc + s.average_score, 0) / (selectedClassData.students.length || 1)) || 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">Rata-rata</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedClassData.code}</div>
                      <p className="text-sm text-muted-foreground">Kode Kelas</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedClassData.students.reduce((acc, s) => acc + s.completed_quizzes, 0)}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Kuis</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Kemajuan Siswa</CardTitle>
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
                                {student.average_score}% Rata-rata
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Kemajuan: {student.progress}%</span>
                              <span>{student.completed_quizzes} Kuis selesai</span>
                            </div>
                            <Progress value={student.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              Terakhir aktif: {new Date(student.last_active).toLocaleDateString('id-ID')}
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
                <TabsTrigger value="classes">Kelas Saya</TabsTrigger>
                <TabsTrigger value="create">Kelas Baru</TabsTrigger>
              </TabsList>

              <TabsContent value="classes" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classrooms.map((classroom) => (
                    <Card key={classroom.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {classroom.name}
                          <Badge variant="outline">{classroom.students.length} Siswa</Badge>
                        </CardTitle>
                        <CardDescription>{classroom.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Kode Kelas:</span>
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
                              Lihat
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
                      Buat Kelas Baru
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block mb-2">Nama Kelas</label>
                      <Input
                        placeholder="Contoh: Bahasa Indonesia A2 - Lanjutan"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block mb-2">Deskripsi</label>
                      <Textarea
                        placeholder="Deskripsi singkat kelas..."
                        value={newClassDescription}
                        onChange={(e) => setNewClassDescription(e.target.value)}
                      />
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} disabled={!newClassName.trim()} className="bg-blue-600 text-white hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Buat Kelas
                    </Button>
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Kelas Baru</DialogTitle>
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
                            Buat Kelas
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
              ← Kembali
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              <h1>Dashboard Siswa - Selamat Datang, {userName}</h1>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Keluar
          </Button>
        </div>

        {/* Join Class Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Bergabung ke Kelas
            </CardTitle>
            <CardDescription>
              Masukkan kode kelas yang diberikan oleh guru Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Masukkan kode kelas..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1"
              />
              <Button onClick={joinClass} disabled={!joinCode.trim() || isLoading}>
                <Send className="h-4 w-4 mr-2" />
                Bergabung
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Join Confirmation Dialog */}
        <Dialog open={isJoinConfirmOpen} onOpenChange={setIsJoinConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bergabung ke Kelas</DialogTitle>
              <DialogDescription>
                Konfirmasi detail kelas sebelum bergabung
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedClassToJoin && (
                <>
                  <div>
                    <h3 className="font-semibold">Nama Kelas: {selectedClassToJoin.name}</h3>
                    <p className="text-sm text-muted-foreground">Deskripsi: {selectedClassToJoin.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Dibuat pada: {new Date(selectedClassToJoin.createdAt).toLocaleDateString('id-ID')}
                    </p>
                    <p className="text-sm text-muted-foreground">Guru: {selectedClassToJoin.teacherName}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={confirmJoinClass} disabled={isLoading} className="bg-green-600 text-white hover:bg-green-700">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Masuk
                    </Button>
                    <Button variant="outline" onClick={() => setIsJoinConfirmOpen(false)}>
                      Batal
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Enrolled Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Kelas Saya
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classrooms.length > 0 ? (
                classrooms.map((classroom) => (
                  <Card key={classroom.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {classroom.name}
                        <Badge variant="outline">{classroom.students.length} Siswa</Badge>
                      </CardTitle>
                      <CardDescription>{classroom.description}</CardDescription>
                      <p className="text-sm text-muted-foreground">Guru: {classroom.teacherName}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Kode Kelas:</span>
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
                            Lihat
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground">Anda belum bergabung dengan kelas apa pun.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Student Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Poin Saya
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">856</div>
                <p className="text-sm text-muted-foreground">Total Poin</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Selesai
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">12</div>
                <p className="text-sm text-muted-foreground">Kuis</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Rata-rata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">78%</div>
                <p className="text-sm text-muted-foreground">Tingkat Keberhasilan</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Aktivitas Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: "Kuis Tata Bahasa A2", score: 85, date: "Hari ini" },
                { title: "Latihan Kosakata", score: 92, date: "Kemarin" },
                { title: "Tes Pemahaman Mendengar", score: 76, date: "2 Hari lalu" }
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