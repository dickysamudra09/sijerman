// @ts-nocheck
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
import { useIsMobile } from "@/hooks/useMediaQuery";
import { ImmersiveCourseView } from "@/components/ImmersiveCourseView";
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
  const isMobile = useIsMobile(); // ✨ NEW: Mobile detection

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
  
  // ✨ NEW: Feedback state management untuk persist feedback per exercise
  const [feedbackMap, setFeedbackMap] = useState<Record<string, any>>({});
  
  // ✨ NEW: Track exercise completion state for mobile navigation lock
  const [allExercisesCompleted, setAllExercisesCompleted] = useState(false);
  const [hasExercises, setHasExercises] = useState(false); // Default: unlocked (no exercises assumed)

  // ✨ NEW: Exercise retry system state
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [isStartingExercise, setIsStartingExercise] = useState(false);
  const [currentExerciseData, setCurrentExerciseData] = useState<{
    exerciseId: string;
    exerciseTitle: string;
  } | null>(null);
  const [exerciseIsPassed, setExerciseIsPassed] = useState(false); // ✨ NEW: Track if user has passed

  // Debug: Log feedbackMap changes
  useEffect(() => {
    console.log('[DEBUG] feedbackMap updated:', Object.keys(feedbackMap));
  }, [feedbackMap]);

  // ✨ NEW: Function to start new exercise attempt
  const startExerciseAttempt = async (exerciseId: string, lessonId: string) => {
    if (!user) return null;
    
    try {
      setIsStartingExercise(true);
      
      console.log('[EXERCISE-RETRY] Starting attempt:', { exerciseId, lessonId, userId: user.id });
      
      const response = await fetch('/api/exercise-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          courseExerciseId: exerciseId,
          lessonId: lessonId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[EXERCISE-RETRY] API Error:', response.status, errorData);
        throw new Error(`Failed to start exercise attempt: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      if (result.success) {
        setCurrentAttemptId(result.data.id);
        console.log('[EXERCISE-RETRY] Started new attempt:', result.data.attempt_number);
        return result.data.id;
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error starting exercise attempt:', error);
      // Show user-friendly error message
      alert('Gagal memulai latihan. Pastikan database sudah di-setup dengan benar.');
      return null;
    } finally {
      setIsStartingExercise(false);
    }
  };

  // ✨ NEW: Function to complete exercise attempt
  const completeExerciseAttempt = async (attemptId: string, timeSpentSeconds?: number) => {
    try {
      const response = await fetch(`/api/exercise-attempts/${attemptId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeSpentSeconds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete exercise attempt');
      }

      const result = await response.json();
      if (result.success) {
        console.log('[EXERCISE-RETRY] Completed attempt:', result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error completing exercise attempt:', error);
      return null;
    }
  };

  // ✨ NEW: Function to fetch exercise data for current lesson
  const fetchCurrentExerciseData = async (lessonId: string) => {
    try {
      const { data: exercisesData, error: exercisesError } = await supabase
        .from("course_exercises")
        .select("id, title")
        .eq("lesson_id", lessonId)
        .eq("is_active", true)
        .order("exercise_number", { ascending: true })
        .limit(1);

      if (exercisesError) throw exercisesError;
      
      if (exercisesData && exercisesData.length > 0) {
        const exercise = exercisesData[0];
        setCurrentExerciseData({
          exerciseId: exercise.id,
          exerciseTitle: exercise.title || 'Latihan Soal'
        });
        
        // ✨ NEW: Fetch exercise summary to check if passed
        if (user) {
          const summaryResponse = await fetch(
            `/api/exercise-attempts/summary?exerciseId=${exercise.id}&userId=${user.id}`
          );
          
          if (summaryResponse.ok) {
            const summaryResult = await summaryResponse.json();
            if (summaryResult.success && summaryResult.data) {
              setExerciseIsPassed(summaryResult.data.is_passed || false);
            } else {
              setExerciseIsPassed(false);
            }
          } else {
            setExerciseIsPassed(false);
          }
        }
        
        return exercise;
      } else {
        setCurrentExerciseData(null);
        setExerciseIsPassed(false);
        return null;
      }
    } catch (error) {
      console.error('Error fetching exercise data:', error);
      setCurrentExerciseData(null);
      setExerciseIsPassed(false);
      return null;
    }
  };



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

  // ✨ NEW: Function to handle exercise completion
  const handleExerciseComplete = async (attemptId: string) => {
    try {
      console.log('[EXERCISE-RETRY] Completing attempt:', attemptId);
      
      const completedAttempt = await completeExerciseAttempt(attemptId);
      if (completedAttempt) {
        console.log('[EXERCISE-RETRY] Attempt completed:', completedAttempt);
        
        // Reset current attempt to show history card again
        setCurrentAttemptId(null);
        
        // Refresh exercise data to update history
        if (currentLesson) {
          fetchCurrentExerciseData(currentLesson.id);
        }
      }
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
  };

  // ✨ NEW: Fetch exercise data when lesson changes
  useEffect(() => {
    if (currentLesson) {
      fetchCurrentExerciseData(currentLesson.id);
    }
  }, [currentLesson]);

  // ✨ NEW: Function to handle starting exercise from history card
  const handleStartExercise = async () => {
    if (!currentExerciseData || !currentLesson || !user) return;
    
    try {
      const attemptId = await startExerciseAttempt(
        currentExerciseData.exerciseId, 
        currentLesson.id
      );
      
      if (attemptId) {
        // Set the current attempt ID to show exercises
        setCurrentAttemptId(attemptId);
        
        // Scroll to exercise section
        setTimeout(() => {
          window.scrollTo({ 
            top: document.body.scrollHeight, 
            behavior: 'smooth' 
          });
        }, 100);
      }
    } catch (error) {
      console.error('Error starting exercise:', error);
      // Handle error - maybe show a toast or alert
    }
  };

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

  // ✨ IMMERSIVE VIEW: For all devices (Mobile, Tablet, Desktop)
  if (activeTab === "lessons" && currentLesson) {
    const handleNext = () => {
      // Mark current lesson as completed before moving to next
      if (currentLesson) {
        markLessonAsCompleted(currentLesson.id);
      }
      
      if (selectedLessonIndex < lessons.length - 1) {
        setSelectedLessonIndex(selectedLessonIndex + 1);
        setAllExercisesCompleted(false); // Reset for next lesson
        setHasExercises(false); // Reset to unlocked, will be locked if exercises exist
        setCurrentAttemptId(null); // ✨ NEW: Reset attempt when changing lessons
        setExerciseIsPassed(false); // ✨ NEW: Reset passed status
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    const handlePrevious = () => {
      if (selectedLessonIndex > 0) {
        setSelectedLessonIndex(selectedLessonIndex - 1);
        setAllExercisesCompleted(false); // Reset for previous lesson
        setHasExercises(false); // Reset to unlocked, will be locked if exercises exist
        setCurrentAttemptId(null); // ✨ NEW: Reset attempt when changing lessons
        setExerciseIsPassed(false); // ✨ NEW: Reset passed status
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    const handleSelectLesson = (index: number) => {
      setSelectedLessonIndex(index);
      setAllExercisesCompleted(false); // Reset when switching lessons
      setHasExercises(false); // Reset to unlocked, will be locked if exercises exist
      setCurrentAttemptId(null); // ✨ NEW: Reset attempt when changing lessons
      setExerciseIsPassed(false); // ✨ NEW: Reset passed status
    };

    const handleComplete = () => {
      // Mark last lesson as completed before exiting
      if (currentLesson) {
        markLessonAsCompleted(currentLesson.id);
      }
    };

    // Map lessons to include completion status and lock status
    const lessonsWithStatus = lessons.map((lesson, index) => {
      const isCompleted = !!lessonProgress[lesson.id]?.completed_at;
      
      // Lock logic: lesson is locked if previous lesson is not completed
      const isLocked = index > 0 && !lessonProgress[lessons[index - 1].id]?.completed_at;
      
      return {
        id: lesson.id,
        title: lesson.title,
        isCompleted,
        isLocked,
      };
    });

    return (
      <ImmersiveCourseView
        courseId={courseId}
        lessonTitle={currentLesson.title}
        lessonContent={currentLesson.content || ''}
        currentQuestionNumber={selectedLessonIndex + 1}
        totalQuestions={lessons.length}
        overallProgress={overallProgress}
        lessons={lessonsWithStatus}
        currentLessonIndex={selectedLessonIndex}
        onSelectLesson={handleSelectLesson}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onComplete={handleComplete}
        hasNext={selectedLessonIndex < lessons.length - 1}
        hasPrevious={selectedLessonIndex > 0}
        allExercisesCompleted={allExercisesCompleted}
        hasExercises={hasExercises}
        // ✨ NEW: Exercise retry system props
        exerciseId={currentExerciseData?.exerciseId}
        exerciseTitle={currentExerciseData?.exerciseTitle}
        userId={user.id}
        onStartExercise={handleStartExercise}
        isStartingExercise={isStartingExercise} // ✨ NEW: Pass loading state
        currentAttemptId={currentAttemptId} // ✨ NEW: Pass current attempt ID
        hasHistoryCard={!!currentExerciseData && !currentAttemptId} // ✨ NEW: Lock navigation when history card shows
        exerciseIsPassed={exerciseIsPassed} // ✨ NEW: Pass if user has passed
      >
        {/* Only show ExerciseInline if user has started an attempt */}
        {currentAttemptId ? (
          <ExerciseInline
            lessonId={currentLesson.id}
            courseId={courseId}
            userId={user.id}
            lessonContent={currentLesson.content}
            feedbackMap={feedbackMap}
            onFeedbackGenerated={(exerciseId: string, feedback: any) => {
              setFeedbackMap(prev => ({
                ...prev,
                [exerciseId]: feedback
              }));
            }}
            onAllExercisesCompleted={(completed) => {
              setAllExercisesCompleted(completed);
            }}
            onHasExercises={(hasEx) => {
              setHasExercises(hasEx);
            }}
            attemptId={currentAttemptId} // ✨ NEW: Pass current attempt ID
            onExerciseComplete={handleExerciseComplete} // ✨ NEW: Handle exercise completion
          />
        ) : currentExerciseData ? (
          // ✨ UPDATED: Show placeholder ONLY if lesson has exercise
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              Klik "Mulai Latihan" di atas untuk memulai mengerjakan soal
            </p>
          </div>
        ) : null}
      </ImmersiveCourseView>
    );
  }

  // ✨ FALLBACK: Show message if no lesson selected or not in lessons tab
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="text-center px-4">
        <BookOpen className="h-16 w-16 mx-auto mb-4" style={{ color: "#E8B824" }} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#1A1A1A" }}>
          Pilih Pelajaran untuk Memulai
        </h2>
        <p className="text-gray-600 mb-6">
          Klik tombol di bawah untuk melihat daftar pelajaran
        </p>
        <Button
          onClick={() => {
            // Navigate to first lesson if available
            if (lessons.length > 0) {
              setActiveTab("lessons");
              setSelectedLessonIndex(0);
            } else {
              router.push('/open-courses');
            }
          }}
          className="px-6 py-3"
          style={{
            background: 'linear-gradient(135deg, #E8B824 0%, #F5C518 100%)',
            color: '#1A1A1A',
          }}
        >
          {lessons.length > 0 ? 'Mulai Belajar' : 'Kembali ke Daftar Kursus'}
        </Button>
      </div>
    </div>
  );
}
