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
  Home,
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

interface StudentModeProps {
  onBack: () => void;
}

interface StudentStats {
  totalClassrooms: number;
  completedExercises: number;
  averageScore: number;
}

function StudentMode({ onBack }: StudentModeProps) {
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [classrooms, setClassrooms] = useState<ClassRoom[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoinConfirmOpen, setIsJoinConfirmOpen] = useState(false);
  const [selectedClassToJoin, setSelectedClassToJoin] = useState<any>(null);
  const [studentStats, setStudentStats] = useState<StudentStats>({
    totalClassrooms: 0,
    completedExercises: 0,
    averageScore: 0,
  });
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
        router.push("/auth/login");
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

      if (userData && userData.role === "student") {
        setUserName(userData.name);
      } else {
        setError("Anda tidak memiliki peran sebagai siswa.");
        setIsLoading(false);
        router.push("/home/teacher");
        return;
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
    setUserName("");
    setUserId(null);
    router.push("/");
  };

  const handleHomeRedirect = () => {
    router.push("/");
  };

  const copyClassCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Kode berhasil disalin!");
    } catch (err) {
      toast.error("Gagal menyalin kode.");
    }
  };

  const fetchStudentStats = async () => {
    if (!userId) return;

    try {
      const { data: registrations, error: regError } = await supabase
        .from("classroom_registrations")
        .select("classroom_id")
        .eq("student_id", userId);

      const totalClassrooms = registrations ? registrations.length : 0;

      const { data: attempts, error: attemptsError } = await supabase
        .from("exercise_attempts")
        .select("id, percentage")
        .eq("student_id", userId)
        .eq("status", "submitted");

      const completedExercises = attempts ? attempts.length : 0;

      let averageScore = 0;
      if (attempts && attempts.length > 0) {
        const totalPercentage = attempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0);
        averageScore = Math.round(totalPercentage / attempts.length);
      }

      setStudentStats({
        totalClassrooms,
        completedExercises,
        averageScore,
      });

      console.log("Student stats updated:", { totalClassrooms, completedExercises, averageScore });
    } catch (error) {
      console.error("Error fetching student stats:", error);
    }
  };

  const fetchClassrooms = async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    console.log("Mengambil kelas untuk pengguna:", userId, "Peran:", "student");

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

    const classroomIds = registrations.map((reg) => reg.classroom_id);
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
    setIsLoading(false);
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
      await fetchStudentStats();
      setIsJoinConfirmOpen(false);
    }
    setIsLoading(false);
  };

  const handleViewClassroom = (classroomId: string) => {
    console.log("Student navigating to classroom with id:", classroomId);
    router.push(`/home/classrooms/${classroomId}`);
  };

  useEffect(() => {
    if (userId) {
      fetchClassrooms();
      fetchStudentStats();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-screen-2xl mx-auto">
          <Card className="bg-white shadow-2xl border-0 rounded-2xl">
            <CardContent className="flex items-center justify-center p-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Memuat...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-screen-2xl mx-auto">
          <Card className="bg-white shadow-2xl border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-red-600 text-xl">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-6">{error}</p>
              <Button onClick={() => router.push("/auth/login")} className="bg-sky-500 hover:bg-sky-600 text-white shadow-md">
                Ke Halaman Masuk
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
      <Card className="w-full h-[calc(100vh-48px)] max-w-screen-2xl bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-gray-100 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500 rounded-full shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Siswa - Selamat Datang, {userName}</h1>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="border-gray-300 text-gray-600 shadow-sm">
              Keluar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 overflow-y-auto h-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="bg-white border-0 shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Kelas yang diikuti</CardTitle>
                <Target className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-sky-600">{studentStats.totalClassrooms}</div>
                <p className="text-xs text-muted-foreground">Kelas</p>
              </CardContent>
            </Card>
            <Card className="bg-white border-0 shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Latihan Soal selesai</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{studentStats.completedExercises}</div>
                <p className="text-xs text-muted-foreground">Latihan</p>
              </CardContent>
            </Card>
            <Card className="bg-white border-0 shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Rata-rata Nilai</CardTitle>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{studentStats.averageScore}%</div>
                <p className="text-xs text-muted-foreground">Dari semua latihan</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="classrooms" className="w-full">
            <TabsList className="bg-gray-100 border-0 rounded-xl p-1 shadow-inner">
              <TabsTrigger value="classrooms" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-sky-600 rounded-lg px-8 py-3 font-medium">Kelas Saya</TabsTrigger>
              <TabsTrigger value="join" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-sky-600 rounded-lg px-8 py-3 font-medium">Bergabung Kelas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="classrooms" className="space-y-6 mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {classrooms.length > 0 ? (
                  classrooms.map((classroom) => (
                    <Card key={classroom.id} className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl flex flex-col">
                      <CardHeader className="pb-4 flex-grow">
                        <CardTitle className="flex items-center justify-between text-gray-900 text-lg">
                          {classroom.name}
                          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 px-3 py-1">
                            Aktif
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-gray-600 text-sm leading-relaxed">{classroom.description}</CardDescription>
                        <p className="text-sm text-muted-foreground">Guru: {classroom.teacherName}</p>
                      </CardHeader>
                      <CardContent className="mt-auto">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Kode Kelas:</span>
                            <div className="flex items-center gap-2">
                              <code className="bg-gray-100 px-3 py-2 rounded-lg text-sm font-mono text-gray-700 border">{classroom.code}</code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyClassCode(classroom.code)}
                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-3 pt-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                              onClick={() => handleViewClassroom(classroom.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Lihat
                            </Button>
                            <Button size="sm" variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50 shadow-sm">
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
            </TabsContent>

            <TabsContent value="join" className="space-y-6 mt-8">
              <Card className="bg-gray-50 border border-gray-200 shadow-lg rounded-xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <UserPlus className="h-5 w-5 text-white" />
                    </div>
                    Bergabung ke Kelas
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Masukkan kode kelas yang diberikan oleh guru Anda
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Masukkan kode kelas..."
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      className="flex-1 border-gray-300 focus:border-sky-500 focus:ring-sky-200 bg-white shadow-sm text-lg py-3"
                    />
                    <Button onClick={joinClass} disabled={!joinCode.trim() || isLoading} className="bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3">
                      <Send className="h-4 w-4 mr-2" />
                      Bergabung
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Dialog open={isJoinConfirmOpen} onOpenChange={setIsJoinConfirmOpen}>
            <DialogContent className="bg-white border-0 shadow-2xl rounded-2xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-gray-900 text-xl">Bergabung ke Kelas</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Konfirmasi detail kelas sebelum bergabung
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedClassToJoin && (
                  <>
                    <div>
                      <h3 className="font-semibold text-gray-900">Nama Kelas: {selectedClassToJoin.name}</h3>
                      <p className="text-sm text-gray-500">Deskripsi: {selectedClassToJoin.description}</p>
                      <p className="text-sm text-gray-500">
                        Dibuat pada: {new Date(selectedClassToJoin.createdAt).toLocaleDateString('id-ID')}
                      </p>
                      <p className="text-sm text-gray-500">Guru: {selectedClassToJoin.teacherName}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={confirmJoinClass} disabled={isLoading} className="bg-green-600 text-white hover:bg-green-700 shadow-md">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Masuk
                      </Button>
                      <Button variant="outline" onClick={() => setIsJoinConfirmOpen(false)} className="border-gray-300 text-gray-600 hover:bg-gray-50 shadow-sm">
                        Batal
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HomePage() {
  return <StudentMode onBack={() => {}} />;
}