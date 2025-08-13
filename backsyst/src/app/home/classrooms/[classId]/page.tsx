"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  GraduationCap,
  BookOpen,
  Target,
  TrendingUp,
  Plus,
  Eye,
} from "lucide-react";
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
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

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

        // Fetch contents for teacher
        const { data: contentsData, error: contentsError } = await supabase
          .from("teacher_create")
          .select("*")
          .eq("kelas", classId)
          .eq("pembuat", userId)
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
        // Student: check if they are registered in this class
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

        // Fetch classroom data
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

        // Get teacher name
        const { data: teacherData, error: teacherError } = await supabase
          .from("users")
          .select("name")
          .eq("id", classroomData.teacher_id)
          .single();

        let teacherName = "Guru Tidak Dikenal";
        if (!teacherError && teacherData) {
          teacherName = teacherData.name || "Guru Tidak Dikenal";
        }

        setClassroom({
          id: classroomData.id,
          name: classroomData.name,
          code: classroomData.code,
          description: classroomData.description || "",
          students: [],
          createdAt: classroomData.created_at,
          teacherName,
        });

        // Record attendance for student only if not already recorded
        if (!alreadyRecorded && !isRecordingAttendance) {
          const success = await recordAttendance(userId, classId);
          if (success) {
            setAttendanceRecorded(true);
          }
        }

        // Fetch contents for student
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
  }, [classId, router]);

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Memuat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push(userRole === "teacher" ? "/home/teacher" : "/home/student")} className="w-full">
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">Kelas tidak ditemukan</p>
            <Button onClick={() => router.push(userRole === "teacher" ? "/home/teacher" : "/home/student")} className="w-full">
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push(userRole === "teacher" ? "/home/teacher" : "/home/student")}
              className="hover:bg-gray-100"
            >
              ← Kembali
            </Button>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Dashboard Kelas - {classroom.name}</h1>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Classroom Info */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{classroom.name}</h2>
              <p className="text-muted-foreground">{classroom.description}</p>
              {userRole === "student" && classroom.teacherName && (
                <p className="text-sm text-muted-foreground mt-1">Guru: {classroom.teacherName}</p>
              )}
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              Kode: {classroom.code}
            </Badge>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {userRole === "teacher" ? classroom.students.length : "N/A"}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {userRole === "teacher" ? "Siswa" : "Kelas"}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{classroom.code}</div>
                  <p className="text-sm text-muted-foreground">Kode Kelas</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{contents.length}</div>
                  <p className="text-sm text-muted-foreground">Total Konten</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Action Card */}
              {userRole === "teacher" && (
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Button 
                        onClick={() => router.push(`/home/classrooms/hub?classId=${classroom.id}`)}
                        className="w-full bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Buat Konten
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            
            {userRole === "student" && (
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div className="text-2xl font-bold text-green-600">Active</div>
                    </div>
                    <p className="text-sm text-muted-foreground">Status</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Content List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Daftar Konten
              </CardTitle>
              <CardDescription>
                {userRole === "teacher" 
                  ? "Kelola konten pembelajaran yang telah Anda buat" 
                  : "Konten pembelajaran yang tersedia di kelas ini"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contents.map((content) => (
                  <Card key={content.id} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{content.judul}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{content.sub_judul}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {content.jenis_create}
                            </Badge>
                            {content.deadline && (
                              <Badge variant="destructive" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Deadline: {new Date(content.deadline).toLocaleDateString('id-ID')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Dibuat: {new Date(content.created_at).toLocaleString('id-ID', { 
                              dateStyle: 'full', 
                              timeStyle: 'short' 
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="default" 
                            className="bg-blue-600 hover:bg-blue-700 transition-colors"
                            onClick={() => router.push(`/home/classrooms/${classId}/${content.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {userRole === "teacher" ? "Review" : "Lihat"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Empty State */}
                {contents.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      {userRole === "teacher" 
                        ? "Belum ada konten yang dibuat" 
                        : "Belum ada konten tersedia"
                      }
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {userRole === "teacher" 
                        ? "Mulai dengan membuat konten pembelajaran pertama Anda." 
                        : "Guru belum menambahkan konten pembelajaran di kelas ini."
                      }
                    </p>
                    {userRole === "teacher" && (
                      <Button 
                        onClick={() => router.push(`/home/classrooms/create?classId=${classId}`)}
                        className="bg-green-600 text-white hover:bg-green-700 transition-colors"
                        size="lg"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Buat Konten Pertama
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}