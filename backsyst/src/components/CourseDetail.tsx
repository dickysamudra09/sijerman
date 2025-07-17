"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  Users, 
  BookOpen, 
  Star, 
  CheckCircle2,
  PlayCircle,
  FileText,
  Award,
  Calendar
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'reading' | 'quiz';
  completed: boolean;
}

interface CourseDetailProps {
  courseId: string;
  onBack: () => void;
}

// Sample course data - in real app this would come from database
const courseData = {
  "a1-1": {
    id: "a1-1",
    title: "Matematika Dasar",
    description: "Pelajari konsep dasar matematika dengan pendekatan yang mudah dipahami. Course ini dirancang khusus untuk siswa kelas A-1 dengan metode pembelajaran interaktif dan contoh praktis dalam kehidupan sehari-hari.",
    instructor: "Dr. Ahmad Sutrisno",
    duration: "8 minggu",
    students: 45,
    lessons: 24,
    rating: 4.8,
    price: "Gratis",
    level: "Pemula",
    category: "Matematika",
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=450&fit=crop",
    progress: 35,
    enrolled: true
  },
  "a1-2": {
    id: "a1-2",
    title: "Bahasa Indonesia",
    description: "Meningkatkan kemampuan berbahasa Indonesia yang baik dan benar. Pelajari tata bahasa, keterampilan menulis, dan kemampuan komunikasi yang efektif.",
    instructor: "Prof. Siti Nurhaliza",
    duration: "6 minggu",
    students: 52,
    lessons: 18,
    rating: 4.6,
    price: "Gratis",
    level: "Pemula",
    category: "Bahasa",
    thumbnail: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=450&fit=crop",
    progress: 0,
    enrolled: false
  },
  "a1-3": {
    id: "a1-3",
    title: "IPA Terpadu",
    description: "Eksplorasi dunia sains melalui eksperimen dan praktik langsung. Memahami konsep fisika, kimia, dan biologi secara terintegrasi.",
    instructor: "Dr. Budi Santoso",
    duration: "10 minggu",
    students: 38,
    lessons: 30,
    rating: 4.9,
    price: "Gratis",
    level: "Pemula",
    category: "Sains",
    thumbnail: "https://images.unsplash.com/photo-1582719471079-b3adcf9b9e7a?w=800&h=450&fit=crop",
    progress: 0,
    enrolled: false
  },
  "a2-1": {
    id: "a2-1",
    title: "Matematika Lanjutan",
    description: "Konsep matematika tingkat menengah dengan aplikasi praktis dalam kehidupan sehari-hari dan persiapan untuk tingkat yang lebih advanced.",
    instructor: "Dr. Ahmad Sutrisno",
    duration: "10 minggu",
    students: 42,
    lessons: 28,
    rating: 4.7,
    price: "Gratis",
    level: "Menengah",
    category: "Matematika",
    thumbnail: "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800&h=450&fit=crop",
    progress: 0,
    enrolled: false
  },
  "a2-2": {
    id: "a2-2",
    title: "Bahasa Inggris",
    description: "Pelajari bahasa Inggris untuk komunikasi sehari-hari dan akademik. Fokus pada grammar, vocabulary, speaking, dan listening skills.",
    instructor: "Ms. Jennifer Smith",
    duration: "8 minggu",
    students: 48,
    lessons: 32,
    rating: 4.8,
    price: "Gratis",
    level: "Menengah",
    category: "Bahasa",
    thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=450&fit=crop",
    progress: 0,
    enrolled: false
  },
  "a2-3": {
    id: "a2-3",
    title: "Sejarah Indonesia",
    description: "Memahami perjalanan sejarah bangsa Indonesia dari masa ke masa. Dari zaman prasejarah hingga era modern dengan pendekatan yang menarik.",
    instructor: "Prof. Susilo Bambang",
    duration: "6 minggu",
    students: 35,
    lessons: 20,
    rating: 4.5,
    price: "Gratis",
    level: "Menengah",
    category: "Sejarah",
    thumbnail: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=450&fit=crop",
    progress: 0,
    enrolled: false  
  }
};

export function CourseDetail({ courseId, onBack }: CourseDetailProps) {
  const course = courseData[courseId as keyof typeof courseData];

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2>Course tidak ditemukan</h2>
          <Button onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  const curriculum: Lesson[] = [
    { id: "1", title: "Pengenalan Bilangan", duration: "15 menit", type: "video", completed: true },
    { id: "2", title: "Operasi Dasar: Penjumlahan", duration: "20 menit", type: "video", completed: true },
    { id: "3", title: "Latihan Penjumlahan", duration: "10 menit", type: "quiz", completed: true },
    { id: "4", title: "Operasi Dasar: Pengurangan", duration: "18 menit", type: "video", completed: false },
    { id: "5", title: "Materi Bacaan: Konsep Pengurangan", duration: "5 menit", type: "reading", completed: false },
    { id: "6", title: "Latihan Pengurangan", duration: "10 menit", type: "quiz", completed: false },
    { id: "7", title: "Operasi Dasar: Perkalian", duration: "25 menit", type: "video", completed: false },
    { id: "8", title: "Tabel Perkalian", duration: "8 menit", type: "reading", completed: false },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlayCircle className="h-4 w-4" />;
      case 'reading': return <FileText className="h-4 w-4" />;
      case 'quiz': return <Award className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'text-blue-600';
      case 'reading': return 'text-green-600';
      case 'quiz': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side - Course curriculum */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Kurikulum Course
                </CardTitle>
                <CardDescription>
                  {curriculum.filter(l => l.completed).length} dari {curriculum.length} pelajaran selesai
                </CardDescription>
                <Progress value={course.progress} className="mt-2" />
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {curriculum.map((lesson, index) => (
                      <div
                        key={lesson.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                          lesson.completed ? 'bg-green-50 border-green-200' : 'bg-background'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {lesson.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <div className={`h-5 w-5 ${getTypeColor(lesson.type)}`}>
                              {getTypeIcon(lesson.type)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {index + 1}. {lesson.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {lesson.duration}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Course details and video */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video/Main content */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-black rounded-t-lg flex items-center justify-center relative">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Button size="lg" className="rounded-full h-16 w-16 p-0">
                      <Play className="h-8 w-8 ml-1" />
                    </Button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{course.category}</Badge>
                        <Badge variant="outline">{course.level}</Badge>
                      </div>
                      <h1>{course.title}</h1>
                      <p className="text-muted-foreground">
                        Oleh {course.instructor}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{course.price}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.students} siswa
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {course.lessons} pelajaran
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {course.rating}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="mb-2">Deskripsi Course</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3>Yang Akan Anda Pelajari</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Konsep dasar bilangan dan operasi matematika</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Penjumlahan, pengurangan, perkalian, dan pembagian</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Penerapan matematika dalam kehidupan sehari-hari</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Teknik pemecahan masalah matematika dasar</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-4 pt-4">
                    {course.enrolled ? (
                      <Button className="flex-1">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Lanjutkan Belajar
                      </Button>
                    ) : (
                      <Button className="flex-1">
                        Daftar Sekarang
                      </Button>
                    )}
                    <Button variant="outline">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Bookmark
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}