"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  GraduationCap,
  BookOpen,
  Plus,
  FileText,
  Upload,
  X,
  PlusCircle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const Editor = dynamic(() => import("@tinymce/tinymce-react").then(m => m.Editor), { ssr: false });

// Definisi tipe data untuk form
interface CreateFormData {
  judul: string;
  sub_judul: string;
  jenis_create: string;
  konten: string;
  deadline: string;
}

export default function CreateContentPage() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    setError: setFormError,
    clearErrors,
  } = useForm<CreateFormData>({
    defaultValues: { jenis_create: "" }
  });
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const classIdParam = searchParams.get("classId");
  const contentIdParam = searchParams.get("contentId"); // Ambil contentId dari URL
  const isEditing = !!contentIdParam; // Tentukan mode edit

  // State untuk data dan UI
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [className, setClassName] = useState<string>("");
  const [classCode, setClassCode] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [initialKonten, setInitialKonten] = useState<string>("");
  const [initialDocuments, setInitialDocuments] = useState<{ name: string; url: string }[]>([]);

  const jenis_create = watch("jenis_create");
  
  // Custom hook-like logic untuk mengambil data awal
  useEffect(() => {
    const fetchUserData = async () => {
      setInitialLoading(true);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.user) {
        setError("Tidak ada sesi ditemukan. Silakan masuk.");
        router.push("/auth/login");
        setInitialLoading(false);
        return;
      }

      const userId = sessionData.session.user.id;
      setUserId(userId);

      if (!classIdParam) {
        setError("ID kelas tidak ditemukan.");
        setInitialLoading(false);
        return;
      }
      setClassId(classIdParam);

      const { data: classroomData, error: classroomError } = await supabase
        .from("classrooms")
        .select("name, code")
        .eq("id", classIdParam)
        .eq("teacher_id", userId)
        .single();

      if (classroomError) {
        setError("Kelas tidak ditemukan atau Anda tidak memiliki akses.");
      } else {
        setClassName(classroomData.name || "");
        setClassCode(classroomData.code || "");
      }

      // Ambil data konten jika dalam mode edit
      if (isEditing) {
        const { data: contentData, error: contentError } = await supabase
          .from("teacher_create")
          .select("judul, sub_judul, jenis_create, konten, deadline, documents")
          .eq("id", contentIdParam)
          .eq("kelas", classIdParam)
          .eq("pembuat", userId)
          .single();
        
        if (contentError) {
          setError("Konten tidak ditemukan atau Anda tidak memiliki akses untuk mengedit.");
          setInitialLoading(false);
          return;
        }

        if (contentData) {
          setValue("judul", contentData.judul);
          setValue("sub_judul", contentData.sub_judul);
          setValue("jenis_create", contentData.jenis_create);
          setValue("konten", contentData.konten);
          setInitialKonten(contentData.konten); // Set initial value for Editor
          
          if (contentData.deadline) {
            // Format deadline ke format datetime-local
            const formattedDeadline = new Date(contentData.deadline).toISOString().substring(0, 16);
            setValue("deadline", formattedDeadline);
          }
          
          if (contentData.documents) {
            setInitialDocuments(contentData.documents);
          }
        }
      } else {
        // Jika mode buat baru, buka modal untuk memilih jenis konten
        setIsModalOpen(true);
      }
      
      setInitialLoading(false);
    };

    fetchUserData();
  }, [router, classIdParam, contentIdParam, isEditing, setValue]);

  // Handler untuk pemilihan file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      setFileErrors("Maksimal 5 dokumen.");
      return;
    }

    let totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    const newFiles = [];
    for (const file of files) {
      if (totalSize + file.size > 12 * 1024 * 1024) {
        setFileErrors("Total ukuran melebihi 12 MB.");
        return;
      }
      totalSize += file.size;
      newFiles.push(file);
    }

    setSelectedFiles([...selectedFiles, ...newFiles]);
    setFileErrors(null);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  const removeExistingFile = (index: number) => {
    const newDocuments = initialDocuments.filter((_, i) => i !== index);
    setInitialDocuments(newDocuments);
  };

  // Logika utama untuk submit form
  const onSubmit = async (data: CreateFormData) => {
    // Validasi tambahan untuk deadline jika jenis "Tugas"
    if (data.jenis_create.toLowerCase() === "tugas" && !data.deadline) {
      setFormError("deadline", {
        type: "manual",
        message: "Deadline wajib diisi untuk tugas.",
      });
      return;
    }

    if (!data.jenis_create) {
      toast.error("Jenis konten harus dipilih.");
      return;
    }

    if (!userId || !classId) {
      toast.error("User ID atau Class ID tidak ditemukan.");
      return;
    }

    let allDocuments: { name: string; url: string }[] = [...initialDocuments];
    const newFilesToUpload = selectedFiles.filter(file => file.name && file.size > 0);

    // Proses upload dokumen baru ke Supabase Storage
    if (newFilesToUpload.length > 0) {
      for (const file of newFilesToUpload) {
        const filePath = `${userId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) {
          toast.error("Gagal upload file: " + uploadError.message);
          return;
        }

        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
        const publicUrl = urlData.publicUrl;
        allDocuments.push({ name: file.name, url: publicUrl });
      }
    }

    const deadlineValue = data.jenis_create.toLowerCase() === "tugas" ? data.deadline : null;

    if (isEditing) {
      // Logika UPDATE
      const { error: updateError } = await supabase
        .from("teacher_create")
        .update({
          judul: data.judul,
          sub_judul: data.sub_judul,
          jenis_create: data.jenis_create,
          konten: data.konten,
          documents: allDocuments,
          deadline: deadlineValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contentIdParam)
        .eq("kelas", classId)
        .eq("pembuat", userId);

      if (updateError) {
        toast.error("Gagal memperbarui konten: " + updateError.message);
      } else {
        toast.success("Konten berhasil diperbarui!");
        router.push(`/home/classrooms/${classId}`);
      }
    } else {
      // Logika INSERT (tetap sama)
      const { error: insertError } = await supabase
        .from("teacher_create")
        .insert({
          judul: data.judul,
          sub_judul: data.sub_judul,
          kelas: classId,
          pembuat: userId,
          jenis_create: data.jenis_create,
          konten: data.konten,
          documents: allDocuments,
          deadline: deadlineValue,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        toast.error("Gagal membuat konten: " + insertError.message);
      } else {
        toast.success("Konten berhasil dibuat!");
        router.push(`/home/classrooms/${classId}`);
      }
    }
  };

  // Handler untuk perubahan TinyMCE editor
  const handleEditorChange = (content: string) => {
    setValue("konten", content);
  };
  
  // Handler untuk inisialisasi TinyMCE
  const handleEditorInit = () => {
    setEditorReady(true);
  };

  // Handler untuk pemilihan jenis konten dari modal
  const handleSelectJenis = (jenis: "materi" | "tugas" | "Latihan soal" | "kuis") => {
    // Memperbaiki nilai yang dikirim agar sesuai dengan skema database
    setValue("jenis_create", jenis);
    setIsModalOpen(false);
    clearErrors("deadline");
    if (jenis.toLowerCase() === "materi" || jenis.toLowerCase() === "latihan soal" || jenis.toLowerCase() === "kuis") {
      setValue("deadline", "");
    }
  };

  // Tampilan Loading dan Error
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Memuat data kelas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white shadow-2xl border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-red-600 text-xl">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-6">{error}</p>
              <Button onClick={() => router.back()} className="bg-sky-500 hover:bg-sky-600 text-white shadow-md">
                Kembali
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Tampilan utama
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-gray-100 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => router.back()} className="border-gray-300 text-gray-600 shadow-sm hover:bg-gray-50">
                  ← Kembali
                </Button>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-500 rounded-full shadow-lg">
                    {isEditing ? <Edit className="h-6 w-6 text-white" /> : <Plus className="h-6 w-6 text-white" />}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{isEditing ? "Edit Konten" : "Buat Konten Baru"}</h1>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{className || `Kelas ${classId}`}</h2>
                  <p className="text-gray-600">{isEditing ? "Ubah detail konten ini" : "Buat konten pembelajaran baru untuk kelas ini"}</p>
                  {jenis_create && (
                    <div className="mt-2 text-sm text-gray-700 font-medium">
                      Pilihan konten Anda:{" "}
                      <span className={`font-semibold ${jenis_create.toLowerCase() === "materi" ? 'text-blue-600' : 'text-green-600'}`}>
                        {jenis_create}
                      </span>
                    </div>
                  )}
                </div>
                {classCode && (
                  <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700 px-4 py-2 text-lg font-medium">
                    Kode: {classCode}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Button
                    type="button"
                    onClick={() => {
                        if (!isEditing) {
                            setIsModalOpen(true);
                        } else {
                            toast.info("Tipe konten tidak dapat diubah saat mode edit.");
                        }
                    }}
                    className={`w-full bg-white border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl p-6 h-auto flex flex-col items-center justify-center text-center group ${jenis_create ? 'border-sky-500' : 'border-gray-100 bg-sky-50 animate-pulse'}`}
                    disabled={isEditing}
                >
                    <div className={`p-3 rounded-full w-fit mx-auto mb-3 shadow-md group-hover:scale-110 transition-transform duration-300 ${jenis_create ? 'bg-sky-500' : 'bg-blue-500'}`}>
                        <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className={`text-lg font-bold mt-2 ${jenis_create ? 'text-sky-600' : 'text-gray-900'}`}>
                        {jenis_create || "Pilih jenis konten"}
                    </div>
                    <p className={`text-sm mt-1 ${jenis_create ? 'text-sky-500' : 'text-gray-500'}`}>
                        {jenis_create ? '' : 'Klik untuk memilih tipe konten Anda'}
                    </p>
                </Button>
                <Card className="bg-white border border-gray-100 shadow-lg rounded-xl">
                  <CardContent className="p-6 text-center">
                    <div className="p-3 bg-green-500 rounded-full w-fit mx-auto mb-3">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-lg font-bold text-green-600">{selectedFiles.length + initialDocuments.length}/5</div>
                    <p className="text-sm text-gray-500 mt-1">Dokumen</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border border-gray-100 shadow-lg rounded-xl">
                  <CardContent className="p-6 text-center">
                    <div className="p-3 bg-purple-500 rounded-full w-fit mx-auto mb-3">
                      <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-lg font-bold text-purple-600">Draft</div>
                    <p className="text-sm text-gray-500 mt-1">Status</p>
                  </CardContent>
                </Card>
              </div>
              <Card className="bg-gray-50 border border-gray-200 shadow-lg rounded-xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                    <div className="p-2 bg-sky-500 rounded-lg"><BookOpen className="h-5 w-5 text-white" /></div>
                    Form {isEditing ? "Edit" : "Pembuatan"} Konten
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Isi form di bawah untuk {isEditing ? "mengubah" : "membuat"} materi atau tugas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="judul" className="text-sm font-medium text-gray-700">Judul</Label>
                        <Input id="judul" {...register("judul", { required: "Judul wajib diisi" })} placeholder="Masukkan judul" className="mt-1 border-gray-300 focus:border-sky-500 focus:ring-sky-500" />
                        {errors.judul && <p className="text-red-600 text-sm mt-1">{errors.judul.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="sub_judul" className="text-sm font-medium text-gray-700">Sub Judul</Label>
                        <Input id="sub_judul" {...register("sub_judul", { required: "Sub judul wajib diisi" })} placeholder="Masukkan sub judul" className="mt-1 border-gray-300 focus:border-sky-500 focus:ring-sky-500" />
                        {errors.sub_judul && <p className="text-red-600 text-sm mt-1">{errors.sub_judul.message}</p>}
                      </div>
                    </div>
                    <div>
                      <input type="hidden" {...register("jenis_create", { required: "Jenis konten wajib dipilih" })} />
                      {errors.jenis_create && (<p className="text-red-600 text-sm mt-1">{errors.jenis_create.message}</p>)}
                    </div>
                    <div>
                      <Label htmlFor="konten" className="text-sm font-medium text-gray-700">Konten</Label>
                      <div className="mt-1 border border-gray-300 rounded-lg overflow-hidden">
                        <Editor
                          apiKey="ovw3rgflgzy8eequry80mjqzagd444pabxa9b0tokym3twln"
                          initialValue={initialKonten}
                          onInit={handleEditorInit}
                          init={{
                            height: 500,
                            menubar: false,
                            plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount',
                            toolbar: 'undo redo | formatselect | bold italic backcolor | link image | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help | print',
                          }}
                          onEditorChange={handleEditorChange}
                        />
                      </div>
                      {errors.konten && <p className="text-red-600 text-sm mt-1">{errors.konten.message}</p>}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Upload Dokumen (opsional, maks 5, total 12MB)
                      </Label>
                      <Input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.png,.txt" onChange={handleFileChange} className="mt-1 border-gray-300 focus:border-sky-500 focus:ring-sky-500" />
                      {fileErrors && <p className="text-red-600 text-sm mt-1">{fileErrors}</p>}
                      {/* Tampilkan dokumen yang sudah ada */}
                      {initialDocuments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium text-gray-700">Dokumen yang sudah ada:</p>
                          <div className="flex flex-wrap gap-2">
                            {initialDocuments.map((doc, index) => (
                              <div key={index} className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">{doc.name}</span>
                                <Button type="button" variant="ghost" size="sm" className="p-0 h-auto text-red-600 hover:text-red-800 ml-1" onClick={() => removeExistingFile(index)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium text-gray-700">File baru yang akan diunggah:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                                <Upload className="h-4 w-4" />
                                <span className="text-sm">{file.name}</span>
                                <Button type="button" variant="ghost" size="sm" className="p-0 h-auto text-red-600 hover:text-red-800 ml-1" onClick={() => removeFile(index)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {jenis_create.toLowerCase() === "tugas" && (
                      <div className="transition-all duration-300 ease-in-out">
                        <Label htmlFor="deadline" className="text-sm font-medium text-gray-700">
                          Deadline <span className="text-red-500">*wajib diisi</span>
                        </Label>
                        <Input id="deadline" type="datetime-local" {...register("deadline", { required: "Deadline wajib diisi untuk tugas" })} placeholder="Pilih deadline" className="mt-1 border-gray-300 focus:border-sky-500 focus:ring-sky-500" />
                        {errors.deadline && <p className="text-red-600 text-sm mt-1">{errors.deadline.message}</p>}
                      </div>
                    )}
                    <div className="pt-6 border-t border-gray-200">
                      <Button type="submit" disabled={isSubmitting} className="w-full bg-sky-500 text-white hover:bg-sky-600 shadow-lg hover:shadow-xl transition-all duration-200 py-3 text-lg font-medium" size="lg">
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            {isEditing ? "Memperbarui Konten..." : "Membuat Konten..."}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {isEditing ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            {isEditing ? "Perbarui Konten" : "Buat Konten"}
                          </div>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden p-0">
          <DialogHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-gray-100 p-8">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
              <div className="p-3 bg-sky-500 rounded-full shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              Pilih Jenis Konten
            </DialogTitle>
            <DialogDescription className="text-gray-600 pl-12">
              Tentukan apakah konten ini adalah Materi atau Tugas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 p-8">
            <Button
              variant="outline"
              onClick={() => handleSelectJenis("materi")}
              className="w-full bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 rounded-xl p-6 h-auto flex flex-col items-start text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-500 rounded-full w-fit shadow-md group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg font-bold text-blue-600">Materi</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Buat konten pembelajaran dengan teks, gambar, dan video.
              </p>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSelectJenis("tugas")}
              className="w-full bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 rounded-xl p-6 h-auto flex flex-col items-start text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-green-500 rounded-full w-fit shadow-md group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg font-bold text-green-600">Tugas</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Buat tugas yang memerlukan pengumpulan.
              </p>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}