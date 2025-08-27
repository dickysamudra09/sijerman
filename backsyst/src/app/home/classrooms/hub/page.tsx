"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, BookOpen, FileText, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContentHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  const cardData = [
    {
      title: "Materi",
      description: "Buat materi pembelajaran untuk siswa",
      icon: <BookOpen className="w-8 h-8 mb-2" />,
      route: `/home/classrooms/create?classId=${classId}`
    },
    {
      title: "Latihan Soal",
      description: "Buat paket soal latihan untuk siswa",
      icon: <FileText className="w-8 h-8 mb-2" />,
      route: `/home/classrooms/latihanSoal?classId=${classId}`
    },
    {
      title: "Kuis",
      description: "Buat kuis evaluasi untuk siswa",
      icon: <ClipboardList className="w-8 h-8 mb-2" />,
      route: `/home/classrooms/kuis?classId=${classId}`
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <GraduationCap className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">Buat Konten Baru</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cardData.map((item, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-all cursor-pointer hover:border-primary"
              onClick={() => router.push(item.route)}
            >
              <CardHeader className="text-center">
                <div className="flex justify-center">
                  {item.icon}
                </div>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground">
                {item.description}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="px-6"
          >
            Kembali
          </Button>
        </div>
      </div>
    </div>
  );
}
