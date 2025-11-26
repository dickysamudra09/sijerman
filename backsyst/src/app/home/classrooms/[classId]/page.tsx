"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  CheckCircle2,
  Clock,
  GraduationCap,
  BookOpen,
  Plus,
  Eye,
  Users,
  FileText,
  ClipboardList,
  Edit,
  ArrowLeft,
  Bell,
  User,
  Home,
  LogOut,
  ChevronDown,
  ChevronRight,
  Target,
  CheckSquare,
  PlayCircle
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

interface ContentItem {
  id: string;
  judul: string;
  sub_judul: string;
  jenis_create: string;
  konten: string;
  documents: { name: string; url: string }[];
  deadline: string | null;
  created_at: string;
}

interface ExerciseAttempt {
  id: string;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  status: string;
  submitted_at: string;
  attempt_number: number;
}

interface StudentSubmission {
  id: string;
  assignment_id: string;
  submitted_at: string;
  status: string;
}

export default function ClassroomsPage() {
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [classroom, setClassroom] = useState<ClassRoom | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceRecorded, setAttendanceRecorded] = useState(false);
  const [isRecordingAttendance, setIsRecordingAttendance] = useState(false);
  const [exerciseAttempts, setExerciseAttempts] = useState<Record<string, ExerciseAttempt[]>>({});
  const [studentSubmissions, setStudentSubmissions] = useState<Record<string, StudentSubmission>>({});
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;
  
  const [activeMenu, setActiveMenu] = useState<string>("Material");
  const [activeSubMenu, setActiveSubMenu] = useState<{menu: string, submenu: string}>({menu: "Material", submenu: "all"});
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(["Material"]));

  const [currentLatihan, setCurrentLatihan] = useState<{
    id: string;
    title: string;
    questionCount: number;
    attempts: ExerciseAttempt[];
  } | null>(null);
  const [showLatihanModal, setShowLatihanModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);

  const checkExerciseAttempts = async (userId: string) => {
    if (userRole !== 'student') return;

    try {
      const { data: attempts, error } = await supabase
        .from('exercise_attempts')
        .select(`
          id,
          exercise_set_id,
          total_score,
          max_possible_score,
          percentage,
          status,
          submitted_at,
          attempt_number
        `)
        .eq('student_id', userId)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error("Error fetching exercise attempts:", error);
        return;
      }

      const attemptsByExerciseSet: Record<string, ExerciseAttempt[]> = {};
      if (attempts) {
        attempts.forEach((attempt: any) => {
          if (!attemptsByExerciseSet[attempt.exercise_set_id]) {
            attemptsByExerciseSet[attempt.exercise_set_id] = [];
          }
          attemptsByExerciseSet[attempt.exercise_set_id].push(attempt);
        });
      }

      setExerciseAttempts(attemptsByExerciseSet);
    } catch (err) {
      console.error("Unexpected error checking exercise attempts:", err);
    }
  };

  const checkStudentSubmissions = async (userId: string) => {
    if (userRole !== 'student') return;

    try {
      const { data: submissions, error } = await supabase
        .from('student_submissions')
        .select(`id, assignment_id, submitted_at`)
        .eq('student_id', userId);

      if (error) {
        console.error("Error fetching student submissions:", error);
        return;
      }

      const submissionsByAssignment: Record<string, StudentSubmission> = {};
      if (submissions) {
        submissions.forEach((submission: any) => {
          submissionsByAssignment[submission.assignment_id] = submission;
        });
      }
      setStudentSubmissions(submissionsByAssignment);
    } catch (err) {
      console.error("Unexpected error checking student submissions:", err);
    }
  };

  const handleKerjakanLatihan = async (content: ContentItem) => {
    if (content.jenis_create.toLowerCase() === "tugas") {
      router.push(`/home/classrooms/${classId}/${content.id}`);
      return;
    }

    if (content.jenis_create.toLowerCase() !== "latihan soal") {
      router.push(`/home/classrooms/${classId}/latihan/${content.id}`);
      return;
    }

    try {
      const { data: exerciseSet, error } = await supabase
        .from("exercise_sets")
        .select("id, judul_latihan")
        .or(
          `konten_id.eq.${content.id},and(judul_latihan.eq.${content.sub_judul},kelas_id.eq.${classId})`
        )
        .maybeSingle();

      if (!exerciseSet || error) {
        console.error("Exercise set not found:", error);
        toast.error(
          "Latihan soal tidak ditemukan. Pastikan soal sudah dibuat."
        );
        return;
      }

      const { count, error: countError } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("exercise_set_id", exerciseSet.id);

      if (countError) {
        console.error("Error counting questions:", countError);
        toast.error("Gagal memuat detail latihan soal");
        return;
      }

      const attemptsForSet = exerciseAttempts[exerciseSet.id] || [];

      setCurrentLatihan({
        id: exerciseSet.id,
        title: content.sub_judul,
        questionCount: count || 0,
        attempts: attemptsForSet,
      });

      setShowLatihanModal(true);
    } catch (err) {
      console.error("Error fetching exercise details:", err);
      toast.error("Gagal memuat detail latihan soal");
    }
  };

  const handleStartNewAttempt = () => {
    if (!currentLatihan) return;
    router.push(`/home/classrooms/${classId}/latihan/${currentLatihan.id}`);
    setShowLatihanModal(false);
  };

  const recordAttendance = async (userId: string, classroomId: string) => {
    if (isRecordingAttendance) {
      console.log("Attendance recording already in progress, skipping...");
      return false;
    }

    setIsRecordingAttendance(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      let sessionId: string | null = null;
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.log("No active auth session found, will create manual session");
      }
      const { data: userSession, error: userSessionError } = await supabase
        .from("sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (userSessionError || !userSession) {
        const newSessionId = crypto.randomUUID();
        const { data: newSession, error: newSessionError } = await supabase
          .from("sessions")
          .insert({
            id: newSessionId,
            user_id: userId,
            is_active: true,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            user_agent: navigator.userAgent || 'Unknown',
            ip_address: '',
          })
          .select()
          .single();
        if (newSessionError) {
          console.error("Failed to create session:", newSessionError.message);
          toast.error("Gagal membuat sesi: " + newSessionError.message);
          return false;
        }
        sessionId = newSession.id;
      } else {
        sessionId = userSession.id;
      }
      const attendanceData: {
        id: string;
        classroom_id: string;
        student_id: string;
        session_id: string | null;
        date: string;
        is_present: boolean;
      } = {
        id: crypto.randomUUID(),
        classroom_id: classroomId,
        student_id: userId,
        session_id: sessionId,
        date: today,
        is_present: true,
      };
      const { data: attendanceResult, error: attendanceError } = await supabase
        .from("attendance")
        .upsert(
          attendanceData,
          {
            onConflict: 'student_id,classroom_id,date',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();
      if (attendanceError) {
        console.error("Failed to record attendance:", attendanceError.message);
        if (attendanceError.code === '23505') {
          console.log("Attendance already exists for today, treating as success");
          toast.info("Kehadiran hari ini sudah tercatat sebelumnya.");
          return true;
        } else if (attendanceError.code === '42501' || attendanceError.message.includes('RLS')) {
          console.error("RLS Policy blocking attendance insert. Check your RLS policies for attendance table.");
          toast.error("Tidak dapat mencatat kehadiran. Periksa pengaturan keamanan database.");
        } else {
          toast.error("Gagal mencatat kehadiran: " + attendanceError.message);
        }
        return false;
      } else {
        toast.success("Kehadiran hari ini telah dicatat!");
        return true;
      }
    } catch (err) {
      console.error("Error in recordAttendance:", err);
      toast.error("Terjadi kesalahan saat mencatat kehadiran.");
      return false;
    } finally {
      setIsRecordingAttendance(false);
    }
  };

  const checkTodayAttendance = async (userId: string, classroomId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("attendance")
        .select("id")
        .eq("student_id", userId)
        .eq("classroom_id", classroomId)
        .eq("date", today)
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking attendance:", error.message);
        return false;
      }
      if (data) {
        setAttendanceRecorded(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error in checkTodayAttendance:", err);
      return false;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setInitialLoading(true);
      setError(null);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.user) {
        setError("Tidak ada sesi ditemukan. Silakan masuk.");
        setIsLoading(false);
        setInitialLoading(false);
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
      if (userError) {
        setError("Gagal mengambil data pengguna: " + userError.message);
        setIsLoading(false);
        setInitialLoading(false);
        return;
      }
      if (!userData) {
        setError("Data pengguna tidak ditemukan.");
        setIsLoading(false);
        setInitialLoading(false);
        return;
      }
      setUserName(userData.name || "");
      setUserRole(userData.role);
      const alreadyRecorded = await checkTodayAttendance(userId, classId);
      if (userData.role === "teacher") {
        const { data: classroomData, error: classroomError } = await supabase
          .from("classrooms")
          .select("id, name, code, description, created_at")
          .eq("id", classId)
          .eq("teacher_id", userId)
          .single();
        if (classroomError) {
          setError("Kelas tidak ditemukan atau Anda tidak memiliki akses: " + classroomError.message);
          setIsLoading(false);
          setInitialLoading(false);
          return;
        }
        if (classroomData) {
          const { data: registrations, error: regError } = await supabase
            .from("classroom_registrations")
            .select("student_id")
            .eq("classroom_id", classId);
          if (regError) {
              console.error("Gagal mengambil registrasi:", regError.message);
              setError("Gagal mengambil registrasi: " + regError.message);
              setIsLoading(false);
              setInitialLoading(false);
              return;
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
          setClassroom({
              id: classroomData.id,
              name: classroomData.name,
              code: classroomData.code,
              description: classroomData.description || "",
              students,
              createdAt: classroomData.created_at,
          });
          if (!alreadyRecorded && !isRecordingAttendance) {
            const success = await recordAttendance(userId, classId);
            if (success) {
              setAttendanceRecorded(true);
            }
          }
        }
        const { data: contentsData, error: contentsError } = await supabase
          .from("teacher_create")
          .select("id, judul, sub_judul, jenis_create, konten, documents, deadline, created_at")
          .eq("kelas", classId)
          .order("created_at", { ascending: false });
        if (contentsError) {
          console.error("Gagal mengambil konten:", contentsError.message);
          setError("Gagal mengambil konten: " + contentsError.message);
        } else {
          setContents(contentsData || []);
        }
      } else if (userData.role === "student") {
        const { data: registration, error: regError } = await supabase
          .from("classroom_registrations")
          .select("classroom_id")
          .eq("classroom_id", classId)
          .eq("student_id", userId)
          .single();
        if (regError || !registration) {
          setError("Anda tidak terdaftar di kelas ini atau kelas tidak ditemukan.");
          setIsLoading(false);
          setInitialLoading(false);
          return;
        }
        const { data: classroomData, error: classroomError } = await supabase
          .from("classrooms")
          .select("id, name, code, description, created_at, teacher_id")
          .eq("id", classId)
          .single();
        if (classroomError || !classroomData) {
          setError("Kelas tidak ditemukan: " + (classroomError?.message || ""));
          setIsLoading(false);
          setInitialLoading(false);
          return;
        }
        const { data: teacherData, error: teacherError } = await supabase
          .from("users")
          .select("name")
          .eq("id", classroomData.teacher_id)
          .single();
        let teacherName = "Guru Tidak Dikenal";
        if (!teacherError && teacherData) {
          teacherName = teacherData.name || "Guru Tidak Dikenal";
        }
        const { data: registrations, error: regStudentsError } = await supabase
          .from("classroom_registrations")
          .select("student_id")
          .eq("classroom_id", classId);
        let students: Student[] = [];
        if (regStudentsError) {
          console.error("Gagal mengambil registrasi siswa lain:", regStudentsError.message);
        } else {
          const studentIds = registrations?.map(reg => reg.student_id);
          if (studentIds && studentIds.length > 0) {
            students = studentIds.map(id => ({
                id,
                name: '',
                email: '',
                progress: 0,
                last_active: new Date().toISOString(),
                completed_quizzes: 0,
                average_score: 0
            }));
          }
        }
        setClassroom({
          id: classroomData.id,
          name: classroomData.name,
          code: classroomData.code,
          description: classroomData.description || "",
          students,
          createdAt: classroomData.created_at,
          teacherName,
        });
        if (!alreadyRecorded && !isRecordingAttendance) {
          const success = await recordAttendance(userId, classId);
          if (success) {
            setAttendanceRecorded(true);
          }
        }
        await checkExerciseAttempts(userId);
        await checkStudentSubmissions(userId);
        const { data: contentsData, error: contentsError } = await supabase
          .from("teacher_create")
          .select("id, judul, sub_judul, jenis_create, konten, documents, deadline, created_at")
          .eq("kelas", classId)
          .order("created_at", { ascending: false });
        if (contentsError) {
          console.error("Gagal mengambil konten:", contentsError.message);
          setError("Gagal mengambil konten: " + contentsError.message);
        } else {
          setContents(contentsData || []);
        }
      } else {
        setError("Role pengguna tidak valid.");
        setIsLoading(false);
        setInitialLoading(false);
        return;
      }
      setIsLoading(false);
      setInitialLoading(false);
    };
    fetchData();
  }, [classId, router, userRole]);

  useEffect(() => {
    if (contents.length > 0) {
      setExpandedMenus(new Set(['Material']));
      setActiveMenu('Material');
      setActiveSubMenu({menu: 'Material', submenu: 'all'});
    }
  }, [contents]);

  const groupedContents = useMemo(() => {
    const groups: Record<string, ContentItem[]> = {
      'Material': [],
      'Tugas': [],
      'Latihan Soal': [],
    };
    
    contents.forEach(content => {
      let normalizedKey = content.jenis_create.trim().toLowerCase();
      switch (normalizedKey) {
        case 'materi':
          groups['Material'].push(content);
          break;
        case 'tugas':
          groups['Tugas'].push(content);
          break;
        case 'latihan soal':
          groups['Latihan Soal'].push(content);
          break;
        default:
          if (normalizedKey.includes('tugas')) {
            groups['Tugas'].push(content);
          } else if (normalizedKey.includes('latihan') || normalizedKey.includes('soal')) {
            groups['Latihan Soal'].push(content);
          } else {
            groups['Material'].push(content);
          }
          break;
      }
    });
    return groups;
  }, [contents]);

  const filteredContents = useMemo(() => {
    const menuContents = groupedContents[activeSubMenu.menu] || [];
    
    switch (activeSubMenu.submenu) {
      case 'pending':
        return menuContents.filter(content => {
          if (activeSubMenu.menu === 'Tugas') {
            const submission = studentSubmissions[content.id];
            return !submission && (!content.deadline || new Date(content.deadline) > new Date());
          }
          if (activeSubMenu.menu === 'Latihan Soal') {
            const attempts = exerciseAttempts[content.id];
            return !attempts || attempts.length === 0;
          }
          return true;
        });
        
      case 'submitted':
        return menuContents.filter(content => {
          if (activeSubMenu.menu === 'Tugas') {
            return studentSubmissions[content.id];
          }
          if (activeSubMenu.menu === 'Latihan Soal') {
            const attempts = exerciseAttempts[content.id];
            return attempts && attempts.length > 0;
          }
          return true;
        });
        
      case 'completed':
        return menuContents.filter(content => {
          if (activeSubMenu.menu === 'Latihan Soal') {
            const attempts = exerciseAttempts[content.id];
            return attempts && attempts.length > 0;
          }
          return true;
        });
        
      case 'available':
        return menuContents.filter(content => {
          if (activeSubMenu.menu === 'Latihan Soal') {
            const attempts = exerciseAttempts[content.id];
            return !attempts || attempts.length === 0;
          }
          return true;
        });
        
      case 'videos':
        return menuContents.filter(content => 
          content.documents?.some(doc => 
            ['mp4', 'mov', 'avi', 'mkv'].includes(doc.name.split('.').pop()?.toLowerCase() || '')
          )
        );
        
      case 'documents':
        return menuContents.filter(content => 
          content.documents?.some(doc => 
            ['pdf', 'doc', 'docx', 'txt'].includes(doc.name.split('.').pop()?.toLowerCase() || '')
          )
        );
        
      case 'presentations':
        return menuContents.filter(content => 
          content.documents?.some(doc => 
            ['ppt', 'pptx'].includes(doc.name.split('.').pop()?.toLowerCase() || '')
          )
        );
        
      default:
        return menuContents;
    }
  }, [groupedContents, activeSubMenu, studentSubmissions, exerciseAttempts]);

  const getGroupTitle = (key: string) => {
    switch (key) {
      case 'Material':
        return 'Material';
      case 'Tugas':
        return 'Tugas';
      case 'Latihan Soal':
        return 'Latihan Soal';
      default:
        return key;
    }
  };

  const getGroupIcon = (key: string) => {
    switch (key) {
      case 'Material':
        return <BookOpen className="h-5 w-5" />;
      case 'Tugas':
        return <FileText className="h-5 w-5" />;
      case 'Latihan Soal':
        return <Target className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getContentDescription = (key: string) => {
    switch(key) {
      case 'Material':
        return 'Akses materi pembelajaran, video, dan bacaan';
      case 'Tugas':
        return 'Lihat dan kumpulkan tugas Anda';
      case 'Latihan Soal':
        return 'Kerjakan latihan soal untuk menguji pemahaman';
      default:
        return '';
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout Error:", error.message);
      toast.error("Gagal keluar. Silakan coba lagi.");
    } else {
      router.push("/auth/login");
    }
  };

  const calculateProgress = () => {
    if (contents.length === 0) return 0;
    const completedCount = contents.filter(content => {
      if (content.jenis_create.toLowerCase() === "latihan soal") {
        return exerciseAttempts[content.id] && exerciseAttempts[content.id].length > 0;
      }
      if (content.jenis_create.toLowerCase() === "tugas") {
        return studentSubmissions[content.id];
      }
      return false;
    }).length;
    return Math.round((completedCount / contents.length) * 100);
  };

  const toggleMenu = (menu: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menu)) {
        newSet.delete(menu);
      } else {
        newSet.add(menu);
      }
      return newSet;
    });
    setActiveMenu(menu);
    setActiveSubMenu({menu, submenu: 'all'});
  };

  const handleSubMenuClick = (menu: string, submenu: string) => {
  setActiveMenu(menu);
  setActiveSubMenu({menu, submenu});
};

  const getSubMenuItems = (menu: string) => {
    switch (menu) {
      case 'Material':
        return [
          { key: 'all', label: 'Semua Materi', icon: <BookOpen className="h-4 w-4" /> },
          { key: 'videos', label: 'Video Pembelajaran', icon: <PlayCircle className="h-4 w-4" /> },
          { key: 'documents', label: 'Dokumen & PDF', icon: <FileText className="h-4 w-4" /> },
          { key: 'presentations', label: 'Presentasi', icon: <ClipboardList className="h-4 w-4" /> }
        ];
      case 'Tugas':
        return [
          { key: 'all', label: 'Semua Tugas', icon: <FileText className="h-4 w-4" /> },
          { key: 'pending', label: 'Tugas Tertunda', icon: <Clock className="h-4 w-4" /> },
          { key: 'submitted', label: 'Tugas Dikumpulkan', icon: <CheckSquare className="h-4 w-4" /> },
          { key: 'graded', label: 'Tugas Dinilai', icon: <CheckCircle2 className="h-4 w-4" /> }
        ];
      case 'Latihan Soal':
        return [
          { key: 'all', label: 'Semua Latihan', icon: <Target className="h-4 w-4" /> },
          { key: 'available', label: 'Latihan Tersedia', icon: <Target className="h-4 w-4" /> },
          { key: 'completed', label: 'Latihan Selesai', icon: <CheckCircle2 className="h-4 w-4" /> }
        ];
      default:
        return [];
    }
  };

  const getContentStatus = (content: ContentItem) => {
    const jenis = content.jenis_create.toLowerCase();
    
    if (jenis === "tugas") {
      const submission = studentSubmissions[content.id];
      if (submission) {
        return { label: "Terkumpul", color: "bg-green-100 text-green-700" };
      }
      if (content.deadline) {
        const now = new Date();
        const deadline = new Date(content.deadline);
        if (now > deadline) {
          return { label: "Terlambat", color: "bg-red-100 text-red-700" };
        }
        return { label: "Dalam Proses", color: "bg-yellow-100 text-yellow-700" };
      }
      return { label: "Belum Dikerjakan", color: "bg-gray-200 text-gray-700" };
    }

    if (jenis === "latihan soal") {
      const attempts = exerciseAttempts[content.id];
      if (attempts && attempts.length > 0) {
        return { label: "Selesai", color: "bg-green-100 text-green-700" };
      }
      return { label: "Tersedia", color: "bg-blue-100 text-blue-700" };
    }

    return null;
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
            <CardContent className="flex items-center justify-center p-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Memuat kelas...</p>
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
          <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle className="text-red-600 text-xl">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-6">{error}</p>
              <Button
                onClick={() => router.push(userRole === "teacher" ? "/home/teacher" : "/home/student")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Kembali ke Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle className="text-red-600 text-xl">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-6">Kelas tidak ditemukan</p>
              <Button
                onClick={() => router.push(userRole === "teacher" ? "/home/teacher" : "/home/student")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Kembali ke Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm px-6 py-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Link href="/home" className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-semibold text-gray-900">
              Si Jerman
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full hover:bg-gray-100"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
          </Button>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex items-center justify-center rounded-full transition-colors hover:bg-gray-100"
              >
                <User className="h-5 w-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-56 rounded-lg shadow-lg bg-white border border-gray-200"
            >
              <DropdownMenuLabel className="font-semibold text-gray-900">
                {userName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link
                  href="/home"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-md"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/home/latihan-soal"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-md"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Latihan Soal
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-md"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{classroom.name}</h1>
            <p className="text-gray-600">{classroom.description}</p>
          </div>

          <div className="flex gap-6">
            {/* Sidebar */}
            <div className="w-80 flex-shrink-0">
              <Card className="bg-white border border-gray-200 rounded-xl shadow-sm sticky top-24">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Menu Kelas</h3>
                  <p className="text-xs text-gray-500 mb-6">Navigasi konten pembelajaran</p>
                  
                  {/* Back Button */}
                  <button
                    onClick={() => router.push(userRole === "teacher" ? "/home/teacher" : "/home/student")}
                    className="w-full flex items-center gap-3 px-4 py-3 mb-4 rounded-lg text-left transition-all text-gray-700 hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-medium">Kembali</span>
                  </button>
                  
                  <nav className="space-y-2">
                    {Object.keys(groupedContents).map((key) => {
                      const isExpanded = expandedMenus.has(key);
                      const isActive = activeMenu === key;
                      const subMenuItems = getSubMenuItems(key);
                      
                      return (
                        <div key={key}>
                          <button
                            onClick={() => toggleMenu(key)}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                              isActive 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {getGroupIcon(key)}
                              <span className="font-medium">{getGroupTitle(key)}</span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          
                          {/* Submenu */}
                          {isExpanded && (
                            <div className="mt-2 ml-4 space-y-1">
                              {subMenuItems.map((item) => (
                                <button
                                  key={item.key}
                                  onClick={() => handleSubMenuClick(key, item.key)}
                                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-all text-sm ${
                                    activeSubMenu.menu === key && activeSubMenu.submenu === item.key
                                      ? 'bg-blue-100 text-blue-700 font-medium'
                                      : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  {item.icon}
                                  <span>{item.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <CardHeader className="border-b border-gray-200 pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Isi konten
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Siswa Terdaftar</p>
                            <h3 className="text-2xl font-bold text-gray-900">{classroom.students.length}</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Clock className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Durasi Kursus</p>
                            <h3 className="text-2xl font-bold text-gray-900">8 Minggu</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Progress Anda</p>
                            <h3 className="text-2xl font-bold text-gray-900">{calculateProgress()}%</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* View Course Overview Button */}
                  {userRole === "teacher" ? (
                    <Button
                      onClick={() => setShowContentModal(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg mb-8 text-base font-medium shadow-sm"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Buat Konten Baru
                    </Button>
                  ) : (
                    <Button
                      onClick={() => router.push(`/home/classrooms/${classId}/overview`)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg mb-8 text-base font-medium shadow-sm"
                    >
                      Lihat Ringkasan Kursus
                    </Button>
                  )}

                  {/* Course Materials */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {activeSubMenu.menu === 'Material' 
                        ? 'Materi Pembelajaran' 
                        : activeSubMenu.menu === 'Tugas' 
                        ? 'Daftar Tugas'
                        : 'Latihan Soal'
                      }
                    </h3>
                    <div className="space-y-4">
                      {filteredContents.length > 0 ? (
                        filteredContents.map((content, index) => {
                          const attempts = content.jenis_create.toLowerCase() === "latihan soal" ? exerciseAttempts[content.id] : null;
                          const studentSubmission = content.jenis_create.toLowerCase() === "tugas" ? studentSubmissions[content.id] : null;
                          const status = getContentStatus(content);

                          // Fungsi untuk membersihkan HTML tags dan menampilkan teks biasa
                          const stripHtml = (html: string) => {
                            if (!html) return 'Deskripsi konten tidak tersedia.';
                            const tmp = document.createElement('DIV');
                            tmp.innerHTML = html;
                            return tmp.textContent || tmp.innerText || '';
                          };

                          // Fungsi untuk mendapatkan judul yang tepat
                          const getDisplayTitle = () => {
                            if (activeSubMenu.menu === 'Material') {
                              return content.judul || 'Materi tanpa judul';
                            } else {
                              return content.sub_judul || content.judul || 'Konten tanpa judul';
                            }
                          };

                          // Fungsi untuk mendapatkan deskripsi yang tepat
                          const getDisplayDescription = () => {
                            const cleanContent = stripHtml(content.konten || '');
                            if (cleanContent && cleanContent.length > 150) {
                              return cleanContent.substring(0, 150) + '...';
                            }
                            return cleanContent || 'Deskripsi konten tidak tersedia.';
                          };

                          return (
                            <Card
                              key={content.id}
                              id={`content-${content.id}`}
                              className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
                            >
                              <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <h4 className="text-base font-semibold text-gray-900 mb-2">
                                      {getDisplayTitle()}
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-3">
                                      {getDisplayDescription()}
                                    </p>
                                  </div>
                                  {status && (
                                    <Badge className={`${status.color} ml-4 px-3 py-1 text-xs font-medium`}>
                                      {status.label}
                                    </Badge>
                                  )}
                                </div>

                                {/* Badges untuk dokumen */}
                                {content.documents && content.documents.length > 0 && (
                                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                                    {content.documents.map((doc, docIndex) => {
                                      const ext = doc.name.split('.').pop()?.toLowerCase();
                                      let badgeClass = 'bg-blue-100 text-blue-700';
                                      let label = 'Dokumen';
                                      
                                      if (ext === 'pdf') {
                                        badgeClass = 'bg-green-100 text-green-700';
                                        label = 'PDF';
                                      } else if (['ppt', 'pptx'].includes(ext || '')) {
                                        badgeClass = 'bg-purple-100 text-purple-700';
                                        label = 'Slide';
                                      } else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext || '')) {
                                        badgeClass = 'bg-blue-100 text-blue-700';
                                        label = 'Video';
                                      }

                                      return (
                                        <Badge key={docIndex} className={`${badgeClass} px-3 py-1 text-xs font-medium`}>
                                          {label}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Info tanggal dan tombol aksi */}
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-6 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">Dibuat:</span>
                                      <span>{new Date(content.created_at).toLocaleDateString('id-ID', { 
                                        day: 'numeric', 
                                        month: 'long', 
                                        year: 'numeric' 
                                      })}</span>
                                    </div>
                                    
                                    {activeSubMenu.menu === 'Tugas' && content.deadline && (
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium">Batas Waktu:</span>
                                        <span>{new Date(content.deadline).toLocaleDateString('id-ID', { 
                                          day: 'numeric', 
                                          month: 'long', 
                                          year: 'numeric' 
                                        })}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Buttons */}
                                  <div className="flex items-center gap-2">
                                    {userRole === "teacher" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                        onClick={() => router.push(`/home/classrooms/create?classId=${classId}&contentId=${content.id}`)}
                                      >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit
                                      </Button>
                                    )}
                                    
                                    {content.jenis_create.toLowerCase() === "latihan soal" ? (
                                      <>
                                        {attempts && attempts.length > 0 ? (
                                          <Button
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                            onClick={() => handleKerjakanLatihan(content)}
                                          >
                                            <Eye className="h-4 w-4 mr-1" />
                                            Lihat Riwayat
                                          </Button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                            onClick={() => handleKerjakanLatihan(content)}
                                          >
                                            Mulai Latihan
                                          </Button>
                                        )}
                                      </>
                                    ) : (
                                      <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => router.push(`/home/classrooms/${classId}/${content.id}`)}
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        Lihat
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Info tambahan untuk Latihan Soal yang sudah dikerjakan */}
                                {activeSubMenu.menu === 'Latihan Soal' && attempts && attempts.length > 0 && (
                                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 text-sm">
                                    <div>
                                      <span className="text-gray-600">Skor:</span>
                                      <p className="font-semibold text-gray-900">{attempts[0].total_score}/{attempts[0].max_possible_score}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Percobaan:</span>
                                      <p className="font-semibold text-gray-900">{attempts.length}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Status:</span>
                                      <p className="font-semibold text-green-600">Selesai</p>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })
                      ) : (
                        <div className="text-center py-16">
                          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak ada konten</h3>
                          <p className="text-gray-500 text-sm max-w-md mx-auto">
                            {userRole === "teacher"
                              ? `Belum ada ${activeSubMenu.menu.toLowerCase()} yang dibuat.`
                              : `Tidak ada ${activeSubMenu.menu.toLowerCase()} yang tersedia.`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Modal Latihan */}
        <Dialog open={showLatihanModal} onOpenChange={setShowLatihanModal}>
          <DialogContent className="bg-white border-0 shadow-xl rounded-xl max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-gray-900 text-xl">Latihan: {currentLatihan?.title}</DialogTitle>
              <DialogDescription className="text-gray-600">
                {currentLatihan?.attempts && currentLatihan.attempts.length > 0
                  ? `Anda telah menyelesaikan latihan ini ${currentLatihan.attempts.length} kali.`
                  : 'Anda belum mengerjakan latihan ini.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              {currentLatihan?.attempts && currentLatihan.attempts.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800">Riwayat Percobaan</h4>
                  {currentLatihan.attempts.map((attempt, index) => (
                    <Card key={attempt.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-all">
                      <CardContent className="p-4 flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-700">Percobaan #{attempt.attempt_number}</p>
                          <p className="text-xs text-gray-500">
                            Diselesaikan: {new Date(attempt.submitted_at).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 font-bold text-base px-4 py-2">
                          {attempt.percentage.toFixed(0)}%
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowLatihanModal(false)}
                  className="border-gray-300 text-gray-600"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleStartNewAttempt}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Mulai Percobaan Baru
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Create Content */}
        <Dialog open={showContentModal} onOpenChange={setShowContentModal}>
          <DialogContent className="bg-white border-0 shadow-xl rounded-xl lg:max-w-4xl w-full">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-gray-900 text-2xl font-bold">
                Buat Konten Baru
              </DialogTitle>
              <p className="text-gray-600 text-base">
                Pilih jenis konten yang ingin Anda buat untuk kelas ini.
              </p>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card
                className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer rounded-xl"
                onClick={() => {
                  router.push(`/home/classrooms/create?classId=${classId}`);
                  setShowContentModal(false);
                }}
              >
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <BookOpen className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <CardTitle className="text-gray-900 text-lg font-semibold">
                    Materi & Tugas
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center px-6 pb-6">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Buat materi pembelajaran atau tugas untuk siswa.
                  </p>
                </CardContent>
              </Card>

              <Card
                className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer rounded-xl"
                onClick={() => {
                  router.push(`/home/classrooms/latihanSoal?classId=${classId}`);
                  setShowContentModal(false);
                }}
              >
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <Target className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <CardTitle className="text-gray-900 text-lg font-semibold">
                    Latihan Soal
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center px-6 pb-6">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Buat soal latihan untuk menguji pemahaman siswa.
                  </p>
                </CardContent>
              </Card>

              <Card
                className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer rounded-xl"
                onClick={() => {
                  router.push(`/home/classrooms/kuis?classId=${classId}`);
                  setShowContentModal(false);
                }}
              >
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <ClipboardList className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                  <CardTitle className="text-gray-900 text-lg font-semibold">
                    Kuis
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center px-6 pb-6">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Buat kuis evaluasi singkat untuk siswa.
                  </p>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}