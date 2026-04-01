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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isJoinConfirmOpen, setIsJoinConfirmOpen] = useState(false);
  const [selectedClassToJoin, setSelectedClassToJoin] = useState<any>(null);
  const [studentStats, setStudentStats] = useState<StudentStats>({
    totalClassrooms: 0,
    completedExercises: 0,
    averageScore: 0,
  });
  const [loadingSession, setLoadingSession] = useState(true);
  const router = useRouter();

  // Effect 1: Get session and user profile
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData?.session?.user?.id) {
          setError("Session error. Please login again.");
          router.push("/auth/login");
          return;
        }

        const userIdValue = sessionData.session.user.id;
        setUserId(userIdValue);

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("name, role")
          .eq("id", userIdValue)
          .single();

        if (userError) {
          setError("Failed to get user profile");
          return;
        }

        if (userData?.role !== "student") {
          router.push("/home/teacher");
          return;
        }

        setUserName(userData.name);
      } catch (err: any) {
        console.error("Session error:", err);
        setError("Error loading session");
      } finally {
        setLoadingSession(false);
      }
    };

    getSession();
  }, [router]);

  // Effect 2: Fetch classrooms when userId is available
  useEffect(() => {
    if (!userId) return;

    const fetchClassrooms = async () => {
      try {
        const { data: registrations, error: regError } = await supabase
          .from("classroom_registrations")
          .select("classroom_id")
          .eq("student_id", userId);

        if (regError) throw regError;

        if (!registrations || registrations.length === 0) {
          setClassrooms([]);
          return;
        }

        const classroomIds = registrations.map(r => r.classroom_id);

        const { data: classroomData, error: classError } = await supabase
          .from("classrooms")
          .select("id, name, code, description, created_at, teacher_id")
          .in("id", classroomIds);

        if (classError) throw classError;

        if (!classroomData || classroomData.length === 0) {
          setClassrooms([]);
          return;
        }

        const classroomsWithTeacher = await Promise.all(
          classroomData.map(async (classroom) => {
            try {
              const { data: teacherData } = await supabase
                .from("users")
                .select("name")
                .eq("id", classroom.teacher_id)
                .single();

              return {
                id: classroom.id,
                name: classroom.name,
                code: classroom.code,
                description: classroom.description || "",
                students: [],
                createdAt: classroom.created_at,
                teacherName: teacherData?.name || "Unknown",
              };
            } catch (err) {
              return {
                id: classroom.id,
                name: classroom.name,
                code: classroom.code,
                description: classroom.description || "",
                students: [],
                createdAt: classroom.created_at,
                teacherName: "Unknown",
              };
            }
          })
        );

        setClassrooms(classroomsWithTeacher);
      } catch (err: any) {
        console.error("Error fetching classrooms:", err);
      }
    };

    fetchClassrooms();
  }, [userId]);

  // Effect 3: Fetch student stats when userId is available
  useEffect(() => {
    if (!userId) return;

    const fetchStats = async () => {
      try {
        const { data: registrations } = await supabase
          .from("classroom_registrations")
          .select("classroom_id")
          .eq("student_id", userId);

        const totalClassrooms = registrations?.length || 0;

        let completedExercises = 0;
        let totalScore = 0;
        let scoreCount = 0;

        if (registrations && registrations.length > 0) {
          // Try to get exercises, but handle if table doesn't exist
          try {
            const { data: exercises } = await supabase
              .from("student_exercises")
              .select("score")
              .eq("student_id", userId)
              .not("score", "is", null);

            if (exercises) {
              completedExercises = exercises.length;
              exercises.forEach((ex) => {
                totalScore += ex.score || 0;
                scoreCount++;
              });
            }
          } catch (err) {
            console.warn("Could not fetch exercises:", err);
          }
        }

        const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

        setStudentStats({
          totalClassrooms,
          completedExercises,
          averageScore,
        });
      } catch (err: any) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats();
  }, [userId]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
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

    try {
      const { data: registrations, error: regError } = await supabase
        .from("classroom_registrations")
        .select("classroom_id, joined_at")
        .eq("student_id", userId);

      if (regError) throw regError;

      if (!registrations || registrations.length === 0) {
        setClassrooms([]);
        setIsLoading(false);
        return;
      }

      const classroomIds = registrations.map((reg) => reg.classroom_id);

      const { data: classroomData, error: classError } = await supabase
        .from("classrooms")
        .select("id, name, code, description, created_at, teacher_id")
        .in("id", classroomIds);

      if (classError) throw classError;

      if (!classroomData || classroomData.length === 0) {
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

            if (!teacherError && teacherData) {
              teacherName = teacherData.name || "Guru Tidak Dikenal";
            }
          } catch (err) {
            console.warn("Error fetching teacher for classroom:", err);
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
      // Cache classrooms to localStorage
      localStorage.setItem(`classrooms_${userId}`, JSON.stringify(classroomsWithTeacher));
      setIsLoading(false);
    } catch (err: any) {
      console.error("Gagal mengambil kelas:", err);
      setError("Gagal mengambil kelas: " + err.message);
      setClassrooms([]);
      setIsLoading(false);
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
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,253,248,1) 100%)'}}>
      {/* Header dengan dark theme dan gold accent */}
      <div className="text-[#FFFFFC] px-6 py-8 shadow-lg relative overflow-hidden" style={{ backgroundColor: '#1A1A1A', borderBottom: '4px solid #E8B824' }}>
        {/* Decorative Blobs */}
        <div className="absolute top-10 right-20 w-64 h-64 bg-gradient-to-br from-yellow-400 to-amber-300 rounded-full filter blur-3xl opacity-8 pointer-events-none" style={{opacity: 0.08}}></div>
        <div className="absolute bottom-0 left-10 w-56 h-56 bg-gradient-to-br from-amber-300 to-yellow-300 rounded-full filter blur-3xl opacity-6 pointer-events-none" style={{opacity: 0.06}}></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-8">
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

          {/* Stats Cards - Glasmorphic */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 - Kelas yang diikuti */}
            <div className="rounded-xl p-6 transition-all duration-300 hover:shadow-lg cursor-pointer backdrop-blur-md" style={{
              backgroundColor: 'rgba(255, 255, 252, 0.1)',
              borderColor: 'rgba(232, 184, 36, 0.2)',
              borderWidth: '1px'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(232, 184, 36, 0.15)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-300 text-sm mb-3">Kelas yang Diikuti</p>
                  <p className="text-4xl font-bold mb-1" style={{ color: '#FFFFFC' }}>{studentStats.totalClassrooms}</p>
                  <p className="text-gray-400 text-xs">Kelas aktif</p>
                </div>
                <div className="p-3 rounded-lg transform transition-transform hover:scale-110" style={{backgroundColor: '#E8B824'}}>
                  <BookOpen className="h-6 w-6" style={{color: '#1E1E1E'}} />
                </div>
              </div>
            </div>

            {/* Card 2 - Latihan Soal selesai */}
            <div className="rounded-xl p-6 transition-all duration-300 hover:shadow-lg cursor-pointer backdrop-blur-md" style={{
              backgroundColor: 'rgba(255, 255, 252, 0.1)',
              borderColor: 'rgba(232, 184, 36, 0.2)',
              borderWidth: '1px'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(232, 184, 36, 0.15)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-300 text-sm mb-3">Latihan Selesai</p>
                  <p className="text-4xl font-bold mb-1" style={{ color: '#FFFFFC' }}>{studentStats.completedExercises}</p>
                  <p className="text-gray-400 text-xs">Total latihan</p>
                </div>
                <div className="p-3 rounded-lg transform transition-transform hover:scale-110" style={{backgroundColor: '#E8B824'}}>
                  <CheckCircle2 className="h-6 w-6" style={{color: '#1E1E1E'}} />
                </div>
              </div>
            </div>

            {/* Card 3 - Rata-rata Nilai */}
            <div className="rounded-xl p-6 transition-all duration-300 hover:shadow-lg cursor-pointer backdrop-blur-md" style={{
              backgroundColor: 'rgba(255, 255, 252, 0.1)',
              borderColor: 'rgba(232, 184, 36, 0.2)',
              borderWidth: '1px'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(232, 184, 36, 0.15)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-300 text-sm mb-3">Rata-rata Nilai</p>
                  <p className="text-4xl font-bold mb-1" style={{ color: '#FFFFFC' }}>{studentStats.averageScore}%</p>
                  <p className="text-gray-400 text-xs">Performa Anda</p>
                </div>
                <div className="p-3 rounded-lg transform transition-transform hover:scale-110" style={{backgroundColor: '#E8B824'}}>
                  <TrendingUp className="h-6 w-6" style={{color: '#1E1E1E'}} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
        {/* Section Title */}
        <div className="mb-8">
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
                classrooms.map((classroom, index) => (
                  <Card 
                    key={classroom.id} 
                    className="rounded-2xl flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer backdrop-blur-sm hover:scale-105 transform" 
                    style={{
                      backgroundColor: 'rgba(255, 255, 252, 0.8)',
                      borderColor: 'rgba(232, 184, 36, 0.2)',
                      borderWidth: '1px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(232, 184, 36, 0.12)';
                      e.currentTarget.style.borderColor = 'rgba(232, 184, 36, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(232, 184, 36, 0.2)';
                    }}
                  >
                    {/* Gradient Top Border */}
                    <div 
                      className="h-1"
                      style={{ background: 'linear-gradient(90deg, #E8B824 0%, rgba(232, 184, 36, 0) 100%)' }}
                    ></div>
                    
                    <CardHeader className="pb-3 flex-shrink-0">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <CardTitle className="text-lg font-bold text-ellipsis line-clamp-2 group-hover:text-yellow-600 transition-colors" style={{ color: "#1A1A1A" }}>
                          {classroom.name}
                        </CardTitle>
                        <Badge 
                          className="flex-shrink-0 text-xs font-semibold px-2 py-1 whitespace-nowrap"
                          style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            color: '#22C55E',
                            border: '1px solid rgba(34, 197, 94, 0.3)'
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
                        style={{ backgroundColor: 'rgba(232, 184, 36, 0.05)' }}
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
                        className="rounded-lg p-3 flex items-center justify-between mb-2 backdrop-blur-sm transition-all hover:shadow-md"
                        style={{ backgroundColor: 'rgba(232, 184, 36, 0.08)', borderColor: 'rgba(232, 184, 36, 0.3)', borderWidth: '1px' }}
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
                          className="text-sm p-2 h-8 w-8 rounded-md transition-all hover:scale-110 hover:bg-yellow-50"
                          style={{ color: "#E8B824" }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        className="w-full font-semibold text-sm h-10 rounded-lg transition-all hover:shadow-lg duration-200 group-hover:shadow-lg"
                        style={{
                          backgroundColor: '#E8B824', 
                          color: '#1A1A1A'
                        }}
                        onClick={() => handleViewClassroom(classroom.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
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
              className="rounded-2xl shadow-sm border backdrop-blur-sm hover:shadow-md transition-all"
              style={{
                backgroundColor: 'rgba(255, 255, 252, 0.8)',
                borderColor: 'rgba(232, 184, 36, 0.2)',
                borderWidth: '1px'
              }}
            >
              <CardHeader className="pb-4">
                <CardTitle 
                  className="flex items-center gap-3 text-lg"
                  style={{ color: '#1A1A1A' }}
                >
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: 'rgba(232, 184, 36, 0.1)' }}
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
                    className="flex-1 h-11 rounded-lg border text-sm transition-all focus:border-yellow-400"
                    style={{
                      borderColor: 'rgba(232, 184, 36, 0.3)',
                      backgroundColor: 'rgba(245, 245, 245, 0.6)',
                      color: '#1A1A1A'
                    }}
                  />
                  <Button 
                    onClick={joinClass} 
                    disabled={!joinCode.trim() || isLoading}
                    className="px-6 h-11 font-semibold text-sm rounded-lg transition-all hover:-translate-y-1 disabled:opacity-50"
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
          <DialogContent className="rounded-2xl max-w-md" style={{ backgroundColor: '#FFFFFC', borderColor: 'rgba(232, 184, 36, 0.3)', borderWidth: '2px' }}>
            <DialogHeader>
              <DialogTitle className="text-xl" style={{ color: '#1A1A1A' }}>Bergabung ke Kelas</DialogTitle>
              <DialogDescription style={{ color: '#4A4A4A' }}>
                Konfirmasi detail kelas sebelum bergabung
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedClassToJoin && (
                <>
                  <div className="space-y-2 p-4 rounded-lg" style={{ backgroundColor: 'rgba(232, 184, 36, 0.05)' }}>
                    <h3 className="font-semibold" style={{ color: '#1A1A1A' }}>📚 {selectedClassToJoin.name}</h3>
                    <p className="text-sm" style={{ color: '#4A4A4A' }}>📝 {selectedClassToJoin.description}</p>
                    <p className="text-sm" style={{ color: '#4A4A4A' }}>
                      📅 {new Date(selectedClassToJoin.createdAt).toLocaleDateString('id-ID')}
                    </p>
                    <p className="text-sm" style={{ color: '#4A4A4A' }}>👨‍🏫 {selectedClassToJoin.teacherName}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={confirmJoinClass} 
                      disabled={isLoading} 
                      className="flex-1 font-semibold transition-all hover:shadow-lg disabled:opacity-50"
                      style={{
                        backgroundColor: '#E8B824',
                        color: '#1A1A1A'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Masuk
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsJoinConfirmOpen(false)} 
                      className="flex-1 font-semibold transition-all hover:shadow-md"
                      style={{
                        borderColor: 'rgba(232, 184, 36, 0.5)',
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