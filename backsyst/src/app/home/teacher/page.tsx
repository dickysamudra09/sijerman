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
    const [userId, setUserId] = useState<string | null>(null);
    const [classrooms, setClassrooms] = useState<ClassRoom[]>([]);
    const [openCourses, setOpenCourses] = useState<OpenCourse[]>([]);
    const [newClassName, setNewClassName] = useState("");
    const [newClassDescription, setNewClassDescription] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stats, setStats] = useState<TeacherStats | null>(null);
    const [activeTab, setActiveTab] = useState<string>("classes");
    const [numPertemuan, setNumPertemuan] = useState(16);
    const [scheduleDay, setScheduleDay] = useState(1);
    const [startTime, setStartTime] = useState("09:00");
    const [attendanceStart, setAttendanceStart] = useState("08:45");
    const [attendanceEnd, setAttendanceEnd] = useState("09:15");
    const [hasAttendance, setHasAttendance] = useState(true);
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
                const authUser = sessionData.session.user;
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

                if (userData?.role !== "teacher") {
                    router.push("/home/student");
                    return;
                }

                const displayName = userData.name || authUser?.user_metadata?.full_name || authUser?.email || "Guru";
                setUserName(displayName);
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
                const { data: classroomList, error: classError } = await supabase
                    .from("classrooms")
                    .select("id, name, code, description, created_at")
                    .eq("teacher_id", userId);

                if (classError) throw classError;

                if (classroomList && classroomList.length > 0) {
                    const classroomsWithStudents = await Promise.all(
                        classroomList.map(async (classroom) => {
                            try {
                                const { data: registrations } = await supabase
                                    .from("classroom_registrations")
                                    .select("student_id")
                                    .eq("classroom_id", classroom.id);

                                const studentIds = registrations?.map(r => r.student_id) || [];
                                let students: any[] = [];
                                
                                if (studentIds.length > 0) {
                                    const { data: studentData } = await supabase
                                        .from("users")
                                        .select("id, name, email")
                                        .in("id", studentIds);

                                    if (studentData) {
                                        students = studentData.map(s => ({
                                            id: s.id,
                                            name: s.name,
                                            email: s.email,
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
                                };
                            } catch (err) {
                                return {
                                    id: classroom.id,
                                    name: classroom.name,
                                    code: classroom.code,
                                    description: classroom.description || "",
                                    students: [],
                                    createdAt: classroom.created_at,
                                };
                            }
                        })
                    );

                    setClassrooms(classroomsWithStudents);
                }
            } catch (err: any) {
                console.error("Error fetching classrooms:", err);
            }
        };

        fetchClassrooms();
    }, [userId]);

    // Effect 3: Fetch open courses when userId is available
    useEffect(() => {
        if (!userId) return;

        const fetchOpenCourses = async () => {
            try {
                const { data: courses, error: courseError } = await supabase
                    .from("courses")
                    .select("*")
                    .eq("teacher_id", userId)
                    .eq("class_type", "open")
                    .order("created_at", { ascending: false });

                if (courseError) throw courseError;

                setOpenCourses(courses || []);
            } catch (err: any) {
                console.error("Error fetching courses:", err);
            }
        };

        fetchOpenCourses();
    }, [userId]);

    // Effect 4: Fetch stats when userId is available
    useEffect(() => {
        if (!userId) return;

        const fetchStats = async () => {
            try {
                const { count: totalClasses } = await supabase
                    .from('classrooms')
                    .select('*', { count: 'exact', head: true })
                    .eq('teacher_id', userId);

                const { count: totalClassExercises } = await supabase
                    .from('exercise_sets')
                    .select('*', { count: 'exact', head: true })
                    .eq('pembuat_id', userId)
                    .not('kelas_id', 'is', null);

                const { count: totalPublicExercises } = await supabase
                    .from('exercise_sets')
                    .select('*', { count: 'exact', head: true })
                    .eq('pembuat_id', userId)
                    .is('kelas_id', null);

                setStats({
                    totalClasses: totalClasses ?? 0,
                    totalClassExercises: totalClassExercises ?? 0,
                    totalPublicExercises: totalPublicExercises ?? 0,
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

    const fetchTeacherStats = async (teacherId: string) => {
        try {
            const { count: totalClasses } = await supabase
                .from('classrooms')
                .select('*', { count: 'exact', head: true })
                .eq('teacher_id', teacherId);

            const { count: totalClassExercises } = await supabase
                .from('exercise_sets')
                .select('*', { count: 'exact', head: true })
                .eq('pembuat_id', teacherId)
                .not('kelas_id', 'is', null);

            const { count: totalPublicExercises } = await supabase
                .from('exercise_sets')
                .select('*', { count: 'exact', head: true })
                .eq('pembuat_id', teacherId)
                .is('kelas_id', null);

            setStats({
                totalClasses: totalClasses ?? 0,
                totalClassExercises: totalClassExercises ?? 0,
                totalPublicExercises: totalPublicExercises ?? 0,
            });
        } catch (err) {
            console.error("Error fetching stats:", err);
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
        const classId = crypto.randomUUID();
        
        try {
            // Validate attendance times if attendance is enabled
            if (hasAttendance && attendanceStart >= attendanceEnd) {
                setError("Jam mulai presensi harus lebih awal dari jam selesai");
                setIsLoading(false);
                return;
            }

            const { error: classError } = await supabase.from("classrooms").insert({
                id: classId,
                name: newClassName,
                code,
                description: newClassDescription || "",
                teacher_id: userId,
                pertemuan: numPertemuan,
                created_at: new Date().toISOString(),
            });

            if (classError) throw classError;
            
            // Set attendance times based on hasAttendance flag
            const attendRangeStart = hasAttendance ? attendanceStart : startTime;
            const attendRangeEnd = hasAttendance ? attendanceEnd : startTime;

            const { error: scheduleError } = await supabase.from("classroom_schedule").insert({
                id: crypto.randomUUID(),
                classroom_id: classId,
                day_of_week: scheduleDay,
                start_time: startTime,
                attendance_range_start: attendRangeStart,
                attendance_range_end: attendRangeEnd,
                created_at: new Date().toISOString(),
            });

            if (scheduleError) throw scheduleError;

            setNewClassName("");
            setNewClassDescription("");
            setNumPertemuan(16);
            setScheduleDay(1);
            setStartTime("09:00");
            setAttendanceStart("08:45");
            setAttendanceEnd("09:15");
            setHasAttendance(true);
            setIsModalOpen(false);
            toast.success("Kelas berhasil dibuat dengan jadwal!");
            
            // Refetch classrooms
            const { data: classroomList } = await supabase
                .from("classrooms")
                .select("id, name, code, description, created_at")
                .eq("teacher_id", userId);

            if (classroomList && classroomList.length > 0) {
                const classroomsWithStudents = await Promise.all(
                    classroomList.map(async (classroom) => {
                        try {
                            const { data: registrations } = await supabase
                                .from("classroom_registrations")
                                .select("student_id")
                                .eq("classroom_id", classroom.id);

                            const studentIds = registrations?.map(r => r.student_id) || [];
                            let students: any[] = [];
                            
                            if (studentIds.length > 0) {
                                const { data: studentData } = await supabase
                                    .from("users")
                                    .select("id, name, email")
                                    .in("id", studentIds);

                                if (studentData) {
                                    students = studentData.map(s => ({
                                        id: s.id,
                                        name: s.name,
                                        email: s.email,
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
                            };
                        } catch (err) {
                            return {
                                id: classroom.id,
                                name: classroom.name,
                                code: classroom.code,
                                description: classroom.description || "",
                                students: [],
                                createdAt: classroom.created_at,
                            };
                        }
                    })
                );

                setClassrooms(classroomsWithStudents);
            }
        } catch (err: any) {
            setError("Gagal membuat kelas: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const copyClassCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            toast.success("Kode berhasil disalin!");
        } catch (err) {
            toast.error("Gagal menyalin kode.");
        }
    };

    if (loadingSession) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <Card className="bg-white shadow-lg border-0 rounded-xl">
                        <CardContent className="flex items-center justify-center p-16">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "#E8B824" }}></div>
                                <p className="text-gray-600 text-lg mt-4">Memuat...</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (error && !classrooms.length && !openCourses.length) {
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
            {/* Header dengan dark theme dan yellow accent */}
            <div className="px-6 py-8 shadow-lg relative overflow-hidden" style={{ backgroundColor: '#1A1A1A', borderBottom: '4px solid #E8B824' }}>
                {/* Decorative Blobs */}
                <div className="absolute top-10 right-20 w-64 h-64 bg-gradient-to-br from-yellow-400 to-amber-300 rounded-full filter blur-3xl opacity-8 pointer-events-none" style={{opacity: 0.08}}></div>
                <div className="absolute bottom-0 left-10 w-56 h-56 bg-gradient-to-br from-amber-300 to-yellow-300 rounded-full filter blur-3xl opacity-6 pointer-events-none" style={{opacity: 0.06}}></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold mb-1" style={{ color: '#FFFFFC' }}>Selamat Datang, {userName || "Guru"}!</h1>
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
                        {/* Card 1 - Kelas yang dibuat */}
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
                                    <p className="text-gray-300 text-sm mb-3">Kelas yang Dibuat</p>
                                    <p className="text-4xl font-bold mb-1" style={{ color: '#FFFFFC' }}>{stats?.totalClasses ?? 0}</p>
                                    <p className="text-gray-400 text-xs">Kelas institusi</p>
                                </div>
                                <div className="p-3 rounded-lg transform transition-transform hover:scale-110" style={{backgroundColor: '#E8B824'}}>
                                    <BookOpen className="h-6 w-6" style={{color: '#1E1E1E'}} />
                                </div>
                            </div>
                        </div>

                        {/* Card 2 - Latihan yang Dibuat */}
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
                                    <p className="text-gray-300 text-sm mb-3">Latihan yang Dibuat</p>
                                    <p className="text-4xl font-bold mb-1" style={{ color: '#FFFFFC' }}>{stats?.totalClassExercises ?? 0}</p>
                                    <p className="text-gray-400 text-xs">Untuk kelas</p>
                                </div>
                                <div className="p-3 rounded-lg transform transition-transform hover:scale-110" style={{backgroundColor: '#E8B824'}}>
                                    <ClipboardList className="h-6 w-6" style={{color: '#1E1E1E'}} />
                                </div>
                            </div>
                        </div>

                        {/* Card 3 - Latihan Soal Umum */}
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
                                    <p className="text-gray-300 text-sm mb-3">Latihan Soal Umum</p>
                                    <p className="text-4xl font-bold mb-1" style={{ color: '#FFFFFC' }}>{stats?.totalPublicExercises ?? 0}</p>
                                    <p className="text-gray-400 text-xs">Untuk publik</p>
                                </div>
                                <div className="p-3 rounded-lg transform transition-transform hover:scale-110" style={{backgroundColor: '#E8B824'}}>
                                    <Users className="h-6 w-6" style={{color: '#1E1E1E'}} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
                {/* Section Title */}
                <div className="flex items-center justify-between mb-8 mt-8">
                    <div>
                        <h2 className="text-2xl font-bold mb-1" style={{ color: "#1A1A1A" }}>Kelola Kelas</h2>
                        <p className="text-sm" style={{ color: "#4A4A4A" }}>Kelola kelas institusi dan kelas terbuka Anda dengan mudah</p>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="classes" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex items-center justify-between mb-6">
                        <TabsList className="bg-transparent border-0 p-0 shadow-none">
                            <TabsTrigger 
                                value="classes" 
                                className="!bg-transparent !text-[#4A4A4A] !border-b-2 !rounded-none !px-4 !py-2 !font-semibold !transition-all data-[state=active]:!text-[#E8B824] data-[state=active]:!border-[#E8B824] data-[state=inactive]:!text-[#4A4A4A] data-[state=inactive]:!border-transparent"
                            >
                                Kelas Institusi
                            </TabsTrigger>
                            <TabsTrigger 
                                value="open-courses" 
                                className="!bg-transparent !text-[#4A4A4A] !border-b-2 !rounded-none !px-4 !py-2 !font-semibold !transition-all data-[state=active]:!text-[#E8B824] data-[state=active]:!border-[#E8B824] data-[state=inactive]:!text-[#4A4A4A] data-[state=inactive]:!border-transparent"
                            >
                                <Globe className="h-4 w-4 mr-2" />
                                Kelas Terbuka
                            </TabsTrigger>
                        </TabsList>
                        
                        {/* Only show "Buat Kelas Baru" button for institutional classes tab */}
                        {activeTab === "classes" && (
                            <Button 
                                className="font-semibold transition-all hover:opacity-90"
                                style={{ backgroundColor: '#E8B824', color: '#1A1A1A' }}
                                onClick={() => setIsModalOpen(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Buat Kelas Baru
                            </Button>
                        )}
                        
                        {/* Only show "Buat Baru" button for open courses tab */}
                        {activeTab === "open-courses" && openCourses.length > 0 && (
                            <Button 
                                className="font-semibold transition-all hover:opacity-90"
                                style={{ backgroundColor: '#E8B824', color: '#1A1A1A' }}
                                onClick={() => router.push('/teacher/courses/new')}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Buat Baru
                            </Button>
                        )}
                    </div>

                    <TabsContent value="classes" className="space-y-6 mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {classrooms.map((classroom, index) => (
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
                                          ✓ Aktif ({classroom.students.length})
                                        </Badge>
                                      </div>
                                      <CardDescription className="text-xs" style={{ color: "#4A4A4A" }}>
                                        {classroom.description || "Belum ada deskripsi"}
                                      </CardDescription>
                                    </CardHeader>
                                    
                                    <CardContent className="space-y-3 pt-1 flex-grow">
                                    </CardContent>

                                    {/* Action Buttons */}
                                    <div className="px-4 pb-4 pt-2 space-y-2 flex flex-col gap-2 flex-shrink-0 border-t" style={{ borderColor: 'rgba(232, 184, 36, 0.1)' }}>
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
                                        onClick={() => {
                                          console.log("Navigating to classroom with id:", classroom.id);
                                          router.push(`/home/classrooms/${classroom.id}`);
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                      >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Lihat Kelas
                                      </Button>
                                    </div>
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
                                    className="font-semibold px-6 transition-all hover:opacity-90 disabled:opacity-50"
                                    style={{ backgroundColor: '#E8B824', color: '#1A1A1A' }}
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
                                className="rounded-2xl flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer backdrop-blur-sm"
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
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-2xl font-bold flex items-center gap-2 mb-2 group-hover:text-yellow-600 transition-colors" style={{ color: '#1A1A1A' }}>
                                                <Globe className="h-6 w-6" style={{ color: '#E8B824' }} />
                                                Kelas Terbuka
                                            </CardTitle>
                                            <CardDescription className="text-base" style={{ color: '#4A4A4A' }}>
                                                Buat kelas mandiri yang dapat diakses oleh siapa saja. Tambahkan modul pembelajaran dan kelola siswa dengan mudah.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg" style={{backgroundColor: '#F5F5F5', borderColor: '#E5E5E5', borderWidth: '1px'}}>
                                            <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#1A1A1A' }}>
                                                <Globe className="h-4 w-4" style={{ color: '#E8B824' }} />
                                                Akses Publik
                                            </h4>
                                            <p className="text-sm" style={{ color: '#4A4A4A' }}>Kelas dapat ditemukan dan dipelajari oleh semua orang</p>
                                        </div>
                                        <div className="p-4 rounded-lg" style={{backgroundColor: '#F5F5F5', borderColor: '#E5E5E5', borderWidth: '1px'}}>
                                            <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#1A1A1A' }}>
                                                <Target className="h-4 w-4" style={{ color: '#E8B824' }} />
                                                Mandiri
                                            </h4>
                                            <p className="text-sm" style={{ color: '#4A4A4A' }}>Siswa belajar dengan kecepatan mereka sendiri</p>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={() => router.push('/teacher/courses/new')}
                                        className="w-full font-semibold h-11 transition-all hover:opacity-90"
                                        style={{ backgroundColor: '#E8B824', color: '#1A1A1A' }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Buat Kelas Terbuka Pertama Anda
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {openCourses.map((course) => (
                                        <Card 
                                            key={course.id} 
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
                                                    <CardTitle className="text-lg font-bold text-ellipsis line-clamp-2 group-hover:text-yellow-600 transition-colors" style={{ color: '#1A1A1A' }}>
                                                        {course.title}
                                                    </CardTitle>
                                                    <Badge 
                                                      className="flex-shrink-0 text-xs font-semibold px-2 py-1 whitespace-nowrap"
                                                      style={{
                                                        backgroundColor: '#FFF7ED',
                                                        color: '#B45309',
                                                        border: '1px solid #E87835'
                                                      }}
                                                    >
                                                      <Globe className="h-3 w-3 mr-1" />
                                                      Terbuka
                                                    </Badge>
                                                </div>
                                                <CardDescription className="text-xs" style={{ color: '#4A4A4A' }}>
                                                    {course.description}
                                                </CardDescription>
                                            </CardHeader>
                                            
                                            <CardContent className="space-y-3 pt-1 flex-grow">
                                                <div className="text-xs" style={{ color: '#999999' }}>
                                                    Dibuat: {new Date(course.created_at).toLocaleDateString('id-ID')}
                                                </div>
                                            </CardContent>

                                            {/* Action Buttons */}
                                            <div className="px-4 pb-4 pt-2 space-y-2 flex flex-col gap-2 flex-shrink-0 border-t" style={{ borderColor: 'rgba(232, 184, 36, 0.2)' }}>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => router.push(`/teacher/courses/${course.id}/modules`)}
                                                        className="flex-1 text-xs font-semibold rounded-lg transition-all hover:opacity-90"
                                                        style={{
                                                            backgroundColor: '#E8B824',
                                                            color: '#1A1A1A',
                                                        }}
                                                    >
                                                        <Edit2 className="h-3 w-3 mr-1" />
                                                        Edit Modul
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => router.push(`/open-courses/${course.id}/preview`)}
                                                        className="flex-1 text-xs font-semibold rounded-lg transition-all hover:opacity-90"
                                                        style={{
                                                            backgroundColor: '#FAF3EB',
                                                            borderColor: 'rgba(232, 184, 36, 0.2)',
                                                            color: '#1A1A1A',
                                                            border: '1px solid'
                                                        }}
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        Preview
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleDeleteCourse(course.id)}
                                                        className="text-xs rounded-lg transition-all hover:opacity-90"
                                                        style={{
                                                            borderColor: '#DC2626',
                                                            color: '#DC2626',
                                                            backgroundColor: 'transparent',
                                                            border: '1px solid'
                                                        }}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>  
                        )}
                    </TabsContent>
                </Tabs>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="rounded-2xl max-w-2xl backdrop-blur-xl p-0 overflow-hidden" style={{ 
                        backgroundColor: 'rgba(255, 255, 252, 0.98)',
                        borderColor: 'rgba(232, 184, 36, 0.4)', 
                        borderWidth: '2px',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)'
                    }}>
                        {/* Header dengan Accent */}
                        <div className="relative p-8 border-b-2" style={{ 
                            backgroundColor: 'linear-gradient(135deg, rgba(232, 184, 36, 0.08) 0%, rgba(232, 184, 36, 0.04) 100%)',
                            borderBottomColor: 'rgba(232, 184, 36, 0.2)'
                        }}>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-400 to-amber-300 rounded-full blur-3xl opacity-10 pointer-events-none"></div>
                            <DialogTitle className="text-3xl font-bold" style={{ color: '#1A1A1A' }}>Buat Kelas Baru</DialogTitle>
                            <DialogDescription className="text-base mt-2" style={{ color: '#4A4A4A' }}>
                                Atur jadwal pertemuan dan detail kelas Anda dengan rapi
                            </DialogDescription>
                        </div>

                        {/* Content */}
                        <div className="p-8 max-h-[65vh] overflow-y-auto space-y-6">
                            {/* Section 1: Info Dasar */}
                            <div>
                                <h3 className="text-sm font-bold mb-5" style={{ color: '#E8B824', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Informasi Dasar</h3>
                                
                                {/* Nama Kelas */}
                                <div className="mb-5">
                                    <label className="block mb-3 text-sm font-semibold" style={{ color: '#1A1A1A' }}>📚 Nama Kelas</label>
                                    <Input
                                        placeholder="Contoh: Bahasa Indonesia A2 - Lanjutan"
                                        value={newClassName}
                                        onChange={(e) => setNewClassName(e.target.value)}
                                        className="border-gray-200 focus:ring-2 transition-all h-11 rounded-lg text-base"
                                        style={{ 
                                            '--tw-ring-color': '#E8B824',
                                            '--tw-border-opacity': '1'
                                        } as React.CSSProperties}
                                    />
                                </div>

                                {/* Deskripsi */}
                                <div className="mb-5">
                                    <label className="block mb-3 text-sm font-semibold" style={{ color: '#1A1A1A' }}>✏️ Deskripsi Kelas</label>
                                    <Textarea
                                        placeholder="Jelaskan ringkas tentang kelas, materi, atau tujuan pembelajaran..."
                                        value={newClassDescription}
                                        onChange={(e) => setNewClassDescription(e.target.value)}
                                        className="border-gray-200 focus:ring-2 transition-all min-h-[100px] rounded-lg text-base"
                                        style={{ 
                                            '--tw-ring-color': '#E8B824'
                                        } as React.CSSProperties}
                                    />
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(232, 184, 36, 0.3), transparent)' }}></div>

                            {/* Section 2: Jumlah Pertemuan */}
                            <div>
                                <h3 className="text-sm font-bold mb-5" style={{ color: '#E8B824', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Konfigurasi Pertemuan</h3>
                                
                                <div className="mb-5">
                                    <label className="block mb-3 text-sm font-semibold" style={{ color: '#1A1A1A' }}>🗓️ Jumlah Pertemuan</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={numPertemuan}
                                        onChange={(e) => setNumPertemuan(parseInt(e.target.value) || 1)}
                                        className="border-gray-200 focus:ring-2 transition-all h-11 rounded-lg text-base"
                                        style={{ 
                                            '--tw-ring-color': '#E8B824'
                                        } as React.CSSProperties}
                                    />
                                    <p className="text-xs mt-2" style={{ color: '#4A4A4A' }}>💡 Tentukan berapa kali pertemuan dalam satu semester (1-20)</p>
                                </div>
                            </div>

                            {/* Section 3: Jadwal Mingguan */}
                            <div>
                                <h3 className="text-sm font-bold mb-5" style={{ color: '#E8B824', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jadwal Mingguan</h3>
                                
                                <div className="mb-5">
                                    <label className="block mb-3 text-sm font-semibold" style={{ color: '#1A1A1A' }}>📅 Hari Pertemuan</label>
                                    <select
                                        value={scheduleDay}
                                        onChange={(e) => setScheduleDay(parseInt(e.target.value))}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all text-base font-medium"
                                        style={{ 
                                            '--tw-ring-color': '#E8B824',
                                            color: '#1A1A1A'
                                        } as React.CSSProperties}
                                    >
                                        <option value={1}>📍 Senin</option>
                                        <option value={2}>📍 Selasa</option>
                                        <option value={3}>📍 Rabu</option>
                                        <option value={4}>📍 Kamis</option>
                                        <option value={5}>📍 Jumat</option>
                                        <option value={6}>📍 Sabtu</option>
                                        <option value={0}>📍 Minggu</option>
                                    </select>
                                </div>

                                <div className="mb-5">
                                    <label className="block mb-3 text-sm font-semibold" style={{ color: '#1A1A1A' }}>🕐 Jam Mulai Pertemuan</label>
                                    <Input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="border-gray-200 focus:ring-2 transition-all h-11 rounded-lg text-base"
                                        style={{ 
                                            '--tw-ring-color': '#E8B824'
                                        } as React.CSSProperties}
                                    />
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(232, 184, 36, 0.3), transparent)' }}></div>

                            {/* Section 4: Presensi Toggle */}
                            <div>
                                <h3 className="text-sm font-bold mb-5" style={{ color: '#E8B824', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pengaturan Presensi</h3>
                                
                                <div className="space-y-4">
                                    {/* Radio Button Group */}
                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all" style={{
                                            backgroundColor: hasAttendance ? 'rgba(232, 184, 36, 0.1)' : '#F3F4F6',
                                            border: hasAttendance ? '2px solid #E8B824' : '2px solid #E5E7EB'
                                        }}>
                                            <input
                                                type="radio"
                                                name="attendance"
                                                value="yes"
                                                checked={hasAttendance}
                                                onChange={() => setHasAttendance(true)}
                                                className="w-4 h-4 cursor-pointer"
                                                style={{ accentColor: '#E8B824' }}
                                            />
                                            <div>
                                                <p className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>✅ Ada Presensi</p>
                                                <p className="text-xs" style={{ color: '#4A4A4A' }}>Aktifkan sistem presensi</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all" style={{
                                            backgroundColor: !hasAttendance ? 'rgba(232, 184, 36, 0.1)' : '#F3F4F6',
                                            border: !hasAttendance ? '2px solid #E8B824' : '2px solid #E5E7EB'
                                        }}>
                                            <input
                                                type="radio"
                                                name="attendance"
                                                value="no"
                                                checked={!hasAttendance}
                                                onChange={() => setHasAttendance(false)}
                                                className="w-4 h-4 cursor-pointer"
                                                style={{ accentColor: '#E8B824' }}
                                            />
                                            <div>
                                                <p className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>❌ Tanpa Presensi</p>
                                                <p className="text-xs" style={{ color: '#4A4A4A' }}>Tidak pakai sistem presensi</p>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Conditional Attendance Time Inputs */}
                                    {hasAttendance && (
                                        <div className="mt-4 pt-4 border-t" style={{ borderTopColor: 'rgba(232, 184, 36, 0.2)' }}>
                                            <p className="text-sm mb-4" style={{ color: '#4A4A4A' }}>⏱️ Tentukan waktu pembukaan dan penutupan presensi</p>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block mb-2 text-sm font-semibold" style={{ color: '#1A1A1A' }}>Jam Mulai</label>
                                                    <Input
                                                        type="time"
                                                        value={attendanceStart}
                                                        onChange={(e) => setAttendanceStart(e.target.value)}
                                                        className="border-gray-200 focus:ring-2 transition-all h-11 rounded-lg text-base"
                                                        style={{ 
                                                            '--tw-ring-color': '#E8B824'
                                                        } as React.CSSProperties}
                                                    />
                                                    <p className="text-xs mt-2" style={{ color: '#4A4A4A' }}>15-30 min sebelum mulai</p>
                                                </div>

                                                <div>
                                                    <label className="block mb-2 text-sm font-semibold" style={{ color: '#1A1A1A' }}>Jam Selesai</label>
                                                    <Input
                                                        type="time"
                                                        value={attendanceEnd}
                                                        onChange={(e) => setAttendanceEnd(e.target.value)}
                                                        className="border-gray-200 focus:ring-2 transition-all h-11 rounded-lg text-base"
                                                        style={{ 
                                                            '--tw-ring-color': '#E8B824'
                                                        } as React.CSSProperties}
                                                    />
                                                    <p className="text-xs mt-2" style={{ color: '#4A4A4A' }}>10-15 min setelah mulai</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-4 border-l-4 rounded-lg backdrop-blur-sm" style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                    borderLeftColor: '#DC2626',
                                    color: '#DC2626'
                                }}>
                                    <p className="font-semibold text-sm">⚠️ Terjadi Kesalahan</p>
                                    <p className="text-sm mt-1">{error}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="px-8 py-6 border-t-2 flex gap-3 bg-gradient-to-r from-gray-50 to-white" style={{ 
                            borderTopColor: 'rgba(232, 184, 36, 0.1)'
                        }}>
                            <Button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 font-semibold h-12 rounded-lg transition-all text-base"
                                style={{
                                    backgroundColor: '#F3F4F6',
                                    color: '#1A1A1A',
                                    border: '1px solid #E5E7EB'
                                }}
                            >
                                Batal
                            </Button>
                            <Button 
                                onClick={createNewClass} 
                                disabled={isLoading || !newClassName.trim()}
                                className="flex-1 font-semibold h-12 rounded-lg transition-all text-base text-lg flex items-center justify-center gap-2"
                                style={{ 
                                    backgroundColor: isLoading || !newClassName.trim() ? '#D4AF37' : '#E8B824',
                                    color: '#1A1A1A',
                                    opacity: isLoading || !newClassName.trim() ? 0.6 : 1,
                                    cursor: isLoading || !newClassName.trim() ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-gray-200 rounded-full"></div>
                                        Membuat...
                                    </>
                                ) : (
                                    <>
                                        ✨ Buat Kelas
                                    </>
                                )}
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