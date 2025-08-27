"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Edit, BookOpen, Clock, FileText, UserCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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

export default function ContentDetailPage() {
  const [content, setContent] = useState<ContentItem | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

      console.log("Fetching content with classId:", classId, "contentId:", contentId);

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

      if (userData.role === "teacher") {
        const { data, error: fetchError } = await supabase
          .from("teacher_create")
          .select("*")
          .eq("id", contentId)
          .eq("kelas", classId)
          .eq("pembuat", currentUserId)
          .single();

        if (fetchError) {
          setError("Gagal mengambil konten: " + fetchError.message);
        } else if (!data) {
          setError("Konten tidak ditemukan atau Anda tidak memiliki akses.");
        } else {
          setContent(data);
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

        const { data, error: fetchError } = await supabase
          .from("teacher_create")
          .select("*, users(name)")
          .eq("id", contentId)
          .eq("kelas", classId)
          .single();

        if (fetchError) {
          setError("Gagal mengambil konten: " + fetchError.message);
        } else if (!data) {
          setError("Konten tidak ditemukan.");
        } else {
          const contentWithTeacherName = {
            ...data,
            pembuat: data.users.name || "Guru Tidak Dikenal",
          };
          setContent(contentWithTeacherName as any);
        }
      } else {
        setError("Role pengguna tidak valid.");
      }

      setIsLoading(false);
    };

    fetchContent();
  }, [classId, contentId, router]);

  const handleDelete = async () => {
    if (!content || userRole !== "teacher" || content.pembuat !== userId) return;

    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus konten ini?");
    if (!confirmDelete) return;

    setIsLoading(true);

    if (content.documents && content.documents.length > 0) {
      const filePaths = content.documents.map(doc => doc.url.split('/storage/v1/object/public/documents/')[1]);
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove(filePaths);

      if (storageError) {
        toast.error("Gagal menghapus file: " + storageError.message);
        setIsLoading(false);
        return;
      }
    }

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
                  {content.pembuat}
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
                  {/* Solusi perbaikan di sini */}
                  {content.deadline ? new Date(content.deadline).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : "Tidak Ada"}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="bg-gray-100 border-0 rounded-xl p-1 shadow-inner">
              <TabsTrigger value="content" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-sky-600 rounded-lg px-8 py-3 font-medium">Isi Konten</TabsTrigger>
              <TabsTrigger value="attachments" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-sky-600 rounded-lg px-8 py-3 font-medium">Dokumen Pendukung</TabsTrigger>
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
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            {doc.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Tidak ada dokumen pendukung yang dilampirkan.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}