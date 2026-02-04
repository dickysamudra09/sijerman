"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import {
    Users,
    GraduationCap,
    Plus,
    Share2,
    Eye,
    Copy,
    BookOpen,
    ClipboardList,
    Globe,
    LayoutDashboard,
    Target,
    CheckCircle2,
    User,
    LogOut,
    Bell,
    Edit2,
    Trash2,
    ChevronDown,
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

interface ClassRoom {
    id: string;
    name: string;
    code: string;
    description: string;
    students: any[];
    createdAt: string;
    teacherName?: string;
}

interface OpenCourse {
    id: string;
    title: string;
    description: string;
    teacher_id: string;
    class_type: string;
    is_paid: boolean;
    created_at: string;
    updated_at: string;
}

interface TeacherStats {
    totalClasses: number;
    totalClassExercises: number;
    totalPublicExercises: number;
}

interface TeacherModeProps {
    onBack: () => void;
}

interface TeacherModeProps {
    onBack: () => void;
}

// Profile Dropdown Component
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
            <LayoutDashboard className="h-4 w-4" />
            Home
          </button>

          <button
            onClick={() => {
              router.push("/home");
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

function TeacherMode({ onBack }: TeacherModeProps) {
    const [userName, setUserName] = useState<string>("");
    const [initialLoading, setInitialLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [classrooms, setClassrooms] = useState<ClassRoom[]>([]);
    const [openCourses, setOpenCourses] = useState<OpenCourse[]>([]);
    const [newClassName, setNewClassName] = useState("");
    const [newClassDescription, setNewClassDescription] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stats, setStats] = useState<TeacherStats | null>(null);
    const [activeTab, setActiveTab] = useState<string>("classes");
    const router = useRouter();

    useEffect(() => {
        const fetchUserData = async () => {
            setIsLoading(true);
            setInitialLoading(true);
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
            const authUser = sessionData.session.user;
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

            if (userData && userData.role === "teacher") {
                // Set username dengan fallback: name dari db → full_name dari metadata → email
                const displayName = userData.name || authUser.user_metadata?.full_name || authUser.email || "Guru";
                setUserName(displayName);
            } else {
                setError("Anda tidak memiliki peran sebagai guru.");
                setIsLoading(false);
                router.push("/home/student");
                return;
            }

            setIsLoading(false);
            setInitialLoading(false);
        };

        fetchUserData();
    }, [router]);

    const fetchTeacherStats = async (teacherId: string) => {
        try {
            const { count: totalClasses, error: classError } = await supabase
                .from('classrooms')
                .select('*', { count: 'exact', head: true })
                .eq('teacher_id', teacherId);
    
            if (classError) throw classError;

            const { count: totalClassExercises, error: classExerciseError } = await supabase
                .from('exercise_sets')
                .select('*', { count: 'exact', head: true })
                .eq('pembuat_id', teacherId)
                .not('kelas_id', 'is', null);
    
            if (classExerciseError) throw classExerciseError;

            const { count: totalPublicExercises, error: publicExerciseError } = await supabase
                .from('exercise_sets')
                .select('*', { count: 'exact', head: true })
                .eq('pembuat_id', teacherId)
                .is('kelas_id', null);
    
            if (publicExerciseError) throw publicExerciseError;
    
            setStats({
                totalClasses: totalClasses ?? 0,
                totalClassExercises: totalClassExercises ?? 0,
                totalPublicExercises: totalPublicExercises ?? 0,
            });
        } catch (err) {
            console.error("Gagal mengambil statistik guru:", err);
            setError("Gagal mengambil data statistik.");
        }
    };

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

    const fetchClassrooms = async () => {
        if (!userId) return;
        setIsLoading(true);
        setError(null);
        console.log("Mengambil kelas untuk pengguna:", userId, "Peran:", "teacher");

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
                    let students: any[] = [];
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
        setIsLoading(false);
    };

    const fetchOpenCourses = async () => {
        if (!userId) return;
        
        try {
            const { data, error } = await supabase
                .from("courses")
                .select("*")
                .eq("teacher_id", userId)
                .eq("class_type", "open")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setOpenCourses(data || []);
        } catch (err: any) {
            console.error("Gagal mengambil open courses:", err);
        }
    };

    const handleDeleteCourse = async (courseId: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus kursus ini?")) return;

        try {
            const { error } = await supabase
                .from("courses")
                .delete()
                .eq("id", courseId);

            if (error) throw error;
            setOpenCourses(openCourses.filter(c => c.id !== courseId));
            toast.success("Kursus berhasil dihapus");
        } catch (err: any) {
            toast.error("Gagal menghapus kursus: " + err.message);
        }
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
            if (userId) {
                await fetchTeacherStats(userId);
            }
        }
        setIsLoading(false);
    };

    const copyClassCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            toast.success("Kode berhasil disalin!");
        } catch (err) {
            toast.error("Gagal menyalin kode.");
        }
    };

    useEffect(() => {
        if (userId) {
            fetchClassrooms();
            fetchOpenCourses();
            fetchTeacherStats(userId);
        }
    }, [userId]);

    if (initialLoading) {
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
            {/* Header dengan dark theme dan yellow accent */}
            <div className="bg-[#1E1E1E] text-[#FFFFFC] px-6 py-8 shadow-lg border-b-4 border-[#FFD903]">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">Selamat Datang, {userName || "Guru"}!</h1>
                            <p className="text-blue-100 text-sm">Kelola kelas dan materi pembelajaran Anda dengan mudah</p>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-[#FFD903]/20">
                                <Bell className="h-5 w-5 text-[#FFD903]" />
                                <span className="absolute top-1 right-1 h-2 w-2 bg-[#FFD903] rounded-full border border-white"></span>
                            </Button>

                            {/* Custom Profile Dropdown */}
                            <ProfileDropdown
                              userName={userName}
                              onLogout={handleLogout}
                            />
                        </div>
                    </div>

                    {/* Stats Cards di dalam header dark dengan white accent */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Card 1 - Kelas yang dibuat */}
                        <div style={{backgroundColor: '#1E1E1E', borderColor: '#FFFFFC', borderWidth: '1px'}} className="rounded-xl p-5 hover:bg-opacity-80 transition-colors duration-200 hover:shadow-lg cursor-pointer" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0A0A0A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1E1E1E'}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-gray-400 text-sm mb-2">Kelas yang Dibuat</p>
                                    <p className="text-4xl font-bold text-[#FFD903] mb-1">{stats?.totalClasses ?? 0}</p>
                                    <p className="text-gray-500 text-xs">+2 kelas baru bulan ini</p>
                                </div>
                                <div style={{backgroundColor: '#FFD903'}} className="p-3 rounded-lg">
                                    <BookOpen className="h-6 w-6" style={{color: '#1E1E1E'}} />
                                </div>
                            </div>
                        </div>

                        {/* Card 2 - Latihan yang Dibuat */}
                        <div style={{backgroundColor: '#1E1E1E', borderColor: '#FFFFFC', borderWidth: '1px'}} className="rounded-xl p-5 hover:bg-opacity-80 transition-colors duration-200 hover:shadow-lg cursor-pointer" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0A0A0A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1E1E1E'}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-gray-400 text-sm mb-2">Latihan yang Dibuat</p>
                                    <p className="text-4xl font-bold text-[#FFD903] mb-1">{stats?.totalClassExercises ?? 0}</p>
                                    <p className="text-gray-500 text-xs">+5 latihan minggu ini</p>
                                </div>
                                <div style={{backgroundColor: '#FFD903'}} className="p-3 rounded-lg">
                                    <BookOpen className="h-6 w-6" style={{color: '#1E1E1E'}} />
                                </div>
                            </div>
                        </div>

                        {/* Card 3 - Latihan Soal Umum */}
                        <div style={{backgroundColor: '#1E1E1E', borderColor: '#FFFFFC', borderWidth: '1px'}} className="rounded-xl p-5 hover:bg-opacity-80 transition-colors duration-200 hover:shadow-lg cursor-pointer" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0A0A0A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1E1E1E'}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-gray-400 text-sm mb-2">Latihan Soal Umum</p>
                                    <p className="text-4xl font-bold text-[#FFD903] mb-1">{stats?.totalPublicExercises ?? 0}</p>
                                    <p className="text-gray-500 text-xs">Untuk publik</p>
                                </div>
                                <div style={{backgroundColor: '#FFD903'}} className="p-3 rounded-lg">
                                    <Users className="h-6 w-6" style={{color: '#1E1E1E'}} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-0 pt-0">
                {/* Section Title */}
                <div className="mb-6">
                </div>

                {/* Tabs */}
                <Tabs defaultValue="classes" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex items-center justify-between mb-6">
                        <TabsList className="bg-transparent border-0 p-0">
                            <TabsTrigger 
                                value="classes" 
                                className="!bg-[#1E1E1E] !text-[#FFD903]/50 !border-transparent !border-b-2 !rounded-lg !px-3 !py-2 !font-semibold !transition-all !mr-2 !hover:text-[#FFD903] data-[state=active]:!text-[#FFD903] data-[state=active]:!border-[#FFD903] data-[state=inactive]:!text-[#FFD903]/50 data-[state=inactive]:!border-transparent"
                            >
                                Kelas Institusi
                            </TabsTrigger>
                            <TabsTrigger 
                                value="open-courses" 
                                className="!bg-[#1E1E1E] !text-[#FFD903]/50 !border-transparent !border-b-2 !rounded-lg !px-3 !py-2 !font-semibold !transition-all !mr-2 !hover:text-[#FFD903] data-[state=active]:!text-[#FFD903] data-[state=active]:!border-[#FFD903] data-[state=inactive]:!text-[#FFD903]/50 data-[state=inactive]:!border-transparent"
                            >
                                <Globe className="h-4 w-4 mr-2" />
                                Kelas Terbuka
                            </TabsTrigger>
                        </TabsList>
                        
                        {/* Only show "Buat Kelas Baru" button for institutional classes tab */}
                        {activeTab === "classes" && (
                            <Button 
                                className="bg-[#FFD903] hover:bg-[#FFD903]/90 text-[#1E1E1E] font-semibold"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Buat Kelas Baru
                            </Button>
                        )}
                        
                        {/* Only show "Buat Baru" button for open courses tab */}
                        {activeTab === "open-courses" && openCourses.length > 0 && (
                            <Button 
                                className="bg-[#FFD903] hover:bg-[#FFD903]/90 text-[#1E1E1E] font-semibold"
                                onClick={() => router.push('/teacher/courses/new')}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Buat Baru
                            </Button>
                        )}
                    </div>

                    <TabsContent value="classes" className="space-y-6 mt-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {classrooms.map((classroom) => (
                                <Card 
                                    key={classroom.id} 
                                    className="rounded-2xl flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                                    style={{backgroundColor: '#1E1E1E', borderColor: '#FFFFFC', borderWidth: '1px'}}
                                >
                                    <CardHeader className="pb-2 flex-shrink-0">
                                        <div className="flex items-start justify-between mb-2">
                                            <CardTitle className="text-xl font-bold text-white flex-1 pr-2">
                                                {classroom.name}
                                            </CardTitle>
                                            <Badge className="bg-green-100 text-green-700 border-0 px-3 py-1 text-xs font-medium flex-shrink-0">
                                                Aktif
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-sm text-gray-300 leading-relaxed line-clamp-2">
                                            {classroom.description}
                                        </CardDescription>
                                    </CardHeader>
                                    
                                    <CardContent className="space-y-3 pt-2 mt-auto flex-shrink-0">
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Users className="h-4 w-4" />
                                            <span>{classroom.students.length} Siswa</span>
                                        </div>
                                        
                                        <div style={{backgroundColor: '#FFFFFC', borderColor: '#FFFFFC', borderWidth: '1px'}} className="rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-gray-600 mb-1">Kode Kelas</p>
                                                    <code className="text-sm font-mono font-semibold text-black">
                                                        {classroom.code}
                                                    </code>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => copyClassCode(classroom.code)}
                                                    className="text-black hover:text-gray-700 hover:bg-gray-100 p-2 h-8 w-8"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                className="flex-1 font-semibold hover:opacity-90 transition-opacity"
                                                style={{backgroundColor: '#FFD903', color: '#1E1E1E'}}
                                                onClick={() => {
                                                    console.log("Navigating to classroom with id:", classroom.id);
                                                    router.push(`/home/classrooms/${classroom.id}`);
                                                }}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Lihat Kelas
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="border-white text-white hover:bg-gray-700 px-4 font-semibold"
                                            >
                                                Kelola
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="create" className="space-y-6 mt-0">
                        <Card className="bg-white border-0 shadow-sm rounded-lg">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-3 text-gray-900 text-lg">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Plus className="h-5 w-5 text-blue-600" />
                                    </div>
                                    Buat Kelas Baru
                                </CardTitle>
                                <CardDescription className="text-gray-600">
                                    Tambahkan kelas baru untuk memulai sesi belajar Anda
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-gray-700">Nama Kelas</label>
                                    <Input
                                        placeholder="Contoh: Bahasa Indonesia A2 - Lanjutan"
                                        value={newClassName}
                                        onChange={(e) => setNewClassName(e.target.value)}
                                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white h-11"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-gray-700">Deskripsi</label>
                                    <Textarea
                                        placeholder="Deskripsi singkat kelas..."
                                        value={newClassDescription}
                                        onChange={(e) => setNewClassDescription(e.target.value)}
                                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white min-h-[120px]"
                                    />
                                </div>
                                <Button 
                                    onClick={createNewClass} 
                                    disabled={!newClassName.trim() || isLoading} 
                                    className="bg-[#FFD903] hover:bg-[#FFD903]/90 text-[#1E1E1E] font-semibold px-6"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Buat Kelas
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="open-courses" className="space-y-6 mt-0">
                        {openCourses.length === 0 ? (
                            <Card 
                                className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                                style={{backgroundColor: '#1E1E1E', borderColor: '#FFD903', borderWidth: '2px'}}
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-2xl font-bold text-[#FFD903] flex items-center gap-2 mb-2">
                                                <Globe className="h-6 w-6" />
                                                Kelas Terbuka
                                            </CardTitle>
                                            <CardDescription className="text-base text-gray-300">
                                                Buat kelas mandiri yang dapat diakses oleh siapa saja. Tambahkan modul pembelajaran dan kelola siswa dengan mudah.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg" style={{backgroundColor: '#0A0A0A', borderColor: '#333333', borderWidth: '1px'}}>
                                            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-[#FFD903]" />
                                                Akses Publik
                                            </h4>
                                            <p className="text-sm text-gray-400">Kelas dapat ditemukan dan dipelajari oleh semua orang</p>
                                        </div>
                                        <div className="p-4 rounded-lg" style={{backgroundColor: '#0A0A0A', borderColor: '#333333', borderWidth: '1px'}}>
                                            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                                                <Target className="h-4 w-4 text-[#FFD903]" />
                                                Mandiri
                                            </h4>
                                            <p className="text-sm text-gray-400">Siswa belajar dengan kecepatan mereka sendiri</p>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={() => router.push('/teacher/courses/new')}
                                        className="w-full bg-[#FFD903] hover:bg-[#FFD903]/90 text-[#1E1E1E] font-semibold h-11"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Buat Kelas Terbuka Pertama Anda
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {openCourses.map((course) => (
                                        <Card 
                                            key={course.id} 
                                            className="rounded-2xl flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                                            style={{backgroundColor: '#1E1E1E', borderColor: '#FFFFFC', borderWidth: '1px'}}
                                        >
                                            <CardHeader className="pb-2 flex-shrink-0">
                                                <div className="flex items-start justify-between mb-2">
                                                    <CardTitle className="text-xl font-bold text-white flex-1 pr-2 line-clamp-2">
                                                        {course.title}
                                                    </CardTitle>
                                                    <Badge className="bg-blue-100 text-blue-700 border-0 px-3 py-1 text-xs font-medium flex-shrink-0">
                                                        Terbuka
                                                    </Badge>
                                                </div>
                                                <CardDescription className="text-sm text-gray-300 leading-relaxed line-clamp-2">
                                                    {course.description}
                                                </CardDescription>
                                            </CardHeader>
                                            
                                            <CardContent className="space-y-3 pt-2 mt-auto flex-shrink-0">
                                                <div className="text-xs text-gray-500">
                                                    Dibuat: {new Date(course.created_at).toLocaleDateString('id-ID')}
                                                </div>
                                                
                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => router.push(`/teacher/courses/${course.id}/modules`)}
                                                        className="flex-1 text-xs font-semibold"
                                                        style={{
                                                            backgroundColor: '#FFD903',
                                                            color: '#1A1A1A',
                                                            border: 'none',
                                                        }}
                                                    >
                                                        <Edit2 className="h-3 w-3 mr-1" />
                                                        Edit Modul
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => router.push(`/open-courses/${course.id}/preview`)}
                                                        className="flex-1 text-xs font-semibold"
                                                        style={{
                                                            backgroundColor: '#FFFFFC',
                                                            borderColor: '#FFFFFC',
                                                            color: '#1A1A1A',
                                                        }}
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        Preview
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDeleteCourse(course.id)}
                                                        className="text-xs"
                                                        style={{
                                                            borderColor: '#DC2626',
                                                            color: '#DC2626',
                                                        }}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="bg-white border-2 border-[#FFD903] shadow-xl rounded-xl max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-[#1E1E1E] text-xl">Kelas Baru</DialogTitle>
                            <DialogDescription className="text-gray-600">
                                Tambahkan kelas baru untuk memulai sesi belajar Anda
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">Nama Kelas</label>
                                <Input
                                    placeholder="Nama Kelas"
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">Deskripsi</label>
                                <Textarea
                                    placeholder="Deskripsi Kelas (Opsional)"
                                    value={newClassDescription}
                                    onChange={(e) => setNewClassDescription(e.target.value)}
                                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                                />
                            </div>
                            <Button 
                                onClick={createNewClass} 
                                disabled={isLoading} 
                                className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Buat Kelas
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

export default function HomePage() {
    return <TeacherMode onBack={() => {}} />;
}