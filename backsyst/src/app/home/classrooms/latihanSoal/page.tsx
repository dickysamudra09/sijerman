"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function LatihanSoalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h1 className="text-2xl font-bold mb-4">
            Halaman Latihan Soal untuk Kelas {classId}
          </h1>
          <p className="text-muted-foreground">
            Fitur pembuatan latihan soal akan dikembangkan di sini.
          </p>
        </div>
      </div>
    </div>
  );
}
