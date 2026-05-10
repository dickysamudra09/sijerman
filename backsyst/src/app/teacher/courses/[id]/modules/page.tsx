// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LessonContentEditor } from "@/components/LessonContentEditor";
import { ExerciseBuilderModal } from "@/components/Exercise/ExerciseBuilderModal";
import {
  Plus,
  Trash2,
  AlertCircle,
  Check,
  BookOpen,
  ChevronRight,
  GripVertical,
  Lock,
  FileText,
  Music,
  Video,
  Image,
  Link2,
  Upload,
  Lightbulb,
  Layers,
  MessageCircle,
  BookMarked,
  Headphones,
  Dumbbell,
  Eye,
  X,
  Brain,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CourseDashboard } from "@/components/DashboardFlow/CourseDashboard";
import { DashboardModals } from "@/components/DashboardFlow/DashboardModals";
import { SimpleCRUD } from "@/components/SimpleCRUD/SimpleCRUD";
import { SimpleExerciseBuilder } from "@/components/SimpleCRUD/SimpleExerciseBuilder";
import { SimplePreview } from "@/components/SimpleCRUD/SimplePreview";
import { ModalProvider, useModal } from "@/contexts/ModalContext";
import { ModalShell } from "@/components/ModalShell";
import { LessonFormModal } from "@/components/forms/LessonFormModal";
import { ExerciseFormModal } from "@/components/forms/ExerciseFormModal";
import { LessonPreview } from "@/components/previews/LessonPreview";
import { ExercisePreview } from "@/components/previews/ExercisePreview";


// Interfaces for hierarchical structure
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

// Sortable Material Item Component
function SortableMaterialItem({
  material,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  getMaterialIcon,
}: {
  material: ModuleMaterial;
  index: number;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  getMaterialIcon: (type: string) => React.ReactElement;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: material.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: isSelected ? "#E87835" : "#F5F5F5",
        border: `1px solid ${isSelected ? "#D4701A" : "#E5E5E5"}`,
      }}
      className="rounded-lg p-3 transition-all flex items-start gap-2 cursor-pointer"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing flex-shrink-0 mt-1 hover:opacity-70"
      >
        <GripVertical
          className="h-4 w-4"
          style={{
            color: isSelected ? "#1A1A1A" : "#999999",
          }}
        />
      </button>

      <div className="flex items-start gap-2 flex-1 min-w-0">
        <div className="flex-shrink-0 mt-1">
          {getMaterialIcon(material.material_type)}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{
              color: isSelected ? "#1A1A1A" : "#1A1A1A",
            }}
          >
            {material.title}
          </p>
          <p
            className="text-xs truncate"
            style={{
              color: "#999999",
            }}
          >
            {material.material_type}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(material.id);
          }}
          className="p-1 hover:bg-orange-100 rounded transition-colors"
          title="Edit bahan"
        >
          <Eye className="h-4 w-4" style={{ color: "#E87835" }} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(material.id);
          }}
          className="p-1 hover:bg-red-100 rounded transition-colors"
          title="Hapus bahan"
        >
          <Trash2 className="h-4 w-4" style={{ color: "#DC2626" }} />
        </button>
      </div>
    </div>
  );
}

interface ModuleExercise {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  exercise_type: "mcq" | "essay" | "puzzle";
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

interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Sortable Lesson Item Component
function SortableLessonItem({
  lesson,
  index,
  isSelected,
  isLocked,
  onSelect,
  onEdit,
  onDelete,
  getLessonIcon,
}: {
  lesson: ModuleLesson;
  index: number;
  isSelected?: boolean;
  isLocked: boolean;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  getLessonIcon: (type: string) => React.ReactElement;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: isSelected ? "#E8B824" : "#F5F5F5",
        border: `1px solid ${isSelected ? "#D4A71F" : "#E5E5E5"}`,
        opacity: isLocked ? 0.6 : 1,
      }}
      className={`rounded-lg p-3 transition-all flex items-start gap-2 ${
        isLocked ? "" : "cursor-pointer"
      }`}
    >
      {!isLocked && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing flex-shrink-0 mt-1 hover:opacity-70"
        >
          <GripVertical
            className="h-4 w-4"
            style={{
              color: isSelected ? "#1A1A1A" : "#999999",
            }}
          />
        </button>
      )}

      <div className="flex items-start gap-2 flex-1 min-w-0">
        <div className="flex-shrink-0 mt-1">
          {isLocked ? (
            <Lock
              className="h-4 w-4"
              style={{ color: "#E87835" }}
            />
          ) : (
            getLessonIcon(lesson.lesson_type)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-xs font-bold uppercase tracking-wide"
            style={{
              color: isSelected ? "#1A1A1A" : "#999999",
            }}
          >
            Pelajaran {index + 1}
          </div>
          <p
            className="text-sm font-semibold line-clamp-2"
            style={{
              color: isSelected ? "#1A1A1A" : "#1A1A1A",
            }}
          >
            {lesson.title}
          </p>
          {isLocked && (
            <p className="text-xs mt-1" style={{ color: "#E87835" }}>
              Terkunci - Selesaikan pelajaran sebelumnya terlebih dahulu
            </p>
          )}
        </div>
      </div>

      {!isLocked && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(lesson.id);
            }}
            className="p-1 hover:bg-yellow-100 rounded transition-colors"
            title="Edit pelajaran"
          >
            <Eye className="h-4 w-4" style={{ color: "#E8B824" }} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(lesson.id);
            }}
            className="p-1 hover:bg-red-100 rounded transition-colors"
            title="Hapus pelajaran"
          >
            <Trash2 className="h-4 w-4" style={{ color: "#DC2626" }} />
          </button>
        </div>
      )}
    </div>
  );
}

function ModuleEditorPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const moduleId = params.moduleId as string;
  
  // Modal management
  const modal = useModal();

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessons, setLessons] = useState<ModuleLesson[]>([]);
  const [materials, setMaterials] = useState<ModuleMaterial[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [studentProgress, setStudentProgress] = useState<
    Record<string, StudentLessonProgress>
  >({});

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal saving state
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [isSavingExercise, setIsSavingExercise] = useState(false);

  const [activeTab, setActiveTab] = useState<"lessons" | "materials">("lessons");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [activeContentTab, setActiveContentTab] = useState<"modules" | "lessons" | "materials" | "exercises">("modules");
  const [previewItem, setPreviewItem] = useState<{ item: any; type: "lesson" | "exercise" | "material" | "module" } | null>(null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  
  // Exercise builder modal states
  const [showExerciseBuilder, setShowExerciseBuilder] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);
  
  // Dashboard modal states
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "module" | "lesson" | "material" | "exercise";
    mode: "create" | "edit";
    initialData?: any;
  }>({
    isOpen: false,
    type: "module",
    mode: "create",
  });

  // Module form state
  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
  });

  // Lesson form state (used by modal system)
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    content: "",
    lesson_type: "explanation" as "explanation" | "vocabulary" | "dialogue" | "reading" | "listening",
  });

  // Material form state (used by modal system)
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
    material_type: "video" as "video" | "audio" | "pdf" | "image" | "resource",
    source_type: "upload" as "upload" | "youtube_link" | "external_link",
    file_url: "",
    external_url: "",
  });

  // STEP 4: Exercise form state (NEW MODAL-BASED)
  const [newExercise, setNewExercise] = useState({
    title: "",
    description: "",
    exercise_type: "mcq" as "mcq" | "essay" | "puzzle",
    question_count: 0,
    ai_feedback_enabled: false,
    ai_feedback_type: "instant" as "instant" | "delayed" | "batch",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Authentication
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUser(user);
    };

    checkAuth();
  }, [router]);

  // Fetch course and modules
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !courseId) return;

      try {
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .eq("teacher_id", user.id)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        const { data: modulesData, error: modulesError } = await supabase
          .from("course_modules")
          .select("*")
          .eq("course_id", courseId)
          .order("order_index", { ascending: true });

        if (modulesError) throw modulesError;
        setModules(modulesData || []);

        // Auto-select first module if it exists
        if (modulesData && modulesData.length > 0) {
          setSelectedModuleId(modulesData[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Gagal mengambil data");
      } finally {
        setLoading(false);
      }
    };

    if (user && courseId) {
      fetchData();
    }
  }, [user, courseId]);

  // Fetch lessons, materials, and exercises for selected module
  useEffect(() => {
    const fetchModuleContent = async () => {
      if (!selectedModuleId) {
        setLessons([]);
        setMaterials([]);
        setExercises([]);
        return;
      }

      try {
        const { data: lessonsData, error: lessonsError } = await supabase
          .from("module_lessons")
          .select("*")
          .eq("module_id", selectedModuleId)
          .order("order_index", { ascending: true });

        if (lessonsError) throw lessonsError;
        setLessons(lessonsData || []);

        // Fetch lesson-based materials for all lessons in this module
        if (lessonsData && lessonsData.length > 0) {
          const lessonIds = lessonsData.map(lesson => lesson.id);
          
          const { data: materialsData, error: materialsError } = await supabase
            .from("course_materials")
            .select("*")
            .in("lesson_id", lessonIds)
            .order("order_index", { ascending: true });

          if (materialsError) throw materialsError;
          setMaterials(materialsData || []);
        } else {
          setMaterials([]);
        }

        // Fetch exercises for this course with lesson information (lesson-based)
        const { data: exercises, error: exercisesError } = await supabase
          .from("course_exercises")
          .select(`
            *,
            module_lessons!inner (
              id,
              title,
              module_id
            ),
            course_questions (
              *,
              course_options (*)
            )
          `)
          .eq("course_id", courseId)
          .order("created_at", { ascending: false });

        if (exercisesError) throw exercisesError;
        setExercises(exercises || []);
      } catch (err: any) {
        setError(err.message || "Gagal mengambil konten modul");
      }
    };

    fetchModuleContent();
  }, [selectedModuleId, courseId]);

  // STEP 6 Part 2: Load lesson data when modal opens in edit mode
  useEffect(() => {
    const loadLessonForEdit = async () => {
      if (modal.isOpen && modal.modalType === 'lesson' && modal.mode === 'edit' && modal.data?.id) {
        try {
          const { data, error } = await supabase
            .from("module_lessons")
            .select("*")
            .eq("id", modal.data.id)
            .single();

          if (error) throw error;
          if (data) {
            setNewLesson({
              title: data.title || "",
              description: data.description || "",
              content: data.content || "",
              lesson_type: data.lesson_type as "explanation" | "vocabulary" | "dialogue" | "reading" | "listening",
            });
          }
        } catch (err: any) {
          console.error("Gagal memuat data pelajaran:", err.message);
          setError("Gagal memuat data pelajaran");
        }
      }
    };

    loadLessonForEdit();
  }, [modal.isOpen, modal.modalType, modal.mode, modal.data?.id]);

  // STEP 6 Part 2: Load exercise data when modal opens in edit mode
  useEffect(() => {
    const loadExerciseForEdit = async () => {
      if (modal.isOpen && modal.modalType === 'exercise' && modal.mode === 'edit' && modal.data?.id) {
        try {
          const { data, error } = await supabase
            .from("exercise_sets")
            .select("*")
            .eq("id", modal.data.id)
            .single();

          if (error) throw error;
          if (data) {
            setNewExercise({
              title: data.title || "",
              description: data.description || "",
              exercise_type: data.exercise_type as "mcq" | "essay" | "puzzle",
              question_count: data.question_count || 0,
              ai_feedback_enabled: data.ai_feedback_enabled || false,
              ai_feedback_type: data.ai_feedback_type || "instant",
            });
          }
        } catch (err: any) {
          console.error("Gagal memuat data latihan:", err.message);
          setError("Gagal memuat data latihan");
        }
      }
    };

    loadExerciseForEdit();
  }, [modal.isOpen, modal.modalType, modal.mode, modal.data?.id]);

  // STEP 6 Part 2: Track lesson dirty state when form changes
  useEffect(() => {
    if (modal.isOpen && modal.modalType === 'lesson') {
      if (modal.mode === 'create') {
        // In create mode, dirty if title has content
        modal.setDirty(!!newLesson.title.trim());
      } else if (modal.mode === 'edit' && modal.data?.id) {
        // In edit mode, compare with original - if any field changed, mark as dirty
        const isChanged = newLesson.title.trim() !== "" || newLesson.description !== "" || newLesson.content !== "";
        modal.setDirty(isChanged);
      }
    }
  }, [newLesson, modal, modal.isOpen, modal.modalType, modal.mode, modal.data?.id]);

  // STEP 6 Part 2: Track exercise dirty state when form changes
  useEffect(() => {
    if (modal.isOpen && modal.modalType === 'exercise') {
      if (modal.mode === 'create') {
        // In create mode, dirty if title has content
        modal.setDirty(!!newExercise.title.trim());
      } else if (modal.mode === 'edit' && modal.data?.id) {
        // In edit mode, compare with original - if any field changed, mark as dirty
        const isChanged = newExercise.title.trim() !== "" || newExercise.description !== "";
        modal.setDirty(isChanged);
      }
    }
  }, [newExercise, modal, modal.isOpen, modal.modalType, modal.mode, modal.data?.id]);

  // STEP 6 Part 2: Reset forms when modal closes
  useEffect(() => {
    if (!modal.isOpen) {
      // Reset lesson form
      setNewLesson({
        title: "",
        description: "",
        content: "",
        lesson_type: "explanation",
      });
      // Reset exercise form
      setNewExercise({
        title: "",
        description: "",
        exercise_type: "mcq",
        question_count: 0,
        ai_feedback_enabled: false,
        ai_feedback_type: "instant",
      });
      setError("");
    }
  }, [modal.isOpen]);





  // Handle module drag end
  const handleModuleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = modules.findIndex((m) => m.id === active.id);
      const newIndex = modules.findIndex((m) => m.id === over.id);

      const newModules = arrayMove(modules, oldIndex, newIndex);
      setModules(newModules);

      try {
        const updates = newModules.map((mod, idx) => ({
          id: mod.id,
          order_index: idx,
        }));

        // Use temporary offset to avoid constraint violation
        const TEMP_OFFSET = 10000;

        // Step 1: Update all to temporary values
        for (const update of updates) {
          const { error } = await supabase
            .from("course_modules")
            .update({ order_index: TEMP_OFFSET + update.order_index })
            .eq("id", update.id);

          if (error) throw error;
        }

        // Step 2: Update all to final values
        for (const update of updates) {
          const { error } = await supabase
            .from("course_modules")
            .update({ order_index: update.order_index })
            .eq("id", update.id);

          if (error) throw error;
        }

        setSuccess("Urutan modul diperbarui!");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err: any) {
        setError(err.message || "Gagal memperbarui urutan modul");
        setModules(modules);
      }
    }
  };

  // Handle lesson drag end
  const handleLessonDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex((l) => l.id === active.id);
      const newIndex = lessons.findIndex((l) => l.id === over.id);

      const newLessons = arrayMove(lessons, oldIndex, newIndex);
      setLessons(newLessons);

      try {
        const updates = newLessons.map((lesson, idx) => ({
          id: lesson.id,
          order_index: idx,
        }));

        // Use temporary offset to avoid constraint violation
        const TEMP_OFFSET = 10000;

        // Step 1: Update all to temporary values
        for (const update of updates) {
          const { error } = await supabase
            .from("module_lessons")
            .update({ order_index: TEMP_OFFSET + update.order_index })
            .eq("id", update.id);

          if (error) throw error;
        }

        // Step 2: Update all to final values
        for (const update of updates) {
          const { error } = await supabase
            .from("module_lessons")
            .update({ order_index: update.order_index })
            .eq("id", update.id);

          if (error) throw error;
        }

        setSuccess("Urutan pelajaran diperbarui!");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err: any) {
        setError(err.message || "Gagal memperbarui urutan pelajaran");
        setLessons(lessons);
      }
    }
  };

  // Handle material drag end
  const handleMaterialDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = materials.findIndex((m) => m.id === active.id);
      const newIndex = materials.findIndex((m) => m.id === over.id);

      const newMaterials = arrayMove(materials, oldIndex, newIndex);
      setMaterials(newMaterials);

      try {
        const updates = newMaterials.map((material, idx) => ({
          id: material.id,
          order_index: idx,
        }));

        // Use temporary offset to avoid constraint violation
        const TEMP_OFFSET = 10000;

        // Step 1: Update all to temporary values
        for (const update of updates) {
          const { error } = await supabase
            .from("module_materials")
            .update({ order_index: TEMP_OFFSET + update.order_index })
            .eq("id", update.id);

          if (error) throw error;
        }

        // Step 2: Update all to final values
        for (const update of updates) {
          const { error } = await supabase
            .from("module_materials")
            .update({ order_index: update.order_index })
            .eq("id", update.id);

          if (error) throw error;
        }

        setSuccess("Urutan bahan diperbarui!");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err: any) {
        setError(err.message || "Gagal memperbarui urutan bahan");
        setMaterials(materials);
      }
    }
  };

  const handleAddModule = async () => {
    if (!newModule.title.trim()) {
      setError("Judul modul diperlukan");
      return;
    }

    try {
      setError("");
      const orderIndex = modules.length;

      const { data, error: insertError } = await supabase
        .from("course_modules")
        .insert({
          course_id: courseId,
          title: newModule.title,
          description: newModule.description,
          order_index: orderIndex,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setModules([...modules, data]);
      setSelectedModuleId(data.id);
      setNewModule({ title: "", description: "" });
      setSuccess("Modul berhasil dibuat!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal membuat modul");
    }
  };

  // STEP 8: Edit module handler
  const handleEditModule = async () => {
    if (!newModule.title.trim()) {
      setError("Judul modul diperlukan");
      return;
    }

    if (!editingModuleId) {
      setError("ID modul tidak ditemukan");
      return;
    }

    try {
      setError("");
      const { error: updateError } = await supabase
        .from("course_modules")
        .update({
          title: newModule.title,
          description: newModule.description,
        })
        .eq("id", editingModuleId);

      if (updateError) throw updateError;

      // Update local state
      const updatedModules = modules.map((m) =>
        m.id === editingModuleId
          ? { ...m, title: newModule.title, description: newModule.description }
          : m
      );
      setModules(updatedModules);
      setNewModule({ title: "", description: "" });
      setEditingModuleId(null);
      setShowModuleModal(false);
      setSuccess("Modul berhasil diperbarui!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui modul");
    }
  };

  // STEP 3: Modal handlers for lesson
  const handleSaveLessonFromModal = async () => {
    if (!newLesson.title.trim()) {
      setError("Judul pelajaran diperlukan");
      return;
    }

    // For create mode, need moduleId; for edit mode, already have lessonId
    const moduleId = modal.mode === 'create' ? modal.data?.moduleId : undefined;
    if (modal.mode === 'create' && !moduleId) {
      setError("Modul harus dipilih untuk membuat pelajaran baru");
      return;
    }

    try {
      setIsSavingLesson(true);
      setError("");

      // If editing an existing lesson
      if (modal.mode === 'edit' && modal.data?.id) {
        const { error: updateError } = await supabase
          .from("module_lessons")
          .update({
            title: newLesson.title,
            description: newLesson.description,
            content: newLesson.content,
            lesson_type: newLesson.lesson_type,
          })
          .eq("id", modal.data!.id);

        if (updateError) throw updateError;

        // Update local state
        const updatedLessons = lessons.map((l) =>
          l.id === modal.data!.id
            ? {
                ...l,
                title: newLesson.title,
                description: newLesson.description,
                content: newLesson.content,
                lesson_type: newLesson.lesson_type as "explanation" | "vocabulary" | "dialogue" | "reading" | "listening",
              }
            : l
        );
        setLessons(updatedLessons);
        setSuccess("Pelajaran berhasil diperbarui!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        // Creating new lesson
        const orderIndex = lessons.length;

        const { data, error: insertError } = await supabase
          .from("module_lessons")
          .insert({
            module_id: moduleId,
            title: newLesson.title,
            description: newLesson.description,
            content: newLesson.content,
            lesson_type: newLesson.lesson_type,
            order_index: orderIndex,
            is_active: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setLessons([...lessons, data]);
        setSuccess("Pelajaran berhasil ditambahkan!");
        setTimeout(() => setSuccess(""), 3000);
      }

      // Reset form and close modal
      setNewLesson({
        title: "",
        description: "",
        content: "",
        lesson_type: "explanation",
      });
      modal.setDirty(false);
      modal.closeModal();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan pelajaran");
    } finally {
      setIsSavingLesson(false);
    }
  };

  // STEP 4: Modal handlers for exercise
  const handleSaveExerciseFromModal = async () => {
    if (!newExercise.title.trim()) {
      setError("Judul latihan diperlukan");
      return;
    }

    // For create mode, need lessonId; for edit mode, already have exerciseId
    const lessonId = modal.mode === 'create' ? modal.data?.lessonId : undefined;
    if (modal.mode === 'create' && !lessonId) {
      setError("Pelajaran harus dipilih untuk membuat latihan baru");
      return;
    }

    try {
      setIsSavingExercise(true);
      setError("");

      // If editing an existing exercise
      if (modal.mode === 'edit' && modal.data?.id) {
        const { error: updateError } = await supabase
          .from("exercise_sets")
          .update({
            title: newExercise.title,
            description: newExercise.description,
            exercise_type: newExercise.exercise_type,
            question_count: newExercise.question_count,
            ai_feedback_enabled: newExercise.ai_feedback_enabled,
            ai_feedback_type: newExercise.ai_feedback_type,
          })
          .eq("id", modal.data!.id);

        if (updateError) throw updateError;

        setSuccess("Latihan berhasil diperbarui!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        // Creating new exercise
        const orderIndex = 0;

        const { data, error: insertError } = await supabase
          .from("exercise_sets")
          .insert({
            lesson_id: lessonId,
            title: newExercise.title,
            description: newExercise.description,
            exercise_type: newExercise.exercise_type,
            question_count: newExercise.question_count,
            ai_feedback_enabled: newExercise.ai_feedback_enabled,
            ai_feedback_type: newExercise.ai_feedback_type,
            order_index: orderIndex,
            is_active: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setSuccess("Latihan berhasil ditambahkan!");
        setTimeout(() => setSuccess(""), 3000);
      }

      // Reset form and close modal
      setNewExercise({
        title: "",
        description: "",
        exercise_type: "mcq",
        question_count: 0,
        ai_feedback_enabled: false,
        ai_feedback_type: "instant",
      });
      modal.setDirty(false);
      modal.closeModal();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan latihan");
    } finally {
      setIsSavingExercise(false);
    }
  };

  // STEP 6: Delete lesson with confirmation
  const handleDeleteLessonFromTree = async (lessonId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pelajaran ini? Data tidak dapat dipulihkan.")) {
      return;
    }

    try {
      setError("");
      const { error } = await supabase
        .from("module_lessons")
        .delete()
        .eq("id", lessonId);

      if (error) throw error;

      setLessons(lessons.filter((l) => l.id !== lessonId));
      setSuccess("Pelajaran berhasil dihapus!");
      setTimeout(() => setSuccess(""), 3000);
      modal.closeModal();
    } catch (err: any) {
      setError(err.message || "Gagal menghapus pelajaran");
    }
  };

  // STEP 6: Delete exercise with confirmation
  const handleDeleteExerciseFromTree = async (exerciseId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus latihan ini? Data tidak dapat dipulihkan.")) {
      return;
    }

    try {
      setError("");
      const { error } = await supabase
        .from("exercise_sets")
        .delete()
        .eq("id", exerciseId);

      if (error) throw error;

      setSuccess("Latihan berhasil dihapus!");
      setTimeout(() => setSuccess(""), 3000);
      modal.closeModal();
    } catch (err: any) {
      setError(err.message || "Gagal menghapus latihan");
    }
  };

  // Check if lesson is locked (only locked in student view, not in teacher edit)
  const isLessonLocked = (index: number): boolean => {
    return false; // Teacher can edit all lessons - locking is only for students
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

  const dndContextKey = activeTab === "lessons" ? "lessons" : "materials";

  return (
    <>
      <CourseDashboard
        course={course}
        modules={modules}
        lessons={lessons}
        materials={materials}
        exercises={exercises}
        courseId={courseId}
        user={user}
        onCreateModule={() => {
          setModalState({
            isOpen: true,
            type: "module",
            mode: "create",
          });
        }}
        onEditModule={async (moduleData) => {
          try {
            const { error } = await supabase
              .from("course_modules")
              .update({
                title: moduleData.title,
                description: moduleData.description,
                is_active: moduleData.is_active,
                updated_at: new Date().toISOString(),
              })
              .eq("id", moduleData.id);

            if (error) throw error;
            setModules(modules.map(m => 
              m.id === moduleData.id ? { ...m, ...moduleData, updated_at: new Date().toISOString() } : m
            ));
            setSuccess("Modul berhasil diperbarui!");
            setTimeout(() => setSuccess(""), 3000);
          } catch (err: any) {
            console.error("Module update error:", err);
            setError(err.message || "Gagal memperbarui modul");
          }
        }}
        onDeleteModule={async (moduleId) => {
          if (!window.confirm("Apakah Anda yakin ingin menghapus modul ini? Semua konten di dalamnya akan dihapus.")) {
            return;
          }
          try {
            const { error } = await supabase
              .from("course_modules")
              .delete()
              .eq("id", moduleId);

            if (error) throw error;
            setModules(modules.filter(m => m.id !== moduleId));
            setSuccess("Modul berhasil dihapus!");
            setTimeout(() => setSuccess(""), 3000);
          } catch (err: any) {
            console.error("Module delete error:", err);
            setError(err.message || "Gagal menghapus modul");
          }
        }}
        onCreateLesson={(moduleId) => {
          setModalState({
            isOpen: true,
            type: "lesson",
            mode: "create",
            initialData: { module_id: moduleId },
          });
        }}
        onCreateMaterial={(moduleId) => {
          setModalState({
            isOpen: true,
            type: "material",
            mode: "create",
            initialData: { module_id: moduleId },
          });
        }}
        onCreateExercise={() => {}} // Disabled - exercises managed at lesson level
        onEditLesson={async (lessonData) => {
          try {
            const { error } = await supabase
              .from("module_lessons")
              .update({
                title: lessonData.title,
                description: lessonData.description,
                content: lessonData.content,
                lesson_type: lessonData.lesson_type || "explanation",
                is_active: lessonData.is_active,
                updated_at: new Date().toISOString(),
              })
              .eq("id", lessonData.id);

            if (error) throw error;
            setLessons(lessons.map(l => 
              l.id === lessonData.id ? { ...l, ...lessonData, updated_at: new Date().toISOString() } : l
            ));
            setSuccess("Pelajaran berhasil diperbarui!");
            setTimeout(() => setSuccess(""), 3000);
          } catch (err: any) {
            console.error("Lesson update error:", err);
            setError(err.message || "Gagal memperbarui pelajaran");
          }
        }}
        onEditMaterial={async (materialData) => {
          try {
            const { error } = await supabase
              .from("course_materials")
              .update({
                title: materialData.title,
                description: materialData.description,
                material_type: materialData.material_type,
                material_url: materialData.file_url,
                material_content: materialData.external_url,
                is_active: materialData.is_active,
                updated_at: new Date().toISOString(),
              })
              .eq("id", materialData.id);

            if (error) throw error;
            setMaterials(materials.map(m => 
              m.id === materialData.id ? { ...m, ...materialData, updated_at: new Date().toISOString() } : m
            ));
            setSuccess("Materi berhasil diperbarui!");
            setTimeout(() => setSuccess(""), 3000);
          } catch (err: any) {
            console.error("Material update error:", err);
            setError(err.message || "Gagal memperbarui materi");
          }
        }}
        onEditExercise={async (exerciseData) => {
          try {
            // Fetch complete course exercise data with questions and options
            const { data: completeExercise, error: fetchError } = await supabase
              .from("course_exercises")
              .select(`
                *,
                course_questions (
                  *,
                  course_options (*)
                )
              `)
              .eq("id", exerciseData.id)
              .single();

            if (fetchError) throw fetchError;

            // Open ExerciseBuilderModal with complete data for editing
            setEditingExercise(completeExercise);
            setShowExerciseBuilder(true);
          } catch (err: any) {
            console.error("Exercise edit error:", err);
            
            // Better error handling for different error structures
            let errorMessage = "Gagal memuat data latihan";
            
            if (err && typeof err === 'object') {
              // Handle Supabase error structure
              if (err.message) {
                errorMessage = err.message;
              } else if (err.error) {
                errorMessage = err.error;
              } else if (err.details) {
                errorMessage = err.details;
              } else {
                // If error object is empty or has no message, try to stringify it
                errorMessage = JSON.stringify(err);
              }
            } else if (typeof err === 'string') {
              errorMessage = err;
            }
            
            setError(errorMessage);
          }
        }}
        onDeleteLesson={async (lessonId) => {
          if (!window.confirm("Apakah Anda yakin ingin menghapus pelajaran ini?")) {
            return;
          }
          try {
            const { error } = await supabase
              .from("module_lessons")
              .delete()
              .eq("id", lessonId);

            if (error) throw error;
            setLessons(lessons.filter(l => l.id !== lessonId));
            setSuccess("Pelajaran berhasil dihapus!");
            setTimeout(() => setSuccess(""), 3000);
          } catch (err: any) {
            setError(err.message || "Gagal menghapus pelajaran");
          }
        }}
        onDeleteMaterial={async (materialId) => {
          if (!window.confirm("Apakah Anda yakin ingin menghapus materi ini?")) {
            return;
          }
          try {
            const { error } = await supabase
              .from("course_materials")
              .delete()
              .eq("id", materialId);

            if (error) throw error;
            setMaterials(materials.filter(m => m.id !== materialId));
            setSuccess("Materi berhasil dihapus!");
            setTimeout(() => setSuccess(""), 3000);
          } catch (err: any) {
            setError(err.message || "Gagal menghapus materi");
          }
        }}
        onDeleteExercise={async (exerciseId) => {
          if (!window.confirm("Apakah Anda yakin ingin menghapus latihan ini? Semua data terkait (pertanyaan, pilihan jawaban, dan jawaban siswa) akan dihapus juga.")) {
            return;
          }
          try {
            setError("");
            
            // Step 1: Delete student answers first
            // Note: course_student_answers uses course_exercise_id, not question_id
            const { error: studentAnswersError } = await supabase
              .from("course_student_answers")
              .delete()
              .eq("course_exercise_id", exerciseId);
            
            if (studentAnswersError) {
              console.warn("Warning: Failed to delete student answers:", studentAnswersError);
              // Continue anyway, might not have student answers
            }
            
            // Step 2: Delete course options
            const questionsData = await supabase
              .from("course_questions")
              .select("id")
              .eq("exercise_id", exerciseId);
            
            const { error: optionsError } = await supabase
              .from("course_options")
              .delete()
              .in("question_id", 
                questionsData.data?.map(q => q.id) || []
              );
            
            if (optionsError) {
              console.warn("Warning: Failed to delete options:", optionsError);
              // Continue anyway, might not have options
            }
            
            // Step 3: Delete course questions
            const { error: questionsError } = await supabase
              .from("course_questions")
              .delete()
              .eq("exercise_id", exerciseId);
            
            if (questionsError) {
              console.warn("Warning: Failed to delete questions:", questionsError);
              // Continue anyway, might not have questions
            }
            
            // Step 4: Finally delete the exercise
            const { error } = await supabase
              .from("course_exercises")
              .delete()
              .eq("id", exerciseId);

            if (error) throw error;
            
            setExercises(exercises.filter(e => e.id !== exerciseId));
            setSuccess("Latihan berhasil dihapus!");
            setTimeout(() => setSuccess(""), 3000);
          } catch (err: any) {
            console.error("Delete exercise error:", err);
            console.error("Error type:", typeof err);
            console.error("Error keys:", err ? Object.keys(err) : 'null');
            
            // Enhanced error handling for different error structures
            let errorMessage = "Gagal menghapus latihan";
            
            if (err) {
              if (typeof err === 'object') {
                // Handle Supabase error structure
                if (err.message) {
                  errorMessage = err.message;
                } else if (err.error) {
                  errorMessage = err.error;
                } else if (err.details) {
                  errorMessage = err.details;
                } else if (err.error_description) {
                  errorMessage = err.error_description;
                } else {
                  // If error object is empty or has no message, try to stringify it
                  const errorStr = JSON.stringify(err, null, 2);
                  errorMessage = errorStr !== '{}' ? errorStr : "Terjadi kesalahan tak terduga saat menghapus latihan";
                }
              } else if (typeof err === 'string') {
                errorMessage = err;
              } else {
                errorMessage = `Terjadi kesalahan tak terduga: ${String(err)}`;
              }
            } else {
              errorMessage = "Terjadi kesalahan tak terduga saat menghapus latihan";
            }
            
            setError(errorMessage);
          }
        }}
        onPreviewLesson={(lesson) => {
          setPreviewItem({ item: lesson, type: "lesson" });
        }}
        onPreviewMaterial={(material) => {
          setPreviewItem({ item: material, type: "material" });
        }}
        onPreviewExercise={(exercise) => {
          setPreviewItem({ item: exercise, type: "exercise" });
        }}
        onAddModule={async (moduleData) => {
          try {
            const { data: result, error } = await supabase
              .from("course_modules")
              .insert({
                title: moduleData.title,
                description: moduleData.description,
                course_id: courseId,
                module_type: "module",
                order_index: modules.length + 1,
                is_active: moduleData.is_active,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (error) throw error;
            setModules([...modules, result]);
            setSuccess("Modul berhasil dibuat!");
            setTimeout(() => setSuccess(""), 3000);
          } catch (err: any) {
            setError(err.message || "Gagal membuat modul");
          }
        }}
        onAddLesson={async (lessonData) => {
          try {
            const { data: result, error } = await supabase
              .from("module_lessons")
              .insert({
                title: lessonData.title,
                description: lessonData.description,
                content: lessonData.content,
                lesson_type: lessonData.lesson_type || "explanation",
                module_id: lessonData.module_id,
                order_index: lessons.length + 1,
                is_active: lessonData.is_active,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (error) throw error;
            setLessons([...lessons, result]);
            setSuccess("Pelajaran berhasil dibuat!");
            setTimeout(() => setSuccess(""), 3000);
          } catch (err: any) {
            setError(err.message || "Gagal membuat pelajaran");
          }
        }}
        onAddMaterial={async (materialData) => {
          try {
            // Get lesson-based materials count for order
            const { data: existingMaterials } = await supabase
              .from("course_materials")
              .select("order_index")
              .eq("lesson_id", materialData.lesson_id)
              .order("order_index", { ascending: false })
              .limit(1);
            
            const nextOrderIndex = existingMaterials && existingMaterials.length > 0 
              ? existingMaterials[0].order_index + 1 
              : 1;

            const { data: result, error } = await supabase
              .from("course_materials")
              .insert({
                title: materialData.title,
                description: materialData.description,
                material_type: materialData.material_type,
                material_url: materialData.file_url,
                material_content: materialData.external_url,
                course_id: courseId,
                lesson_id: materialData.lesson_id,
                order_index: nextOrderIndex,
                is_active: materialData.is_active,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (error) throw error;
            setMaterials([...materials, result]);
            setSuccess("Materi berhasil dibuat!");
            setTimeout(() => setSuccess(""), 3000);
          } catch (err: any) {
            setError(err.message || "Gagal membuat materi");
          }
        }}
        onAddExercise={async (exerciseData) => {
          try {
            // Create lesson-based exercise
            const { data: courseExercise, error: exerciseError } = await supabase
              .from("course_exercises")
              .insert({
                title: exerciseData.title,
                description: exerciseData.description,
                course_id: courseId,
                lesson_id: exerciseData.lesson_id, // Lesson-based field
                exercise_number: exerciseData.exercise_number || 1, // Exercise 1 or 2
                exercise_type: exerciseData.exercise_type || 'multiple_choice', // Exercise type
                is_active: exerciseData.is_active,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (exerciseError) throw exerciseError;

            // Create course questions if provided
            if (exerciseData.course_questions && exerciseData.course_questions.length > 0) {
              const questionsWithExerciseId = exerciseData.course_questions.map((q: any) =>({
                exercise_id: courseExercise.id,
                pertanyaan: q.pertanyaan, // Direct field mapping
                perintah: q.perintah, // Direct field mapping
                jawaban: q.jawaban, // Direct field mapping
                jawaban_benar: q.jawaban_benar, // Direct field mapping
                question_type: q.question_type,
                points: q.points || 10,
                order_index: q.order_index || 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }));

              const { data: savedQuestions, error: questionsError } = await supabase
                .from("course_questions")
                .insert(questionsWithExerciseId)
                .select();

              if (questionsError) throw questionsError;

              // Create course options for each question (only for multiple_choice)
              for (let i = 0; i < exerciseData.course_questions.length; i++) {
                const question = exerciseData.course_questions[i];
                const savedQuestion = savedQuestions[i];

                if (question.question_type === 'multiple_choice' && question.course_options && question.course_options.length > 0) {
                  const optionsToCreate = question.course_options.map((opt: any) => ({
                    question_id: savedQuestion.id,
                    jawaban: opt.jawaban, // Direct field mapping
                    is_correct: opt.is_correct,
                    order_index: opt.order_index || 1,
                    created_at: new Date().toISOString(),
                  }));

                  const { error: optionsError } = await supabase
                    .from("course_options")
                    .insert(optionsToCreate);

                  if (optionsError) throw optionsError;
                }
              }
            }

            // Refresh exercises list with complete data
            const { data: refreshedExercises, error: refreshError } = await supabase
              .from("course_exercises")
              .select(`
                *,
                course_questions (
                  *,
                  course_options (*)
                )
              `)
              .eq("course_id", courseId)
              .order("created_at", { ascending: false });

            if (refreshError) throw refreshError;
            setExercises(refreshedExercises || []);

            setSuccess("Latihan berhasil dibuat!");
            setTimeout(() => setSuccess(""), 3000);
          } catch (err: any) {
            setError(err.message || "Gagal membuat latihan");
          }
        }}
      />

      {/* Dashboard CRUD Modal */}
      <DashboardModals
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        type={modalState.type}
        mode={modalState.mode}
        initialData={modalState.initialData}
        onSave={async (data) => {
          try {
            if (modalState.type === "module") {
              if (modalState.mode === "edit") {
                // Update existing module
                const { error } = await supabase
                  .from("course_modules")
                  .update({
                    title: data.title,
                    description: data.description,
                    is_active: data.is_active,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", data.id);

                if (error) throw error;
                setModules(modules.map(m => 
                  m.id === data.id ? { ...m, ...data, updated_at: new Date().toISOString() } : m
                ));
                setSuccess("Modul berhasil diperbarui!");
              } else {
                // Create new module
                const { data: result, error } = await supabase
                  .from("course_modules")
                  .insert({
                    course_id: courseId,
                    title: data.title,
                    description: data.description,
                    order_index: modules.length,
                    is_active: data.is_active,
                    module_type: "module",
                  })
                  .select()
                  .single();

                if (error) throw error;
                setModules([...modules, result]);
                setSuccess("Modul berhasil dibuat!");
              }
            } else if (modalState.type === "lesson") {
              if (modalState.mode === "edit") {
                // Update existing lesson
                const { error } = await supabase
                  .from("module_lessons")
                  .update({
                    title: data.title,
                    description: data.description,
                    content: data.content,
                    lesson_type: data.lesson_type || "explanation",
                    is_active: data.is_active,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", data.id);

                if (error) throw error;
                setLessons(lessons.map(l => 
                  l.id === data.id ? { ...l, ...data, updated_at: new Date().toISOString() } : l
                ));
                setSuccess("Pelajaran berhasil diperbarui!");
              } else {
                // Create new lesson
                const { data: result, error } = await supabase
                  .from("module_lessons")
                  .insert({
                    module_id: data.module_id,
                    title: data.title,
                    description: data.description,
                    content: data.content,
                    lesson_type: data.lesson_type || "explanation",
                    order_index: lessons.length,
                    is_active: data.is_active,
                  })
                  .select()
                  .single();

                if (error) throw error;
                setLessons([...lessons, result]);
                setSuccess("Pelajaran berhasil dibuat!");
              }
            } else if (modalState.type === "material") {
              if (modalState.mode === "edit") {
                // Update existing material
                const { error } = await supabase
                  .from("module_materials")
                  .update({
                    title: data.title,
                    description: data.description,
                    material_type: data.material_type,
                    source_type: data.source_type,
                    file_url: data.file_url,
                    external_url: data.external_url,
                    is_active: data.is_active,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", data.id);

                if (error) throw error;
                setMaterials(materials.map(m => 
                  m.id === data.id ? { ...m, ...data, updated_at: new Date().toISOString() } : m
                ));
                setSuccess("Materi berhasil diperbarui!");
              } else {
                // Create new material
                const { data: result, error } = await supabase
                  .from("module_materials")
                  .insert({
                    module_id: data.module_id,
                    title: data.title,
                    description: data.description,
                    material_type: data.material_type,
                    source_type: data.source_type,
                    file_url: data.file_url,
                    external_url: data.external_url,
                    order_index: materials.length,
                    is_active: data.is_active,
                  })
                  .select()
                  .single();

                if (error) throw error;
                setMaterials([...materials, result]);
                setSuccess("Materi berhasil dibuat!");
              }
            } else if (modalState.type === "exercise") {
              if (modalState.mode === "edit") {
                // Update existing exercise - use correct field names from SQL schema
                const { error } = await supabase
                  .from("exercise_sets")
                  .update({
                    judul_latihan: data.title,
                    deskripsi: data.description,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", data.id);

                if (error) throw error;
                setExercises(exercises.map(e => 
                  e.id === data.id ? { 
                    ...e, 
                    judul_latihan: data.title, 
                    deskripsi: data.description,
                    updated_at: new Date().toISOString() 
                  } : e
                ));
                setSuccess("Latihan berhasil diperbarui!");
              } else {
                // Create new exercise - use correct field names from SQL schema
                const { data: result, error } = await supabase
                  .from("exercise_sets")
                  .insert({
                    judul_latihan: data.title,
                    deskripsi: data.description,
                    kelas_id: courseId, // Using course_id as kelas_id for now
                    pembuat_id: user?.id,
                    is_active: true,
                    pertemuan: 1,
                  })
                  .select()
                  .single();

                if (error) throw error;
                setExercises([...exercises, result]);
                setSuccess("Latihan berhasil dibuat!");
              }
            }

            setTimeout(() => setSuccess(""), 3000);
          } catch (err: any) {
            setError(err.message || "Gagal menyimpan data");
          }
        }}
        moduleId={selectedModuleId || undefined}
        courseId={courseId}
      />

      {/* Exercise Builder Modal */}
      {showExerciseBuilder && (
        <ExerciseBuilderModal
          isOpen={showExerciseBuilder}
          onClose={() => {
            setShowExerciseBuilder(false);
            setEditingExercise(null);
          }}
          onSave={async (data: any) => {
            if (editingExercise) {
              // Update existing course exercise with questions and options
              try {
                // Update exercise basic info
                const { error: exerciseError } = await supabase
                  .from("course_exercises")
                  .update({
                    title: data.title,
                    description: data.description,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", editingExercise.id);

                if (exerciseError) throw exerciseError;

                // Delete existing questions and options
                const { error: deleteQuestionsError } = await supabase
                  .from("course_questions")
                  .delete()
                  .eq("exercise_id", editingExercise.id);

                if (deleteQuestionsError) throw deleteQuestionsError;

                // Then insert new questions and options (direct field mapping)
                const questionsWithExerciseId = data.course_questions.map((q: any) => ({
                  exercise_id: editingExercise.id,
                  pertanyaan: q.pertanyaan, // Direct field mapping
                  perintah: q.perintah, // Direct field mapping
                  jawaban: q.jawaban, // Direct field mapping
                  jawaban_benar: q.jawaban_benar, // Direct field mapping
                  question_type: q.question_type,
                  points: q.points || 10,
                  order_index: q.order_index || 1,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }));

                const { data: savedQuestions, error: questionsError } = await supabase
                  .from("course_questions")
                  .insert(questionsWithExerciseId)
                  .select();

                if (questionsError) throw questionsError;

                // Create options for each question (only for multiple_choice)
                for (let i = 0; i < data.course_questions.length; i++) {
                  const question = data.course_questions[i];
                  const savedQuestion = savedQuestions[i];

                  if (question.question_type === 'multiple_choice' && question.course_options && question.course_options.length > 0) {
                    const optionsToCreate = question.course_options.map((opt: any) => ({
                      question_id: savedQuestion.id,
                      jawaban: opt.jawaban, // Direct field mapping
                      is_correct: opt.is_correct,
                      order_index: opt.order_index || 1,
                      created_at: new Date().toISOString(),
                    }));

                    const { error: optionsError } = await supabase
                      .from("course_options")
                      .insert(optionsToCreate);

                    if (optionsError) throw optionsError;
                  }
                }

                // Refresh exercises list with complete data
                const { data: refreshedExercises, error: refreshError } = await supabase
                  .from("course_exercises")
                  .select(`
                    *,
                    course_questions (
                      *,
                      course_options (*)
                    )
                  `)
                  .eq("course_id", courseId)
                  .order("created_at", { ascending: false });

                if (refreshError) throw refreshError;
                setExercises(refreshedExercises || []);
                
                setSuccess("Latihan berhasil diperbarui!");
                setTimeout(() => setSuccess(""), 3000);
              } catch (err: any) {
                setError(err.message || "Gagal memperbarui latihan");
              }
            } else {
              // Create new course exercise (use custom course tables)
              // Create course exercise first
              const { data: courseExercise, error: exerciseError } = await supabase
                .from("course_exercises")
                .insert({
                  title: data.title,
                  description: data.description,
                  course_id: courseId,
                  is_active: data.is_active,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select()
                .single();

              if (exerciseError) throw exerciseError;

              // Create course questions if provided
              if (data.course_questions && data.course_questions.length > 0) {
                const questionsWithExerciseId = data.course_questions.map((q: any) =>({
                  exercise_id: courseExercise.id,
                  pertanyaan: q.pertanyaan, // Direct field mapping
                  perintah: q.perintah, // Direct field mapping
                  jawaban: q.jawaban, // Direct field mapping
                  jawaban_benar: q.jawaban_benar, // Direct field mapping
                  question_type: q.question_type,
                  points: q.points || 10,
                  order_index: q.order_index || 1,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }));

                const { data: savedQuestions, error: questionsError } = await supabase
                  .from("course_questions")
                  .insert(questionsWithExerciseId)
                  .select();

                if (questionsError) throw questionsError;

                // Create course options for each question (only for multiple_choice)
                for (let i = 0; i < data.course_questions.length; i++) {
                  const question = data.course_questions[i];
                  const savedQuestion = savedQuestions[i];

                  if (question.question_type === 'multiple_choice' && question.course_options && question.course_options.length > 0) {
                    const optionsToCreate = question.course_options.map((opt: any) => ({
                      question_id: savedQuestion.id,
                      jawaban: opt.jawaban, // Direct field mapping
                      is_correct: opt.is_correct,
                      order_index: opt.order_index || 1,
                      created_at: new Date().toISOString(),
                    }));

                    const { error: optionsError } = await supabase
                      .from("course_options")
                      .insert(optionsToCreate);

                    if (optionsError) throw optionsError;
                  }
                }
              }

              // Refresh exercises list with complete data
              const { data: refreshedExercises, error: refreshError } = await supabase
                .from("course_exercises")
                .select(`
                  *,
                  course_questions (
                    *,
                    course_options (*)
                  )
                `)
                .eq("course_id", courseId)
                .order("created_at", { ascending: false });

              if (refreshError) throw refreshError;
              setExercises(refreshedExercises || []);
              
              setSuccess("Latihan berhasil dibuat!");
              setTimeout(() => setSuccess(""), 3000);
            }
          }}
          initialData={editingExercise}
          mode={editingExercise ? "edit" : "create"}
        />
      )}

      {/* Preview Modal */}
      {previewItem && (
        <SimplePreview
          item={previewItem.item}
          itemType={previewItem.type}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </>
  );
}

// Helper functions
function getLessonIcon(type: string): React.ReactElement {
  const iconProps = { className: "h-4 w-4", style: { color: "#E8B824" } };
  switch (type) {
    case "explanation":
      return <Lightbulb {...iconProps} />;
    case "vocabulary":
      return <BookMarked {...iconProps} />;
    case "dialogue":
      return <MessageCircle {...iconProps} />;
    case "reading":
      return <FileText {...iconProps} />;
    case "listening":
      return <Headphones {...iconProps} />;
    default:
      return <BookOpen {...iconProps} />;
  }
}

function getMaterialIcon(type: string): React.ReactElement {
  const iconProps = { className: "h-4 w-4", style: { color: "#E87835" } };
  switch (type) {
    case "video":
      return <Video {...iconProps} />;
    case "audio":
      return <Music {...iconProps} />;
    case "pdf":
      return <FileText {...iconProps} />;
    case "image":
      return <Image {...iconProps} />;
    case "resource":
      return <Link2 {...iconProps} />;
    default:
      return <Upload {...iconProps} />;
  }
}

  // Extract YouTube ID from URL
function extractYouTubeId(url: string): string | null {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    return match[2];
  }
  return null;
}

// Main export with ModalProvider wrapper
export default function ModuleEditorPageWrapper() {
  return (
    <ModalProvider>
      <ModuleEditorPage />
    </ModalProvider>
  );
}
