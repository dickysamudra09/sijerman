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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white shadow-lg border-0 rounded-xl">
            <CardContent className="flex items-center justify-center p-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white shadow-lg border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="text-red-600 text-xl">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-6">{error}</p>
              <Button onClick={() => router.push("/auth/login")} className="bg-blue-600 hover:bg-blue-700 text-white">
                Ke Halaman Masuk
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header dengan gradient biru - UI Teacher Style */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Selamat Datang, {userName}!</h1>
              <p className="text-blue-100 text-sm">Kelola kelas dan materi pembelajaran Anda dengan mudah</p>
            </div>
            <Button 
              variant="secondary" 
              onClick={handleLogout} 
              className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
            >
              Keluar
            </Button>
          </div>

          {/* Stats Cards di dalam header biru - UI Teacher Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 - Kelas yang diikuti */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-blue-100 text-sm mb-2">Kelas yang diikuti</p>
                  <p className="text-4xl font-bold text-white mb-1">{studentStats.totalClassrooms}</p>
                  <p className="text-blue-200 text-xs">Kelas</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            {/* Card 2 - Latihan Soal selesai */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-blue-100 text-sm mb-2">Latihan Soal selesai</p>
                  <p className="text-4xl font-bold text-white mb-1">{studentStats.completedExercises}</p>
                  <p className="text-blue-200 text-xs">Latihan</p>
                </div>
                <div className="bg-green-500/80 p-3 rounded-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            {/* Card 3 - Rata-rata Nilai */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-blue-100 text-sm mb-2">Rata-rata Nilai</p>
                  <p className="text-4xl font-bold text-white mb-1">{studentStats.averageScore}%</p>
                  <p className="text-blue-200 text-xs">Dari semua latihan</p>
                </div>
                <div className="bg-purple-500/80 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Section Title - UI Teacher Style */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Daftar Kelas Anda</h2>
          <p className="text-gray-600 text-sm">Kelola dan pantau semua kelas yang Anda ikuti</p>
        </div>

        {/* Tabs - UI Teacher Style */}
        <Tabs defaultValue="classrooms" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-transparent border-0 p-0">
              <TabsTrigger 
                value="classrooms" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 py-2 font-semibold transition-all mr-6 text-gray-500"
              >
                Kelas Saya
              </TabsTrigger>
              <TabsTrigger 
                value="join" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 py-2 font-semibold transition-all text-gray-500"
              >
                Bergabung Kelas
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="classrooms" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {classrooms.length > 0 ? (
                classrooms.map((classroom) => (
                  <Card key={classroom.id} className="bg-white border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg flex flex-col">
                    <CardHeader className="pb-3 flex-shrink-0">
                      <div className="flex items-start justify-between mb-3">
                        <CardTitle className="text-xl font-bold text-gray-900 flex-1 pr-2">
                          {classroom.name}
                        </CardTitle>
                        <Badge className="bg-green-100 text-green-700 border-0 px-3 py-1 text-xs font-medium flex-shrink-0">
                          Aktif
                        </Badge>
                      </div>
                      <CardDescription className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                        {classroom.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 pt-0 mt-auto flex-shrink-0">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>Guru: {classroom.teacherName}</span>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Kode Kelas</p>
                            <code className="text-sm font-mono font-semibold text-gray-900">
                              {classroom.code}
                            </code>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyClassCode(classroom.code)}
                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-200 p-2 h-8 w-8"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleViewClassroom(classroom.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Lihat Kelas
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-gray-300 text-gray-600 hover:bg-gray-50 px-4"
                        >
                          Kelola
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500 col-span-2">Anda belum bergabung dengan kelas apa pun.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="join" className="space-y-6 mt-0">
            <Card className="bg-white border-0 shadow-sm rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-gray-900 text-lg">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <UserPlus className="h-5 w-5 text-purple-600" />
                  </div>
                  Bergabung ke Kelas
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Masukkan kode kelas yang diberikan oleh guru Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Masukkan kode kelas..."
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white h-11"
                  />
                  <Button 
                    onClick={joinClass} 
                    disabled={!joinCode.trim() || isLoading} 
                    className="bg-green-600 hover:bg-green-700 text-white px-6"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Bergabung
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isJoinConfirmOpen} onOpenChange={setIsJoinConfirmOpen}>
          <DialogContent className="bg-white border-0 shadow-xl rounded-xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-900 text-xl">Bergabung ke Kelas</DialogTitle>
              <DialogDescription className="text-gray-600">
                Konfirmasi detail kelas sebelum bergabung
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedClassToJoin && (
                <>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900">Nama Kelas: {selectedClassToJoin.name}</h3>
                    <p className="text-sm text-gray-600">Deskripsi: {selectedClassToJoin.description}</p>
                    <p className="text-sm text-gray-600">
                      Dibuat pada: {new Date(selectedClassToJoin.createdAt).toLocaleDateString('id-ID')}
                    </p>
                    <p className="text-sm text-gray-600">Guru: {selectedClassToJoin.teacherName}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={confirmJoinClass} 
                      disabled={isLoading} 
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Masuk
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsJoinConfirmOpen(false)} 
                      className="border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      Batal
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function HomePage() {
  return <StudentMode onBack={() => {}} />;
}