"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { 
  Trash2, Edit, Clock, FileText, UserCircle, MoreVertical, Download as DownloadIcon, UploadCloud, 
  CheckCircle2, ArrowLeft, AlertCircle, File, Calendar, Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  file_path: string | null;
  message: string | null;
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
  const [className, setClassName] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingSubmission, setIsDeletingSubmission] = useState(false);
  
  // State untuk upload tugas
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState<string>("");
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

      const { data: classData } = await supabase
        .from("classrooms")
        .select("name")
        .eq("id", classId)
        .single();
      
      if (classData) {
        setClassName(classData.name);
      }

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

          if (submissionError) {
            if (submissionError.code !== 'PGRST116') {
              console.error("Error fetching submission status:", submissionError);
            }
            setSubmissionStatus(null);
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
    if ((!selectedFile && !submissionMessage.trim()) || isUploading || !userId) {
      toast.error("Pilih file atau tulis pesan terlebih dahulu.");
      return;
    }

    if (selectedFile && selectedFile.size > 12 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 12MB.");
      return;
    }

    setIsUploading(true);
    let fileUrl = "";
    let filePath = "";

    try {
      if (selectedFile) {
        const uniqueFileName = `${Date.now()}_${selectedFile.name}`;
        filePath = `${userId}/${contentId}/${uniqueFileName}`;

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

        fileUrl = fileUrlData.publicUrl;
      }

      const { error: dbError } = await supabase
        .from('student_submissions')
        .upsert({
          assignment_id: contentId,
          student_id: userId,
          file_url: fileUrl || null,
          file_path: filePath || null,
          message: submissionMessage.trim() || null,
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
        file_url: fileUrl || "",
        file_path: filePath || null,
        message: submissionMessage.trim() || null,
        submitted_at: new Date().toISOString(),
        status: 'submitted'
      });
      setSelectedFile(null);
      setSubmissionMessage("");

    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat mengunggah tugas.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Memuat konten...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-6">{error || "Konten tidak ditemukan"}</p>
            <Button 
              onClick={() => router.push(`/home/classrooms/${classId}`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Kembali ke Kelas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isContentCreator = userRole === "teacher" && content.pembuat === userId;
  const isAssignment = content.jenis_create.toLowerCase() === "tugas";
  const isLate = content.deadline && new Date() > new Date(content.deadline);

  const getRelativeTime = (deadline: string) => {
    const now = new Date();
    const target = new Date(deadline);
    const diffMs = target.getTime() - now.getTime();
    
    if (diffMs < 0) {
      const absDiff = Math.abs(diffMs);
      const hours = Math.floor(absDiff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      
      if (days > 0) return `Terlambat ${days} hari`;
      if (hours > 0) return `Terlambat ${hours} jam`;
      return "Terlambat";
    }
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `Kurang ${days} hari`;
    if (hours > 0) return `Kurang ${hours} jam ${minutes} menit`;
    return `Kurang ${minutes} menit`;
  };

  const handleImagePreview = (url: string) => {
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    if (isImage) {
      setPreviewImage(url);
    } else {
      handleDownload(url, url.substring(url.lastIndexOf('/') + 1));
    }
  };

  const handleDeleteSubmission = async () => {
    if (!submissionStatus || !userId) return;
    
    setIsDeletingSubmission(true);
    
    try {
      let filePathToDelete = submissionStatus.file_path;
      
      if (!filePathToDelete && submissionStatus.file_url) {
        try {
          const urlParts = submissionStatus.file_url.split('/documents/');
          if (urlParts.length > 1) {
            filePathToDelete = decodeURIComponent(urlParts[1]);
            console.log("Extracted file path from URL:", filePathToDelete);
          }
        } catch (parseError) {
          console.error("Error parsing URL:", parseError);
        }
      }

      if (filePathToDelete) {
        try {
          console.log("Attempting to delete file:", filePathToDelete);
          const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([filePathToDelete]);
          
          if (storageError) {
            console.error("Storage delete error:", storageError);
          } else {
            console.log("File berhasil dihapus dari storage:", filePathToDelete);
          }
        } catch (storageError) {
          console.error("Error deleting from storage:", storageError);
        }
      }

      console.log("Deleting from DB with:", { assignment_id: contentId, student_id: userId });
      const { error, count } = await supabase
        .from('student_submissions')
        .delete()
        .eq('assignment_id', contentId)
        .eq('student_id', userId)
        .select();
      
      console.log("Delete response:", { error, count });
      
      if (error) {
        console.error("Database delete error:", error);
        throw new Error(error.message);
      } else {
        console.log("Database delete SUCCESS - Rows affected:", count);
      }
      
      toast.success("Pengumpulan berhasil dihapus!");
      setSubmissionStatus(null);
      setShowDeleteModal(false);

    } catch (err: any) {
      toast.error("Gagal menghapus: " + (err.message || err));
    } finally {
      setIsDeletingSubmission(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#1E1E1E] border-b-4 border-[#FFD903] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => router.push(`/home/classrooms/${classId}`)}
                className="flex-shrink-0 bg-[#FFD903] hover:bg-[#FFD903]/90 text-[#1E1E1E]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-[#FFFFFC] truncate">{content.judul}</h1>
                <p className="text-xs sm:text-sm text-[#FFD903] mt-0.5 truncate">{content.sub_judul}</p>
              </div>
            </div>
            
            {isContentCreator && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-shrink-0 bg-[#FFD903] hover:bg-[#FFD903]/90 text-[#1E1E1E] border-[#FFD903]">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={handleUpdate} className="flex items-center cursor-pointer">
                    <Edit className="h-4 w-4 mr-2" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600 cursor-pointer flex items-center">
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span>Hapus</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Meta Info Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24 lg:pt-28">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600">Jenis</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{content.jenis_create.charAt(0).toUpperCase() + content.jenis_create.slice(1).toLowerCase()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <UserCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600">Pengajar</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{creatorName || "Unknown"}</p>
              </div>
            </div>
          </div>

          {content.deadline && (
            <div className={`rounded-lg border p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow ${
              isLate ? "bg-red-50 border-red-200" : "bg-white border-gray-200"
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isLate ? "bg-red-100" : "bg-purple-100"
                }`}>
                  <Calendar className={`h-4 w-4 ${isLate ? "text-red-600" : "text-purple-600"}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-600">Batas</p>
                  <p className={`text-sm font-semibold truncate ${isLate ? "text-red-700" : "text-gray-900"}`}>
                    {new Date(content.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className={`text-xs truncate ${isLate ? "text-red-600" : "text-gray-600"}`}>
                    {new Date(content.deadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isAssignment && submissions && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-600">Pengumpulan</p>
                  <p className="text-sm font-semibold text-gray-900">{submissions.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content Display Card */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="border-b border-gray-200 bg-[#1E1E1E] rounded-t-lg py-4">
                <CardTitle className="text-lg text-[#FFFFFC]">Konten Materi</CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <div 
                  dangerouslySetInnerHTML={{ __html: content.konten || '' }}
                  className="prose prose-sm sm:prose max-w-none 
                    text-gray-800 leading-relaxed
                    [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-6 [&_h1]:mb-4
                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-5 [&_h2]:mb-3
                    [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-2
                    [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-gray-800 [&_h4]:mt-3 [&_h4]:mb-2
                    [&_p]:text-base [&_p]:text-gray-700 [&_p]:mb-4 [&_p]:leading-7
                    [&_strong]:font-semibold [&_strong]:text-gray-900
                    [&_em]:italic [&_em]:text-gray-700
                    [&_ul]:list-disc [&_ul]:list-inside [&_ul]:mb-4 [&_ul]:ml-2
                    [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:mb-4 [&_ol]:ml-2
                    [&_li]:mb-2 [&_li]:text-gray-700
                    [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-4 [&_blockquote]:bg-blue-50 [&_blockquote]:italic
                    [&_code]:bg-gray-100 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-red-600 [&_code]:text-sm [&_code]:font-mono
                    [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4
                    [&_a]:text-blue-600 [&_a]:hover:text-blue-700 [&_a]:underline
                    [&_table]:w-full [&_table]:border-collapse [&_table]:mb-4
                    [&_th]:bg-gray-200 [&_th]:text-gray-900 [&_th]:font-semibold [&_th]:p-2 [&_th]:border [&_th]:border-gray-300 [&_th]:text-left
                    [&_td]:p-2 [&_td]:border [&_td]:border-gray-300
                    [&_hr]:border-gray-300 [&_hr]:my-6
                    [&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto [&_img]:my-4"
                />
              </CardContent>
            </Card>

            {/* Documents Section */}
            {content.documents && content.documents.length > 0 && (
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="border-b border-gray-200 bg-[#1E1E1E] rounded-t-lg py-4">
                  <CardTitle className="text-lg text-[#FFFFFC] flex items-center gap-2">
                    <File className="h-5 w-5 text-[#FFFFFC]" />
                    File Pendukung ({content.documents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {content.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <File className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                            <p className="text-xs text-gray-500">File pendukung</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(doc.url, doc.name)}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 flex-shrink-0"
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Student Submission Section */}
            {isAssignment && userRole === "student" && (
              <Card className={`shadow-sm hover:shadow-md transition-shadow border-2 ${
                submissionStatus ? "border-green-200 bg-white" : "border-yellow-200 bg-white"
              }`}>
                <CardHeader className="border-b rounded-t-lg py-4 bg-[#1E1E1E] border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#1E1E1E]">
                        <UploadCloud className="h-5 w-5 text-[#FFFFFC]" />
                      </div>
                      <CardTitle className="text-lg text-[#FFFFFC]">Status Pengumpulan</CardTitle>
                    </div>
                    <Badge className={submissionStatus ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                      {submissionStatus ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Dikumpulkan</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-1" /> Belum Dikumpulkan</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {!submissionStatus ? (
                    <>
                      <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                            <UploadCloud className="h-6 w-6 text-blue-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">Unggah File Tugas</p>
                          <p className="text-xs text-gray-600 text-center mb-4">Drag and drop atau klik untuk memilih file (max 12MB)</p>
                          <label htmlFor="file-input" className="cursor-pointer">
                            <div 
                              onDragOver={handleDragOver}
                              onDrop={handleDrop}
                              className="px-4 py-2 bg-[#FFD903] text-[#1E1E1E] rounded-lg font-medium hover:bg-[#FFD903]/90 transition-colors"
                            >
                              Pilih File
                            </div>
                          </label>
                          <input
                            id="file-input"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </div>
                      </div>

                      {selectedFile && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                              <File className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-sm text-gray-700 truncate">{selectedFile.name}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setSelectedFile(null)}
                            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                          >
                            ✕
                          </Button>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label htmlFor="submission-message" className="text-sm font-medium text-gray-900">
                          Atau tulis pesan pengumpulan
                        </label>
                        <textarea
                          id="submission-message"
                          value={submissionMessage}
                          onChange={(e) => setSubmissionMessage(e.target.value)}
                          placeholder="Tulis pesan pengumpulan tugas (opsional)..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={handleFileUpload}
                        className="w-full bg-[#FFD903] hover:bg-[#FFD903]/90 text-[#1E1E1E] font-medium py-2 h-auto"
                        disabled={(!selectedFile && !submissionMessage.trim()) || isUploading}
                      >
                        {isUploading ? (
                          <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1E1E1E] mr-2"></div> Mengunggah...</>
                        ) : (
                          <><UploadCloud className="h-5 w-5 mr-2" /> Kumpulkan Tugas</>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-green-800">Tugas Berhasil Dikumpulkan</p>
                              <p className="text-sm text-green-700 mt-1">
                                {new Date(submissionStatus.submitted_at).toLocaleString('id-ID', { 
                                  weekday: 'long',
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {submissionStatus.message && (
                                <div className="mt-3 p-3 bg-white rounded border border-green-200">
                                  <p className="text-xs font-semibold text-gray-700 mb-1">Pesan:</p>
                                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{submissionStatus.message}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {submissionStatus.file_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-600 hover:bg-blue-50 h-8"
                                onClick={() => handleImagePreview(submissionStatus.file_url)}
                              >
                                <File className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50 h-8"
                              onClick={() => setShowDeleteModal(true)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {content.deadline && new Date(submissionStatus.submitted_at) > new Date(content.deadline) && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-red-800">Pengumpulan Terlambat</p>
                            <p className="text-sm text-red-700 mt-1">Tugas dikumpulkan setelah batas waktu yang ditentukan</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {content.deadline && (
                    <p className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                      <strong>Batas Waktu:</strong> {new Date(content.deadline).toLocaleDateString('id-ID', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                      })} pukul {new Date(content.deadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Teacher Submissions List */}
            {isAssignment && isContentCreator && submissions && submissions.length > 0 && (
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="border-b border-gray-200 bg-[#1E1E1E] rounded-t-lg py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1E1E1E] rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-[#FFFFFC]" />
                      </div>
                      <CardTitle className="text-lg text-[#FFFFFC]">Pengumpulan Siswa ({submissions.length})</CardTitle>
                    </div>
                    {selectedSubmissionIds.length > 0 && (
                      <Button
                        size="sm"
                        onClick={handleDownloadSelected}
                        disabled={isDownloadingAll}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Unduh {selectedSubmissionIds.length}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            <Checkbox
                              checked={selectedSubmissionIds.length === submissions.length}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubmissionIds(submissions.map(s => s.id));
                                } else {
                                  setSelectedSubmissionIds([]);
                                }
                              }}
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Nama Siswa</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Waktu Pengumpulan</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {submissions.map((sub) => {
                          const isLateSubmission = content.deadline && new Date(sub.submitted_at) > new Date(content.deadline);
                          return (
                            <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <Checkbox
                                  checked={selectedSubmissionIds.includes(sub.id)}
                                  onCheckedChange={(checked) => handleCheckboxChange(sub.id, checked as boolean)}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-700">
                                    {(sub.users?.name || 'S').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-sm font-medium text-gray-900">{sub.users?.name || 'Nama Tidak Ditemukan'}</span>
                                    {sub.message && (
                                      <p className="text-xs text-gray-600 mt-1 truncate" title={sub.message}>
                                        {sub.message}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={`${
                                  isLateSubmission 
                                    ? "bg-red-100 text-red-700 border border-red-300" 
                                    : "bg-green-100 text-green-700 border border-green-300"
                                }`}>
                                  {isLateSubmission ? 'Terlambat' : 'Tepat Waktu'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                <div>
                                  <p className="font-medium text-gray-900">{new Date(sub.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                  <p className="text-xs text-gray-500">{new Date(sub.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {sub.file_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleImagePreview(sub.file_url)}
                                    className="border-gray-300 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    {/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(sub.file_url) ? (
                                      <File className="h-4 w-4" />
                                    ) : (
                                      <DownloadIcon className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                                {!sub.file_url && sub.message && (
                                  <span className="text-xs text-gray-500">Pesan saja</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow sticky top-24">
              <CardHeader className="border-b border-gray-200 bg-[#1E1E1E] rounded-t-lg py-4">
                <CardTitle className="text-lg text-[#FFFFFC]">Informasi Detail</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Tugas</p>
                      <p className="font-medium text-gray-900 truncate">{content.judul} - {content.sub_judul}</p>
                    </div>
                  </div>
                </div>

                {className && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Kelas</p>
                        <p className="font-medium text-gray-900 truncate">{className}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Jenis</p>
                      <p className="font-medium text-gray-900">{content.jenis_create.charAt(0).toUpperCase() + content.jenis_create.slice(1).toLowerCase()}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-xs font-bold text-green-700">
                      {(creatorName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Pengajar</p>
                      <p className="font-medium text-gray-900 truncate">{creatorName || 'Unknown'}</p>
                    </div>
                  </div>
                </div>

                {content.deadline && (
                  <div className={`pt-2 border-t ${isLate ? "border-red-200" : "border-gray-200"}`}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLate ? "bg-red-100" : "bg-purple-100"}`}>
                          <Clock className={`h-4 w-4 ${isLate ? "text-red-600" : "text-purple-600"}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Deadline</p>
                          <p className={`font-semibold text-sm ${isLate ? "text-red-700" : "text-purple-700"}`}>
                            {getRelativeTime(content.deadline)}
                          </p>
                        </div>
                      </div>
                      <div className="ml-10 text-xs text-gray-600">
                        {new Date(content.deadline).toLocaleDateString('id-ID', { 
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })} • {new Date(content.deadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )}

                {isAssignment && submissions && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs uppercase tracking-wide font-semibold text-gray-600 mb-2">Statistik Pengumpulan</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
                        <p className="text-lg font-bold text-blue-700">{submissions.length}</p>
                        <p className="text-xs text-blue-600">Dikumpulkan</p>
                      </div>
                      <div className="bg-gray-100 border border-gray-300 rounded p-2 text-center">
                        <p className="text-lg font-bold text-gray-700">0</p>
                        <p className="text-xs text-gray-600">Belum</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:text-white hover:bg-white/20"
              onClick={() => setPreviewImage(null)}
            >
              ✕
            </Button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[90vh] mx-auto rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 right-4">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(previewImage, previewImage.substring(previewImage.lastIndexOf('/') + 1));
                }}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Unduh
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          onClick={() => !isDeletingSubmission && setShowDeleteModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Hapus Pengumpulan</h3>
                <p className="text-sm text-gray-600">Konfirmasi penghapusan</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Apakah Anda yakin ingin menghapus pengumpulan tugas ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingSubmission}
                className="border-gray-300"
              >
                Batal
              </Button>
              <Button
                onClick={handleDeleteSubmission}
                disabled={isDeletingSubmission}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeletingSubmission ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}