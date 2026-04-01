"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userData?.role !== "teacher") {
        router.push("/home");
        return;
      }

      setUser(user);
    };

    checkAuth();
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Judul kelas harus diisi");
      return;
    }

    if (!formData.description.trim()) {
      setError("Deskripsi kelas harus diisi");
      return;
    }

    if (!user) {
      setError("Pengguna tidak ditemukan");
      return;
    }

    setLoading(true);

    try {
      const { data, error: createError } = await supabase
        .from("courses")
        .insert({
          title: formData.title,
          description: formData.description,
          teacher_id: user.id,
          class_type: "open",
          is_paid: false, 
        })
        .select()
        .single();

      if (createError) throw createError;

      router.push(`/teacher/courses/${data.id}/modules`);
    } catch (err: any) {
      setError(err.message || "Gagal membuat kelas");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFC" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: "rgba(26, 26, 26, 0.98)",
          borderBottomColor: "rgba(232, 184, 36, 0.1)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="flex items-center gap-2"
            style={{ color: "#FFFFFC" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1
            className="text-4xl font-bold mb-2"
            style={{ color: "#1A1A1A", lineHeight: "1.3" }}
          >
            Buat Kelas Baru
          </h1>
          <p style={{ color: "#4A4A4A" }}>
            Mulai dengan memasukkan informasi dasar tentang kelas Anda. Anda akan menambahkan modul dan konten di langkah berikutnya.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Error Alert */}
          {error && (
            <div
              className="p-4 rounded-lg border border-red-200 bg-red-50 flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Course Title */}
          <div className="space-y-2">
            <Label
              htmlFor="title"
              className="text-sm font-semibold block"
              style={{ color: "#1A1A1A" }}
            >
              Judul Kelas *
            </Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="Contoh: Belajar Bahasa Jerman dari Nol"
              value={formData.title}
              onChange={handleInputChange}
              className="h-12 rounded-lg border-2 focus:border-yellow-400 focus:ring-0 focus:outline-none pl-4 pr-10 text-base transition-all hover:border-opacity-75"
              style={{
                backgroundColor: "#FFFFFC",
                borderColor: "rgba(232, 184, 36, 0.25)",
              }}
            />
            <p className="text-xs" style={{ color: "#999999" }}>
              Buat judul yang jelas dan deskriptif
            </p>
          </div>

          {/* Course Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-sm font-semibold block"
              style={{ color: "#1A1A1A" }}
            >
              Deskripsi Kelas *
            </Label>
            <textarea
              id="description"
              name="description"
              placeholder="Jelaskan apa yang akan dipelajari siswa di kelas ini..."
              value={formData.description}
              onChange={handleInputChange}
              rows={5}
              className="w-full rounded-lg border-2 focus:border-yellow-400 focus:ring-0 focus:outline-none p-4 text-base transition-all resize-none hover:border-opacity-75"
              style={{
                backgroundColor: "#FFFFFC",
                fontFamily: "inherit",
                borderColor: "rgba(232, 184, 36, 0.25)",
              }}
            />
            <p className="text-xs" style={{ color: "#999999" }}>
              Ini akan ditampilkan di halaman pencarian kelas
            </p>
          </div>

          {/* Info Box */}
          <div
            className="p-5 rounded-xl border-2 backdrop-blur-sm"
            style={{
              backgroundColor: "rgba(255, 255, 252, 0.8)",
              borderColor: "rgba(232, 184, 36, 0.3)",
            }}
          >
            <div className="flex items-start gap-3 mb-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm"
                style={{
                  backgroundColor: "#E8B824",
                  color: "#1A1A1A"
                }}
              >
                ℹ
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1" style={{ color: "#1A1A1A" }}>
                  Kelas Terbuka (Gratis)
                </p>
                <p className="text-sm" style={{ color: "#4A4A4A" }}>
                  Anda membuat kelas terbuka yang dapat dipelajari sendiri. Siswa dapat melihat pratinjau 3 modul pertama sebelum mendaftar. Anda dapat mengubahnya menjadi berbayar nanti.
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6 border-t" style={{ borderColor: "rgba(232, 184, 36, 0.1)" }}>
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
              className="flex-1 h-12 font-semibold"
              style={{
                color: "#1A1A1A",
                borderColor: "rgba(232, 184, 36, 0.2)",
              }}
            >
              Batalkan
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 font-semibold transition-all hover:opacity-90 rounded-lg"
              style={{
                backgroundColor: "#E8B824",
                color: "#1A1A1A",
              }}
            >
              {loading ? "Membuat..." : "Buat Kelas"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
