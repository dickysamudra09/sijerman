"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCoursePreviewInfo, canViewModuleContent } from "@/lib/permissions";
import { initGuestSession, trackCoursePreviewed } from "@/lib/guest-session";
import { Button } from "@/components/ui/button";
import UserMenuDropdown from "@/components/UserMenuDropdown";
import { ArrowLeft, Lock, BookOpen } from "lucide-react";
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
        style={{ backgroundColor: "#FFFFFC" }}
      >
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: "#E8B824" }}
        ></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FFFFFC" }}
      >
        <div className="text-center">
          <p style={{ color: "#4A4A4A" }} className="text-lg">
            Course not found
          </p>
          <Button
            onClick={() => router.push("/open-courses")}
            className="mt-4"
            style={{ backgroundColor: "#1A1A1A", color: "#FFFFFC" }}
          >
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFC" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b overflow-visible"
        style={{
          backgroundColor: "rgba(13, 13, 13, 0.90)",
          backdropFilter: "blur(10px)",
          borderBottomColor: "#333333",
          overflow: "visible"
        }}
      >
        <div className="container mx-auto px-4 py-4 overflow-visible" style={{ overflow: 'visible' }}>
          <div className="flex items-center justify-between">
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
              <Button
                variant="ghost"
                onClick={() => router.push("/open-courses")}
                className="flex items-center gap-2"
                style={{ color: "#FFFFFC" }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Courses
              </Button>
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/")}
                    style={{ color: "#FFFFFC" }}
                  >
                    Home
                  </Button>
                  <UserMenuDropdown
                    user={user}
                    onLogout={async () => {
                      await supabase.auth.signOut();
                      router.push("/auth/login");
                    }}
                    onNavigate={router.push}
                  />
                </>
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
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-6 p-4 md:p-8">
        {/* Sidebar - Module List */}
        <div className="lg:col-span-1">
          <div
            className="rounded-lg p-4"
            style={{
              backgroundColor: "#F5F5F5",
              border: "1px solid #E5E5E5",
            }}
          >
            <h3
              className="font-bold mb-4 text-sm uppercase tracking-wider"
              style={{ color: "#999999" }}
            >
              Course Modules ({previewModuleCount} Preview)
            </h3>

            <div className="space-y-2">
              {modules.map((module, index) => {
                const isAvailable = index < previewModuleCount;
                const isSelected = index === selectedModuleIndex;

                return (
                  <button
                    key={module.id}
                    onClick={() => {
                      if (isAvailable) {
                        setSelectedModuleIndex(index);
                      }
                    }}
                    disabled={!isAvailable}
                    className={`w-full text-left p-3 rounded-lg transition-all text-sm ${
                      isAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                    }`}
                    style={{
                      backgroundColor: isSelected ? "#E8B824" : "#FFFFFF",
                      color: isSelected ? "#1A1A1A" : "#4A4A4A",
                      border: `1px solid ${
                        isSelected ? "#E8B824" : "#E5E5E5"
                      }`,
                      fontWeight: isSelected ? "600" : "400",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-bold">{index + 1}.</span>
                      <div className="flex-1">
                        <p className="font-semibold">{module.title}</p>
                        {!isAvailable && (
                          <p className="text-xs flex items-center gap-1 mt-1">
                            <Lock className="h-3 w-3" />
                            Unlock with enrollment
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content - Module Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Course Header Card */}
          <div
            className="rounded-lg overflow-hidden shadow-md"
            style={{
              backgroundColor: "#FFFFFC",
              border: "1px solid #E5E5E5",
            }}
          >
            <div
              className="h-32 p-6"
              style={{
                background: `linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)`,
              }}
            >
              <h1 className="text-3xl font-bold text-white">{course.title}</h1>
              <p className="text-gray-300 mt-2">by {course.teacher?.name || "Unknown Teacher"}</p>
            </div>

            <div className="p-6 border-b" style={{ borderColor: "#E5E5E5" }}>
              <p style={{ color: "#4A4A4A" }} className="leading-relaxed">
                {course.description}
              </p>
            </div>

            <div className="p-6 bg-blue-50">
              <p className="text-sm mb-4" style={{ color: "#4A4A4A" }}>
                You're viewing a preview of this course. Only the first{" "}
                <strong>{previewModuleCount} modules</strong> are available.
              </p>
              <Button
                onClick={handleEnroll}
                className="w-full h-12 font-semibold rounded-lg flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "#E8B824",
                  color: "#1A1A1A",
                }}
              >
                {user ? "Enroll Now to Access Full Course" : "Register & Enroll"}
              </Button>
            </div>
          </div>

          {/* Module Content */}
          {currentModule && (
            <div
              className="rounded-lg p-8 shadow-md"
              style={{
                backgroundColor: "#FFFFFC",
                border: "1px solid #E5E5E5",
              }}
            >
              <div className="mb-6">
                <span
                  className="text-xs uppercase tracking-wider font-bold"
                  style={{ color: "#E8B824" }}
                >
                  {currentModule.module_type}
                </span>
                <h2 className="text-3xl font-bold mt-2 mb-2" style={{ color: "#1A1A1A" }}>
                  {currentModule.title}
                </h2>
                <p style={{ color: "#4A4A4A" }}>
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
                  <p className="text-gray-400">No content available for this module yet.</p>
                )}
              </div>

              {/* Navigation */}
              <div className="mt-8 flex gap-4 pt-8 border-t" style={{ borderColor: "#E5E5E5" }}>
                <Button
                  onClick={() =>
                    setSelectedModuleIndex(Math.max(0, selectedModuleIndex - 1))
                  }
                  disabled={selectedModuleIndex === 0}
                  variant="outline"
                  className="flex-1 h-10"
                  style={{
                    color: selectedModuleIndex === 0 ? "#999999" : "#1A1A1A",
                  }}
                >
                  Previous
                </Button>
                <Button
                  onClick={() =>
                    setSelectedModuleIndex(
                      Math.min(modules.length - 1, selectedModuleIndex + 1)
                    )
                  }
                  disabled={selectedModuleIndex === modules.length - 1}
                  variant="outline"
                  className="flex-1 h-10"
                  style={{
                    color:
                      selectedModuleIndex === modules.length - 1
                        ? "#999999"
                        : "#1A1A1A",
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
