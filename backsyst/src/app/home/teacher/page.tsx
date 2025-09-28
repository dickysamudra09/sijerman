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
    BookOpen,
    ClipboardList,
    Globe,
    LayoutDashboard,
    Target,
    CheckCircle2,
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
    students: any[];
    createdAt: string;
    teacherName?: string;
}

interface TeacherStats {
    totalClasses: number;
    totalClassExercises: number;
    totalPublicExercises: number;
}

interface TeacherModeProps {
    onBack: () => void;
}

function TeacherMode({ onBack }: TeacherModeProps) {
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
    const [stats, setStats] = useState<TeacherStats | null>(null);
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

    const fetchTeacherStats = async (teacherId: string) => {
        try {
            // Fetch total classes
            const { count: totalClasses, error: classError } = await supabase
                .from('classrooms')
                .select('*', { count: 'exact', head: true })
                .eq('teacher_id', teacherId);
    
            if (classError) throw classError;
    
            // Fetch total class exercises
            // Assuming exercise_sets with a non-null kelas_id are class-specific
            const { count: totalClassExercises, error: classExerciseError } = await supabase
                .from('exercise_sets')
                .select('*', { count: 'exact', head: true })
                .eq('pembuat_id', teacherId)
                .not('kelas_id', 'is', null);
    
            if (classExerciseError) throw classExerciseError;
    
            // Fetch total public exercises
            // Assuming exercise_sets with a null kelas_id are public
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
            fetchTeacherStats(userId);
        }
    }, [userId]);

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-gray-100 p-6">
                <div className="max-w-screen-2xl mx-auto">
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
                <div className="max-w-screen-2xl mx-auto">
                    <Card className="bg-white shadow-2xl border-0 rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-red-600 text-xl">Error</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-red-600 mb-6">{error}</p>
                            <Button onClick={() => router.push("/auth/login")} className="bg-sky-500 hover:bg-sky-600 text-white shadow-md">
                                Ke Halaman Masuk
                            </Button>
                        </CardContent>
                    </Card>
                </div>
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
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
            <Card className="w-full h-[calc(100vh-48px)] max-w-screen-2xl bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-gray-100 p-8">
                  <div className="flex items-center justify-between">
                    {/* Kiri: Icon + Nama */}
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-sky-500 rounded-full shadow-lg">
                        <GraduationCap className="h-6 w-6 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        Selamat Datang, {userName}
                      </h1>
                    </div>

                    {/* Kanan: Tombol Home + Keluar */}
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/`)}
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 shadow-sm"
                      >
                        Home
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="border-red-500 text-red-600 hover:bg-red-50 shadow-sm"
                      >
                        Keluar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 overflow-y-auto h-full space-y-8">
                    {/* Statistik Ringkasan */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card className="bg-white border-0 shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Kelas yang dibuat</CardTitle>
                        <Target className="h-5 w-5 text-gray-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-sky-600">{stats?.totalClasses ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Kelas</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Latihan Soal yang dibuat</CardTitle>
                        <CheckCircle2 className="h-5 w-5 text-gray-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats?.totalClassExercises ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Latihan</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Latihan Soal umum</CardTitle>
                        {/* <TrendingUp className="h-5 w-5 text-gray-400" /> */}
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{stats?.totalPublicExercises ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Dari semua latihan</p>
                      </CardContent>
                    </Card>
                  </div>

                    <Tabs defaultValue="classes" className="w-full">
                        <TabsList className="bg-gray-100 border-0 rounded-xl p-1 shadow-inner">
                            <TabsTrigger value="classes" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-sky-600 rounded-lg px-8 py-3 font-medium">Kelas Saya</TabsTrigger>
                            <TabsTrigger value="create" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-sky-600 rounded-lg px-8 py-3 font-medium">Kelas Baru</TabsTrigger>
                        </TabsList>

                        <TabsContent value="classes" className="space-y-6 mt-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {classrooms.map((classroom) => (
                                    <Card
                                        key={classroom.id}
                                        className="h-full flex flex-col bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl"
                                    >
                                        <CardHeader className="pb-4">
                                            <CardTitle className="flex items-center justify-between text-gray-900 text-lg">
                                                {classroom.name}
                                                <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700 px-3 py-1">
                                                    {classroom.students.length} Siswa
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription className="text-gray-600 text-sm leading-relaxed">{classroom.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex flex-col flex-1">
                                            <div className="flex-1">
                                                {/* Konten yang bisa memanjang di sini */}
                                            </div>
                                            <div className="flex flex-col space-y-4 pt-4 border-t border-gray-100 mt-auto">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-500">Kode Kelas:</span>
                                                    <div className="flex items-center gap-2">
                                                        <code className="bg-gray-100 px-3 py-2 rounded-lg text-sm font-mono text-gray-700 border">{classroom.code}</code>
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost" 
                                                            onClick={() => copyClassCode(classroom.code)}
                                                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button 
                                                        size="sm" 
                                                        className="flex-1 bg-sky-500 hover:bg-sky-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                                                        onClick={() => {
                                                            console.log("Navigating to classroom with id:", classroom.id);
                                                            router.push(`/home/classrooms/${classroom.id}`);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Lihat
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50 shadow-sm">
                                                        <Share2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="create" className="space-y-6 mt-8">
                            <Card className="bg-gray-50 border border-gray-200 shadow-lg rounded-xl">
                                <CardHeader className="pb-6">
                                    <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                                        <div className="p-2 bg-sky-500 rounded-lg">
                                            <Plus className="h-5 w-5 text-white" />
                                        </div>
                                        Buat Kelas Baru
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <label className="block mb-3 text-sm font-semibold text-gray-700">Nama Kelas</label>
                                        <Input
                                            placeholder="Contoh: Bahasa Indonesia A2 - Lanjutan"
                                            value={newClassName}
                                            onChange={(e) => setNewClassName(e.target.value)}
                                            className="border-gray-300 focus:border-sky-500 focus:ring-sky-200 bg-white shadow-sm text-lg py-3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-3 text-sm font-semibold text-gray-700">Deskripsi</label>
                                        <Textarea
                                            placeholder="Deskripsi singkat kelas..."
                                            value={newClassDescription}
                                            onChange={(e) => setNewClassDescription(e.target.value)}
                                            className="border-gray-300 focus:border-sky-500 focus:ring-sky-200 bg-white shadow-sm min-h-[120px]"
                                        />
                                    </div>
                                    <Button 
                                        onClick={() => setIsModalOpen(true)} 
                                        disabled={!newClassName.trim()} 
                                        className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-lg"
                                    >
                                        <Plus className="h-5 w-5 mr-2" />
                                        Buat Kelas
                                    </Button>
                                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                                        <DialogContent className="bg-white border-0 shadow-2xl rounded-2xl max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="text-gray-900 text-xl">Kelas Baru</DialogTitle>
                                                <DialogDescription className="text-gray-600">
                                                    Tambahkan kelas baru untuk memulai sesi belajar Anda
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <Input
                                                    placeholder="Nama Kelas"
                                                    value={newClassName}
                                                    onChange={(e) => setNewClassName(e.target.value)}
                                                    className="border-gray-300 focus:border-sky-500 focus:ring-sky-200 shadow-sm"
                                                />
                                                <Textarea
                                                    placeholder="Deskripsi Kelas (Opsional)"
                                                    value={newClassDescription}
                                                    onChange={(e) => setNewClassDescription(e.target.value)}
                                                    className="border-gray-300 focus:border-sky-500 focus:ring-sky-200 shadow-sm"
                                                />
                                                <Button 
                                                    onClick={createNewClass} 
                                                    disabled={isLoading} 
                                                    className="bg-sky-500 hover:bg-sky-600 text-white w-full shadow-md"
                                                >
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
                </CardContent>
            </Card>
        </div>
    );
}

export default function HomePage() {
    return <TeacherMode onBack={() => {}} />;
}