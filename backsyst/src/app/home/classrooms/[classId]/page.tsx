"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  FileQuestion,
  GraduationCap as GraduationCapIcon,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

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
  const [exerciseAttempts, setExerciseAttempts] = useState<Record<string, ExerciseAttempt>>({});
  const [studentSubmissions, setStudentSubmissions] = useState<Record<string, StudentSubmission>>({});
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

  const [currentLatihan, setCurrentLatihan] = useState<{
    id: string;
    title: string;
    questionCount: number;
    attempt?: ExerciseAttempt;
  } | null>(null);
  const [showLatihanModal, setShowLatihanModal] = useState(false);

  // --- Check Exercise Attempts ---
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
          submitted_at
        `)
        .eq('student_id', userId)
        .eq('status', 'submitted');

      if (error) {
        console.error("Error fetching exercise attempts:", error);
        return;
      }

      const attemptsByExerciseSet: Record<string, ExerciseAttempt> = {};
      if (attempts) {
        attempts.forEach((attempt: any) => {
          attemptsByExerciseSet[attempt.exercise_set_id] = attempt;
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
      console.log("Mencari exercise set untuk content:", content.id);

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

      const existingAttempt = exerciseAttempts[exerciseSet.id];

      setCurrentLatihan({
        id: exerciseSet.id,
        title: content.sub_judul,
        questionCount: count || 0,
        attempt: existingAttempt,
      });

      setShowLatihanModal(true);
    } catch (err) {
      console.error("Error fetching exercise details:", err);
      toast.error("Gagal memuat detail latihan soal");
    }
  };


  const handleStartNewAttempt = async () => {
    if (!currentLatihan) return;

    try {
      if (currentLatihan.attempt && userId) {
        const { error: deleteError } = await supabase
          .from('exercise_attempts')
          .delete()
          .eq('exercise_set_id', currentLatihan.id)
          .eq('student_id', userId);

        if (deleteError) {
          console.error("Error deleting previous attempt:", deleteError);
          toast.error("Gagal menghapus percobaan sebelumnya");
          return;
        }

        const { error: deleteAnswersError } = await supabase
          .from('student_answers')
          .delete()
          .eq('attempt_id', currentLatihan.attempt.id);

        if (deleteAnswersError) {
          console.error("Error deleting previous answers:", deleteAnswersError);
        }
      }

      router.push(`/home/classrooms/${classId}/latihan/${currentLatihan.id}`);
      setShowLatihanModal(false);

      if (userId) {
        await checkExerciseAttempts(userId);
      }
    } catch (error) {
      console.error("Error starting new attempt:", error);
      toast.error("Gagal memulai percobaan baru");
    }
  };

  const recordAttendance = async (userId: string, classroomId: string) => {
    if (isRecordingAttendance) {
      console.log("Attendance recording already in progress, skipping...");
      return false;
    }

    setIsRecordingAttendance(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      console.log("Recording attendance for:", { userId, classroomId, date: today });

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

      console.log("Attempting to upsert attendance:", attendanceData);

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

      console.log("Attendance upsert result:", { attendanceResult, error: attendanceError });

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
        console.log("Attendance recorded successfully for date:", today);
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
        console.log("Attendance already recorded today");
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
      console.log("Mengambil data untuk classId:", classId);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("Respons sesi:", { sessionData, error: sessionError });

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
      console.log("Respons data pengguna:", { userData, error: userError });

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

        console.log("Respons kelas:", { classroomData, error: classroomError });

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

        // Perbaikan: Hapus filter `.eq("pembuat", userId)` agar guru dapat melihat semua konten di kelas
        const { data: contentsData, error: contentsError } = await supabase
          .from("teacher_create")
          .select("*")
          .eq("kelas", classId)
          .order("created_at", { ascending: false });

        console.log("Respons konten guru:", { contentsData, error: contentsError });

        if (contentsError) {
          console.error("Gagal mengambil konten:", contentsError.message);
          setError("Gagal mengambil konten: " + contentsError.message);
        } else {
          setContents(contentsData || []);
          console.log("Konten guru yang di-set:", contentsData);
        }

      } else if (userData.role === "student") {
        const { data: registration, error: regError } = await supabase
          .from("classroom_registrations")
          .select("classroom_id")
          .eq("classroom_id", classId)
          .eq("student_id", userId)
          .single();

        console.log("Respons registrasi siswa:", { registration, error: regError });

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

        console.log("Respons kelas siswa:", { classroomData, error: classroomError });

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
        
        // --- START PERBAIKAN UNTUK STUDENT ROLE ---
        // Ambil semua registrasi siswa di kelas ini
        const { data: registrations, error: regStudentsError } = await supabase
          .from("classroom_registrations")
          .select("student_id")
          .eq("classroom_id", classId);

        let students: Student[] = [];
        if (regStudentsError) {
          console.error("Gagal mengambil registrasi siswa lain:", regStudentsError.message);
        } else {
          // Buat array data siswa kosong, hanya untuk mendapatkan jumlahnya
          const studentIds = registrations?.map(reg => reg.student_id);
          if (studentIds && studentIds.length > 0) {
            // Karena student role tidak butuh data detail siswa lain, kita bisa mengosongkan array ini
            // namun jumlahnya tetap akan terhitung di students.length
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
        // --- END PERBAIKAN UNTUK STUDENT ROLE ---

        setClassroom({
          id: classroomData.id,
          name: classroomData.name,
          code: classroomData.code,
          description: classroomData.description || "",
          students, // Gunakan array siswa yang sudah diperbarui
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

        console.log("Mengambil konten untuk siswa di kelas:", classId, "dengan teacher_id:", classroomData.teacher_id);

        const { data: contentsData, error: contentsError } = await supabase
          .from("teacher_create")
          .select("*")
          .eq("kelas", classId)
          .order("created_at", { ascending: false });

        console.log("Respons konten siswa:", { contentsData, error: contentsError });

        if (contentsError) {
          console.error("Gagal mengambil konten:", contentsError.message);
          setError("Gagal mengambil konten: " + contentsError.message);
        } else {
          setContents(contentsData || []);
          console.log("Konten siswa yang di-set:", contentsData);
          console.log("Jumlah konten yang ditemukan:", contentsData?.length || 0);
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
          buttonText: "text-white"
        };
      case 'materi':
        return {
          cardBorder: "border-l-blue-500",
          cardBg: "bg-blue-50",
          badgeBg: "bg-blue-100",
          badgeText: "text-blue-700",
          buttonBg: "bg-blue-500",
          buttonHoverBg: "hover:bg-blue-600",
          buttonText: "text-white"
        };
      case 'kuis':
        return {
          cardBorder: "border-l-purple-500",
          cardBg: "bg-purple-50",
          badgeBg: "bg-purple-100",
          badgeText: "text-purple-700",
          buttonBg: "bg-purple-500",
          buttonHoverBg: "hover:bg-purple-600",
          buttonText: "text-white"
        };
      case 'tugas':
        return {
          cardBorder: "border-l-green-500",
          cardBg: "bg-green-50",
          badgeBg: "bg-green-100",
          badgeText: "text-green-700",
          buttonBg: "bg-green-500",
          buttonHoverBg: "hover:bg-green-600",
          buttonText: "text-white"
        };
      default:
        return {
          cardBorder: "border-l-gray-500",
          cardBg: "bg-gray-50",
          badgeBg: "bg-gray-100",
          badgeText: "text-gray-700",
          buttonBg: "bg-sky-500",
          buttonHoverBg: "hover:bg-sky-600",
          buttonText: "text-white"
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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-gray-100 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push(userRole === "teacher" ? "/home/teacher" : "/home/student")}
                  className="border-gray-300 text-gray-600 shadow-sm hover:bg-gray-50"
                >
                  ← Kembali
                </Button>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-500 rounded-full shadow-lg">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{classroom.name}</h1>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{classroom.name}</h2>
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
                          onClick={() => router.push(`/home/classrooms/hub?classId=${classroom.id}`)}
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

              {Object.keys(groupedContents).length > 0 ? (
                Object.keys(groupedContents).map((key) => {
                  const items = groupedContents[key];
                  if (items.length === 0) return null;

                  return (
                    <Card key={key} className="bg-gray-50 border border-gray-200 shadow-lg rounded-xl mt-6">
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
                          const exerciseAttempt = content.jenis_create.toLowerCase() === "latihan soal" ? exerciseAttempts[content.id] : null;
                          const studentSubmission = content.jenis_create.toLowerCase() === "tugas" ? studentSubmissions[content.id] : null;
                          
                          const { cardBorder, cardBg, badgeBg, badgeText, buttonBg, buttonHoverBg, buttonText } = getColorsForType(content.jenis_create);

                          const deadlineBadgeColor = content.deadline
                            ? studentSubmission
                              ? "bg-green-50 border-green-200 text-green-700"
                              : "bg-red-50 border-red-200 text-red-700"
                            : "";

                          return (
                            <Card key={content.id} className={`bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl border-l-4 ${cardBorder}`}>
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
                                    {exerciseAttempt && (
                                      <Badge variant="secondary" className="bg-green-50 border-green-200 text-green-700 text-xs px-3 py-1">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Selesai: {exerciseAttempt.percentage.toFixed(0)}%
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
                                        {exerciseAttempt ? (
                                          <Button
                                            variant="outline"
                                            className="border-gray-300 text-gray-600 cursor-not-allowed shadow-sm"
                                            disabled
                                          >
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Selesai
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
                                        {exerciseAttempt && (
                                          <Button
                                            variant="outline"
                                            className="border-orange-300 text-orange-600 hover:bg-orange-50 shadow-sm"
                                            onClick={() => handleKerjakanLatihan(content)}
                                          >
                                            <RotateCcw className="h-4 w-4 mr-2" />
                                            Coba Lagi
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
                          onClick={() => router.push(`/home/classrooms/create?classId=${classId}`)}
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
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={showLatihanModal} onOpenChange={setShowLatihanModal}>
        <DialogContent className="bg-white border-0 shadow-2xl rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 text-xl">Latihan: {currentLatihan?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Jumlah Pertanyaan</p>
                <p className="text-xl font-semibold text-gray-900">{currentLatihan?.questionCount}</p>
              </div>
              {currentLatihan?.attempt && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Skor Terakhir</p>
                  <p className="text-xl font-bold text-green-600">
                    {currentLatihan.attempt.percentage.toFixed(0)}%
                  </p>
                </div>
              )}
            </div>
            {currentLatihan?.attempt && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-700 leading-relaxed">
                  Anda sudah menyelesaikan latihan ini dengan skor{' '}
                  <strong>{currentLatihan.attempt.total_score}/{currentLatihan.attempt.max_possible_score}</strong>{' '}
                  ({currentLatihan.attempt.percentage.toFixed(0)}%)
                </p>
                <p className="text-xs text-green-600 mt-2">
                  Diselesaikan: {new Date(currentLatihan.attempt.submitted_at).toLocaleString('id-ID')}
                </p>
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
              {currentLatihan?.attempt ? (
                <Button
                  onClick={handleStartNewAttempt}
                  className="bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Mulai Ulang
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    router.push(`/home/classrooms/${classId}/latihan/${currentLatihan?.id}`);
                    setShowLatihanModal(false);
                  }}
                  className="bg-sky-500 hover:bg-sky-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Kerjakan Sekarang
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}