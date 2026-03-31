"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getUserCourseAccess, canUseAIFeedback } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import UserMenuDropdown from "@/components/UserMenuDropdown";
import { CourseSyllabus } from "@/components/CourseSyllabus";
import { ModuleTimeline, type ModuleItem } from "@/components/ModuleTimeline";
import { WarmProgressBar } from "@/components/WarmProgressBar";
import {
  ArrowLeft,
  Lock,
  BookOpen,
  TrendingUp,
  Zap,
  CheckCircle,
  Menu,
  X,
} from "lucide-react";
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
  learning_outcomes?: string;
}

interface Enrollment {
  id: string;
  access_level: string;
  enrollment_type: string;
  progress_percentage: number;
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [unlockedModules, setUnlockedModules] = useState<Set<number>>(new Set([0])); // First module always unlocked
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [access, setAccess] = useState<any>(null);
  const [showAIUpgrade, setShowAIUpgrade] = useState(false);
  const [aiAttempts, setAiAttempts] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false); // For mobile hamburger

  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        router.push(`/open-courses/${courseId}/preview`);
        return;
      }

      const { data: enrollmentData } = await supabase
        .from("course_enrollments")
        .select("*")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .single();

      if (!enrollmentData) {
        router.push(`/open-courses/${courseId}/preview`);
        return;
      }

      setEnrollment(enrollmentData);

      const accessInfo = await getUserCourseAccess(user.id, courseId);
      setAccess(accessInfo);
    };

    checkAccess();
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

  const handleAIFeedback = async () => {
    if (!user || !access) return;

    const aiCheck = await canUseAIFeedback(user.id, courseId, aiAttempts);

    if (!aiCheck.canUse) {
      if (aiCheck.reason?.includes("Free trial")) {
        setShowAIUpgrade(true);
      }
      return;
    }

    setAiAttempts(aiAttempts + 1);
  };

  const currentModule = modules[selectedModuleIndex];

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

  if (!course || !enrollment || !access) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FFFFFC" }}
      >
        <div className="text-center">
          <p style={{ color: "#4A4A4A" }} className="text-lg">
            Access denied or course not found
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
              
              {/* Hamburger Menu - Mobile Only */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="md:hidden"
                style={{ color: "#FFFFFC" }}
              >
                {showSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout - Hybrid: 20% FIXED sidebar (desktop) + 80% content | Full width (mobile with hamburger) */}
      <div className="flex w-full relative min-h-[calc(100vh-80px)]">
        {/* Mobile Overlay - Show when sidebar is open on mobile */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black/30 z-20 md:hidden"
            onClick={() => setShowSidebar(false)}
            style={{ top: '80px', height: 'calc(100vh - 80px)' }}
          />
        )}

        {/* Sidebar - FIXED on desktop (20%) / Overlay on mobile */}
        <aside
          className={`${
            showSidebar ? 'translate-x-0' : '-translate-x-full'
          } fixed w-3/4 md:w-1/5 bg-white border-r border-gray-200 overflow-y-auto transition-transform duration-300 ease-out z-30 md:translate-x-0`}
          style={{
            backgroundColor: '#F9F9F9',
            borderColor: '#E5E5E5',
            top: '80px',
            left: 0,
            height: 'calc(100vh - 80px)',
          }}
        >
          <div className="p-4 md:p-6 space-y-6">
            {/* Progress Summary */}
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E5E5",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5" style={{ color: "#F5C518" }} />
                <h4 className="font-bold text-sm" style={{ color: "#1A1A1A" }}>
                  Progress
                </h4>
              </div>
              <WarmProgressBar
                percentage={Math.round((unlockedModules.size / modules.length) * 100)}
                showPercentage={true}
                height="md"
              />
            </div>

            {/* Modules List - Using ModuleTimeline component */}
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E5E5",
              }}
            >
              <h3
                className="font-bold mb-4 text-sm uppercase tracking-wider"
                style={{ color: "#666666" }}
              >
                Modul Pembelajaran
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {modules.map((module, index) => {
                  const isUnlocked = unlockedModules.has(index);
                  const isSelected = index === selectedModuleIndex;
                  const isCompleted = index < selectedModuleIndex;
                  
                  return (
                    <button
                      key={module.id}
                      onClick={() => {
                        if (isUnlocked) {
                          setSelectedModuleIndex(index);
                          setShowSidebar(false); // Close sidebar on mobile after selection
                        }
                      }}
                      disabled={!isUnlocked}
                      className={`w-full text-left p-3 rounded-lg transition-all text-sm ${
                        !isUnlocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                      }`}
                      style={{
                        backgroundColor: isSelected
                          ? "#F5C518"
                          : isCompleted
                          ? "#E8F5E9"
                          : isUnlocked
                          ? "#FFFFFF"
                          : "#F0F0F0",
                        color: isSelected ? "#1A1A1A" : isUnlocked ? "#4A4A4A" : "#999999",
                        border: `1px solid ${
                          isSelected ? "#F5C518" : isUnlocked ? "#E5E5E5" : "#CCCCCC"
                        }`,
                        fontWeight: isSelected ? "600" : "400",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                        ) : isUnlocked ? (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                        ) : (
                          <Lock className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="truncate">{module.title}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Access Badge */}
            {access.access === "limited" && (
              <div
                className="rounded-lg p-3 border-2"
                style={{
                  backgroundColor: "#FFFBF0",
                  borderColor: "#F5C518",
                }}
              >
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 flex-shrink-0 flex-shrink-0 mt-0.5" style={{ color: "#F5C518" }} />
                  <div>
                    <p
                      className="font-bold text-xs mb-1"
                      style={{ color: "#F5C518" }}
                    >
                      Akses Gratis
                    </p>
                    <p className="text-xs" style={{ color: "#4A4A4A" }}>
                      2 AI Feedback Gratis
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content - Full width, but with margin-left on desktop for fixed sidebar */}
        <main 
          className="flex-1 w-full overflow-y-auto main-with-fixed-sidebar"
        >
          <div className="container mx-auto px-4 md:px-8 py-6 md:py-8 space-y-8 max-w-5xl">
            {/* Course Syllabus */}
            {course && (
              <CourseSyllabus
                courseTitle={course.title}
                courseDescription={course.description}
                learningOutcomes={
                  // Aggregate unique learning outcomes from all modules
                  modules
                    .flatMap((m) => m.learning_outcomes?.split("|").map((o) => o.trim()) || [])
                    .filter((o) => o.length > 0)
                    .filter((o, i, arr) => arr.indexOf(o) === i) // Remove duplicates
                    .join("|")
                }
                totalModules={modules.length}
                estimatedHours={modules.length * 2} // Estimate 2 hours per module
                progressPercentage={Math.round((unlockedModules.size / modules.length) * 100)}
                teacherName={course.teacher?.name || "Instruktur"}
              />
            )}

            {/* Module Content Card */}
            {currentModule && (
              <div
                className="rounded-lg p-6 md:p-8 shadow-md"
                style={{
                  backgroundColor: "#FFFFFC",
                  border: "1px solid #E5E5E5",
                }}
              >
                <div className="mb-6">
                  <span
                    className="text-xs uppercase tracking-wider font-bold"
                    style={{ color: "#F5C518" }}
                  >
                    {currentModule.module_type}
                  </span>
                  <h2
                    className="text-3xl font-bold mt-2 mb-2"
                    style={{ color: "#1A1A1A" }}
                  >
                    {currentModule.title}
                  </h2>
                  <p style={{ color: "#4A4A4A" }}>
                    {currentModule.description}
                  </p>
                </div>

                <div style={{ color: "#4A4A4A" }} className="leading-relaxed mb-8">
                  {currentModule.content ? (
                    <div dangerouslySetInnerHTML={{ __html: currentModule.content }} />
                  ) : (
                    <p className="text-gray-400">
                      No content available for this module yet.
                    </p>
                  )}
                </div>

                {/* AI Feedback Button (if access allows) */}
                {access.access === "limited" && (
                  <div
                    className="p-4 rounded-lg mb-6 border-2"
                    style={{
                      backgroundColor: "#FFFBF0",
                      borderColor: "#F5C518",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Zap
                        className="h-5 w-5 flex-shrink-0 mt-0.5"
                        style={{ color: "#F5C518" }}
                      />
                      <div className="flex-1">
                        <p
                          className="font-bold text-sm mb-1"
                          style={{ color: "#F5C518" }}
                        >
                          Free AI Feedback (1-2 attempts)
                        </p>
                        <p className="text-xs mb-3" style={{ color: "#4A4A4A" }}>
                          You have limited AI feedback attempts. Upgrade to paid
                          for unlimited access.
                        </p>
                        <Button
                          onClick={handleAIFeedback}
                          size="sm"
                          className="h-8"
                          style={{
                            backgroundColor: "#F5C518",
                            color: "#1A1A1A",
                          }}
                        >
                          Use AI Feedback ({2 - aiAttempts} remaining)
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analytics (only if full access) */}
                {access.canViewAnalytics && (
                  <div
                    className="p-4 rounded-lg mb-6"
                    style={{
                      backgroundColor: "#E8F5E9",
                      border: "1px solid #C8E6C9",
                    }}
                  >
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#2E7D32" }}
                    >
                      ✓ Full analytics access available
                    </p>
                  </div>
                )}

                {/* Navigation & Continue Button */}
                <div
                  className="mt-8 flex gap-4 pt-8 border-t"
                  style={{ borderColor: "#E5E5E5" }}
                >
                  <Button
                    onClick={() =>
                      setSelectedModuleIndex(Math.max(0, selectedModuleIndex - 1))
                    }
                    disabled={selectedModuleIndex === 0}
                    variant="outline"
                    className="flex-1 h-10"
                    style={{
                      color:
                        selectedModuleIndex === 0 ? "#999999" : "#1A1A1A",
                    }}
                  >
                    Previous
                  </Button>
                  
                  {/* Continue Button - Unlock Next Module */}
                  {selectedModuleIndex < modules.length - 1 ? (
                    <Button
                      onClick={() => {
                        // Unlock next module
                        const newUnlockedModules = new Set(unlockedModules);
                        newUnlockedModules.add(selectedModuleIndex + 1);
                        setUnlockedModules(newUnlockedModules);
                        
                        // Move to next module
                        setSelectedModuleIndex(selectedModuleIndex + 1);
                      }}
                      className="flex-1 h-10 font-semibold"
                      style={{
                        backgroundColor: "#F5C518",
                        color: "#1A1A1A",
                      }}
                    >
                      Lanjutkan ke Modul Berikutnya
                    </Button>
                  ) : (
                    <Button
                      disabled
                      className="flex-1 h-10 font-semibold"
                      style={{
                        backgroundColor: "#22C55E",
                        color: "#FFFFFF",
                      }}
                    >
                      ✓ Kursus Selesai
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Upgrade Modal */}
      {showAIUpgrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="rounded-lg max-w-md w-full p-6"
            style={{ backgroundColor: "#FFFFFC" }}
          >
            <h3 className="text-2xl font-bold mb-2" style={{ color: "#1A1A1A" }}>
              Upgrade to Premium
            </h3>
            <p style={{ color: "#4A4A4A" }} className="mb-4">
              You've used your free AI feedback attempts. Upgrade to premium for
              unlimited access to AI feedback and analytics.
            </p>
            <div className="space-y-3">
              <Button
                className="w-full h-12"
                style={{
                  backgroundColor: "#F5C518",
                  color: "#1A1A1A",
                }}
              >
                Upgrade Now
              </Button>
              <Button
                onClick={() => setShowAIUpgrade(false)}
                variant="outline"
                className="w-full h-12"
                style={{ color: "#1A1A1A" }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
