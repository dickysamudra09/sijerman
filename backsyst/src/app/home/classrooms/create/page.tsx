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
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const Editor = dynamic(() => import("@tinymce/tinymce-react").then(m => m.Editor), { ssr: false });

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
  const contentIdParam = searchParams.get("contentId");
  const pertemuanParam = searchParams.get("pertemuan");
  const isEditing = !!contentIdParam;

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
  const [pertemuan, setPertemuan] = useState<number | null>(pertemuanParam ? parseInt(pertemuanParam) : null);
  const [showConfirmBack, setShowConfirmBack] = useState(false);

  const jenis_create = watch("jenis_create");
  
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
          setInitialKonten(contentData.konten);
          
          if (contentData.deadline) {
            const formattedDeadline = new Date(contentData.deadline).toISOString().substring(0, 16);
            setValue("deadline", formattedDeadline);
          }
          
          if (contentData.documents) {
            setInitialDocuments(contentData.documents);
          }
        }
      } else {
        setIsModalOpen(true);
      }
      
      setInitialLoading(false);
    };

    fetchUserData();
  }, [router, classIdParam, contentIdParam, isEditing, setValue]);

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

  const onSubmit = async (data: CreateFormData) => {
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
      const { error: updateError } = await supabase
        .from("teacher_create")
        .update({
          judul: data.judul,
          sub_judul: data.sub_judul,
          jenis_create: data.jenis_create,
          konten: data.konten,
          documents: allDocuments,
          deadline: deadlineValue,
          pertemuan: pertemuan || 1,
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
          pertemuan: pertemuan || 1,
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

  const handleEditorChange = (content: string) => {
    setValue("konten", content);
  };
  
  const handleEditorInit = () => {
    setEditorReady(true);
  };

  const handleSelectJenis = (jenis: "materi" | "tugas" | "Latihan soal" | "kuis") => {
    setValue("jenis_create", jenis);
    setIsModalOpen(false);
    clearErrors("deadline");
    if (jenis.toLowerCase() === "materi" || jenis.toLowerCase() === "latihan soal" || jenis.toLowerCase() === "kuis") {
      setValue("deadline", "");
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="bg-white shadow-lg border-0 rounded-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Memuat data kelas...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white shadow-lg border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="text-red-600 text-xl">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-6">{error}</p>
              <Button onClick={() => router.back()} className="bg-blue-600 hover:bg-blue-700 text-white">
                Kembali
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-4 sm:py-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button 
                variant="ghost" 
                onClick={() => setShowConfirmBack(true)} 
                className="text-white hover:bg-white/20 h-10 w-10 p-0 flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold">{isEditing ? "Edit Konten" : "Buat Konten"}</h1>
                <p className="text-xs sm:text-sm text-blue-100 truncate">{className}</p>
              </div>
            </div>
            {classCode && (
              <Badge className="bg-white/20 text-white border-0 px-3 py-1.5 text-xs sm:text-sm flex-shrink-0 backdrop-blur-sm">
                {classCode}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Quick Info Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Tipe Konten */}
            <button
              type="button"
              onClick={() => {
                if (!isEditing) {
                  setIsModalOpen(true);
                } else {
                  toast.info("Tipe konten tidak dapat diubah saat mode edit.");
                }
              }}
              className="flex items-center gap-3 hover:bg-blue-50 p-2 rounded-lg transition-colors flex-1 sm:flex-auto text-left"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Tipe Konten</p>
                <p className="text-sm font-semibold text-gray-900">{jenis_create || "Belum dipilih"}</p>
              </div>
            </button>

            {/* Dokumen */}
            <div className="flex items-center gap-3 flex-1 sm:flex-auto">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Upload className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Dokumen</p>
                <p className="text-sm font-semibold text-gray-900">{selectedFiles.length + initialDocuments.length}/5</p>
              </div>
            </div>

            {/* Pertemuan */}
            {pertemuan && (
              <div className="flex items-center gap-3 flex-1 sm:flex-auto">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Pertemuan</p>
                  <p className="text-sm font-semibold text-orange-700">{pertemuan}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Card */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
          <CardHeader className="border-b border-gray-200 pb-4">
            <CardTitle className="text-xl text-gray-900">
              {isEditing ? "Edit Konten" : "Informasi Konten"}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              Isi formulir untuk {isEditing ? "mengubah" : "membuat"} konten pembelajaran
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Judul & Sub Judul */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="judul" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Judul <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="judul" 
                    {...register("judul", { required: "Judul wajib diisi" })} 
                    placeholder="Contoh: Perkenalan Bahasa Jerman" 
                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-200" 
                  />
                  {errors.judul && <p className="text-red-500 text-xs mt-1.5">{errors.judul.message}</p>}
                </div>
                <div>
                  <Label htmlFor="sub_judul" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Sub Judul <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="sub_judul" 
                    {...register("sub_judul", { required: "Sub judul wajib diisi" })} 
                    placeholder="Contoh: Memperkenalkan diri" 
                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-200" 
                  />
                  {errors.sub_judul && <p className="text-red-500 text-xs mt-1.5">{errors.sub_judul.message}</p>}
                </div>
              </div>

              {/* Jenis Konten - Hidden */}
              <input type="hidden" {...register("jenis_create", { required: "Jenis konten wajib dipilih" })} />
              {errors.jenis_create && <p className="text-red-600 text-sm mt-1">{errors.jenis_create.message}</p>}

              {/* Konten Editor */}
              <div>
                <Label htmlFor="konten" className="text-sm font-semibold text-gray-700 mb-3 block">
                  Konten <span className="text-red-500">*</span>
                </Label>
                <div className="border border-gray-300 rounded-lg overflow-hidden hover:border-gray-400 transition-colors">
                  <Editor
                    apiKey="ovw3rgflgzy8eequry80mjqzagd444pabxa9b0tokym3twln"
                    initialValue={initialKonten}
                    onInit={handleEditorInit}
                    init={{
                      height: 400,
                      menubar: false,
                      plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount',
                      toolbar: 'undo redo | formatselect | bold italic backcolor | link image | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                    }}
                    onEditorChange={handleEditorChange}
                  />
                </div>
                {errors.konten && <p className="text-red-500 text-xs mt-1.5">{errors.konten.message}</p>}
              </div>

              {/* Deadline */}
              {jenis_create?.toLowerCase() === "tugas" && (
                <div>
                  <Label htmlFor="deadline" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Deadline <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="deadline" 
                    type="datetime-local" 
                    {...register("deadline", { required: "Deadline wajib diisi untuk tugas" })} 
                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-200" 
                  />
                  {errors.deadline && <p className="text-red-500 text-xs mt-1.5">{errors.deadline.message}</p>}
                </div>
              )}

              {/* Dokumen Upload */}
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Dokumen Pendukung <span className="text-gray-500 font-normal">(opsional)</span>
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <Input 
                    type="file" 
                    multiple 
                    accept=".pdf,.doc,.docx,.jpg,.png,.txt" 
                    onChange={handleFileChange}
                    className="border-0 p-0 focus:ring-0"
                  />
                  <p className="text-xs text-gray-500 mt-2">Maks 5 file, total 12MB</p>
                </div>
                {fileErrors && <p className="text-red-500 text-xs mt-1.5">{fileErrors}</p>}
                
                {/* Existing Documents */}
                {initialDocuments.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Dokumen Saat Ini:</p>
                    <div className="space-y-2">
                      {initialDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="p-0 h-auto text-red-500 hover:text-red-700 flex-shrink-0"
                            onClick={() => removeExistingFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* New Files to Upload */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">File Baru:</p>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Upload className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="p-0 h-auto text-red-500 hover:text-red-700 flex-shrink-0"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirmBack(true)}
                  className="flex-1"
                >
                  {isEditing ? "Batalkan Edit" : "Batalkan Buat"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {isEditing ? "Memperbarui..." : "Membuat..."}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {isEditing ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {isEditing ? "Perbarui Konten" : "Buat Konten"}
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Modal Pilih Jenis Konten */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-white shadow-xl border-0 rounded-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              Pilih Jenis Konten
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Tentukan apakah konten ini adalah Materi atau Tugas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => handleSelectJenis("materi")}
              className="w-full bg-white border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg p-6 h-auto flex items-start text-left"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <span className="text-lg font-bold text-blue-600 block">Materi</span>
                  <p className="text-sm text-gray-600 mt-1">
                    Buat konten pembelajaran dengan teks, gambar, dan video.
                  </p>
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSelectJenis("tugas")}
              className="w-full bg-white border-l-4 border-l-green-600 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg p-6 h-auto flex items-start text-left"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <span className="text-lg font-bold text-green-600 block">Tugas</span>
                  <p className="text-sm text-gray-600 mt-1">
                    Buat tugas yang memerlukan pengumpulan.
                  </p>
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Kembali */}
      <Dialog open={showConfirmBack} onOpenChange={setShowConfirmBack}>
        <DialogContent className="bg-white max-w-md rounded-xl border-0 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-6 w-6" />
              {isEditing ? "Batalkan Edit Konten?" : "Batalkan Pembuatan Konten?"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Perubahan yang belum disimpan akan hilang. Apakah Anda yakin ingin kembali?
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowConfirmBack(false)}
              className="flex-1"
            >
              {isEditing ? "Lanjutkan Edit" : "Lanjutkan Membuat"}
            </Button>
            <Button
              onClick={() => {
                setShowConfirmBack(false);
                router.push(`/home/classrooms/${classId}`);
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Batalkan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

