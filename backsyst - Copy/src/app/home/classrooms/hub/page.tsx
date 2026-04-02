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
      title: "Materi & Tugas",
      description: "Buat materi pembelajaran untuk siswa",
      icon: <BookOpen className="w-8 h-8 mb-2" />,
      route: `/home/classrooms/create?classId=${classId}`,
      color: "text-blue-600"
    },
    {
      title: "Latihan Soal",
      description: "Buat paket soal latihan untuk siswa",
      icon: <FileText className="w-8 h-8 mb-2" />,
      route: `/home/classrooms/latihanSoal?classId=${classId}`,
      color: "text-green-600"
    },
    {
      title: "Kuis",
      description: "Buat kuis evaluasi untuk siswa",
      icon: <ClipboardList className="w-8 h-8 mb-2" />,
      route: `/home/classrooms/kuis?classId=${classId}`,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Main Card Container */}
        <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-gray-100 p-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-sky-500 rounded-full shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Buat Konten Baru</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {/* Content Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cardData.map((item, index) => (
                <Card 
                  key={index} 
                  className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer rounded-xl"
                  onClick={() => router.push(item.route)}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center">
                      <div className={`${item.color} p-4 bg-gray-50 rounded-full mb-4`}>
                        {item.icon}
                      </div>
                    </div>
                    <CardTitle className="text-gray-900 text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center px-6 pb-6">
                    <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Back Button */}
            <div className="mt-8 flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="border-gray-300 text-gray-600 shadow-sm hover:bg-gray-50 px-8 py-3 text-lg"
              >
                ← Kembali
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}