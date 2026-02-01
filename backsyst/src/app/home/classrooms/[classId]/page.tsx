"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
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
  Bell,
  User,
  Home,
  LogOut,
  Target,
  CheckSquare,
  PlayCircle,
  Menu,
  Lock,
  Calendar,
  Filter,
  X,
  ChevronRight,
  AlertCircle,
  Upload,
  Download,
  UploadCloud
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
  pertemuan?: number;
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
  file_url?: string;
  student_id?: string;
}

interface Meeting {
  number: number;
  title: string;
  date?: string;
  isCompleted: boolean;
  totalContents: number;
  completedContents: number;
}

type FilterType = "all" | "materi" | "tugas" | "latihan";

export default function ClassroomsPage() {
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [classroom, setClassroom] = useState<ClassRoom | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exerciseAttempts, setExerciseAttempts] = useState<Record<string, ExerciseAttempt[]>>({});
  const [studentSubmissions, setStudentSubmissions] = useState<Record<string, StudentSubmission>>({});
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;
  
  const [selectedMeeting, setSelectedMeeting] = useState<number>(1);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedContentType, setSelectedContentType] = useState<"materi" | "tugas" | "latihan" | "all">("all");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentLatihan, setCurrentLatihan] = useState<{
    id: string;
    title: string;
    questionCount: number;
    attempts: ExerciseAttempt[];
  } | null>(null);
  const [showLatihanModal, setShowLatihanModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [showContentPanel, setShowContentPanel] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [studentSubmissionStatus, setStudentSubmissionStatus] = useState<Record<string, StudentSubmission>>({});

  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedPertemuan, setSelectedPertemuan] = useState<number | null>(null);
  const [showContentTypeModal, setShowContentTypeModal] = useState(false);
  const [showConfirmBackModal, setShowConfirmBackModal] = useState(false);

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
        .select(`id, assignment_id, submitted_at, file_url, status`)
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
      
      setStudentSubmissionStatus(submissionsByAssignment);
    } catch (err) {
      console.error("Unexpected error checking student submissions:", err);
    }
  };

  const recordAttendance = async (userId: string, classroomId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let sessionId: string | null = null;
      
      const { data: userSession } = await supabase
        .from("sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (!userSession) {
        const newSessionId = crypto.randomUUID();
        const { data: newSession } = await supabase
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
        
        if (newSession) sessionId = newSession.id;
      } else {
        sessionId = userSession.id;
      }
      
      await supabase
        .from("attendance")
        .upsert(
          {
            id: crypto.randomUUID(),
            classroom_id: classroomId,
            student_id: userId,
            session_id: sessionId,
            date: today,
            is_present: true,
          },
          {
            onConflict: 'student_id,classroom_id,date',
            ignoreDuplicates: false
          }
        );
    } catch (err) {
      console.error("Error in recordAttendance:", err);
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
      
      if (userError || !userData) {
        setError("Gagal mengambil data pengguna");
        return;
      }
      
      setUserName(userData.name || "");
      setUserRole(userData.role);
      
      if (userData.role === "teacher") {
        const { data: classroomData } = await supabase
          .from("classrooms")
          .select("id, name, code, description, created_at")
          .eq("id", classId)
          .eq("teacher_id", userId)
          .single();
        
        if (classroomData) {
          const { data: registrations } = await supabase
            .from("classroom_registrations")
            .select("student_id")
            .eq("classroom_id", classId);
          
          const studentIds = registrations?.map(reg => reg.student_id) || [];
          let students: Student[] = [];
          
          if (studentIds.length > 0) {
            const { data: studentData } = await supabase
              .from("users")
              .select("id, name, email")
              .in("id", studentIds);
            
            if (studentData) {
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
        }
      } else if (userData.role === "student") {
        const { data: registration } = await supabase
          .from("classroom_registrations")
          .select("classroom_id")
          .eq("classroom_id", classId)
          .eq("student_id", userId)
          .single();
        
        if (!registration) {
          setError("Anda tidak terdaftar di kelas ini");
          return;
        }
        
        const { data: classroomData } = await supabase
          .from("classrooms")
          .select("id, name, code, description, created_at, teacher_id")
          .eq("id", classId)
          .single();
        
        if (classroomData) {
          const { data: teacherData } = await supabase
            .from("users")
            .select("name")
            .eq("id", classroomData.teacher_id)
            .single();
          
          const { data: registrations } = await supabase
            .from("classroom_registrations")
            .select("student_id")
            .eq("classroom_id", classId);
          
          const students = registrations?.map(reg => ({
            id: reg.student_id,
            name: '',
            email: '',
            progress: 0,
            last_active: new Date().toISOString(),
            completed_quizzes: 0,
            average_score: 0
          })) || [];
          
          setClassroom({
            id: classroomData.id,
            name: classroomData.name,
            code: classroomData.code,
            description: classroomData.description || "",
            students,
            createdAt: classroomData.created_at,
            teacherName: teacherData?.name || "Guru Tidak Dikenal",
          });
        }
        
        await recordAttendance(userId, classId);
        await checkExerciseAttempts(userId);
        await checkStudentSubmissions(userId);
      }
      
      const { data: contentsData } = await supabase
        .from("teacher_create")
        .select("id, judul, sub_judul, jenis_create, konten, documents, deadline, created_at, pertemuan")
        .eq("kelas", classId)
        .order("created_at", { ascending: false });
      
      if (contentsData) {
        const contentsWithMeeting = contentsData.map((content) => ({
          ...content,
          pertemuan: content.pertemuan || 1
        }));
        setContents(contentsWithMeeting);
      }
      
      setIsLoading(false);
      setInitialLoading(false);
    };
    
    fetchData();
  }, [classId, router, userRole]);

  const meetings: Meeting[] = useMemo(() => {
    const meetingMap = new Map<number, Meeting>();
    
    contents.forEach(content => {
      const meetingNum = content.pertemuan || 1;
      
      if (!meetingMap.has(meetingNum)) {
        meetingMap.set(meetingNum, {
          number: meetingNum,
          title: `Pertemuan ${meetingNum}`,
          isCompleted: false,
          totalContents: 0,
          completedContents: 0
        });
      }
      
      const meeting = meetingMap.get(meetingNum)!;
      meeting.totalContents++;

      const jenis = content.jenis_create.toLowerCase();
      if (jenis === "latihan soal") {
        if (exerciseAttempts[content.id]?.length > 0) {
          meeting.completedContents++;
        }
      } else if (jenis === "tugas") {
        if (studentSubmissions[content.id]) {
          meeting.completedContents++;
        }
      } else {
        meeting.completedContents++;
      }
    });
    
    const meetingsArray = Array.from(meetingMap.values()).sort((a, b) => a.number - b.number);
    
    meetingsArray.forEach(meeting => {
      meeting.isCompleted = meeting.completedContents === meeting.totalContents && meeting.totalContents > 0;
    });
    
    return meetingsArray;
  }, [contents, exerciseAttempts, studentSubmissions]);

  const filteredContents = useMemo(() => {
    let filtered = contents.filter(content => content.pertemuan === selectedMeeting);
    
    if (selectedContentType !== "all") {
      filtered = filtered.filter(content => {
        const jenis = content.jenis_create.toLowerCase();
        if (selectedContentType === "materi") return jenis === "materi";
        if (selectedContentType === "tugas") return jenis === "tugas";
        if (selectedContentType === "latihan") return jenis === "latihan soal";
        return true;
      });
    }
    
    if (activeFilter !== "all") {
      filtered = filtered.filter(content => {
        const jenis = content.jenis_create.toLowerCase();
        if (activeFilter === "materi") return jenis === "materi";
        if (activeFilter === "tugas") return jenis === "tugas";
        if (activeFilter === "latihan") return jenis === "latihan soal";
        return true;
      });
    }
    
    return filtered;
  }, [contents, selectedMeeting, activeFilter, selectedContentType]);

  const overallProgress = useMemo(() => {
    if (contents.length === 0) return 0;
    const completedCount = contents.filter(content => {
      const jenis = content.jenis_create.toLowerCase();
      if (jenis === "latihan soal") {
        return exerciseAttempts[content.id]?.length > 0;
      }
      if (jenis === "tugas") {
        return studentSubmissions[content.id];
      }
      return true;
    }).length;
    return Math.round((completedCount / contents.length) * 100);
  }, [contents, exerciseAttempts, studentSubmissions]);

  const getContentCountByType = (meetingNum: number, type: "materi" | "tugas" | "latihan") => {
    return contents.filter(content => {
      if (content.pertemuan !== meetingNum) return false;
      const jenis = content.jenis_create.toLowerCase();
      if (type === "materi") return jenis === "materi";
      if (type === "tugas") return jenis === "tugas";
      if (type === "latihan") return jenis === "latihan soal";
      return false;
    }).length;
  };

  const handleContentClick = (content: ContentItem) => {
    if (content.jenis_create.toLowerCase() === "latihan soal") {
      handleKerjakanLatihan(content);
    } else {
      router.push(`/home/classrooms/${classId}/${content.id}`);
    }
  };

  const handleKerjakanLatihan = async (content: ContentItem) => {
    if (content.jenis_create.toLowerCase() === "tugas") {
      router.push(`/home/classrooms/${classId}/${content.id}`);
      return;
    }

    try {
      const { data: exerciseSet } = await supabase
        .from("exercise_sets")
        .select("id, judul_latihan")
        .or(
          `konten_id.eq.${content.id},and(judul_latihan.eq.${content.sub_judul},kelas_id.eq.${classId})`
        )
        .maybeSingle();

      if (!exerciseSet) {
        toast.error("Latihan soal tidak ditemukan");
        return;
      }

      const { count } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("exercise_set_id", exerciseSet.id);

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

  const getContentStatus = (content: ContentItem) => {
    const jenis = content.jenis_create.toLowerCase();
    
    if (jenis === "tugas") {
      const submission = studentSubmissions[content.id];
      if (submission) {
        const isLate = isSubmissionLate(submission.submitted_at, content.deadline);
        if (isLate) {
          return { label: "Terkumpul (Terlambat)", color: "bg-red-100 text-red-700", icon: AlertCircle };
        }
        return { label: "Terkumpul", color: "bg-green-100 text-green-700", icon: CheckCircle2 };
      }
      if (content.deadline) {
        const now = new Date();
        const deadline = new Date(content.deadline);
        if (now > deadline) {
          return { label: "Terlambat", color: "bg-red-100 text-red-700", icon: AlertCircle };
        }
        return { label: "Dalam Proses", color: "bg-yellow-100 text-yellow-700", icon: Clock };
      }
      return { label: "Belum Dikerjakan", color: "bg-gray-200 text-gray-700", icon: Clock };
    }

    if (jenis === "latihan soal") {
      const attempts = exerciseAttempts[content.id];
      if (attempts && attempts.length > 0) {
        return { label: "Selesai", color: "bg-green-100 text-green-700", icon: CheckCircle2 };
      }
      return { label: "Tersedia", color: "bg-blue-100 text-blue-700", icon: Target };
    }

    return { label: "Lihat", color: "bg-blue-100 text-blue-700", icon: BookOpen };
  };

  const getContentIcon = (jenis: string) => {
    const jenisLower = jenis.toLowerCase();
    if (jenisLower === "materi") return BookOpen;
    if (jenisLower === "tugas") return FileText;
    if (jenisLower === "latihan soal") return Target;
    return BookOpen;
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Gagal keluar. Silakan coba lagi.");
    } else {
      router.push("/auth/login");
    }
  };

  const stripHtml = (html: string) => {
    if (!html) return 'Deskripsi konten tidak tersedia.';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const isSubmissionLate = (submittedAt: string, deadline: string | null) => {
    if (!deadline) return false;
    const submitted = new Date(submittedAt);
    const deadlineDate = new Date(deadline);
    return submitted > deadlineDate;
  };

  useEffect(() => {
    if (meetings.length > 0 && selectedMeeting === 1) {
      const firstIncomplete = meetings.find(m => !m.isCompleted);
      if (firstIncomplete) {
        setSelectedMeeting(firstIncomplete.number);
      }
    }
  }, [meetings]);

  const handleFileUpload = async (contentId: string) => {
    if (!selectedFile || isUploading || !userId) {
      toast.error("Pilih file terlebih dahulu.");
      return;
    }

    if (selectedFile.size > 12 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 12MB.");
      return;
    }

    setIsUploading(true);
    const uniqueFileName = `${Date.now()}_${selectedFile.name}`;
    const filePath = `${userId}/${contentId}/${uniqueFileName}`;

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw new Error("Gagal mengunggah file: " + uploadError.message);
      }

      const { data: fileUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      if (!fileUrlData || !fileUrlData.publicUrl) {
        throw new Error("Gagal mendapatkan URL publik.");
      }

      const { error: dbError } = await supabase
        .from('student_submissions')
        .upsert({
          assignment_id: contentId,
          student_id: userId,
          file_url: fileUrlData.publicUrl,
          submitted_at: new Date().toISOString(),
          status: 'submitted',
        }, { onConflict: 'assignment_id,student_id', ignoreDuplicates: false });

      if (dbError) {
        throw new Error("Gagal menyimpan data: " + dbError.message);
      }

      toast.success("Tugas berhasil dikumpulkan!");
      setStudentSubmissionStatus(prev => ({
        ...prev,
        [contentId]: {
          id: crypto.randomUUID(),
          assignment_id: contentId,
          student_id: userId,
          file_url: fileUrlData.publicUrl,
          submitted_at: new Date().toISOString(),
          status: 'submitted'
        }
      }));
      setSelectedFile(null);

    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat mengunggah tugas.");
    } finally {
      setIsUploading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Memuat kelas...</p>
        </div>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-6">{error || "Kelas tidak ditemukan"}</p>
            <Button
              onClick={() => router.push(userRole === "teacher" ? "/home/teacher" : "/home/student")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <MeetingSidebar
                    meetings={meetings}
                    selectedMeeting={selectedMeeting}
                    onSelectMeeting={(num) => {
                      setSelectedMeeting(num);
                      setIsMobileSidebarOpen(false);
                    }}
                  />
                </SheetContent>
              </Sheet>
              
              <Link href="/home" className="flex items-center space-x-2">
                <GraduationCap className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-semibold text-gray-900 hidden sm:inline">
                  Si Jerman
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-gray-100">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
              </Button>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-full bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-400 hover:border-blue-600 hover:bg-blue-100 text-blue-900 font-semibold shadow-sm transition-all duration-200 cursor-pointer" size="icon">
                    <User className="h-5 w-5 text-blue-700" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border-2 border-blue-300 shadow-lg">
                  <DropdownMenuLabel className="text-blue-900 font-bold">{userName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={userRole === "teacher" ? "/home/teacher" : "/home/student"} className="flex items-center cursor-pointer hover:bg-blue-50">
                      <Home className="mr-2 h-4 w-4 text-blue-600" />
                      <span className="text-gray-800">Kelas</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer hover:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Class Info & Progress */}
          <div className="mt-3 lg:mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{classroom.name}</h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-1">{classroom.description}</p>
              </div>
              
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Progress</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{overallProgress}%</p>
                </div>
                <div className="w-24 sm:w-28">
                  <Progress value={overallProgress} className="h-2" />
                </div>
              </div>
            </div>
            
            {/* Filter Menu */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(userRole === "teacher" ? "/home/teacher" : "/home/student")}
                className="flex items-center gap-1 flex-shrink-0 text-xs sm:text-sm bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                <span className="hidden sm:inline">Kembali</span>
              </Button>
              <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
              {[
                { key: "all" as FilterType, label: "Semua", icon: null },
                { key: "materi" as FilterType, label: "Materi", icon: BookOpen },
                { key: "tugas" as FilterType, label: "Tugas", icon: FileText },
                { key: "latihan" as FilterType, label: "Latihan Soal", icon: Target }
              ].map((filter) => {
                const Icon = filter.icon;
                return (
                  <Button
                    key={filter.key}
                    variant={activeFilter === filter.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter.key)}
                    className={`flex items-center gap-1 flex-shrink-0 text-xs sm:text-sm ${
                      activeFilter === filter.key
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className="hidden sm:inline">{filter.label}</span>
                    <span className="sm:hidden">{filter.label.split(' ')[0]}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-44 lg:pt-56 pb-10">
        <div className="flex h-full">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 fixed left-0 top-44 bottom-0 border-r border-gray-200 bg-white overflow-y-auto">
            <MeetingSidebar
              meetings={meetings}
              selectedMeeting={selectedMeeting}
              onSelectMeeting={setSelectedMeeting}
              userRole={userRole}
              onCreateContent={() => setShowMeetingModal(true)}
              selectedContentType={selectedContentType}
              onContentTypeChange={setSelectedContentType}
              getContentCountByType={getContentCountByType}
            />
          </aside>

          {/* Content Area */}
          <div className="flex-1 lg:ml-72 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              {/* Context Indicator */}
              <div className="mb-8 flex items-center text-xs sm:text-sm text-gray-600">
                <span className="font-semibold text-gray-900">Pertemuan {selectedMeeting}</span>
                <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
                <span className="text-gray-600">
                  {activeFilter === "all" && "Semua Konten"}
                  {activeFilter === "materi" && "Materi"}
                  {activeFilter === "tugas" && "Tugas"}
                  {activeFilter === "latihan" && "Latihan Soal"}
                </span>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
                <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600">Siswa</p>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">{classroom.students.length}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600">Pertemuan</p>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">{meetings.length}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600">Konten</p>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">{contents.length}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Create Button for Teacher */}
              {userRole === "teacher" && (
                <Button
                  onClick={() => setShowMeetingModal(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 mb-6"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Buat Pertemuan
                </Button>
              )}

              {/* Content List */}
              <div className="space-y-4">
                {filteredContents.length > 0 ? (
                  filteredContents.map((content) => {
                    const status = getContentStatus(content);
                    const Icon = getContentIcon(content.jenis_create);
                    const StatusIcon = status.icon;
                    const attempts = exerciseAttempts[content.id];
                    const submission = studentSubmissions[content.id];

                    return (
                      <Card
                        key={content.id}
                        className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        onClick={() => handleContentClick(content)}
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Icon className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 sm:gap-4 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 truncate">
                                    {content.sub_judul || content.judul}
                                  </h4>
                                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                    {stripHtml(content.konten).substring(0, 120)}...
                                  </p>
                                </div>
                                
                                <Badge className={`${status.color} flex items-center gap-1 px-2 sm:px-3 py-1 flex-shrink-0 text-xs sm:text-sm`}>
                                  <StatusIcon className="h-3 w-3" />
                                  <span className="hidden sm:inline">{status.label}</span>
                                  <span className="sm:hidden">{status.label.split(' ')[0]}</span>
                                </Badge>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500 mt-2 sm:mt-3">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{new Date(content.created_at).toLocaleDateString('id-ID')}</span>
                                </div>
                                
                                {content.deadline && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">Deadline: {new Date(content.deadline).toLocaleDateString('id-ID')}</span>
                                  </div>
                                )}
                                
                                {attempts && attempts.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Target className="h-3 w-3 flex-shrink-0" />
                                    <span>Skor: {attempts[0].percentage.toFixed(0)}%</span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
                                {userRole === "teacher" ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (content.jenis_create.toLowerCase() === "latihan soal") {
                                          router.push(`/home/classrooms/latihanSoal?classId=${classId}&exerciseId=${content.id}`);
                                        } else {
                                          router.push(`/home/classrooms/create?classId=${classId}&contentId=${content.id}`);
                                        }
                                      }}
                                      className="text-xs sm:text-sm"
                                    >
                                      <Edit className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
                                      <span className="hidden sm:inline">Edit</span>
                                      <span className="sm:hidden">Edit</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                                    >
                                      <Eye className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
                                      Lihat Detail
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    {content.jenis_create.toLowerCase() === "latihan soal" ? (
                                      <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                                      >
                                        {attempts && attempts.length > 0 ? (
                                          <>
                                            <Eye className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
                                            <span className="hidden sm:inline">Lihat Riwayat</span>
                                            <span className="sm:hidden">Riwayat</span>
                                          </>
                                        ) : (
                                          <>
                                            <PlayCircle className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
                                            <span className="hidden sm:inline">Mulai Latihan</span>
                                            <span className="sm:hidden">Mulai</span>
                                          </>
                                        )}
                                      </Button>
                                    ) : content.jenis_create.toLowerCase() === "tugas" ? (
                                      <Button
                                        size="sm"
                                        className={submission ? "bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm" : "bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"}
                                      >
                                        {submission ? (
                                          <>
                                            <CheckCircle2 className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
                                            <span className="hidden sm:inline">Lihat Pengumpulan</span>
                                            <span className="sm:hidden">Lihat</span>
                                          </>
                                        ) : (
                                          <>
                                            <FileText className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
                                            <span className="hidden sm:inline">Kumpulkan Tugas</span>
                                            <span className="sm:hidden">Kumpul</span>
                                          </>
                                        )}
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                                      >
                                        <BookOpen className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
                                        <span className="hidden sm:inline">Pelajari</span>
                                        <span className="sm:hidden">Baca</span>
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="bg-white border border-gray-200">
                    <CardContent className="p-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        Tidak ada konten
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {activeFilter === "all" 
                          ? `Belum ada konten untuk Pertemuan ${selectedMeeting}.`
                          : `Tidak ada ${activeFilter} untuk Pertemuan ${selectedMeeting}.`
                        }
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Content Panel */}
      <Sheet open={showContentPanel} onOpenChange={setShowContentPanel}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          {selectedContent && (
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-md flex-shrink-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    {(() => {
                      const Icon = getContentIcon(selectedContent.jenis_create);
                      return <Icon className="h-6 w-6 text-white" />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {selectedContent.sub_judul || selectedContent.judul}
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-white/30 text-white border-0 backdrop-blur-sm text-xs">
                        {selectedContent.jenis_create}
                      </Badge>
                      {selectedContent.deadline && (
                        <Badge className="bg-orange-400/30 text-orange-50 border-0 backdrop-blur-sm text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(selectedContent.deadline).toLocaleDateString('id-ID')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedContent.konten }} />

                {selectedContent.documents && selectedContent.documents.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Dokumen Terlampir</h3>
                    <div className="space-y-2">
                      {selectedContent.documents.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors group"
                        >
                          <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">{doc.name}</span>
                          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-auto group-hover:text-blue-600" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Tugas Section untuk Student */}
                {selectedContent.jenis_create.toLowerCase() === "tugas" && userRole === "student" && (
                  <div className="space-y-4 border-t pt-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Kumpulkan Tugas</h3>
                      <p className="text-sm text-gray-600">
                        Maksimal ukuran file 12MB
                        {selectedContent.deadline && (
                          <span className="block mt-1 text-orange-600 font-medium">
                            Deadline: {new Date(selectedContent.deadline).toLocaleDateString('id-ID', { 
                              weekday: 'long',
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric'
                            })}
                          </span>
                        )}
                      </p>
                    </div>

                    {!studentSubmissionStatus[selectedContent.id] ? (
                      <div className="space-y-4">
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const file = e.dataTransfer.files?.[0];
                            if (file) {
                              setSelectedFile(file);
                            }
                          }}
                          className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                        >
                          <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
                          <p className="text-sm text-gray-600 text-center mb-2">Drag file di sini atau</p>
                          <label htmlFor={`file-upload-${selectedContent.id}`} className="text-blue-600 font-medium hover:underline cursor-pointer">
                            Pilih dari komputer
                          </label>
                          <input
                            id={`file-upload-${selectedContent.id}`}
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedFile(file);
                              }
                            }}
                          />
                        </div>

                        {selectedFile && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-700 truncate">{selectedFile.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFile(null)}
                              className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 flex-shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        <Button
                          onClick={() => handleFileUpload(selectedContent.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={!selectedFile || isUploading}
                        >
                          {isUploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Mengunggah...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Kumpulkan Tugas
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(() => {
                          const submission = studentSubmissionStatus[selectedContent.id];
                          const isLate = isSubmissionLate(submission?.submitted_at || '', selectedContent.deadline);
                          return (
                            <>
                              <div className={`p-4 rounded-lg border ${
                                isLate 
                                  ? 'bg-red-50 border-red-200' 
                                  : 'bg-green-50 border-green-200'
                              }`}>
                                <div className="flex items-start gap-3">
                                  <CheckCircle2 className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                                    isLate 
                                      ? 'text-red-600' 
                                      : 'text-green-600'
                                  }`} />
                                  <div>
                                    <p className={`font-semibold ${
                                      isLate 
                                        ? 'text-red-800' 
                                        : 'text-green-800'
                                    }`}>
                                      {isLate ? 'Tugas dikumpulkan (Terlambat)' : 'Tugas berhasil dikumpulkan!'}
                                    </p>
                                    <p className={`text-xs mt-1 ${
                                      isLate 
                                        ? 'text-red-700' 
                                        : 'text-green-700'
                                    }`}>
                                      {new Date(submission?.submitted_at).toLocaleString('id-ID', { 
                                        dateStyle: 'full', 
                                        timeStyle: 'short' 
                                      })}
                                    </p>
                                    {isLate && selectedContent.deadline && (
                                      <p className="text-red-600 text-xs font-medium mt-2">
                                        Deadline: {new Date(selectedContent.deadline).toLocaleString('id-ID', { 
                                          dateStyle: 'full', 
                                          timeStyle: 'short' 
                                        })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                        <Button
                          variant="outline"
                          className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            const submission = studentSubmissionStatus[selectedContent.id];
                            if (submission?.file_url) {
                              const url = submission.file_url;
                              const fileName = `Tugas_${selectedContent.sub_judul}`;
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = fileName;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Unduh File Saya
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex-shrink-0">
                {selectedContent.jenis_create.toLowerCase() === "tugas" && userRole !== "student" && (
                  <Button
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                    onClick={() => setShowContentPanel(false)}
                  >
                    <X className="h-5 w-5 mr-2" />
                    Tutup
                  </Button>
                )}
                {selectedContent.jenis_create.toLowerCase() === "materi" && (
                  <Button
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                    onClick={() => setShowContentPanel(false)}
                  >
                    <X className="h-5 w-5 mr-2" />
                    Tutup
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Latihan Modal */}
      <Dialog open={showLatihanModal} onOpenChange={setShowLatihanModal}>
        <DialogContent className="bg-white max-w-xl border-0 shadow-xl rounded-xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              Latihan: {currentLatihan?.title}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              {currentLatihan?.attempts && currentLatihan.attempts.length > 0
                ? `Anda telah menyelesaikan latihan ini ${currentLatihan.attempts.length} kali. Mulai percobaan baru untuk meningkatkan skor Anda.`
                : 'Anda belum mengerjakan latihan ini. Mulai sekarang dan kuji kemampuan Anda!'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4 max-h-96 overflow-y-auto">
            {currentLatihan?.attempts && currentLatihan.attempts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  Riwayat Percobaan
                </h4>
                <div className="space-y-2">
                  {currentLatihan.attempts.map((attempt) => (
                    <Card key={attempt.id} className="border border-gray-200 hover:border-blue-300 transition-colors">
                      <CardContent className="p-4 flex justify-between items-center">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            Percobaan #{attempt.attempt_number}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(attempt.submitted_at).toLocaleString('id-ID', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-blue-100 text-blue-700 font-bold text-lg px-4 py-2 border-0">
                            {attempt.percentage.toFixed(0)}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {(!currentLatihan?.attempts || currentLatihan.attempts.length === 0) && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Percobaan</h4>
                <p className="text-sm text-gray-600">
                  Mulai mengerjakan latihan ini untuk merekam percobaan pertama Anda.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowLatihanModal(false)}
              className="flex-1"
            >
              Tutup
            </Button>
            <Button 
              onClick={handleStartNewAttempt} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Mulai Percobaan {currentLatihan?.attempts?.length ? currentLatihan.attempts.length + 1 : 1}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Content Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-white max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Buat Pertemuan</DialogTitle>
            <DialogDescription>
              Pilih jenis konten yang ingin Anda buat untuk kelas ini.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            <Card
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => {
                router.push(`/home/classrooms/create?classId=${classId}`);
                setShowCreateModal(false);
              }}
            >
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Materi & Tugas</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600">
                  Buat materi pembelajaran atau tugas untuk siswa.
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => {
                router.push(`/home/classrooms/latihanSoal?classId=${classId}`);
                setShowCreateModal(false);
              }}
            >
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-lg">Latihan Soal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600">
                  Buat soal latihan untuk menguji pemahaman siswa.
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => {
                router.push(`/home/classrooms/kuis?classId=${classId}`);
                setShowCreateModal(false);
              }}
            >
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Kuis</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600">
                  Buat kuis evaluasi singkat untuk siswa.
                </p>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 1: Pilih Pertemuan */}
      <Dialog open={showMeetingModal} onOpenChange={setShowMeetingModal}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Buat Konten Baru</DialogTitle>
            <DialogDescription>
              Pilih pertemuan ke berapa konten ini akan diberikan
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">Pertemuan</Label>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => {
                  const maxExistingMeeting = Math.max(...meetings.map(m => m.number), 0);
                  const isCreated = num <= maxExistingMeeting;
                  const isNextAvailable = num === maxExistingMeeting + 1;
                  const isDisabled = num > maxExistingMeeting + 1;
                  
                  let buttonClass = "p-2 rounded-lg border-2 font-semibold transition-all";
                  
                  if (isDisabled) {
                    buttonClass += " border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50";
                  } else if (isCreated) {
                    buttonClass += ` border-green-600 ${selectedPertemuan === num ? "bg-green-100 text-green-700" : "bg-green-50 text-green-700"} hover:border-green-700`;
                  } else if (isNextAvailable) {
                    buttonClass += ` border-purple-500 ${selectedPertemuan === num ? "bg-purple-100 text-purple-700" : "bg-purple-50 text-purple-700"} hover:border-purple-600 cursor-pointer`;
                  }
                  
                  return (
                    <button
                      key={num}
                      onClick={() => !isDisabled && setSelectedPertemuan(num)}
                      disabled={isDisabled}
                      className={buttonClass}
                      title={isDisabled ? `Buat pertemuan ${maxExistingMeeting + 1} terlebih dahulu` : ""}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                <span className="inline-block w-3 h-3 rounded bg-green-600 mr-2"></span>Sudah dibuat
                <span className="inline-block w-3 h-3 rounded bg-purple-500 mr-2 ml-3"></span>Bisa dibuat
                <span className="inline-block w-3 h-3 rounded bg-gray-300 mr-2 ml-3"></span>Belum tersedia
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowMeetingModal(false);
                setSelectedPertemuan(null);
              }}
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                if (selectedPertemuan !== null) {
                  setShowMeetingModal(false);
                  setShowContentTypeModal(true);
                } else {
                  toast.error("Pilih pertemuan terlebih dahulu");
                }
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Lanjutkan
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Pilih Jenis Konten (Materi/Tugas & Latihan Soal) */}
      <Dialog open={showContentTypeModal} onOpenChange={setShowContentTypeModal}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Pilih Jenis Konten</DialogTitle>
            <DialogDescription>
              Pertemuan {selectedPertemuan} - Pilih jenis konten yang akan dibuat
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            {/* Materi & Tugas Card */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-400"
              onClick={() => {
                router.push(`/home/classrooms/create?classId=${classId}&pertemuan=${selectedPertemuan}`);
                setShowContentTypeModal(false);
                setShowMeetingModal(false);
                setSelectedPertemuan(null);
              }}
            >
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Materi & Tugas</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600">
                  Buat materi pembelajaran atau tugas untuk siswa.
                </p>
              </CardContent>
            </Card>

            {/* Latihan Soal Card */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-green-400"
              onClick={() => {
                router.push(`/home/classrooms/latihanSoal?classId=${classId}&pertemuan=${selectedPertemuan}`);
                setShowContentTypeModal(false);
                setShowMeetingModal(false);
                setSelectedPertemuan(null);
              }}
            >
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-lg">Latihan Soal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600">
                  Buat soal latihan untuk menguji pemahaman siswa.
                </p>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Konfirmasi Kembali */}
      <Dialog open={showConfirmBackModal} onOpenChange={setShowConfirmBackModal}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-orange-500" />
              Batalkan Pembuatan Konten?
            </DialogTitle>
            <DialogDescription>
              Perubahan yang belum disimpan akan hilang. Apakah Anda yakin ingin kembali?
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowConfirmBackModal(false)}
              className="flex-1"
            >
              Lanjutkan Membuat
            </Button>
            <Button
              onClick={() => {
                setShowConfirmBackModal(false);
                router.push(`/home/classrooms/${classId}`);
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Batalkan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MeetingSidebar({
  meetings,
  selectedMeeting,
  onSelectMeeting,
  userRole,
  onCreateContent,
  selectedContentType,
  onContentTypeChange,
  getContentCountByType,
}: {
  meetings: Meeting[];
  selectedMeeting: number;
  onSelectMeeting: (num: number) => void;
  userRole?: string | null;
  onCreateContent?: () => void;
  selectedContentType?: "materi" | "tugas" | "latihan" | "all";
  onContentTypeChange?: (type: "materi" | "tugas" | "latihan" | "all") => void;
  getContentCountByType?: (meetingNum: number, type: "materi" | "tugas" | "latihan") => number;
}) {
  return (
    <div className="p-5 lg:p-6 sticky top-44 lg:top-5 h-full overflow-y-auto">
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Daftar Pertemuan</h3>
        <p className="text-xs text-gray-500 font-medium">Pilih pertemuan untuk melihat konten</p>
        
        {userRole === "teacher" && (
          <Button
            onClick={onCreateContent}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Buat Pertemuan
          </Button>
        )}
      </div>
      
      <div className="space-y-3 mt-6">
        {meetings.map((meeting) => {
          const progress = meeting.totalContents > 0 
            ? (meeting.completedContents / meeting.totalContents) * 100 
            : 0;
          
          return (
            <div
              key={meeting.number}
              onClick={() => onSelectMeeting(meeting.number)}
              className={`relative rounded-xl border-2 overflow-hidden transition-all duration-300 cursor-pointer group ${
                selectedMeeting === meeting.number
                  ? "border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md"
                  : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
              }`}
            >
              {/* Top accent bar */}
              <div className={`h-1 ${
                selectedMeeting === meeting.number ? "bg-blue-600" : "bg-gray-300"
              }`} />
              
              <div className="p-4 lg:p-5">
                {/* Header dengan title dan status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm lg:text-base font-bold transition-colors ${
                      selectedMeeting === meeting.number 
                        ? "text-blue-700" 
                        : "text-gray-900 group-hover:text-blue-600"
                    }`}>
                      {meeting.title}
                    </h4>
                  </div>
                  
                  {meeting.isCompleted && (
                    <div className="flex-shrink-0 bg-green-100 rounded-full p-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                </div>
                
                {/* Content count */}
                <div className="flex items-center gap-2 mb-4 text-xs text-gray-600">
                  <FileText className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                  <span className="font-medium">
                    <span className={selectedMeeting === meeting.number ? "text-blue-700 font-bold" : "text-gray-700"}>
                      {meeting.completedContents}
                    </span>
                    <span className="text-gray-500"> / {meeting.totalContents} konten</span>
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        selectedMeeting === meeting.number 
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-md" 
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-600">{progress.toFixed(0)}%</span>
                    {meeting.isCompleted && (
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        Selesai
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Type Submenu */}
                {selectedMeeting === meeting.number && (
                  <div className="border-t pt-3 mt-3">
                    <div className="flex flex-col gap-2">
                      {[
                        { type: "materi", label: "Materi", color: "bg-slate-600", textColor: "text-slate-600" },
                        { type: "tugas", label: "Tugas", color: "bg-orange-500", textColor: "text-orange-500" },
                        { type: "latihan", label: "Latihan Soal", color: "bg-purple-400", textColor: "text-purple-400" },
                      ].map((item) => {
                        const count = getContentCountByType?.(meeting.number, item.type as "materi" | "tugas" | "latihan") || 0;
                        const isSelected = selectedContentType === item.type;
                        
                        return (
                          <button
                            key={item.type}
                            onClick={() => onContentTypeChange?.(item.type as "materi" | "tugas" | "latihan")}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                              isSelected
                                ? `${item.color} text-white font-semibold shadow-md`
                                : `bg-gray-100 text-gray-700 hover:bg-gray-200`
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${isSelected ? "bg-white" : item.color}`}></div>
                            <span className="text-xs lg:text-sm flex-1 text-left">{item.label}</span>
                            <span className={`text-xs font-bold ${isSelected ? "bg-white/30" : "bg-gray-300"} px-2 py-0.5 rounded`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Hover effect border */}
              <div className={`absolute inset-0 pointer-events-none rounded-xl transition-opacity duration-300 ${
                selectedMeeting === meeting.number ? "opacity-100" : "opacity-0 group-hover:opacity-50"
              }`} style={{
                boxShadow: selectedMeeting === meeting.number ? 'inset 0 0 0 2px rgba(37, 99, 235, 0.1)' : 'none'
              }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}