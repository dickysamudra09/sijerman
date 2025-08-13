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
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

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

      // Check access based on role
      if (userData.role === "teacher") {
        // Teacher: fetch classroom they created
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
          students: [], // Students don't need to see other students
          createdAt: classroomData.created_at,
          teacherName,
        });

        // Fetch contents for student (all contents in this class created by the teacher)
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
    return <div className="min-h-screen flex items-center justify-center bg-background">Memuat...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button onClick={() => router.push(userRole === "teacher" ? "/home/teacher" : "/home/student")} className="mt-4">
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
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">Kelas tidak ditemukan</p>
            <Button onClick={() => router.push(userRole === "teacher" ? "/home/teacher" : "/home/student")} className="mt-4">
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
            <Button variant="ghost" onClick={() => router.push(userRole === "teacher" ? "/home/teacher" : "/home/student")}>
              ← Kembali
            </Button>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h1>Dashboard Kelas - {classroom.name}</h1>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2>{classroom.name}</h2>
              <p className="text-muted-foreground">{classroom.description}</p>
              {userRole === "student" && classroom.teacherName && (
                <p className="text-sm text-muted-foreground">Guru: {classroom.teacherName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
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
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{classroom.code}</div>
                  <p className="text-sm text-muted-foreground">Kode Kelas</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{contents.length}</div>
                  <p className="text-sm text-muted-foreground">Total Konten</p>
                </div>
              </CardContent>
            </Card>
            {/* Show Create button only for teachers */}
            {userRole === "teacher" && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <Button onClick={() => router.push(`/home/classrooms/create?classId=${classId}`)} className="w-full bg-green-600 text-white hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* For students, show a different card */}
            {userRole === "student" && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">Active</div>
                    <p className="text-sm text-muted-foreground">Status</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Konten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contents.map((content) => (
                  <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{content.judul}</h3>
                      <p className="text-sm text-muted-foreground">{content.sub_judul}</p>
                      <Badge variant="outline" className="mt-1">
                        {content.jenis_create}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(content.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          variant="default" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => router.push(`/home/classrooms/${classId}/${content.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {userRole === "teacher" ? "Review" : "Lihat"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {contents.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {userRole === "teacher" 
                        ? "Belum ada konten yang dibuat." 
                        : "Belum ada konten yang tersedia di kelas ini."
                      }
                    </p>
                    {userRole === "teacher" && (
                      <Button 
                        onClick={() => router.push(`/home/classrooms/create?classId=${classId}`)}
                        className="mt-4 bg-green-600 text-white hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
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