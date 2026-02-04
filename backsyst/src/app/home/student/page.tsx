"use client";

import { useState, useEffect, useRef } from "react";
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
  User,
  LogOut,
  Bell,
  ChevronDown,
  Globe,
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
import Link from "next/link";
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

const ProfileDropdown = ({ userName, onLogout }: { userName: string; onLogout: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && 
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center px-3 py-2 rounded-md transition-colors hover:bg-gray-700"
        style={{ color: "#FFD903" }}
      >
        <User className="h-5 w-5" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E5E5",
            zIndex: 99999,
            top: "100%",
            marginTop: "8px"
          }}
        >
          <div
            className="px-4 py-2 text-sm font-medium border-b"
            style={{ color: "#1A1A1A", borderColor: "#E5E5E5" }}
          >
            {userName}
          </div>

          <button
            onClick={() => {
              router.push("/");
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
            style={{ color: "#1A1A1A" }}
          >
            <Home className="h-4 w-4" />
            Home
          </button>

          <button
            onClick={() => {
              router.push("/home/student");
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
            style={{ color: "#1A1A1A" }}
          >
            <BookOpen className="h-4 w-4" />
            My Courses
          </button>

          <button
            onClick={() => {
              router.push("/open-courses");
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
            style={{ color: "#1A1A1A" }}
          >
            <Globe className="h-4 w-4" />
            Open Courses
          </button>

          <div style={{ borderColor: "#E5E5E5" }} className="border-t my-1"></div>

          <button
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
            style={{ color: "#DC2626" }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

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
      {/* Header dengan dark theme dan gold accent */}
      <div className="text-[#FFFFFC] px-6 py-8 shadow-lg" style={{ backgroundColor: '#1A1A1A', borderBottom: '4px solid #E8B824' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Selamat Datang, {userName}!</h1>
              <p className="text-sm" style={{ color: '#E8B824' }}>Kelola kelas dan materi pembelajaran Anda dengan mudah</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" size="icon" className="relative rounded-full transition-colors hover:opacity-80">
                <Bell className="h-5 w-5" style={{ color: '#E8B824' }} />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full border border-white" style={{ backgroundColor: '#E8B824' }}></span>
              </Button>

              {/* Custom Profile Dropdown */}
              <ProfileDropdown
                userName={userName}
                onLogout={handleLogout}
              />
            </div>
          </div>

          {/* Stats Cards di dalam header dark */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 - Kelas yang diikuti */}
            <div className="rounded-xl p-5 hover:bg-opacity-80 transition-colors duration-200 hover:shadow-lg cursor-pointer" style={{backgroundColor: '#1E1E1E', borderColor: '#FFFFFC', borderWidth: '1px'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0A0A0A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1E1E1E'}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-400 text-sm mb-2">Kelas yang diikuti</p>
                  <p className="text-4xl font-bold mb-1" style={{ color: '#FFFFFC' }}>{studentStats.totalClassrooms}</p>
                  <p className="text-gray-500 text-xs">Kelas</p>
                </div>
                <div className="p-3 rounded-lg" style={{backgroundColor: '#E8B824'}}>
                  <BookOpen className="h-6 w-6" style={{color: '#1E1E1E'}} />
                </div>
              </div>
            </div>

            {/* Card 2 - Latihan Soal selesai */}
            <div className="rounded-xl p-5 hover:bg-opacity-80 transition-colors duration-200 hover:shadow-lg cursor-pointer" style={{backgroundColor: '#1E1E1E', borderColor: '#FFFFFC', borderWidth: '1px'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0A0A0A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1E1E1E'}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-400 text-sm mb-2">Latihan Soal selesai</p>
                  <p className="text-4xl font-bold mb-1" style={{ color: '#FFFFFC' }}>{studentStats.completedExercises}</p>
                  <p className="text-gray-500 text-xs">Latihan</p>
                </div>
                <div className="p-3 rounded-lg" style={{backgroundColor: '#E8B824'}}>
                  <BookOpen className="h-6 w-6" style={{color: '#1E1E1E'}} />
                </div>
              </div>
            </div>

            {/* Card 3 - Rata-rata Nilai */}
            <div className="rounded-xl p-5 hover:bg-opacity-80 transition-colors duration-200 hover:shadow-lg cursor-pointer" style={{backgroundColor: '#1E1E1E', borderColor: '#FFFFFC', borderWidth: '1px'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0A0A0A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1E1E1E'}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-400 text-sm mb-2">Rata-rata Nilai</p>
                  <p className="text-4xl font-bold mb-1" style={{ color: '#FFFFFC' }}>{studentStats.averageScore}%</p>
                  <p className="text-gray-500 text-xs">Dari semua latihan</p>
                </div>
                <div className="p-3 rounded-lg" style={{backgroundColor: '#E8B824'}}>
                  <TrendingUp className="h-6 w-6" style={{color: '#1E1E1E'}} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px- pt-0 pb-12">
        {/* Section Title */}
        <div className="mb-6">
        </div>

        {/* Tabs */}
        <Tabs defaultValue="classrooms" className="w-full border-0">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: "#1A1A1A" }}>
                Kelas Saya
              </h2>
              <p className="text-sm" style={{ color: "#4A4A4A" }}>
                Kelola dan ikuti perkembangan belajar kelas Anda
              </p>
            </div>
            <TabsList className="bg-transparent border-0 p-0 shadow-none">
              <TabsTrigger 
                value="classrooms" 
                className="!bg-transparent !text-[#4A4A4A] !border-b-2 !rounded-none !px-4 !py-2 !font-semibold !transition-all data-[state=active]:!text-[#E8B824] data-[state=active]:!border-[#E8B824] data-[state=inactive]:!text-[#4A4A4A] data-[state=inactive]:!border-transparent"
              >
                Kelas Terdaftar
              </TabsTrigger>
              <TabsTrigger 
                value="join" 
                className="!bg-transparent !text-[#4A4A4A] !border-b-2 !rounded-none !px-4 !py-2 !font-semibold !transition-all data-[state=active]:!text-[#E8B824] data-[state=active]:!border-[#E8B824] data-[state=inactive]:!text-[#4A4A4A] data-[state=inactive]:!border-transparent"
              >
                Bergabung Kelas
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="classrooms" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.length > 0 ? (
                classrooms.map((classroom) => (
                  <Card 
                    key={classroom.id} 
                    className="rounded-xl flex flex-col shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer" 
                    style={{
                      backgroundColor: '#FFFFFC', 
                      borderColor: '#E5E5E5', 
                      borderWidth: '1px'
                    }}
                  >
                    {/* Header dengan warna accent */}
                    <div 
                      className="h-2"
                      style={{ backgroundColor: '#1A1A1A' }}
                    ></div>
                    
                    <CardHeader className="pb-3 flex-shrink-0">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <CardTitle className="text-lg font-bold text-ellipsis line-clamp-2" style={{ color: "#1A1A1A" }}>
                          {classroom.name}
                        </CardTitle>
                        <Badge 
                          className="flex-shrink-0 text-xs font-semibold px-2 py-1 whitespace-nowrap"
                          style={{
                            backgroundColor: '#E8F5E9',
                            color: '#2E7D32',
                            border: '1px solid #C8E6C9'
                          }}
                        >
                          ✓ Aktif
                        </Badge>
                      </div>
                      <CardDescription className="text-xs" style={{ color: "#4A4A4A" }}>
                        {classroom.description || "Belum ada deskripsi"}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 pt-1 flex-grow">
                      {/* Teacher Info */}
                      <div 
                        className="flex items-center gap-2 text-sm p-3 rounded-lg"
                        style={{ backgroundColor: '#F5F5F5' }}
                      >
                        <BookOpen className="h-4 w-4 flex-shrink-0" style={{ color: '#E8B824' }} />
                        <div className="min-w-0">
                          <p className="text-xs" style={{ color: "#999999" }}>Guru</p>
                          <p className="font-semibold text-ellipsis truncate" style={{ color: "#1A1A1A" }}>
                            {classroom.teacherName || "Tidak diketahui"}
                          </p>
                        </div>
                      </div>
                    </CardContent>

                    {/* Action Buttons */}
                    <div className="px-4 pb-4 pt-2 space-y-2 flex flex-col gap-2 flex-shrink-0 border-t" style={{ borderColor: '#E5E5E5' }}>
                      {/* Class Code Section */}
                      <div 
                        className="rounded-lg p-3 flex items-center justify-between mb-2"
                        style={{ backgroundColor: '#FFF8E1', borderColor: '#E8B824', borderWidth: '1px' }}
                      >
                        <div>
                          <p className="text-xs" style={{ color: "#4A4A4A" }}>Kode Kelas</p>
                          <code 
                            className="text-sm font-bold font-mono"
                            style={{ color: "#E8B824" }}
                          >
                            {classroom.code}
                          </code>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyClassCode(classroom.code)}
                          className="text-sm p-2 h-8 w-8 rounded-md transition-colors hover:opacity-70"
                          style={{ color: "#E8B824" }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        className="w-full font-semibold text-sm h-9 rounded-lg transition-all hover:opacity-90"
                        style={{
                          backgroundColor: '#E8B824', 
                          color: '#1A1A1A'
                        }}
                        onClick={() => handleViewClassroom(classroom.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Buka Kelas
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" style={{ color: "#1A1A1A" }} />
                  <p className="text-sm" style={{ color: "#4A4A4A" }}>
                    Anda belum bergabung dengan kelas apa pun.
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#999999" }}>
                    Gunakan tab "Bergabung Kelas" untuk mendaftar
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="join" className="space-y-6 mt-0">
            <Card 
              className="rounded-xl shadow-sm border-l-4"
              style={{
                backgroundColor: '#FFFFFC',
                borderLeftColor: '#E8B824',
                borderColor: '#E5E5E5'
              }}
            >
              <CardHeader className="pb-4">
                <CardTitle 
                  className="flex items-center gap-3 text-lg"
                  style={{ color: '#1A1A1A' }}
                >
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: '#FFF8E1' }}
                  >
                    <UserPlus className="h-5 w-5" style={{ color: '#E8B824' }} />
                  </div>
                  Bergabung ke Kelas Baru
                </CardTitle>
                <CardDescription className="text-sm mt-2" style={{ color: '#4A4A4A' }}>
                  Masukkan kode kelas yang diberikan oleh guru Anda untuk bergabung
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Masukkan kode kelas..."
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="flex-1 h-11 rounded-lg border text-sm"
                    style={{
                      borderColor: '#E5E5E5',
                      backgroundColor: '#F5F5F5',
                      color: '#1A1A1A'
                    }}
                  />
                  <Button 
                    onClick={joinClass} 
                    disabled={!joinCode.trim() || isLoading}
                    className="px-6 h-11 font-semibold text-sm rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                    style={{
                      backgroundColor: '#E8B824',
                      color: '#1A1A1A'
                    }}
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
          <DialogContent className="rounded-xl max-w-md" style={{ backgroundColor: '#FFFFFC', borderColor: '#E8B824', borderWidth: '2px' }}>
            <DialogHeader>
              <DialogTitle className="text-xl" style={{ color: '#1A1A1A' }}>Bergabung ke Kelas</DialogTitle>
              <DialogDescription style={{ color: '#4A4A4A' }}>
                Konfirmasi detail kelas sebelum bergabung
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedClassToJoin && (
                <>
                  <div className="space-y-2">
                    <h3 className="font-semibold" style={{ color: '#1A1A1A' }}>Nama Kelas: {selectedClassToJoin.name}</h3>
                    <p className="text-sm" style={{ color: '#4A4A4A' }}>Deskripsi: {selectedClassToJoin.description}</p>
                    <p className="text-sm" style={{ color: '#4A4A4A' }}>
                      Dibuat pada: {new Date(selectedClassToJoin.createdAt).toLocaleDateString('id-ID')}
                    </p>
                    <p className="text-sm" style={{ color: '#4A4A4A' }}>Guru: {selectedClassToJoin.teacherName}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={confirmJoinClass} 
                      disabled={isLoading} 
                      className="font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                      style={{
                        backgroundColor: '#E8B824',
                        color: '#1A1A1A'
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Masuk
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsJoinConfirmOpen(false)} 
                      className="font-semibold transition-all hover:opacity-90"
                      style={{
                        borderColor: '#E8B824',
                        color: '#E8B824'
                      }}
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