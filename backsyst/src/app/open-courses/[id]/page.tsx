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
import ExerciseInline from "@/components/ExerciseInline";
import AIFeedbackInline from "@/components/AIFeedbackInline";
import {
  BookOpen,
  Lock,
  TrendingUp,
  Zap,
  CheckCircle,
  Menu,
  X,
  Home,
  Lightbulb,
  BookMarked,
  MessageCircle,
  FileText,
  Headphones,
  Video,
  Image,
  Link2,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Play,
  HelpCircle,
  Trophy,
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

interface ModuleLesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  content: string;
  lesson_type: "explanation" | "vocabulary" | "dialogue" | "reading" | "listening";
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ModuleMaterial {
  id: string;
  module_id: string;
  title: string;
  description: string;
  material_type: "video" | "audio" | "pdf" | "image" | "resource";
  source_type: "upload" | "youtube_link" | "external_link";
  file_url: string | null;
  external_url: string | null;
  file_size_mb: number | null;
  duration_seconds: number | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StudentLessonProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  status: "not_started" | "in_progress" | "completed";
  viewed_at: string | null;
  completed_at: string | null;
  time_spent_seconds: number;
  created_at: string;
  updated_at: string;
}

interface StudentMaterialProgress {
  id: string;
  student_id: string;
  material_id: string;
  status: "not_started" | "in_progress" | "completed";
  viewed_at: string | null;
  completed_at: string | null;
  time_spent_seconds: number;
  created_at: string;
  updated_at: string;
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
  const [lessons, setLessons] = useState<ModuleLesson[]>([]);
  const [materials, setMaterials] = useState<ModuleMaterial[]>([]);
  const [lessonProgress, setLessonProgress] = useState<
    Record<string, StudentLessonProgress>
  >({});
  const [materialProgress, setMaterialProgress] = useState<
    Record<string, StudentMaterialProgress>
  >({});
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0])); // Track which modules are expanded
  const [unlockedModules, setUnlockedModules] = useState<Set<number>>(new Set([0])); // First module always unlocked
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [access, setAccess] = useState<any>(null);
  const [showAIUpgrade, setShowAIUpgrade] = useState(false);
  const [aiAttempts, setAiAttempts] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true); // Sidebar visible by default on desktop, hidden on mobile
  const [activeTab, setActiveTab] = useState<"lessons" | "materials">("lessons");
  const [overallProgress, setOverallProgress] = useState(0); // Track overall course progress

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (!user) {
          router.push(`/open-courses/${courseId}/preview`);
          return;
        }

        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from("course_enrollments")
          .select("*")
          .eq("course_id", courseId)
          .eq("user_id", user.id)
          .single();

        if (enrollmentError || !enrollmentData) {
          console.log("No enrollment found, redirecting to preview");
          router.push(`/open-courses/${courseId}/preview`);
          return;
        }

        setEnrollment(enrollmentData);

        const accessInfo = await getUserCourseAccess(user.id, courseId);
        setAccess(accessInfo);
      } catch (error) {
        console.error("Error in checkAccess:", error);
        setLoading(false);
      }
    };

    checkAccess();
  }, [courseId, router]);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId || !user || !enrollment || !access) {
        return;
      }

      setLoading(true);

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
            teacher: teacherData
              ? {
                  id: teacherData.id,
                  name: teacherData.name,
                  email: teacherData.email,
                }
              : undefined,
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

        // Fetch lessons for first module if exists
        if (modulesData && modulesData.length > 0) {
          const { data: lessonsData, error: lessonsError } = await supabase
            .from("module_lessons")
            .select("*")
            .eq("module_id", modulesData[0].id)
            .order("order_index", { ascending: true });

          if (lessonsError) throw lessonsError;
          setLessons(lessonsData || []);

          // Fetch materials for first module
          const { data: materialsData, error: materialsError } = await supabase
            .from("module_materials")
            .select("*")
            .eq("module_id", modulesData[0].id)
            .order("order_index", { ascending: true });

          if (materialsError) throw materialsError;
          setMaterials(materialsData || []);

          // Fetch student progress for all lessons
          if (lessonsData && lessonsData.length > 0) {
            const { data: progressData } = await supabase
              .from("student_lesson_progress")
              .select("*")
              .eq("student_id", user.id)
              .in(
                "lesson_id",
                lessonsData.map((l) => l.id)
              );

            if (progressData) {
              const progressMap: Record<string, StudentLessonProgress> = {};
              progressData.forEach((p) => {
                progressMap[p.lesson_id] = p;
              });
              setLessonProgress((prev) => ({
                ...prev,
                ...progressMap,
              }));
            }
          }

          // Fetch student progress for all materials
          if (materialsData && materialsData.length > 0) {
            const { data: materialProgressData } = await supabase
              .from("student_material_progress")
              .select("*")
              .eq("student_id", user.id)
              .in(
                "material_id",
                materialsData.map((m) => m.id)
              );

            if (materialProgressData) {
              const progressMap: Record<string, StudentMaterialProgress> = {};
              materialProgressData.forEach((p) => {
                progressMap[p.material_id] = p;
              });
              setMaterialProgress((prev) => ({
                ...prev,
                ...progressMap,
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error fetching course:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, user, enrollment, access]);

  // Recalculate unlocked modules whenever progress or modules change
  useEffect(() => {
    if (modules.length > 0 && user) {
      calculateUnlockedModules();
      calculateOverallProgress();
    }
  }, [modules, lessonProgress, materialProgress, user]);

  // Fetch lessons when module is selected
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchModuleLessons = async () => {
      if (!modules[selectedModuleIndex]) return;
      
      const moduleId = modules[selectedModuleIndex].id;

      try {
        // Fetch lessons for this module
        const { data: lessonsData, error: lessonsError } = await supabase
          .from("module_lessons")
          .select("*")
          .eq("module_id", moduleId)
          .order("order_index", { ascending: true });

        if (lessonsError) throw lessonsError;
        
        // Only update if this is still the current module
        if (modules[selectedModuleIndex]?.id === moduleId) {
          setLessons(lessonsData || []);

          // Handle "go to last item" marker - if selectedLessonIndex is MAX_SAFE_INTEGER, set to last lesson
          if (selectedLessonIndex === Number.MAX_SAFE_INTEGER && lessonsData && lessonsData.length > 0) {
            setSelectedLessonIndex(lessonsData.length - 1);
          }

          // Fetch materials for this module
          const { data: materialsData, error: materialsError } = await supabase
            .from("module_materials")
            .select("*")
            .eq("module_id", moduleId)
            .order("order_index", { ascending: true });

          if (materialsError) throw materialsError;
          setMaterials(materialsData || []);

          // Fetch student progress for all lessons
          if (user && lessonsData) {
            const { data: progressData } = await supabase
              .from("student_lesson_progress")
              .select("*")
              .eq("student_id", user.id)
              .in(
                "lesson_id",
                lessonsData.map((l) => l.id)
              );

            if (progressData) {
              const progressMap: Record<string, StudentLessonProgress> = {};
              progressData.forEach((p) => {
                progressMap[p.lesson_id] = p;
              });
              setLessonProgress((prev) => ({
                ...prev,
                ...progressMap,
              }));
            }
          }

          // Fetch student progress for all materials
          if (user && materialsData) {
            const { data: materialProgressData } = await supabase
              .from("student_material_progress")
              .select("*")
              .eq("student_id", user.id)
              .in(
                "material_id",
                materialsData.map((m) => m.id)
              );

            if (materialProgressData) {
              const progressMap: Record<string, StudentMaterialProgress> = {};
              materialProgressData.forEach((p) => {
                progressMap[p.material_id] = p;
              });
              setMaterialProgress((prev) => ({
                ...prev,
                ...progressMap,
              }));
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error("Error fetching lessons:", error);
        }
      }
    };

    fetchModuleLessons();

    return () => {
      controller.abort();
    };
  }, [selectedModuleIndex, modules, user]);

  // Mark lesson as viewed when selected
  const markLessonAsViewed = async (lessonId: string) => {
    if (!user) return;

    try {
      const existing = lessonProgress[lessonId];

      if (existing) {
        // Only update status if not already completed
        if (existing.status !== "completed") {
          await supabase
            .from("student_lesson_progress")
            .update({
              status: "in_progress",
              viewed_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          // If already completed, just update viewed_at
          await supabase
            .from("student_lesson_progress")
            .update({
              viewed_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        }
      } else {
        await supabase
          .from("student_lesson_progress")
          .insert({
            student_id: user.id,
            lesson_id: lessonId,
            status: "in_progress",
            viewed_at: new Date().toISOString(),
            time_spent_seconds: 0,
          });
      }

      // Refresh progress
      const { data: progressData } = await supabase
        .from("student_lesson_progress")
        .select("*")
        .eq("student_id", user.id)
        .eq("lesson_id", lessonId)
        .single();

      if (progressData) {
        setLessonProgress((prev) => ({
          ...prev,
          [lessonId]: progressData,
        }));
      }
    } catch (error) {
      console.error("Error marking lesson as viewed:", error);
    }
  };

  // Mark lesson as completed
  const markLessonAsCompleted = async (lessonId: string) => {
    if (!user) return;

    try {
      const existing = lessonProgress[lessonId];

      if (existing) {
        await supabase
          .from("student_lesson_progress")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("student_lesson_progress")
          .insert({
            student_id: user.id,
            lesson_id: lessonId,
            status: "completed",
            completed_at: new Date().toISOString(),
            viewed_at: new Date().toISOString(),
            time_spent_seconds: 0,
          });
      }

      // Refresh progress
      const { data: progressData } = await supabase
        .from("student_lesson_progress")
        .select("*")
        .eq("student_id", user.id)
        .eq("lesson_id", lessonId)
        .single();

      if (progressData) {
        const updatedProgress = {
          ...lessonProgress,
          [lessonId]: progressData,
        };
        setLessonProgress(updatedProgress);
        // This will trigger the useEffect to recalculate unlocked modules
      }
    } catch (error) {
      console.error("Error marking lesson as completed:", error);
    }
  };

  // Mark material as viewed
  const markMaterialAsViewed = async (materialId: string) => {
    if (!user) return;

    try {
      const existing = materialProgress[materialId];

      if (existing) {
        // Only update status if not already completed
        if (existing.status !== "completed") {
          await supabase
            .from("student_material_progress")
            .update({
              status: "in_progress",
              viewed_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          // If already completed, just update viewed_at
          await supabase
            .from("student_material_progress")
            .update({
              viewed_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        }
      } else {
        await supabase
          .from("student_material_progress")
          .insert({
            student_id: user.id,
            material_id: materialId,
            status: "in_progress",
            viewed_at: new Date().toISOString(),
            time_spent_seconds: 0,
          });
      }

      // Refresh progress
      const { data: progressData } = await supabase
        .from("student_material_progress")
        .select("*")
        .eq("student_id", user.id)
        .eq("material_id", materialId)
        .single();

      if (progressData) {
        setMaterialProgress((prev) => ({
          ...prev,
          [materialId]: progressData,
        }));
      }
    } catch (error) {
      console.error("Error marking material as viewed:", error);
    }
  };

  // Mark material as completed
  const markMaterialAsCompleted = async (materialId: string) => {
    if (!user) return;

    try {
      const existing = materialProgress[materialId];

      if (existing) {
        await supabase
          .from("student_material_progress")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("student_material_progress")
          .insert({
            student_id: user.id,
            material_id: materialId,
            status: "completed",
            completed_at: new Date().toISOString(),
            viewed_at: new Date().toISOString(),
            time_spent_seconds: 0,
          });
      }

      // Refresh progress
      const { data: progressData } = await supabase
        .from("student_material_progress")
        .select("*")
        .eq("student_id", user.id)
        .eq("material_id", materialId)
        .single();

      if (progressData) {
        const updatedProgress = {
          ...materialProgress,
          [materialId]: progressData,
        };
        setMaterialProgress(updatedProgress);
        // This will trigger the useEffect to recalculate unlocked modules
      }
    } catch (error) {
      console.error("Error marking material as completed:", error);
    }
  };

  // Calculate which modules should be unlocked based on completion from DATABASE
  const calculateUnlockedModules = async () => {
    const newUnlocked = new Set<number>();
    newUnlocked.add(0); // First module always unlocked

    if (!user) return;

    for (let i = 1; i < modules.length; i++) {
      const prevModule = modules[i - 1];
      
      // Fetch ALL lessons and materials for previous module from database
      const { data: prevLessons } = await supabase
        .from("module_lessons")
        .select("id")
        .eq("module_id", prevModule.id);

      const { data: prevMaterials } = await supabase
        .from("module_materials")
        .select("id")
        .eq("module_id", prevModule.id);

      if (!prevLessons || !prevMaterials) continue;

      // Fetch actual completion status from database
      const { data: completedLessons } = await supabase
        .from("student_lesson_progress")
        .select("lesson_id")
        .eq("student_id", user.id)
        .eq("status", "completed")
        .in(
          "lesson_id",
          prevLessons.map((l) => l.id)
        );

      const { data: completedMaterials } = await supabase
        .from("student_material_progress")
        .select("material_id")
        .eq("student_id", user.id)
        .eq("status", "completed")
        .in(
          "material_id",
          prevMaterials.map((m) => m.id)
        );

      const completedLessonIds = new Set(completedLessons?.map((p) => p.lesson_id) || []);
      const completedMaterialIds = new Set(completedMaterials?.map((p) => p.material_id) || []);

      // Check if all lessons are completed
      const allLessonsCompleted = prevLessons.every((lesson) => completedLessonIds.has(lesson.id));

      // Check if all materials are completed
      const allMaterialsCompleted = prevMaterials.every((material) => completedMaterialIds.has(material.id));

      // Unlock if both all lessons and materials are completed (or if no content exists)
      if ((prevLessons.length === 0 || allLessonsCompleted) && 
          (prevMaterials.length === 0 || allMaterialsCompleted)) {
        newUnlocked.add(i);
      }
    }

    setUnlockedModules(newUnlocked);
  };

  // Calculate overall course progress from ALL lessons + materials
  const calculateOverallProgress = async () => {
    if (!user || modules.length === 0) return;

    try {
      // Fetch ALL lessons across all modules
      const { data: allLessons } = await supabase
        .from("module_lessons")
        .select("id")
        .in(
          "module_id",
          modules.map((m) => m.id)
        );

      // Fetch ALL materials across all modules
      const { data: allMaterials } = await supabase
        .from("module_materials")
        .select("id")
        .in(
          "module_id",
          modules.map((m) => m.id)
        );

      if (!allLessons || !allMaterials) return;

      const totalContent = (allLessons?.length || 0) + (allMaterials?.length || 0);
      if (totalContent === 0) {
        setOverallProgress(0);
        return;
      }

      // Fetch completed lessons
      const { data: completedLessons } = await supabase
        .from("student_lesson_progress")
        .select("lesson_id")
        .eq("student_id", user.id)
        .eq("status", "completed")
        .in(
          "lesson_id",
          allLessons.map((l) => l.id)
        );

      // Fetch completed materials
      const { data: completedMaterials } = await supabase
        .from("student_material_progress")
        .select("material_id")
        .eq("student_id", user.id)
        .eq("status", "completed")
        .in(
          "material_id",
          allMaterials.map((m) => m.id)
        );

      const completedCount = (completedLessons?.length || 0) + (completedMaterials?.length || 0);
      const progressPercentage = Math.round((completedCount / totalContent) * 100);
      
      setOverallProgress(progressPercentage);
    } catch (error) {
      console.error("Error calculating overall progress:", error);
    }
  };

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

  const toggleModuleExpand = (moduleIndex: number) => {
    // Check if this module is already expanded
    const isAlreadyExpanded = expandedModules.has(moduleIndex);
    
    if (isAlreadyExpanded) {
      // Collapse: just remove from expanded set
      setExpandedModules(new Set());
      // Don't clear lessons/materials - keep them cached
    } else {
      // Expand: add to expanded set (only one at a time)
      setExpandedModules(new Set([moduleIndex]));
      
      // If switching to a different module, update selected and trigger fetch
      if (selectedModuleIndex !== moduleIndex) {
        setSelectedModuleIndex(moduleIndex);
        setSelectedLessonIndex(0);
        setSelectedMaterialId(null);
        // useEffect will fetch data when selectedModuleIndex changes
      }
      // If same module, data is already cached so no action needed
    }
  };

  const currentModule = modules[selectedModuleIndex];
  const currentLesson = lessons[selectedLessonIndex];
  const currentMaterial = materials.find(m => m.id === selectedMaterialId);

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
            Akses ditolak atau kursus tidak ditemukan
          </p>
          <Button
            onClick={() => router.push("/open-courses")}
            className="mt-4"
            style={{ backgroundColor: "#1A1A1A", color: "#FFFFFC" }}
          >
            Kembali ke Kursus
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFC" }}>
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-30 border-b overflow-visible w-full"
        style={{
          backgroundColor: "rgba(13, 13, 13, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottomColor: "#333333",
          overflow: "visible"
        }}
      >
        <div className="container mx-auto px-4 py-3 overflow-visible" style={{ overflow: 'visible' }}>
          <div className="flex items-center justify-between gap-4">
            {/* Left: Course Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EFF6FF" }}>
                <BookOpen className="h-5 w-5" style={{ color: "#0F766E" }} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold truncate" style={{ color: "#FFFFFF" }}>
                  {course?.title || "Loading..."}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>
                    {overallProgress}% Complete
                  </span>
                  <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{ backgroundColor: "#374151" }}>
                    <div 
                      className="h-full transition-all duration-500 rounded-full"
                      style={{ 
                        width: `${overallProgress}%`,
                        backgroundColor: overallProgress === 100 ? "#16A34A" : "#E8B824"
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <UserMenuDropdown
                user={user}
                onLogout={async () => {
                  await supabase.auth.signOut();
                  router.push("/auth/login");
                }}
                onNavigate={router.push}
              />
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

        {/* Sidebar - Collapsible on desktop / Overlay on mobile */}
        <aside
          className={`${
            showSidebar ? 'translate-x-0' : '-translate-x-full md:-translate-x-full'
          } fixed w-3/4 md:w-80 bg-white border-r overflow-y-auto transition-all duration-300 ease-out z-30`}
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#E0E0E0',
            top: '80px',
            left: 0,
            height: 'calc(100vh - 80px)',
          }}
        >
          <div className="p-6 md:p-8 space-y-6">
            {/* Hide Menu Button - Mobile Only */}
            <Button
              onClick={() => setShowSidebar(false)}
              variant="ghost"
              className="md:hidden w-full justify-start gap-2"
              style={{ color: "#6B7280" }}
            >
              <X className="h-4 w-4" />
              Sembunyikan Menu
            </Button>
            {/* Progress Summary */}
            <div
              className="rounded-xl p-5 border-2"
              style={{
                backgroundColor: "#FFFBEB",
                borderColor: "#FDE68A",
                boxShadow: "0 2px 8px rgba(232, 184, 36, 0.1)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E8B824" }}>
                    <Trophy className="h-4 w-4" style={{ color: "#1A1A1A" }} />
                  </div>
                  <h4 className="font-bold text-base" style={{ color: "#1A1A1A" }}>
                    Progress Kamu
                  </h4>
                </div>
                <span className="text-2xl font-bold" style={{ color: "#E8B824" }}>
                  {overallProgress}%
                </span>
              </div>
              <WarmProgressBar
                percentage={overallProgress}
                showPercentage={false}
                height="md"
              />
              <p className="text-xs mt-3" style={{ color: "#92400E" }}>
                {overallProgress === 100 
                  ? "🎉 Selamat! Kamu sudah menyelesaikan semua materi!" 
                  : overallProgress >= 75 
                  ? "💪 Hampir selesai! Terus semangat!"
                  : overallProgress >= 50
                  ? "🚀 Kamu sudah setengah jalan! Keep going!"
                  : overallProgress >= 25
                  ? "✨ Awal yang bagus! Lanjutkan belajarnya!"
                  : "🌟 Yuk mulai perjalanan belajarmu!"}
              </p>
            </div>

            {/* Modules & Lessons & Materials List */}
            <div className="space-y-3">
                {modules.map((module, moduleIndex) => {
                  const isModuleSelected = moduleIndex === selectedModuleIndex;
                  const isModuleUnlocked = unlockedModules.has(moduleIndex);
                  const isModuleCompleted = moduleIndex < selectedModuleIndex;
                  const isModuleExpanded = expandedModules.has(moduleIndex);

                  return (
                    <div key={module.id} className="mb-3">
                      {/* Module Header */}
                      <button
                        onClick={() => {
                          if (isModuleUnlocked) {
                            toggleModuleExpand(moduleIndex);
                          }
                        }}
                        disabled={!isModuleUnlocked}
                        className="w-full text-left px-5 py-4 rounded-xl transition-all duration-200 ease-out flex items-center justify-between group"
                        style={{
                          backgroundColor: isModuleSelected 
                            ? "#E8B824"
                            : isModuleCompleted
                            ? "#F0FDF4"
                            : "#FAFAFA",
                          color: isModuleSelected ? "#1A1A1A" : "#333333",
                          opacity: !isModuleUnlocked ? 0.6 : 1,
                          cursor: isModuleUnlocked ? "pointer" : "not-allowed",
                          border: `2px solid ${
                            isModuleSelected 
                              ? "#E8B824" 
                              : isModuleCompleted 
                              ? "#BBF7D0" 
                              : "#E5E7EB"
                          }`,
                          boxShadow: isModuleSelected 
                            ? "0 4px 12px rgba(232, 184, 36, 0.2)" 
                            : "0 1px 3px rgba(0, 0, 0, 0.05)",
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {isModuleCompleted ? (
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#D1FAE5" }}>
                              <CheckCircle className="h-5 w-5" strokeWidth={2.5} style={{ color: "#059669" }} />
                            </div>
                          ) : isModuleUnlocked ? (
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all" 
                              style={{ 
                                backgroundColor: isModuleSelected ? "#1A1A1A" : "#FEF3C7",
                                border: `2px solid ${isModuleSelected ? "#1A1A1A" : "#E8B824"}`
                              }} 
                            >
                              <span className="text-sm font-bold" style={{ color: isModuleSelected ? "#E8B824" : "#92400E" }}>
                                {moduleIndex + 1}
                              </span>
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F3F4F6" }}>
                              <Lock className="h-5 w-5" strokeWidth={2} style={{ color: "#9CA3AF" }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold uppercase tracking-wider block mb-0.5" style={{ color: isModuleSelected ? "#1A1A1A" : "#6B7280" }}>
                              Module {moduleIndex + 1}
                            </span>
                            <span className="font-bold text-base truncate block" style={{ color: isModuleSelected ? "#1A1A1A" : "#1F2937" }}>
                              {module.title}
                            </span>
                          </div>
                        </div>
                        {isModuleUnlocked && (
                          <div className="flex-shrink-0 ml-2">
                            {isModuleExpanded ? (
                              <ChevronUp className="h-5 w-5 transition-transform duration-200" strokeWidth={2} style={{ color: isModuleSelected ? "#1A1A1A" : "#6B7280" }} />
                            ) : (
                              <ChevronDown className="h-5 w-5 transition-transform duration-200" strokeWidth={2} style={{ color: isModuleSelected ? "#1A1A1A" : "#6B7280" }} />
                            )}
                          </div>
                        )}
                      </button>

                      {/* Module Content - Lessons & Materials with smooth animation */}
                      <div
                        className={`overflow-hidden transition-all ease-out ${
                          isModuleExpanded 
                            ? "duration-500 max-h-[2000px] opacity-100 mt-2" 
                            : "duration-600 max-h-0 opacity-0"
                        }`}
                      >
                        {(lessons.length > 0 || materials.length > 0) && (
                          <div className="space-y-2 pl-2">
                          {/* Lessons */}
                          {lessons.map((lesson, lessonIndex) => {
                            const progress = lessonProgress[lesson.id];
                            const isLessonSelected = lessonIndex === selectedLessonIndex && isModuleSelected && activeTab === "lessons";
                            const isCompleted = !!progress?.completed_at;

                            return (
                              <button
                                key={lesson.id}
                                onClick={() => {
                                  setSelectedModuleIndex(moduleIndex);
                                  setSelectedLessonIndex(lessonIndex);
                                  setSelectedMaterialId(null);
                                  setActiveTab("lessons");
                                  setExpandedModules(new Set([moduleIndex])); // Close other modules
                                  markLessonAsViewed(lesson.id);
                                }}
                                className="w-full text-left px-4 py-3.5 rounded-lg transition-all duration-200 ease-out flex items-center justify-between hover:shadow-md hover:scale-[1.02] group"
                                style={{
                                  backgroundColor: isLessonSelected ? "#FFF9E6" : isCompleted ? "#F0FDF4" : "#FFFFFF",
                                  border: `2px solid ${
                                    isLessonSelected ? "#E8B824" : isCompleted ? "#BBF7D0" : "#E5E7EB"
                                  }`,
                                  boxShadow: isLessonSelected 
                                    ? "0 2px 8px rgba(232, 184, 36, 0.15)" 
                                    : "0 1px 2px rgba(0, 0, 0, 0.05)",
                                }}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="flex-shrink-0">
                                    {isCompleted ? (
                                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#D1FAE5" }}>
                                        <CheckCircle className="h-4 w-4" strokeWidth={2.5} style={{ color: "#059669" }} />
                                      </div>
                                    ) : isLessonSelected ? (
                                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEF3C7" }}>
                                        <Play className="h-4 w-4" strokeWidth={2.5} style={{ color: "#E8B824" }} fill="#E8B824" />
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors" style={{ backgroundColor: "#F9FAFB" }}>
                                        <Play className="h-4 w-4 group-hover:scale-110 transition-transform" strokeWidth={2} style={{ color: "#9CA3AF" }} />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold truncate" style={{ 
                                      color: isLessonSelected ? "#92400E" : isCompleted ? "#047857" : "#374151" 
                                    }}>
                                      {lesson.title}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                  {isCompleted && (
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: "#065F46", backgroundColor: "#D1FAE5", whiteSpace: "nowrap" }}>
                                      ✓
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}

                          {/* Materials */}
                          {materials.map((material) => {
                            const isMaterialSelected = selectedMaterialId === material.id && isModuleSelected && activeTab === "materials";
                            const progress = materialProgress[material.id];
                            const isCompleted = !!progress?.completed_at;
                            const durationMinutes = material.duration_seconds ? Math.round(material.duration_seconds / 60) : null;

                            return (
                              <button
                                key={material.id}
                                onClick={() => {
                                  setSelectedModuleIndex(moduleIndex);
                                  setSelectedMaterialId(material.id);
                                  setActiveTab("materials");
                                  setExpandedModules(new Set([moduleIndex])); // Close other modules
                                  markMaterialAsViewed(material.id);
                                }}
                                className="w-full text-left px-4 py-3.5 rounded-lg transition-all duration-200 ease-out flex items-center justify-between hover:shadow-md hover:scale-[1.02] group"
                                style={{
                                  backgroundColor: isMaterialSelected ? "#FFF4E6" : isCompleted ? "#F0FDF4" : "#FFFFFF",
                                  border: `2px solid ${
                                    isMaterialSelected ? "#F97316" : isCompleted ? "#BBF7D0" : "#E5E7EB"
                                  }`,
                                  boxShadow: isMaterialSelected 
                                    ? "0 2px 8px rgba(249, 115, 22, 0.15)" 
                                    : "0 1px 2px rgba(0, 0, 0, 0.05)",
                                }}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="flex-shrink-0">
                                    {isCompleted ? (
                                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#D1FAE5" }}>
                                        <CheckCircle className="h-4 w-4" strokeWidth={2.5} style={{ color: "#059669" }} />
                                      </div>
                                    ) : isMaterialSelected ? (
                                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FFF4E6" }}>
                                        {material.material_type === "video" && <Video className="h-4 w-4" strokeWidth={2.5} style={{ color: "#F97316" }} />}
                                        {material.material_type === "audio" && <Headphones className="h-4 w-4" strokeWidth={2.5} style={{ color: "#F97316" }} />}
                                        {material.material_type === "pdf" && <FileText className="h-4 w-4" strokeWidth={2.5} style={{ color: "#F97316" }} />}
                                        {material.material_type === "image" && <Image className="h-4 w-4" strokeWidth={2.5} style={{ color: "#F97316" }} />}
                                        {material.material_type === "resource" && <Link2 className="h-4 w-4" strokeWidth={2.5} style={{ color: "#F97316" }} />}
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors" style={{ backgroundColor: "#F9FAFB" }}>
                                        {material.material_type === "video" && <Video className="h-4 w-4 group-hover:scale-110 transition-transform" strokeWidth={2} style={{ color: "#9CA3AF" }} />}
                                        {material.material_type === "audio" && <Headphones className="h-4 w-4 group-hover:scale-110 transition-transform" strokeWidth={2} style={{ color: "#9CA3AF" }} />}
                                        {material.material_type === "pdf" && <FileText className="h-4 w-4 group-hover:scale-110 transition-transform" strokeWidth={2} style={{ color: "#9CA3AF" }} />}
                                        {material.material_type === "image" && <Image className="h-4 w-4 group-hover:scale-110 transition-transform" strokeWidth={2} style={{ color: "#9CA3AF" }} />}
                                        {material.material_type === "resource" && <Link2 className="h-4 w-4 group-hover:scale-110 transition-transform" strokeWidth={2} style={{ color: "#9CA3AF" }} />}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold truncate" style={{ 
                                      color: isMaterialSelected ? "#C2410C" : isCompleted ? "#047857" : "#374151" 
                                    }}>
                                      {material.title}
                                    </div>
                                    {durationMinutes && (
                                      <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                                        ⏱ {durationMinutes} menit
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                  {isCompleted && (
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: "#065F46", backgroundColor: "#D1FAE5", whiteSpace: "nowrap" }}>
                                      ✓
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Access Badge - TODO: Enable when AI feedback is ready */}
            {false && access.access === "limited" && (
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

        {/* Floating Sidebar Toggle Button - All Devices */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="flex fixed z-40 items-center justify-center transition-all duration-300 ease-out hover:brightness-110 active:scale-95"
          style={{
            backgroundColor: '#E8B824',
            color: '#1A1A1A',
            top: '50%',
            // Mobile: 75vw - 16px (sidebar is w-3/4), Desktop: 304px (sidebar is 320px)
            left: showSidebar ? 'calc(min(75vw, 320px) - 16px)' : '-16px',
            transform: 'translateY(-50%)',
            width: '40px',
            height: '80px',
            borderRadius: '0 12px 12px 0',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            borderLeft: 'none',
            borderTop: '1px solid rgba(0,0,0,0.1)',
            borderRight: '1px solid rgba(0,0,0,0.1)',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
          }}
          title={showSidebar ? "Sembunyikan Menu" : "Tampilkan Menu"}
        >
          {showSidebar ? (
            <ChevronLeft className="h-6 w-6" />
          ) : (
            <ChevronRight className="h-6 w-6" />
          )}
        </button>

        {/* Main Content - Responsive width based on sidebar state */}
        <main 
          className={`flex-1 w-full overflow-y-auto transition-all duration-300 ease-out pb-2 pt-24 ${
            showSidebar ? 'md:ml-80' : 'md:ml-0'
          }`}
        >
          <div className="w-full py-6 md:py-8 space-y-6">
            <div className="w-full px-4 md:px-8">
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
                    progressPercentage={overallProgress}
                    teacherName={course.teacher?.name || "Instruktur"}
                    courseId={courseId}
                  />
              )}

              {/* Lesson Content Card */}
              {activeTab === "lessons" && currentLesson ? (
                <div
                    className="rounded-lg p-6 md:p-8 shadow-md"
                    style={{
                      backgroundColor: "#FFFFFC",
                      border: "1px solid #E5E5E5",
                    }}
                  >
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-xs uppercase tracking-wider font-bold px-2 py-1 rounded-lg"
                          style={{
                            color: "#E8B824",
                            backgroundColor: "#FFF9E6",
                          }}
                        >
                          {currentLesson.lesson_type}
                        </span>
                        {lessonProgress[currentLesson.id]?.completed_at && (
                          <span
                            className="text-xs uppercase tracking-wider font-bold px-2 py-1 rounded-lg"
                            style={{
                              color: "#2E7D32",
                              backgroundColor: "#E8F5E9",
                            }}
                          >
                            Selesai
                          </span>
                        )}
                      </div>
                      <h2
                        className="text-3xl font-bold mt-2 mb-2"
                        style={{ color: "#1A1A1A" }}
                      >
                        {currentLesson.title}
                      </h2>
                      <p style={{ color: "#4A4A4A" }}>
                        {currentLesson.description}
                      </p>
                    </div>

                    <div
                      style={{ color: "#374151", lineHeight: "1.8" }}
                      className="leading-relaxed mb-8 prose prose-lg max-w-none"
                    >
                      {currentLesson.content ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: currentLesson.content,
                          }}
                          style={{
                            wordWrap: "break-word",
                            overflowWrap: "break-word",
                            fontSize: "1.0625rem", // 17px for better readability
                          }}
                        />
                      ) : (
                        <p className="text-gray-400">
                          Konten tidak tersedia untuk pelajaran ini.
                        </p>
                      )}
                    </div>

                    {/* Exercise Inline Component */}
                    {currentLesson && user && (
                      <ExerciseInline
                        lessonId={currentLesson.id}
                        courseId={courseId}
                        userId={user.id}
                        lessonContent={currentLesson.content}
                      />
                    )}

                  </div>
              ) : (
                <div
                    className="rounded-lg p-6 md:p-8 shadow-md text-center"
                    style={{
                      backgroundColor: "#FFFFFC",
                      border: "1px solid #E5E5E5",
                    }}
                  >
                    <p style={{ color: "#4A4A4A" }}>
                      Pilih pelajaran untuk memulai.
                    </p>
                  </div>
              )}

              {/* Materials Content */}
              {activeTab === "materials" && (
                <>
                  {/* Check if all lessons are completed to show materials */}
                  {lessons.length > 0 && 
                   Object.keys(lessonProgress).length === lessons.length && 
                   lessons.every(l => lessonProgress[l.id]?.completed_at) ? (
                    <>
                      {currentMaterial ? (
                        <div
                            className="rounded-lg p-6 md:p-8 shadow-md"
                            style={{
                              backgroundColor: "#FFFFFC",
                              border: "1px solid #E5E5E5",
                            }}
                          >
                            <div className="mb-6 pb-6 border-b border-gray-200">
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className="text-xs uppercase tracking-wider font-bold px-2 py-1 rounded-lg"
                                  style={{
                                    color: "#E87835",
                                    backgroundColor: "#FFF4E6",
                                  }}
                                >
                                  {currentMaterial.material_type}
                                </span>
                                {materialProgress[currentMaterial.id]?.completed_at && (
                                  <span
                                    className="text-xs uppercase tracking-wider font-bold px-2 py-1 rounded-lg"
                                    style={{
                                      color: "#2E7D32",
                                      backgroundColor: "#E8F5E9",
                                    }}
                                  >
                                    Selesai
                                  </span>
                                )}
                              </div>
                              <h2
                                className="text-3xl font-bold mt-2 mb-2"
                                style={{ color: "#1A1A1A" }}
                              >
                                {currentMaterial.title}
                              </h2>
                              <p style={{ color: "#4A4A4A" }}>
                                {currentMaterial.description || "Tidak ada deskripsi yang diberikan"}
                              </p>
                            </div>

                            {/* Material Content Preview based on type */}
                            <div className="mb-8">
                              {currentMaterial.material_type === "video" && (
                                <>
                                  {currentMaterial.source_type === "youtube_link" && currentMaterial.external_url && (
                                    <div className="aspect-video rounded-lg overflow-hidden bg-black mb-4">
                                      <iframe
                                        width="100%"
                                        height="100%"
                                        src={currentMaterial.external_url.replace("watch?v=", "embed/")}
                                        title={currentMaterial.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      />
                                    </div>
                                  )}
                                  {currentMaterial.source_type === "upload" && currentMaterial.file_url && (
                                    <div className="aspect-video rounded-lg overflow-hidden bg-black mb-4">
                                      <video
                                        controls
                                        style={{ width: "100%", height: "100%" }}
                                        src={currentMaterial.file_url}
                                      />
                                    </div>
                                  )}
                                  {currentMaterial.source_type === "external_link" && currentMaterial.external_url && (
                                    <a
                                      href={currentMaterial.external_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                                      style={{
                                        backgroundColor: "#E87835",
                                        color: "#FFFFFC",
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      Tonton Video
                                    </a>
                                  )}
                                </>
                              )}

                              {currentMaterial.material_type === "audio" && (
                                <>
                                  {currentMaterial.file_url && (
                                    <audio
                                      controls
                                      style={{ width: "100%" }}
                                      src={currentMaterial.file_url}
                                    />
                                  )}
                                  {currentMaterial.external_url && !currentMaterial.file_url && (
                                    <a
                                      href={currentMaterial.external_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                                      style={{
                                        backgroundColor: "#E87835",
                                        color: "#FFFFFC",
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      Buka Audio
                                    </a>
                                  )}
                                </>
                              )}

                              {currentMaterial.material_type === "image" && (
                                <>
                                  {currentMaterial.file_url && (
                                    <img
                                      src={currentMaterial.file_url}
                                      alt={currentMaterial.title}
                                      className="max-w-full h-auto rounded-lg mb-4"
                                    />
                                  )}
                                  {currentMaterial.external_url && !currentMaterial.file_url && (
                                    <a
                                      href={currentMaterial.external_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                                      style={{
                                        backgroundColor: "#E87835",
                                        color: "#FFFFFC",
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      Lihat Gambar
                                    </a>
                                  )}
                                </>
                              )}

                              {currentMaterial.material_type === "pdf" && (
                                <>
                                  {currentMaterial.file_url && (
                                    <a
                                      href={currentMaterial.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                                      style={{
                                        backgroundColor: "#E87835",
                                        color: "#FFFFFC",
                                      }}
                                    >
                                      <Download className="h-4 w-4" />
                                      Unduh PDF
                                    </a>
                                  )}
                                  {currentMaterial.external_url && !currentMaterial.file_url && (
                                    <a
                                      href={currentMaterial.external_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                                      style={{
                                        backgroundColor: "#E87835",
                                        color: "#FFFFFC",
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      Buka PDF
                                    </a>
                                  )}
                                </>
                              )}

                              {currentMaterial.material_type === "resource" && (
                                <>
                                  {currentMaterial.file_url && (
                                    <a
                                      href={currentMaterial.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                                      style={{
                                        backgroundColor: "#E87835",
                                        color: "#FFFFFC",
                                      }}
                                    >
                                      <Download className="h-4 w-4" />
                                      Unduh Sumber Daya
                                    </a>
                                  )}
                                  {currentMaterial.external_url && (
                                    <a
                                      href={currentMaterial.external_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                                      style={{
                                        backgroundColor: "#E87835",
                                        color: "#FFFFFC",
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      Buka Sumber Daya
                                    </a>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                      ) : (
                        <div
                            className="rounded-lg p-6 md:p-8 shadow-md text-center"
                            style={{
                              backgroundColor: "#FFFFFC",
                              border: "1px solid #E5E5E5",
                            }}
                          >
                            <p style={{ color: "#4A4A4A" }}>
                              Pilih materi dari sidebar untuk memulai.
                            </p>
                          </div>
                      )}
                    </>
                  ) : (
                    <div
                        className="rounded-lg p-6 md:p-8 shadow-md text-center"
                        style={{
                          backgroundColor: "#FFFBF0",
                          border: "2px solid #F5C518",
                        }}
                      >
                        <Lock className="h-8 w-8 mx-auto mb-2" strokeWidth={1.5} style={{ color: "#9CA3AF" }} />
                        <p
                          className="font-bold mb-1"
                          style={{ color: "#F5C518" }}
                        >
                          Materi Terkunci
                        </p>
                        <p style={{ color: "#4A4A4A" }}>
                          Selesaikan semua pelajaran untuk mengakses materi.
                        </p>
                      </div>
                  )}
                </>
              )}

              {/* AI Feedback Button - TODO: Enable when AI feedback is ready */}
              {false && access.access === "limited" && (
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
                          Umpan Balik AI Gratis (1-2 Upaya)
                        </p>
                        <p className="text-xs mb-3" style={{ color: "#4A4A4A" }}>
                          Anda memiliki upaya umpan balik AI terbatas. Tingkatkan ke berbayar
                          untuk akses tanpa batas.
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
                          Gunakan Umpan Balik AI ({2 - aiAttempts} Tersisa)
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analytics (only if full access) */}
                {access.canViewAnalytics && (
                  <div
                    className="p-4 rounded-lg mb-6 flex items-center gap-2"
                    style={{
                      backgroundColor: "#E8F5E9",
                      border: "1px solid #C8E6C9",
                    }}
                  >
                    <CheckCircle className="h-4 w-4" strokeWidth={1.5} style={{ color: "#6B7280" }} />
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#2E7D32" }}
                    >
                      Akses analitik penuh tersedia
                    </p>
                  </div>
                )}
            </div>
          </div>
        </main>
      </div>

      {/* Fixed Navigation Footer */}
      <div className={`fixed bottom-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl z-20 transition-all duration-300 ease-out ${
        showSidebar ? 'left-0 md:left-80' : 'left-0'
      }`}>
        <div className="px-6 md:px-8 py-3 flex items-center justify-between">
          <div className="flex-1"></div>
          
          <div className="flex items-center w-full justify-between gap-4">
            <Button
              onClick={() => {
                // Handle Sebelumnya with unified lesson/material logic
                if (activeTab === "lessons") {
                  if (selectedLessonIndex > 0) {
                    // Go to previous lesson
                    setSelectedLessonIndex(selectedLessonIndex - 1);
                  } else if (selectedModuleIndex > 0) {
                    // Go to previous module - use marker to go to last item after fetch
                    const newModuleIndex = selectedModuleIndex - 1;
                    setExpandedModules(new Set([newModuleIndex]));
                    setSelectedModuleIndex(newModuleIndex);
                    setSelectedLessonIndex(Number.MAX_SAFE_INTEGER); // Marker for "go to last item"
                    setSelectedMaterialId(null);
                    setLessons([]);
                    setMaterials([]);
                    setLessonProgress({});
                    setMaterialProgress({});
                  }
                } else if (activeTab === "materials") {
                  const currentIndex = materials.findIndex(m => m.id === selectedMaterialId);
                  if (currentIndex > 0) {
                    // Go to previous material
                    setSelectedMaterialId(materials[currentIndex - 1].id);
                  } else if (lessons.length > 0) {
                    // Go to last lesson
                    setSelectedLessonIndex(lessons.length - 1);
                    setActiveTab("lessons");
                  } else if (selectedModuleIndex > 0) {
                    // Go to previous module - use marker to go to last item after fetch
                    const newModuleIndex = selectedModuleIndex - 1;
                    setExpandedModules(new Set([newModuleIndex]));
                    setSelectedModuleIndex(newModuleIndex);
                    setSelectedMaterialId(null);
                    setSelectedLessonIndex(Number.MAX_SAFE_INTEGER); // Marker for "go to last item"
                    setActiveTab("lessons"); // Switch to lessons when going back to previous module
                    setLessons([]);
                    setMaterials([]);
                    setLessonProgress({});
                    setMaterialProgress({});
                  }
                }
              }}
              disabled={
                selectedLessonIndex === 0 && 
                selectedModuleIndex === 0 && 
                (activeTab === "lessons" || (activeTab === "materials" && materials.findIndex(m => m.id === selectedMaterialId) === 0))
              }
              variant="outline"
              className="h-9 px-4 font-semibold border-2 hover:bg-gray-50 transition-all flex-1 text-sm"
              style={{
                color:
                  selectedLessonIndex === 0 && selectedModuleIndex === 0 ? "#999999" : "#1A1A1A",
              }}
            >
               Sebelumnya
            </Button>
            
            {selectedModuleIndex < modules.length - 1 || activeTab === "lessons" || activeTab === "materials" ? (
              <Button
                onClick={() => {
                  // Handle Lanjutkan with unified lesson/material logic
                  if (activeTab === "lessons") {
                    // Mark current lesson as completed before moving
                    if (currentLesson) {
                      markLessonAsCompleted(currentLesson.id);
                    }
                    
                    if (selectedLessonIndex < lessons.length - 1) {
                      // Go to next lesson
                      setSelectedLessonIndex(selectedLessonIndex + 1);
                    } else if (materials.length > 0) {
                      // Go to first material when lessons exhausted
                      setSelectedMaterialId(materials[0].id);
                      setActiveTab("materials");
                    } else if (selectedModuleIndex < modules.length - 1) {
                      // Go to next module
                      const newModuleIndex = selectedModuleIndex + 1;
                      const newUnlockedModules = new Set(unlockedModules);
                      newUnlockedModules.add(newModuleIndex);
                      setUnlockedModules(newUnlockedModules);
                      // Expand the new module and clear old data
                      setExpandedModules(new Set([newModuleIndex]));
                      setSelectedModuleIndex(newModuleIndex);
                      setSelectedLessonIndex(0);
                      setSelectedMaterialId(null);
                      setLessons([]);
                      setMaterials([]);
                      setLessonProgress({});
                      setMaterialProgress({});
                    }
                  } else if (activeTab === "materials") {
                    // Mark current material as completed before moving
                    if (currentMaterial) {
                      markMaterialAsCompleted(currentMaterial.id);
                    }
                    
                    const currentIndex = materials.findIndex(m => m.id === selectedMaterialId);
                    if (currentIndex < materials.length - 1) {
                      // Go to next material
                      setSelectedMaterialId(materials[currentIndex + 1].id);
                    } else if (selectedModuleIndex < modules.length - 1) {
                      // Go to next module
                      const newModuleIndex = selectedModuleIndex + 1;
                      const newUnlockedModules = new Set(unlockedModules);
                      newUnlockedModules.add(newModuleIndex);
                      setUnlockedModules(newUnlockedModules);
                      // Expand the new module and clear old data
                      setExpandedModules(new Set([newModuleIndex]));
                      setSelectedModuleIndex(newModuleIndex);
                      setSelectedLessonIndex(0);
                      setSelectedMaterialId(null);
                      setLessons([]);
                      setMaterials([]);
                      setLessonProgress({});
                      setMaterialProgress({});
                    }
                  }
                }}
                className="h-9 px-4 font-bold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex-1 text-sm"
                style={{
                  background: 'linear-gradient(135deg, #F5C518 0%, #F59E0B 100%)',
                  color: '#1A1A1A',
                }}
              >
                Lanjutkan 
              </Button>
            ) : (
              <Button
                disabled
                className="h-9 px-4 font-bold rounded-lg transition-all shadow-lg flex-1 text-sm flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "#10B981",
                  color: "#FFFFFF",
                }}
              >
                <CheckCircle className="h-4 w-4" strokeWidth={1.5} style={{ color: "#FFFFFF" }} />
                Selesai
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Spacing for fixed footer */}
      <div className="h-24"></div>

      {/* Upgrade Modal */}
      {showAIUpgrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="rounded-lg max-w-md w-full p-6"
            style={{ backgroundColor: "#FFFFFC" }}
          >
            <h3 className="text-2xl font-bold mb-2" style={{ color: "#1A1A1A" }}>
              Tingkatkan ke Premium
            </h3>
            <p style={{ color: "#4A4A4A" }} className="mb-4">
              Anda telah menggunakan upaya umpan balik AI gratis Anda. Tingkatkan ke premium untuk akses tanpa batas ke umpan balik AI dan analitik.
            </p>
            <div className="space-y-3">
              <Button
                className="w-full h-12"
                style={{
                  backgroundColor: "#F5C518",
                  color: "#1A1A1A",
                }}
              >
                Tingkatkan Sekarang
              </Button>
              <Button
                onClick={() => setShowAIUpgrade(false)}
                variant="outline"
                className="w-full h-12"
                style={{ color: "#1A1A1A" }}
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
