"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Edit, BookOpen, Clock, FileText, UserCircle, UploadCloud, CheckCircle2, Download as DownloadIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<StudentSubmission | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionWithStudentName[] | null>(null);
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
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
        .select("role")
        .eq("id", currentUserId)
        .single();

      if (userError || !userData) {
        setError("Gagal mengambil data pengguna: " + (userError?.message || ""));
        setIsLoading(false);
        return;
      }

      setUserRole(userData.role);

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
    toast.info("Fitur update akan segera tersedia!");
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
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <Card className="w-full max-w-screen-2xl bg-white shadow-2xl border-0 rounded-2xl">
          <CardContent className="flex items-center justify-center p-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Memuat konten...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <Card className="w-full max-w-screen-2xl bg-white shadow-2xl border-0 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-red-600 text-xl">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-6">{error || "Konten tidak ditemukan"}</p>
            <Button onClick={() => router.push(`/home/classrooms/${classId}`)} className="bg-sky-500 hover:bg-sky-600 text-white shadow-md">
              Kembali
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isContentCreator = userRole === "teacher" && content.pembuat === userId;
  const isAssignment = content.jenis_create.toLowerCase() === "tugas";

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
      <Card className="w-full h-[calc(100vh-48px)] max-w-screen-2xl bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-gray-100 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push(`/home/classrooms/${classId}`)} className="text-gray-600 hover:text-gray-900">
                ← Kembali ke Kelas
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-full shadow-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{content.judul}</h1>
              </div>
            </div>
            {isContentCreator && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleUpdate} disabled={isLoading} className="border-gray-300 text-gray-600 hover:bg-gray-50 shadow-sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Update
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isLoading} className="bg-red-500 hover:bg-red-600 text-white shadow-sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-8 overflow-y-auto h-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="bg-white border-0 shadow-lg rounded-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Jenis Konten</CardTitle>
                <BookOpen className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-sky-600">{content.jenis_create}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-0 shadow-lg rounded-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Pembuat</CardTitle>
                <UserCircle className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600">
                  {creatorName}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-0 shadow-lg rounded-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Batas Waktu</CardTitle>
                <Clock className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-purple-600">
                  {content.deadline ? new Date(content.deadline).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : "Tidak Ada"}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="bg-gray-100 border-0 rounded-xl p-1 shadow-inner">
              <TabsTrigger value="content" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-sky-600 rounded-lg px-8 py-3 font-medium">Isi Konten</TabsTrigger>
              <TabsTrigger value="attachments" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-sky-600 rounded-lg px-8 py-3 font-medium">Dokumen Pendukung</TabsTrigger>
              {isAssignment && userRole === "student" && (
                <TabsTrigger value="submission" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-sky-600 rounded-lg px-8 py-3 font-medium">
                  Kumpulkan Tugas
                  {submissionStatus ? (
                    <CheckCircle2 className="h-4 w-4 ml-2 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 ml-2 text-red-500" />
                  )}
                </TabsTrigger>
              )}
              {isAssignment && isContentCreator && (
                <TabsTrigger value="submissions" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-sky-600 rounded-lg px-8 py-3 font-medium">
                  Daftar Pengumpulan
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="content" className="space-y-6 mt-8">
              <Card className="bg-white border border-gray-100 shadow-lg rounded-xl p-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-gray-900">{content.sub_judul}</CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    Dibuat pada: {new Date(content.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none break-words" dangerouslySetInnerHTML={{ __html: content.konten }} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments" className="space-y-6 mt-8">
              <Card className="bg-white border border-gray-100 shadow-lg rounded-xl p-6">
                <CardHeader>
                  <CardTitle>Dokumen Pendukung</CardTitle>
                </CardHeader>
                <CardContent>
                  {content.documents && content.documents.length > 0 ? (
                    <ul className="list-disc pl-6 space-y-2">
                      {content.documents.map((doc, index) => (
                        <li key={index}>
                          <button onClick={() => handleDownload(doc.url, doc.name)} className="text-blue-600 hover:underline flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            {doc.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Tidak ada dokumen pendukung yang dilampirkan.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {isAssignment && userRole === "student" && (
              <TabsContent value="submission" className="space-y-6 mt-8">
                <Card className="bg-white border border-gray-100 shadow-lg rounded-xl p-6">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Kumpulkan Tugas
                      {submissionStatus ? (
                        <Badge className="bg-green-500 text-white">Sudah Dikumpulkan</Badge>
                      ) : (
                        <Badge className="bg-red-500 text-white">Belum Dikumpulkan</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>Unggah file tugas Anda. Maksimal 12MB.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-sky-500 transition-colors"
                    >
                      <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-sm text-gray-500 mb-2">Drag and drop file di sini, atau</p>
                      <label htmlFor="file-upload" className="text-sky-600 font-medium hover:underline cursor-pointer">
                        Pilih file
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                    {selectedFile && (
                      <div className="mt-4 p-3 bg-gray-100 rounded-md flex items-center justify-between">
                        <span className="text-sm text-gray-700">{selectedFile.name}</span>
                        <Button
                          variant="ghost"
                          onClick={() => setSelectedFile(null)}
                          className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <Button
                      onClick={handleFileUpload}
                      className="w-full bg-sky-500 text-white hover:bg-sky-600 mt-6"
                      disabled={!selectedFile || isUploading}
                    >
                      {isUploading ? "Mengunggah..." : "Kumpulkan Tugas"}
                    </Button>
                  </CardContent>
                </Card>
                {submissionStatus && (
                  <Card className="bg-white border border-gray-100 shadow-lg rounded-xl p-6">
                    <CardHeader>
                      <CardTitle>Detail Pengumpulan Anda</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">File: </span>
                        <button onClick={() => handleDownload(submissionStatus.file_url, "Tugas Anda")} className="text-blue-600 hover:underline">
                          Lihat dan Unduh File Tugas
                        </button>
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">Waktu Pengumpulan: </span>
                        {new Date(submissionStatus.submitted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}

            {isAssignment && isContentCreator && (
              <TabsContent value="submissions" className="space-y-6 mt-8">
                <Card className="bg-white border border-gray-100 shadow-lg rounded-xl p-6">
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div className="space-y-1">
                      <CardTitle>Daftar Pengumpulan Siswa</CardTitle>
                      <CardDescription>
                        {submissions && submissions.length > 0
                          ? `Total ${submissions.length} siswa sudah mengumpulkan.`
                          : "Belum ada siswa yang mengumpulkan tugas ini."}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleDownloadSelected}
                      disabled={selectedSubmissionIds.length === 0 || isDownloadingAll}
                      className="bg-sky-500 hover:bg-sky-600 text-white shadow-md transition-all duration-200 ease-in-out"
                    >
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      {isDownloadingAll ? "Mengunduh..." : `Unduh Dokumen Terpilih (${selectedSubmissionIds.length})`}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {submissions && submissions.length > 0 ? (
                      <Table>
                        <TableHeader>
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
                            <TableHead>Nama Siswa</TableHead>
                            <TableHead>Status Pengumpulan</TableHead>
                            <TableHead>Waktu Pengumpulan</TableHead>
                            <TableHead className="text-right">Dokumen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {submissions.map((submission) => {
                            const isLate = content.deadline && new Date(submission.submitted_at) > new Date(content.deadline);
                            return (
                              <TableRow key={submission.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedSubmissionIds.includes(submission.id)}
                                    onCheckedChange={(checked) => handleCheckboxChange(submission.id, checked as boolean)}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{submission.users?.name || 'Nama Tidak Ditemukan'}</TableCell>
                                <TableCell>
                                  <Badge className={isLate ? "bg-red-500 text-white hover:bg-red-500/80" : "bg-green-500 text-white hover:bg-green-500/80"}>
                                    {isLate ? "Terlambat" : "Tepat Waktu"}
                                  </Badge>
                                </TableCell>
                                <TableCell>{new Date(submission.submitted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                                <TableCell className="text-right">
                                  <button onClick={() => handleDownload(submission.file_url, `${submission.users?.name || "siswa"}_${submission.file_url.substring(submission.file_url.lastIndexOf('/') + 1)}`)} className="inline-flex items-center gap-2 text-sky-600 hover:underline">
                                    <DownloadIcon className="h-4 w-4" />
                                    Unduh
                                  </button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground text-center">Belum ada pengumpulan tugas.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}