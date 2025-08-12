"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

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
}

export default function ContentDetailPage() {
  const [content, setContent] = useState<ContentItem | null>(null);
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

      const userId = sessionData.session.user.id;

      const { data, error: fetchError } = await supabase
        .from("teacher_create")
        .select("*")
        .eq("id", contentId)
        .eq("kelas", classId)
        .eq("pembuat", userId)
        .single();

      console.log("Supabase response:", { data, error: fetchError }); 

      if (fetchError) {
        setError("Gagal mengambil konten: " + fetchError.message);
      } else if (!data) {
        setError("Konten tidak ditemukan atau Anda tidak memiliki akses.");
      } else {
        setContent(data);
      }

      setIsLoading(false);
    };

    fetchContent();
  }, [classId, contentId, router]);

  const handleDelete = async () => {
    if (!content) return;

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

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Memuat...</div>;
  }

  if (error || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error || "Konten tidak ditemukan"}</p>
            <Button onClick={() => router.push(`/home/classrooms/${classId}`)} className="mt-4">
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
            <Button variant="ghost" onClick={() => router.push(`/home/classrooms/${classId}`)}>
              ← Kembali
            </Button>
            <h1 className="text-2xl font-bold">{content.judul}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled>Update</Button>
            <Button className="text-red-500" variant="destructive" onClick={handleDelete} disabled={isLoading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{content.sub_judul}</CardTitle>
            <p className="text-sm text-muted-foreground">Jenis: {content.jenis_create}</p>
            {content.deadline && (
              <p className="text-sm text-muted-foreground">Deadline: {new Date(content.deadline).toLocaleString('id-ID')}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Dibuat: {new Date(content.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
            </p>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content.konten }} />
            {content.documents && content.documents.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Dokumen Tambahan:</h3>
                <ul className="list-disc pl-6">
                  {content.documents.map((doc, index) => (
                    <li key={index}>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {doc.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}