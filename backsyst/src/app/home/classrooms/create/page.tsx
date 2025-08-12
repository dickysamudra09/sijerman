"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Editor } from '@tinymce/tinymce-react';

interface CreateFormData {
  judul: string;
  sub_judul: string;
  jenis_create: "materi" | "Latihan soal" | "kuis";
  konten: string;
  deadline: string;
}

export default function CreateContentPage() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.user) {
        setError("Tidak ada sesi ditemukan. Silakan masuk.");
        router.push("/auth/login");
        return;
      }

      const userId = sessionData.session.user.id;
      setUserId(userId);

      const classIdParam = searchParams.get("classId");
      if (classIdParam) {
        setClassId(classIdParam);
      } else {
        setError("ID kelas tidak ditemukan.");
      }
    };

    fetchUserData();
  }, [router, searchParams]);

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

  const onSubmit = async (data: CreateFormData) => {
    setIsLoading(true);
    setError(null);

    if (!userId || !classId) {
      setError("User ID atau Class ID tidak ditemukan.");
      setIsLoading(false);
      return;
    }

    const documents: { name: string; url: string }[] = [];

    if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        const filePath = `${userId}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) {
          setError("Gagal upload file: " + uploadError.message);
          setIsLoading(false);
          return;
        }

        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
        const publicUrl = urlData.publicUrl;
        documents.push({ name: file.name, url: publicUrl });
      }
    }

    const { error } = await supabase
      .from("teacher_create")
      .insert({
        judul: data.judul,
        sub_judul: data.sub_judul,
        kelas: classId,
        pembuat: userId,
        jenis_create: data.jenis_create,
        konten: data.konten,
        documents: documents,
        deadline: data.deadline,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      setError("Gagal membuat konten: " + error.message);
    } else {
      toast.success("Konten berhasil dibuat!");
      router.push(`/home/classrooms/${classId}`);
    }

    setIsLoading(false);
  };

  const handleEditorChange = (content: string) => {
    setValue("konten", content);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Kembali
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              ← Kembali
            </Button>
            <h1 className="text-2xl font-bold">Buat Konten Baru untuk Kelas {classId}</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Pembuatan Konten</CardTitle>
            <CardDescription>Isi form di bawah untuk membuat materi, latihan, atau kuis baru.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="judul">Judul (contoh: Pertemuan ke-1)</Label>
                <Input
                  id="judul"
                  {...register("judul", { required: "Judul wajib diisi" })}
                  placeholder="Masukkan judul"
                />
                {errors.judul && <p className="text-red-600 text-sm">{errors.judul.message}</p>}
              </div>
              <div>
                <Label htmlFor="sub_judul">Sub Judul (contoh: Nama Materi/Latihan/Kuis)</Label>
                <Input
                  id="sub_judul"
                  {...register("sub_judul", { required: "Sub judul wajib diisi" })}
                  placeholder="Masukkan sub judul"
                />
                {errors.sub_judul && <p className="text-red-600 text-sm">{errors.sub_judul.message}</p>}
              </div>
              <div>
                <Label htmlFor="jenis_create">Jenis Konten</Label>
                <Select onValueChange={(value) => setValue("jenis_create", value as "materi" | "Latihan soal" | "kuis")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="materi">Materi</SelectItem>
                    <SelectItem value="Latihan soal">Latihan Soal</SelectItem>
                    <SelectItem value="kuis">Kuis</SelectItem>
                  </SelectContent>
                </Select>
                {errors.jenis_create && <p className="text-red-600 text-sm">{errors.jenis_create.message}</p>}
              </div>
              <div>
                <Label htmlFor="konten">Konten</Label>
                <Editor
                  apiKey="ovw3rgflgzy8eequry80mjqzagd444pabxa9b0tokym3twln" 
                  initialValue=""
                  init={{
                    height: 500,
                    menubar: false,
                    plugins: [
                      'advlist autolink lists link image charmap print preview anchor',
                      'searchreplace visualblocks code fullscreen',
                      'insertdatetime media table paste code help wordcount'
                    ],
                    toolbar: 'undo redo | formatselect | bold italic backcolor | link image | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                  }}
                  onEditorChange={handleEditorChange}
                />
                {errors.konten && <p className="text-red-600 text-sm">{errors.konten.message}</p>}
              </div>
              <div>
                <Label>Upload Dokumen (maks 5, total 12MB)</Label>
                <Input 
                  type="file" 
                  multiple 
                  accept=".pdf,.doc,.docx,.jpg,.png,.txt" 
                  onChange={handleFileChange} 
                />
                {fileErrors && <p className="text-red-600 text-sm">{fileErrors}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-2">
                      {file.name}
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 h-auto text-red-600" 
                        onClick={() => removeFile(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  {...register("deadline")}
                  placeholder="Pilih deadline"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white hover:bg-blue-700">
                {isLoading ? "Membuat..." : "Buat Konten"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}