"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";

interface ClassRoom {
  id: string;
  name: string;
  code: string;
  description: string;
  students: any[]; // Placeholder, bisa disesuaikan jika diperlukan
  createdAt: string;
  teacherName?: string;
}

interface TeacherModeProps {
  onBack: () => void;
}

export function TeacherMode({ onBack }: TeacherModeProps) {
  const [userName, setUserName] = useState<string>("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [classrooms, setClassrooms] = useState<ClassRoom[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        setUserName(userData.name);
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
    }
  }, [userId]);

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
            <Button onClick={() => router.push("/auth/login")} className="mt-4">
              Ke Halaman Masuk
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const createOrUpdateUserProfile = async (name: string, role: "teacher" | "student") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("Tidak ada pengguna terautentikasi ditemukan.");
      return;
    }

    const { error } = await supabase.from("users").upsert(
      {
        id: user.id,
        name,
        email: user.email || "",
        role,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("Gagal membuat/memperbarui profil:", error.message);
    } else {
      console.log("Profil berhasil dibuat/diperbarui.");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              ← Kembali
            </Button>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h1>Dashboard Guru - Selamat Datang, {userName}</h1>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Keluar
          </Button>
        </div>

        <Tabs defaultValue="classes" className="w-full">
          <TabsList>
            <TabsTrigger value="classes">Kelas Saya</TabsTrigger>
            <TabsTrigger value="create">Kelas Baru</TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classrooms.map((classroom) => (
                <Card key={classroom.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {classroom.name}
                      <Badge variant="outline">{classroom.students.length} Siswa</Badge>
                    </CardTitle>
                    <CardDescription>{classroom.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Kode Kelas:</span>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm">{classroom.code}</code>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => copyClassCode(classroom.code)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            console.log("Navigating to classroom with id:", classroom.id);
                            router.push(`/home/classrooms/${classroom.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Lihat
                        </Button>
                        <Button size="sm" variant="outline">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Buat Kelas Baru
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block mb-2">Nama Kelas</label>
                  <Input
                    placeholder="Contoh: Bahasa Indonesia A2 - Lanjutan"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block mb-2">Deskripsi</label>
                  <Textarea
                    placeholder="Deskripsi singkat kelas..."
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                  />
                </div>
                <Button onClick={() => setIsModalOpen(true)} disabled={!newClassName.trim()} className="bg-blue-600 text-white hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Kelas
                </Button>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Kelas Baru</DialogTitle>
                      <DialogDescription>
                        Tambahkan kelas baru untuk memulai sesi belajar Anda
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Nama Kelas"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                      />
                      <Textarea
                        placeholder="Deskripsi Kelas (Opsional)"
                        value={newClassDescription}
                        onChange={(e) => setNewClassDescription(e.target.value)}
                      />
                      <Button onClick={createNewClass} disabled={isLoading} className="bg-blue-600 text-white hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Buat Kelas
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function HomePage() {
  return <TeacherMode onBack={() => {}} />;
}