"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCoursePreviewInfo, canViewModuleContent } from "@/lib/permissions";
import { initGuestSession, trackCoursePreviewed } from "@/lib/guest-session";
import { Button } from "@/components/ui/button";
import UserMenuDropdown from "@/components/UserMenuDropdown";
import { Lock, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Course {
  id: string;
  title: string;
  description: string;
  is_paid: boolean;
  teacher_id: string;
  teacher?: { id: string; name: string; email: string };
}

interface Module {
  id: string;
  title: string;
  description: string;
  content: string;
  module_type: string;
  order_index: number;
}

export default function CoursePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    initGuestSession();
    trackCoursePreviewed(courseId);
  }, [courseId]);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: enrollment } = await supabase
          .from("course_enrollments")
          .select("id")
          .eq("course_id", courseId)
          .eq("user_id", user.id)
          .single();

        if (enrollment) {
          router.push(`/open-courses/${courseId}`);
        }
      }
    };
    checkAuth();
  }, [courseId, router]);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select(
            `
            id,
            title,
            description,
            is_paid,
            teacher_id
          `
          )
          .eq("id", courseId)
          .single();

        if (courseError) throw courseError;
        
        if (courseData && courseData.teacher_id) {
          const { data: teacherData } = await supabase
            .from("users")
            .select("id, name, email")
            .eq("id", courseData.teacher_id)
            .single();
          
          const courseWithTeacher = {
            ...courseData,
            teacher: teacherData ? { id: teacherData.id, name: teacherData.name, email: teacherData.email } : undefined,
          };
          setCourse(courseWithTeacher);
        } else {
          setCourse(courseData);
        }

        const { data: modulesData, error: modulesError } = await supabase
          .from("course_modules")
          .select("*")
          .eq("course_id", courseId)
          .order("order_index", { ascending: true });

        if (modulesError) throw modulesError;
        setModules(modulesData || []);
      } catch (error) {
        console.error("Error fetching course:", error);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const handleEnroll = async () => {
    if (!user) {
      router.push(`/auth/register?next=/open-courses/${courseId}`);
      return;
    }

    try {
      const { data: existingEnrollment } = await supabase
        .from("course_enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .single();

      if (existingEnrollment) {
        router.push(`/open-courses/${courseId}`);
        return;
      }

      const { error: enrollError } = await supabase
        .from("course_enrollments")
        .insert({
          course_id: courseId,
          user_id: user.id,
          enrollment_type: "free",
          access_level: "limited",
          progress_percentage: 0,
        });

      if (enrollError) throw enrollError;

      router.push(`/open-courses/${courseId}`);
    } catch (error) {
      console.error("Error enrolling in course:", error);
      alert("Failed to enroll. Please try again.");
    }
  };

  const currentModule = modules[selectedModuleIndex];
  const previewModuleCount = 3;
  const canPreview = selectedModuleIndex < previewModuleCount;

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: "#14B8A6" }}
        ></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div className="text-center">
          <p style={{ color: "#1A1A1A" }} className="text-lg">
            Kursus tidak ditemukan
          </p>
          <Button
            onClick={() => router.push("/open-courses")}
            className="mt-4"
            style={{ backgroundColor: "#1A1A1A", color: "#FFFFFC" }}
          >
            Kembali ke Daftar Kursus
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-30 border-b w-full"
        style={{
          backgroundColor: "rgba(13, 13, 13, 0.90)",
          backdropFilter: "blur(10px)",
          borderBottomColor: "#333333",
        }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/img/1.png"
              alt="Logo"
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#E8B824" }}>Si Jerman</h1>
              <p className="text-xs uppercase tracking-wider" style={{ color: "#FFFFFC" }}>Learning Platform</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <UserMenuDropdown
                user={user}
                onLogout={async () => {
                  await supabase.auth.signOut();
                  router.push("/auth/login");
                }}
                onNavigate={router.push}
              />
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/auth/login")}
                  style={{ backgroundColor: "#FFFFFC", color: "#1A1A1A", borderColor: "#FFFFFC" }}
                >
                  Login
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout - Content Only */}
      <div className="w-full pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 px-2 md:px-0">
            <Link href="/open-courses" className="text-sm" style={{ color: "#64748B" }}>
              Kursus
            </Link>
            <ChevronRight className="h-4 w-4" style={{ color: "#CBD5E1" }} />
            <span className="text-sm font-medium line-clamp-1" style={{ color: "#1A1A1A" }}>Preview - {course.title}</span>
          </div>

          {/* Preview Card */}
          <div className="rounded-lg border p-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0" }}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{ color: "#1A1A1A" }}>{course.title}</h1>
                <p style={{ color: "#64748B" }}>Diajar oleh <span className="font-semibold" style={{ color: "#1A1A1A" }}>{course.teacher?.name || "Instruktur"}</span></p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: "#FEE2E2", borderColor: "#FECACA" }}>
                <Lock className="h-4 w-4" style={{ color: "#DC2626" }} />
                <span className="text-xs font-semibold" style={{ color: "#DC2626" }}>Preview</span>
              </div>
            </div>

            <p className="mb-6" style={{ color: "#4A4A4A" }}>{course.description}</p>

            <div className="p-4 rounded-lg" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE047" }}>
              <p className="text-sm mb-4" style={{ color: "#78350F" }}>
                ⚠️ Ini adalah <strong>preview terbatas</strong>. Hanya <strong>{previewModuleCount} modul pertama</strong> yang bisa diakses. 
                <br />Daftar sekarang untuk mengakses semua materi kursus.
              </p>
              <Button
                onClick={handleEnroll}
                className="w-full h-10 font-semibold rounded-lg"
                style={{
                  backgroundColor: "#F59E0B",
                  color: "#FFFFFF",
                }}
              >
                {user ? "Daftar Sekarang" : "🔐 Login & Daftar"}
              </Button>
            </div>
          </div>

          {/* Module Content */}
          {currentModule && canPreview && (
            <div
              className="rounded-lg p-8"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
              }}
            >
              <div className="mb-6">
                <span
                  className="text-xs uppercase tracking-wider font-bold"
                  style={{ color: "#0F766E" }}
                >
                  {currentModule.module_type}
                </span>
                <h2 className="text-3xl font-bold mt-2 mb-2" style={{ color: "#1A1A1A" }}>
                  {currentModule.title}
                </h2>
                <p style={{ color: "#64748B" }}>
                  {currentModule.description}
                </p>
              </div>

              <div
                className="prose max-w-none"
                style={{ color: "#4A4A4A" }}
              >
                {currentModule.content ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: currentModule.content }}
                    className="leading-relaxed"
                  />
                ) : (
                  <p style={{ color: "#9CA3AF" }}>Tidak ada konten untuk modul ini.</p>
                )}
              </div>

              {/* Navigation */}
              <div className="mt-8 flex gap-4 pt-8" style={{ borderTop: "1px solid #E2E8F0" }}>
                <Button
                  onClick={() =>
                    setSelectedModuleIndex(Math.max(0, selectedModuleIndex - 1))
                  }
                  disabled={selectedModuleIndex === 0}
                  variant="outline"
                  className="flex-1 h-10"
                  style={{
                    color: selectedModuleIndex === 0 ? "#CBD5E1" : "#1A1A1A",
                    borderColor: "#E2E8F0",
                  }}
                >
                  Sebelumnya
                </Button>
                <Button
                  onClick={() => {
                    if (selectedModuleIndex < previewModuleCount - 1) {
                      setSelectedModuleIndex(selectedModuleIndex + 1);
                    }
                  }}
                  disabled={selectedModuleIndex === previewModuleCount - 1}
                  variant="outline"
                  className="flex-1 h-10"
                  style={{
                    color:
                      selectedModuleIndex === previewModuleCount - 1
                        ? "#CBD5E1"
                        : "#1A1A1A",
                    borderColor: "#E2E8F0",
                  }}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}

          {/* Limited Access Message */}
          {currentModule && !canPreview && (
            <div
              className="rounded-lg p-8 text-center"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
              }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#FEE2E2" }}>
                <Lock className="h-8 w-8" style={{ color: "#DC2626" }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: "#1A1A1A" }}>Modul Terkunci</h3>
              <p className="mb-6" style={{ color: "#64748B" }}>
                Modul ini hanya tersedia untuk member terdaftar.
              </p>
              <Button
                onClick={handleEnroll}
                className="px-6 h-10 font-semibold"
                style={{
                  backgroundColor: "#F59E0B",
                  color: "#FFFFFF",
                }}
              >
                {user ? "Daftar Sekarang untuk Membuka" : "🔐 Login & Daftar"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
