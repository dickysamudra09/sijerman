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

export default function ClassroomsPage() {
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [classroom, setClassroom] = useState<ClassRoom | null>(null);
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

      if (userData && userData.role !== "teacher") {
        setError("Anda tidak memiliki peran sebagai guru.");
        setIsLoading(false);
        setInitialLoading(false);
        router.push("/home/student");
        return;
      }

      setUserName(userData.name || "");

      // Fetch classroom data
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
            <Button onClick={() => router.push("/home/teacher")} className="mt-4">
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
            <Button onClick={() => router.push("/home/teacher")} className="mt-4">
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
            <Button variant="ghost" onClick={() => router.push("/home/teacher")}>
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{classroom.students.length}</div>
                  <p className="text-sm text-muted-foreground">Siswa</p>
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
                  <div className="text-2xl font-bold text-purple-600">
                    {classroom.students.reduce((acc, s) => acc + s.completed_quizzes, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Kuis</p>
                </div>
              </CardContent>
            </Card>
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
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Kemajuan Siswa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classroom.students.map((student) => (
                  <div key={student.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Avatar>
                      <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={student.average_score >= 80 ? "default" : student.average_score >= 60 ? "secondary" : "destructive"}>
                            {student.average_score}% Rata-rata
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Kemajuan: {student.progress}%</span>
                          <span>{student.completed_quizzes} Kuis selesai</span>
                        </div>
                        <Progress value={student.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Terakhir aktif: {new Date(student.last_active).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}