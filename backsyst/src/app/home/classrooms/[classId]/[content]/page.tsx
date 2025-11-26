"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Edit, BookOpen, Clock, FileText, UserCircle, MoreVertical, Download as DownloadIcon, GraduationCap, Bell, User, Home, LogOut, UploadCloud, CheckCircle2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface ContentItem {
  id: string;
  judul: string;
  sub_judul: string;
  jenis_create: string;
  konten: string;
  documents: { name: string; url: string }[];
  deadline: string | null;
  created_at: string;
  updated_at: string;
  pembuat: string;
}

interface StudentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string;
  submitted_at: string;
  status: string;
}

interface SubmissionWithStudentName extends StudentSubmission {
  users: {
    name: string;
  } | null;
}

export default function ContentDetailPage() {
  const [content, setContent] = useState<ContentItem | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionWithStudentName[] | null>(null);
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  
  // State untuk upload tugas
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<StudentSubmission | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;
  const contentId = params.content as string;

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);

      if (!classId || !contentId) {
        setError("Parameter kelas atau konten tidak valid.");
        setIsLoading(false);
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.user) {
        setError("Tidak ada sesi ditemukan. Silakan masuk.");
        router.push("/auth/login");
        setIsLoading(false);
        return;
      }

      const currentUserId = sessionData.session.user.id;
      setUserId(currentUserId);

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("name, role")
        .eq("id", currentUserId)
        .single();

      if (userError || !userData) {
        setError("Gagal mengambil data pengguna: " + (userError?.message || ""));
        setIsLoading(false);
        return;
      }

      setUserRole(userData.role);
      setUserName(userData.name || "");

      let contentData: ContentItem | null = null;
      let creator: string | null = null;
      let fetchError: any = null;

      if (userData.role === "teacher") {
        const { data, error: fetchErr } = await supabase
          .from("teacher_create")
          .select("*, users!teacher_create_pembuat_fkey(name)")
          .eq("id", contentId)
          .eq("kelas", classId)
          .single();
        
        if (data) {
          contentData = data;
          creator = data.users?.name || data.pembuat;
        }
        fetchError = fetchErr;

        if (contentData && contentData.jenis_create.toLowerCase() === "tugas") {
          const { data: submissionData, error: submissionError } = await supabase
            .from("student_submissions")
            .select(`
              *,
              users!student_submissions_student_id_fkey(name)
            `)
            .eq("assignment_id", contentId)
            .order("submitted_at", { ascending: true });

          if (submissionError) {
            console.error("Error fetching student submissions:", submissionError);
          } else {
            setSubmissions(submissionData as SubmissionWithStudentName[]);
          }
        }
      } else if (userData.role === "student") {
        const { data: registration, error: regError } = await supabase
          .from("classroom_registrations")
          .select("classroom_id")
          .eq("classroom_id", classId)
          .eq("student_id", currentUserId)
          .single();

        if (regError || !registration) {
          setError("Anda tidak terdaftar di kelas ini.");
          setIsLoading(false);
          return;
        }

        const { data, error: fetchErr } = await supabase
          .from("teacher_create")
          .select("*, users!teacher_create_pembuat_fkey(name)")
          .eq("id", contentId)
          .eq("kelas", classId)
          .single();
        
        if (data) {
          contentData = data;
          creator = data.users?.name || data.pembuat;
        }
        fetchError = fetchErr;

        // Fetch submission status untuk student
        if (contentData && contentData.jenis_create.toLowerCase() === "tugas") {
          const { data: submissionData, error: submissionError } = await supabase
            .from("student_submissions")
            .select("*")
            .eq("assignment_id", contentId)
            .eq("student_id", currentUserId)
            .single();

          if (submissionError && submissionError.code !== 'PGRST116') {
            console.error("Error fetching submission status:", submissionError);
          } else {
            setSubmissionStatus(submissionData || null);
          }
        }
      } else {
        setError("Role pengguna tidak valid.");
      }

      if (fetchError) {
        setError("Gagal mengambil konten: " + fetchError.message);
      } else if (!contentData) {
        setError("Konten tidak ditemukan atau Anda tidak memiliki akses.");
      } else {
        setContent(contentData);
        setCreatorName(creator);
      }

      setIsLoading(false);
    };

    fetchContent();
  }, [classId, contentId, router, userId]);

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      toast.error("Gagal mengunduh file: " + (err.message || err));
    }
  };

  const handleCheckboxChange = (id: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedSubmissionIds((prev) => [...prev, id]);
    } else {
      setSelectedSubmissionIds((prev) => prev.filter((submissionId) => submissionId !== id));
    }
  };

  const handleDownloadSelected = async () => {
    setIsDownloadingAll(true);
    try {
      if (!submissions) {
        toast.error("Tidak ada data pengumpulan untuk diunduh.");
        return;
      }
      
      const filesToDownload = submissions.filter((sub) => selectedSubmissionIds.includes(sub.id));

      if (filesToDownload.length === 0) {
        toast.error("Tidak ada file yang dipilih.");
        return;
      }

      for (const file of filesToDownload) {
        const fileUrl = file.file_url;
        const fileName = `${file.users?.name || "siswa"}_${fileUrl.substring(fileUrl.lastIndexOf('/') + 1)}`;
        
        await handleDownload(fileUrl, fileName);
      }

      toast.success(`${filesToDownload.length} dokumen berhasil diunduh!`);
      setSelectedSubmissionIds([]);
      
    } catch (err: any) {
      toast.error("Gagal mengunduh file: " + (err.message || err));
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleDelete = async () => {
    if (!content || userRole !== "teacher" || content.pembuat !== userId) return;

    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus konten ini?");
    if (!confirmDelete) return;

    setIsLoading(true);

    const { error } = await supabase
      .from("teacher_create")
      .delete()
      .eq("id", contentId);

    if (error) {
      toast.error("Gagal menghapus konten: " + error.message);
    } else {
      toast.success("Konten berhasil dihapus!");
      router.push(`/home/classrooms/${classId}`);
    }

    setIsLoading(false);
  };

  const handleUpdate = () => {
    if (!content || userRole !== "teacher" || content.pembuat !== userId) return;
    router.push(`/home/classrooms/create?classId=${classId}&contentId=${content.id}`);
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

  // Fungsi untuk upload tugas
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
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
        console.error("Storage upload error:", uploadError);
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
        console.error("Database upsert error:", dbError);
        throw new Error("Gagal menyimpan data ke database: " + dbError.message);
      }

      toast.success("Tugas berhasil dikumpulkan!");
      setSubmissionStatus({
        id: crypto.randomUUID(),
        assignment_id: contentId,
        student_id: userId,
        file_url: fileUrlData.publicUrl,
        submitted_at: new Date().toISOString(),
        status: 'submitted'
      });
      setSelectedFile(null);

    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat mengunggah tugas.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
            <CardContent className="flex items-center justify-center p-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Memuat konten...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle className="text-red-600 text-xl">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-6">{error || "Konten tidak ditemukan"}</p>
              <Button 
                onClick={() => router.push(`/home/classrooms/${classId}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Kembali ke Kelas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isContentCreator = userRole === "teacher" && content.pembuat === userId;
  const isAssignment = content.jenis_create.toLowerCase() === "tugas";
  const isLate = content.deadline && new Date() > new Date(content.deadline);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header Menu */}
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

      {/* Main Content */}
      <main className="flex-1 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push(`/home/classrooms/${classId}`)}
              className="mb-4 text-gray-600 hover:text-gray-900 px-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Kelas
            </Button>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{content.judul}</h1>
                <p className="text-gray-600 text-lg">{content.sub_judul}</p>
              </div>
              {isContentCreator && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleUpdate}>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Konten
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus Konten
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Card Informasi */}
              <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Jenis Konten */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">Jenis Konten</h3>
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          {content.jenis_create}
                        </Badge>
                      </div>
                    </div>

                    {/* Pembuat */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">Pembuat</h3>
                      <div className="flex items-center gap-3">
                        <UserCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-gray-900">{creatorName}</span>
                      </div>
                    </div>

                    {/* Batas Waktu */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">Batas Waktu</h3>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-gray-900">
                          {content.deadline 
                            ? new Date(content.deadline).toLocaleDateString('id-ID', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric'
                              })
                            : "Tidak Ada"
                          }
                        </span>
                      </div>
                      {isAssignment && content.deadline && (
                        <div className="mt-2">
                          <Badge className={isLate ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>
                            {isLate ? "Terlambat" : "Aktif"}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Status Pengumpulan untuk Siswa */}
                    {isAssignment && userRole === "student" && (
                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-500 mb-2">Status Tugas</h3>
                        <div className="flex items-center gap-3">
                          {submissionStatus ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                              <Badge className="bg-green-100 text-green-700">
                                Sudah Dikumpulkan
                              </Badge>
                            </>
                          ) : (
                            <>
                              <Clock className="h-5 w-5 text-yellow-600" />
                              <Badge className="bg-yellow-100 text-yellow-700">
                                Belum Dikumpulkan
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Dokumen Pendukung */}
              <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Dokumen Pendukung</CardTitle>
                </CardHeader>
                <CardContent>
                  {content.documents && content.documents.length > 0 ? (
                    <div className="space-y-3">
                      {content.documents.map((doc, index) => {
                        const fileExtension = doc.name.split('.').pop()?.toLowerCase();
                        let badgeVariant = "secondary";
                        let badgeText = "Dokumen";
                        
                        if (fileExtension === 'pdf') {
                          badgeVariant = "secondary";
                          badgeText = "PDF";
                        } else if (['mp4', 'mov', 'avi'].includes(fileExtension || '')) {
                          badgeVariant = "secondary";
                          badgeText = "Video";
                        }

                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-700 truncate">{doc.name}</p>
                                <Badge variant="secondary" className="bg-gray-200 text-gray-700 text-xs">
                                  {badgeText}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(doc.url, doc.name)}
                              className="text-blue-600 hover:text-blue-700 flex-shrink-0 ml-2"
                            >
                              <DownloadIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Tidak ada dokumen pendukung</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Materi Pembelajaran */}
              <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                {/* <CardHeader className="border-b border-gray-200 pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {content.jenis_create === "Materi" ? "Materi Pembelajaran" : "Detail Tugas"}
                  </CardTitle>
                </CardHeader> */}
                <CardContent className="p-6">
                  <div className="prose max-w-none">
                    {/* Header dengan judul utama */}
                    <div className="mb-8">
                      <h1 className="text-3xl font-bold text-gray-900 mb-4">{content.judul}</h1>
                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-lg text-gray-700 leading-relaxed">
                          <strong>Tema:</strong> {content.sub_judul}
                        </p>
                      </div>
                    </div>

                    {/* Konten utama */}
                    <div 
                      className="text-gray-700 leading-relaxed space-y-6 text-base"
                      dangerouslySetInnerHTML={{ 
                        __html: content.konten || `
                          <div class="space-y-6">
                            <section>
                              <h2 class="text-xl font-semibold text-gray-900 mb-4">Pengenalan Materi</h2>
                              <p class="text-gray-700">Selamat datang di kursus <strong>${content.judul}</strong>! Dalam materi ini, kita akan mempelajari konsep-konsep dasar yang penting untuk dipahami.</p>
                            </section>

                            <section>
                              <h2 class="text-xl font-semibold text-gray-900 mb-4">Topik Pembelajaran</h2>
                              <ul class="list-disc pl-6 space-y-2 text-gray-700">
                                <li>Pengenalan konsep dasar dan terminologi</li>
                                <li>Fundamental principles and core concepts</li>
                                <li>Practical applications and real-world examples</li>
                                <li>Tools and environment setup</li>
                                <li>Best practices and next steps</li>
                              </ul>
                            </section>

                            <section>
                              <h2 class="text-xl font-semibold text-gray-900 mb-4">Contoh Penerapan</h2>
                              <div class="bg-gray-50 border-l-4 border-blue-500 p-4">
                                <p class="text-gray-700"><strong>Contoh:</strong> Berikut adalah contoh penerapan dalam kehidupan sehari-hari...</p>
                              </div>
                            </section>
                          </div>
                        `
                      }} 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Bagian Kumpulkan Tugas untuk Siswa */}
              {isAssignment && userRole === "student" && (
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="border-b border-gray-200 pb-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        Kumpulkan Tugas
                      </CardTitle>
                      {submissionStatus ? (
                        <Badge className="bg-green-100 text-green-700 text-sm">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Sudah Dikumpulkan
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700 text-sm">
                          <Clock className="h-4 w-4 mr-1" />
                          Belum Dikumpulkan
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      Unggah file tugas Anda. Maksimal ukuran file 12MB.
                      {content.deadline && (
                        <span className="block mt-1">
                          Batas waktu: {new Date(content.deadline).toLocaleDateString('id-ID', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric'
                          })}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-6">
                    {!submissionStatus ? (
                      <>
                        <div
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors mb-4"
                        >
                          <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
                          <p className="text-sm text-gray-500 mb-2">Drag and drop file di sini, atau</p>
                          <label htmlFor="file-upload" className="text-blue-600 font-medium hover:underline cursor-pointer">
                            Pilih file dari komputer
                          </label>
                          <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </div>
                        
                        {selectedFile && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-700">{selectedFile.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFile(null)}
                              className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        <Button
                          onClick={handleFileUpload}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-6"
                          disabled={!selectedFile || isUploading}
                        >
                          {isUploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Mengunggah...
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-4 w-4 mr-2" />
                              Kumpulkan Tugas
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            <div>
                              <h4 className="font-semibold text-green-800">Tugas berhasil dikumpulkan!</h4>
                              <p className="text-green-700 text-sm mt-1">
                                Dikumpulkan pada: {new Date(submissionStatus.submitted_at).toLocaleString('id-ID', { 
                                  dateStyle: 'full', 
                                  timeStyle: 'short' 
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">
                              File tugas Anda
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(submissionStatus.file_url, "Tugas_Saya")}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <DownloadIcon className="h-4 w-4 mr-1" />
                            Unduh
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Daftar Pengumpulan untuk Teacher */}
              {isAssignment && isContentCreator && (
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="border-b border-gray-200 pb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                          Daftar Pengumpulan Siswa
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {submissions && submissions.length > 0
                            ? `Total ${submissions.length} siswa sudah mengumpulkan tugas`
                            : "Belum ada siswa yang mengumpulkan tugas ini"
                          }
                        </CardDescription>
                      </div>
                      {submissions && submissions.length > 0 && (
                        <Button
                          onClick={handleDownloadSelected}
                          disabled={selectedSubmissionIds.length === 0 || isDownloadingAll}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <DownloadIcon className="h-4 w-4 mr-2" />
                          {isDownloadingAll ? "Mengunduh..." : `Unduh Terpilih (${selectedSubmissionIds.length})`}
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    {submissions && submissions.length > 0 ? (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead className="w-[50px]">
                                <Checkbox
                                  checked={selectedSubmissionIds.length === submissions.length}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedSubmissionIds(submissions.map(sub => sub.id));
                                    } else {
                                      setSelectedSubmissionIds([]);
                                    }
                                  }}
                                />
                              </TableHead>
                              <TableHead className="font-semibold text-gray-900">Nama Siswa</TableHead>
                              <TableHead className="font-semibold text-gray-900">Status</TableHead>
                              <TableHead className="font-semibold text-gray-900">Waktu Pengumpulan</TableHead>
                              <TableHead className="text-right font-semibold text-gray-900">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {submissions.map((submission) => {
                              const isLate = content.deadline && new Date(submission.submitted_at) > new Date(content.deadline);
                              return (
                                <TableRow key={submission.id} className="hover:bg-gray-50">
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedSubmissionIds.includes(submission.id)}
                                      onCheckedChange={(checked) => handleCheckboxChange(submission.id, checked as boolean)}
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium text-gray-900">
                                    {submission.users?.name || 'Nama Tidak Ditemukan'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={isLate ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>
                                      {isLate ? "Terlambat" : "Tepat Waktu"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-gray-700">
                                    {new Date(submission.submitted_at).toLocaleString('id-ID', { 
                                      dateStyle: 'medium', 
                                      timeStyle: 'short' 
                                    })}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDownload(
                                        submission.file_url, 
                                        `${submission.users?.name || "siswa"}_${submission.file_url.substring(submission.file_url.lastIndexOf('/') + 1)}`
                                      )}
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <DownloadIcon className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Belum ada pengumpulan tugas</p>
                        <p className="text-gray-400 text-sm mt-1">Siswa belum mengumpulkan tugas ini</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}