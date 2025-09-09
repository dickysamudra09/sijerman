"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  RotateCcw,
  Users,
  Code,
  FileText,
  ClipboardList,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowLeft, // Tambahkan ini
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";

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
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [activeContentId, setActiveContentId] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const [currentLatihan, setCurrentLatihan] = useState<{
    id: string;
    title: string;
    questionCount: number;
    attempts: ExerciseAttempt[];
  } | null>(null);
  const [showLatihanModal, setShowLatihanModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);

  useEffect(() => {
    if (highlightedId) {
      const timer = setTimeout(() => {
        setHighlightedId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedId]);

  const handleScrollAndHighlight = (id: string, groupKey: string) => {
    const element = document.getElementById(`content-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedId(id);
      setActiveContentId(id);
    }
    if (!openGroups.has(groupKey)) {
        setOpenGroups(prev => new Set(prev).add(groupKey));
    }
  };

  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

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

  // Efek baru untuk membuka semua grup menu secara otomatis
  useEffect(() => {
    if (contents.length > 0) {
      setOpenGroups(new Set(Object.keys(groupedContents)));
    }
  }, [contents]);


  const groupedContents = useMemo(() => {
    const groups: Record<string, ContentItem[]> = {
      'Materi': [],
      'Tugas': [],
      'Latihan soal': [],
      'Kuis': [],
    };
    contents.forEach(content => {
      let normalizedKey = content.jenis_create.trim().toLowerCase();
      switch (normalizedKey) {
        case 'materi':
          groups['Materi'].push(content);
          break;
        case 'tugas':
          groups['Tugas'].push(content);
          break;
        case 'latihan soal':
          groups['Latihan soal'].push(content);
          break;
        case 'kuis':
          groups['Kuis'].push(content);
          break;
        default:
          if (!groups[content.jenis_create]) {
            groups[content.jenis_create] = [];
          }
          groups[content.jenis_create].push(content);
          break;
      }
    });
    return groups;
  }, [contents]);

  const getGroupTitle = (key: string) => {
    switch (key.toLowerCase()) {
      case 'materi':
        return 'Materi Pembelajaran';
      case 'latihan soal':
        return 'Latihan Soal';
      case 'kuis':
        return 'Kuis';
      case 'tugas':
        return 'Tugas';
      default:
        return key;
    }
  };

  const getGroupIcon = (key: string) => {
    switch (key.toLowerCase()) {
      case 'materi':
        return <BookOpen className="h-4 w-4" />;
      case 'latihan soal':
        return <FileText className="h-4 w-4" />;
      case 'kuis':
        return <ClipboardList className="h-4 w-4" />;
      case 'tugas':
        return <ClipboardList className="h-4 w-4" />;
      default:
        return null;
    }
  }

  const getColorsForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'latihan soal':
        return {
          cardBorder: "border-l-orange-500",
          cardBg: "bg-orange-50",
          badgeBg: "bg-orange-100",
          badgeText: "text-orange-700",
          buttonBg: "bg-orange-500",
          buttonHoverBg: "hover:bg-orange-600",
          buttonText: "text-white",
          hoverColor: "hover:bg-orange-50",
          highlightColor: "ring-orange-500/50",
          sidebarActiveBg: "bg-gray-200",
          sidebarActiveText: "text-gray-900 font-semibold",
          sidebarHoverBg: "hover:bg-gray-100",
          sidebarBadgeBg: "bg-orange-200",
          sidebarBadgeText: "text-orange-800"
        };
      case 'materi':
        return {
          cardBorder: "border-l-blue-500",
          cardBg: "bg-blue-50",
          badgeBg: "bg-blue-100",
          badgeText: "text-blue-700",
          buttonBg: "bg-blue-500",
          buttonHoverBg: "hover:bg-blue-600",
          buttonText: "text-white",
          hoverColor: "hover:bg-blue-50",
          highlightColor: "ring-blue-500/50",
          sidebarActiveBg: "bg-gray-200",
          sidebarActiveText: "text-gray-900 font-semibold",
          sidebarHoverBg: "hover:bg-gray-100",
          sidebarBadgeBg: "bg-blue-200",
          sidebarBadgeText: "text-blue-800"
        };
      case 'kuis':
        return {
          cardBorder: "border-l-purple-500",
          cardBg: "bg-purple-50",
          badgeBg: "bg-purple-100",
          badgeText: "text-purple-700",
          buttonBg: "bg-purple-500",
          buttonHoverBg: "hover:bg-purple-600",
          buttonText: "text-white",
          hoverColor: "hover:bg-purple-50",
          highlightColor: "ring-purple-500/50",
          sidebarActiveBg: "bg-gray-200",
          sidebarActiveText: "text-gray-900 font-semibold",
          sidebarHoverBg: "hover:bg-gray-100",
          sidebarBadgeBg: "bg-purple-200",
          sidebarBadgeText: "text-purple-800"
        };
      case 'tugas':
        return {
          cardBorder: "border-l-green-500",
          cardBg: "bg-green-50",
          badgeBg: "bg-green-100",
          badgeText: "text-green-700",
          buttonBg: "bg-green-500",
          buttonHoverBg: "hover:bg-green-600",
          buttonText: "text-white",
          hoverColor: "hover:bg-green-50",
          highlightColor: "ring-green-500/50",
          sidebarActiveBg: "bg-gray-200",
          sidebarActiveText: "text-gray-900 font-semibold",
          sidebarHoverBg: "hover:bg-gray-100",
          sidebarBadgeBg: "bg-green-200",
          sidebarBadgeText: "text-green-800"
        };
      default:
        return {
          cardBorder: "border-l-gray-500",
          cardBg: "bg-gray-50",
          badgeBg: "bg-gray-100",
          badgeText: "text-gray-700",
          buttonBg: "bg-sky-500",
          buttonHoverBg: "hover:bg-sky-600",
          buttonText: "text-white",
          hoverColor: "hover:bg-gray-50",
          highlightColor: "ring-gray-500/50",
          sidebarActiveBg: "bg-gray-200",
          sidebarActiveText: "text-gray-900 font-semibold",
          sidebarHoverBg: "hover:bg-gray-100",
          sidebarBadgeBg: "bg-gray-200",
          sidebarBadgeText: "text-gray-800"
        };
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
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
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white shadow-2xl border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-red-600 text-xl">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-6">{error}</p>
              <Button
                onClick={() => router.push(userRole === "teacher" ? "/home/teacher" : "/home/student")}
                className="bg-sky-500 hover:bg-sky-600 text-white shadow-md"
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
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white shadow-2xl border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-red-600 text-xl">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-6">Kelas tidak ditemukan</p>
              <Button
                onClick={() => router.push(userRole === "teacher" ? "/home/teacher" : "/home/student")}
                className="bg-sky-500 hover:bg-sky-600 text-white shadow-md"
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
    <div className="min-h-screen bg-gray-100">
      <div className="w-full flex flex-col md:flex-row gap-6 p-6 md:p-8 lg:p-10 items-stretch">

        <Card className="bg-white shadow-2xl border-0 rounded-2xl w-full md:w-1/4 sticky top-6 self-start">
          <CardHeader className="p-6">
            <div className="flex items-center gap-3">
              {/* START: Perubahan Tombol Kembali */}
              <Button
                variant="outline"
                onClick={() =>
                  router.push(userRole === "teacher" ? "/home/teacher" : "/home/student")
                }
                className="border-gray-300 text-gray-600 shadow-sm hover:bg-gray-50 px-3 py-2.5"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              {/* END: Perubahan Tombol Kembali */}

              {/* START: Perubahan Judul Daftar Konten */}
              <div className="text-xl font-bold text-gray-900">
                Daftar Konten
              </div>
              {/* END: Perubahan Judul Daftar Konten */}
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-4">
            <nav className="space-y-1">
              {Object.keys(groupedContents).length > 0 ? (
                Object.keys(groupedContents).map((key) => {
                  const items = groupedContents[key];
                  const isOpen = openGroups.has(key);
                  const groupColors = getColorsForType(key);
                  
                  const materialCount = groupedContents['Materi']?.length || 0;
                  const assignmentCount = groupedContents['Tugas']?.length || 0;
                  const exerciseCount = groupedContents['Latihan soal']?.length || 0;
                  const quizCount = groupedContents['Kuis']?.length || 0;

                  return (
                    <div key={key}>
                        <Button 
                            variant="ghost" 
                            onClick={() => toggleGroup(key)}
                            className={`w-full justify-between text-left text-base font-medium text-gray-700 ${groupColors.sidebarHoverBg} ${isOpen ? 'bg-gray-100' : ''} px-6 py-3`}
                        >
                            <span className="flex items-center gap-3">
                                {getGroupIcon(key)}
                                {getGroupTitle(key)}
                            </span>
                            <div className="flex items-center gap-2">
                                {(key === 'Materi' && materialCount > 0) && (
                                    <Badge className={`${groupColors.sidebarBadgeBg} ${groupColors.sidebarBadgeText} text-xs px-2.5 py-0.5 rounded-full font-normal`}>
                                        {materialCount}
                                    </Badge>
                                )}
                                {(key === 'Tugas' && assignmentCount > 0) && (
                                    <Badge className={`${groupColors.sidebarBadgeBg} ${groupColors.sidebarBadgeText} text-xs px-2.5 py-0.5 rounded-full font-normal`}>
                                        {assignmentCount}
                                    </Badge>
                                )}
                                {(key === 'Latihan soal' && exerciseCount > 0) && (
                                    <Badge className={`${groupColors.sidebarBadgeBg} ${groupColors.sidebarBadgeText} text-xs px-2.5 py-0.5 rounded-full font-normal`}>
                                        {exerciseCount}
                                    </Badge>
                                )}
                                {(key === 'Kuis' && quizCount > 0) && (
                                    <Badge className={`${groupColors.sidebarBadgeBg} ${groupColors.sidebarBadgeText} text-xs px-2.5 py-0.5 rounded-full font-normal`}>
                                        {quizCount}
                                    </Badge>
                                )}
                                {isOpen ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                            </div>
                        </Button>
                        {isOpen && (
                            <div className="pl-8 border-l border-gray-200 ml-6 space-y-0.5">
                                {items.map((content) => {
                                    const itemColors = getColorsForType(content.jenis_create);
                                    const isActive = activeContentId === content.id;
                                    return (
                                        <a 
                                            key={content.id} 
                                            onClick={() => handleScrollAndHighlight(content.id, content.jenis_create)} 
                                            className="block cursor-pointer"
                                        >
                                            <Button 
                                                variant="ghost" 
                                                className={`w-full justify-start text-left text-sm py-2.5 rounded-lg 
                                                            ${itemColors.sidebarHoverBg} 
                                                            ${isActive ? `${itemColors.sidebarActiveBg} ${itemColors.sidebarActiveText}` : 'text-gray-600'}
                                                            `}
                                            >
                                                <span className="truncate">{content.jenis_create.toLowerCase() === 'latihan soal' || content.jenis_create.toLowerCase() === 'kuis' ? content.sub_judul : content.judul}</span>
                                            </Button>
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-sm italic p-4 pl-6">Belum ada konten.</p>
              )}
            </nav>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-2xl border-0 rounded-2xl w-full md:w-3/4">
          <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-gray-100 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-500 rounded-full shadow-lg">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">{classroom.name}</h1>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    {/* <h2 className="text-3xl font-bold text-gray-900">{classroom.name}</h2> */}
                    <p className="text-gray-600 mr-20">{classroom.description}</p>
                    {userRole === "student" && classroom.teacherName && (
                      <p className="text-sm text-gray-500 mt-1">Guru: {classroom.teacherName}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700 px-4 py-2 text-lg font-medium">
                    Kode: {classroom.code}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                    <CardContent className="p-6 flex items-center gap-4 min-h-[112px]">
                      <div className="p-4 bg-sky-100 rounded-full">
                        <Users className="h-6 w-6 text-sky-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{classroom.students.length}</h3>
                        <p className="text-sm text-gray-500">Total Siswa</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                    <CardContent className="p-6 flex items-center gap-4 min-h-[112px]">
                      <div className="p-4 bg-purple-100 rounded-full">
                        <Code className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{classroom.code}</h3>
                        <p className="text-sm text-gray-500">Kode Kelas</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                    <CardContent className="p-6 flex items-center gap-4 min-h-[112px]">
                      <div className="p-4 bg-lime-100 rounded-full">
                        <BookOpen className="h-6 w-6 text-lime-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{contents.length}</h3>
                        <p className="text-sm text-gray-500">Total Konten</p>
                      </div>
                    </CardContent>
                  </Card>

                  {userRole === "teacher" && (
                    <Card className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                      <CardContent className="p-6 flex items-center gap-4 min-h-[112px]">
                          <Button
                            onClick={() => setShowContentModal(true)}
                            className="w-full bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Buat Konten
                          </Button>
                      </CardContent>
                    </Card>
                  )}

                  {userRole === "student" && (
                    <Card className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                      <CardContent className="p-6 flex items-center gap-4 min-h-[112px]">
                        <div className="p-4 bg-green-100 rounded-full">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-green-600">Aktif</div>
                            <p className="text-sm text-gray-500">Status</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {Object.keys(groupedContents).length > 0 ? (
                Object.keys(groupedContents).map((key) => {
                  const items = groupedContents[key];
                  if (items.length === 0) return null;
                  
                  return (
                    <Card key={key} id={key.toLowerCase().replace(/\s/g, '-')} className="bg-gray-50 border border-gray-200 shadow-lg rounded-xl mt-6">
                      <CardHeader className="pb-6">
                        <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                          <div className="p-2 bg-sky-500 rounded-lg">
                            <BookOpen className="h-5 w-5 text-white" />
                          </div>
                          {getGroupTitle(key)}
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                          {getGroupTitle(key) === 'Materi Pembelajaran' && "Konten materi pembelajaran yang dapat Anda pelajari."}
                          {getGroupTitle(key) === 'Latihan Soal' && "Latihan soal untuk menguji pemahaman Anda."}
                          {getGroupTitle(key) === 'Kuis' && "Kuis untuk evaluasi singkat."}
                          {getGroupTitle(key) === 'Tugas' && "Tugas yang perlu Anda kumpulkan."}
                          {userRole === "teacher" && (
                              `Daftar ${getGroupTitle(key).toLowerCase()} yang telah Anda buat.`
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {items.map((content) => {
                          const attempts = content.jenis_create.toLowerCase() === "latihan soal" ? exerciseAttempts[content.id] : null;
                          const studentSubmission = content.jenis_create.toLowerCase() === "tugas" ? studentSubmissions[content.id] : null;
                          
                          const { cardBorder, cardBg, badgeBg, badgeText, buttonBg, buttonHoverBg, buttonText, highlightColor } = getColorsForType(content.jenis_create);

                          const deadlineBadgeColor = content.deadline
                            ? studentSubmission
                              ? "bg-green-50 border-green-200 text-green-700"
                              : "bg-red-50 border-red-200 text-red-700"
                            : "";
                          const isHighlighted = highlightedId === content.id;
                          return (
                            <Card 
                              key={content.id} 
                              id={`content-${content.id}`} 
                              className={`bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl border-l-4 ${cardBorder} ${isHighlighted ? `${cardBg} animate-pulse-once` : ''}`}
                            >
                              <CardContent className="p-6 flex flex-col justify-between min-h-[180px]">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg mb-2 text-gray-900 line-clamp-2">{content.judul}</h3>
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{content.sub_judul}</p>
                                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                                    <Badge variant="outline" className={`${badgeBg} ${badgeText} text-xs px-3 py-1`}>
                                      {getGroupTitle(content.jenis_create)}
                                    </Badge>
                                    {content.deadline && (
                                      <Badge variant="default" className={`${deadlineBadgeColor} text-xs px-3 py-1`}>
                                        <Clock className="h-3 w-3 mr-1" />
                                        Deadline: {new Date(content.deadline).toLocaleDateString('id-ID')}
                                      </Badge>
                                    )}
                                    {userRole === "student" && content.jenis_create.toLowerCase() === "tugas" && (
                                      <Badge
                                        variant="default"
                                        className={studentSubmission ? "bg-green-500 text-white" : "bg-red-500 text-white"}
                                      >
                                        {studentSubmission ? "Sudah Dikumpulkan" : "Belum Dikumpulkan"}
                                      </Badge>
                                    )}
                                    {attempts && attempts.length > 0 && (
                                      <Badge variant="secondary" className="bg-green-50 border-green-200 text-green-700 text-xs px-3 py-1">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Selesai: {attempts[0].percentage.toFixed(0)}%
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                  <p className="text-xs text-gray-500">
                                    Dibuat: {new Date(content.created_at).toLocaleString('id-ID', {
                                      dateStyle: 'full',
                                      timeStyle: 'short'
                                    })}
                                  </p>
                                  <div className="flex items-center gap-3">
                                    {content.jenis_create.toLowerCase() === "latihan soal" ? (
                                      <>
                                        {attempts && attempts.length > 0 ? (
                                          <Button
                                            variant="default"
                                            className={`${buttonBg} ${buttonHoverBg} transition-colors ${buttonText} shadow-md hover:shadow-lg`}
                                            onClick={() => handleKerjakanLatihan(content)}
                                          >
                                            <Eye className="h-4 w-4" />
                                            Lihat Riwayat
                                          </Button>
                                        ) : (
                                          <Button
                                            variant="default"
                                            className={`${buttonBg} ${buttonHoverBg} transition-colors ${buttonText} shadow-md hover:shadow-lg`}
                                            onClick={() => handleKerjakanLatihan(content)}
                                          >
                                            <Eye className="h-4 w-4" />
                                            Kerjakan
                                          </Button>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        {userRole === "teacher" && (
                                          <Button
                                            variant="outline"
                                            className="border-gray-300 text-gray-600 hover:bg-gray-50 shadow-sm"
                                            onClick={() => router.push(`/home/classrooms/create?classId=${classId}&contentId=${content.id}`)}
                                          >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                          </Button>
                                        )}
                                        <Button
                                          variant="default"
                                          className={`${buttonBg} ${buttonHoverBg} transition-colors ${buttonText} shadow-md hover:shadow-lg`}
                                          onClick={() => router.push(`/home/classrooms/${classId}/${content.id}`)}
                                        >
                                          <Eye className="h-4 w-4" />
                                          {content.jenis_create.toLowerCase() === "tugas" ? "Lihat" : "Review"}
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="bg-gray-50 border border-gray-200 shadow-lg rounded-xl">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                      <div className="p-2 bg-sky-500 rounded-lg">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      Daftar Konten
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {userRole === "teacher"
                        ? "Kelola konten pembelajaran yang telah Anda buat"
                        : "Konten pembelajaran yang tersedia di kelas ini"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-16">
                      <div className="p-4 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-3">
                        {userRole === "teacher"
                          ? "Belum ada konten yang dibuat"
                          : "Belum ada konten tersedia"
                        }
                      </h3>
                      <p className="text-gray-500 mb-8 max-w-md mx-auto">
                        {userRole === "teacher"
                          ? "Mulai dengan membuat konten pembelajaran pertama Anda untuk siswa di kelas ini."
                          : "Guru belum menambahkan konten pembelajaran di kelas ini. Silakan tunggu atau hubungi guru Anda."
                        }
                      </p>
                      {userRole === "teacher" && (
                        <Button
                          onClick={() => setShowContentModal(true)}
                          className="bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-lg"
                          size="lg"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Buat Konten Pertama
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
        </Card>
      </div>

      <Dialog open={showLatihanModal} onOpenChange={setShowLatihanModal}>
        <DialogContent className="bg-white border-0 shadow-2xl rounded-2xl max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 text-xl">Latihan: {currentLatihan?.title}</DialogTitle>
            <DialogDescription>
                {currentLatihan?.attempts && currentLatihan.attempts.length > 0
                    ? `Anda telah menyelesaikan latihan ini ${currentLatihan.attempts.length} kali.`
                    : 'Latihan ini belum pernah Anda kerjakan.'
                }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {currentLatihan?.attempts && currentLatihan.attempts.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Riwayat Pengerjaan</h4>
                    {currentLatihan.attempts.map((attempt, index) => (
                        <Card key={attempt.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-all">
                            <CardContent className="p-4 flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-700">Percobaan ke-{attempt.attempt_number}</p>
                                    <p className="text-xs text-gray-500">
                                        Diselesaikan pada: {new Date(attempt.submitted_at).toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <Badge className="bg-sky-100 text-sky-700 font-bold text-base px-4 py-2">
                                    {attempt.percentage.toFixed(0)}%
                                </Badge>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setShowLatihanModal(false)}
                className="border-gray-300 text-gray-600 shadow-sm hover:bg-gray-50"
              >
                Batal
              </Button>
              <Button
                onClick={handleStartNewAttempt}
                className="bg-sky-500 hover:bg-sky-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Mulai Percobaan Baru
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showContentModal} onOpenChange={setShowContentModal}>
        <DialogContent className="bg-white border-0 shadow-3xl rounded-2xl lg:max-w-[960px] w-full">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-gray-900 text-2xl font-bold">
              Buat Konten Baru
            </DialogTitle>
            <p className="text-gray-500 text-base">
              Pilih jenis konten yang ingin Anda buat untuk kelas ini.
            </p>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card
              className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer rounded-xl"
              onClick={() => {
                router.push(`/home/classrooms/create?classId=${classId}`);
                setShowContentModal(false);
              }}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center">
                  <div className="text-blue-600 p-4 bg-gray-50 rounded-full mb-4">
                    <BookOpen className="w-10 h-10" />
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
              className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer rounded-xl"
              onClick={() => {
                router.push(`/home/classrooms/latihanSoal?classId=${classId}`);
                setShowContentModal(false);
              }}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center">
                  <div className="text-green-600 p-4 bg-gray-50 rounded-full mb-4">
                    <FileText className="w-10 h-10" />
                  </div>
                </div>
                <CardTitle className="text-gray-900 text-lg font-semibold">
                  Latihan Soal
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center px-6 pb-6">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Buat paket soal latihan untuk menguji pemahaman siswa.
                </p>
              </CardContent>
            </Card>

            <Card
              className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer rounded-xl"
              onClick={() => {
                router.push(`/home/classrooms/kuis?classId=${classId}`);
                setShowContentModal(false);
              }}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center">
                  <div className="text-purple-600 p-4 bg-gray-50 rounded-full mb-4">
                    <ClipboardList className="w-10 h-10" />
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
    </div>
  );
}