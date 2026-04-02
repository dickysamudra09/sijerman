"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LessonContentEditor } from "@/components/LessonContentEditor";
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
  getLessonIcon,
}: {
  lesson: ModuleLesson;
  index: number;
  isSelected: boolean;
  isLocked: boolean;
  onSelect: (id: string) => void;
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
      onClick={() => !isLocked && onSelect(lesson.id)}
      className={`rounded-lg p-3 transition-all flex items-start gap-2 ${
        isLocked ? "cursor-not-allowed" : "cursor-pointer"
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
        <ChevronRight
          className="h-4 w-4 flex-shrink-0 mt-1"
          style={{
            color: isSelected ? "#1A1A1A" : "#999999",
          }}
        />
      )}
    </div>
  );
}

// Sortable Material Item Component
function SortableMaterialItem({
  material,
  index,
  isSelected,
  onSelect,
  getMaterialIcon,
}: {
  material: ModuleMaterial;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
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
        border: `1px solid ${isSelected ? "#D45F3D" : "#E5E5E5"}`,
      }}
      onClick={() => onSelect(material.id)}
      className="rounded-lg p-3 cursor-pointer transition-all flex items-start gap-2"
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
          <div
            className="text-xs font-bold uppercase tracking-wide"
            style={{
              color: isSelected ? "#1A1A1A" : "#999999",
            }}
          >
            {material.material_type}
          </div>
          <p
            className="text-sm font-semibold line-clamp-2"
            style={{
              color: isSelected ? "#1A1A1A" : "#1A1A1A",
            }}
          >
            {material.title}
          </p>
        </div>
      </div>

      <ChevronRight
        className="h-4 w-4 flex-shrink-0 mt-1"
        style={{
          color: isSelected ? "#1A1A1A" : "#999999",
        }}
      />
    </div>
  );
}

export default function ModuleEditorPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const moduleId = params.moduleId as string;

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessons, setLessons] = useState<ModuleLesson[]>([]);
  const [materials, setMaterials] = useState<ModuleMaterial[]>([]);
  const [studentProgress, setStudentProgress] = useState<
    Record<string, StudentLessonProgress>
  >({});

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activeTab, setActiveTab] = useState<"lessons" | "materials">("lessons");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);

  // Module form state
  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
  });

  // Lesson form state
  const [newLesson, setNewLesson] = useState<{
    title: string;
    description: string;
    content: string;
    lesson_type: "explanation" | "vocabulary" | "dialogue" | "reading" | "listening";
  }>({
    title: "",
    description: "",
    content: "",
    lesson_type: "explanation",
  });

  // Material form state
  const [newMaterial, setNewMaterial] = useState<{
    title: string;
    description: string;
    material_type: "video" | "audio" | "pdf" | "image" | "resource";
    source_type: "upload" | "youtube_link" | "external_link";
    file_url: string;
    external_url: string;
  }>({
    title: "",
    description: "",
    material_type: "video",
    source_type: "upload",
    file_url: "",
    external_url: "",
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

  // Fetch lessons and materials for selected module
  useEffect(() => {
    const fetchModuleContent = async () => {
      if (!selectedModuleId) {
        setLessons([]);
        setMaterials([]);
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

        const { data: materialsData, error: materialsError } = await supabase
          .from("module_materials")
          .select("*")
          .eq("module_id", selectedModuleId)
          .order("order_index", { ascending: true });

        if (materialsError) throw materialsError;
        setMaterials(materialsData || []);
      } catch (err: any) {
        setError(err.message || "Gagal mengambil konten modul");
      }
    };

    fetchModuleContent();
  }, [selectedModuleId]);

  // Auto-populate lesson form when a lesson is selected
  useEffect(() => {
    if (selectedLessonId && activeTab === "lessons") {
      const selectedLesson = lessons.find((l) => l.id === selectedLessonId);
      if (selectedLesson) {
        setNewLesson({
          title: selectedLesson.title,
          description: selectedLesson.description,
          content: selectedLesson.content,
          lesson_type: selectedLesson.lesson_type,
        });
      }
    } else if (!selectedLessonId) {
      // Reset form when deselected
      setNewLesson({
        title: "",
        description: "",
        content: "",
        lesson_type: "explanation",
      });
    }
  }, [selectedLessonId, activeTab, lessons]);

  // Auto-populate material form when a material is selected
  useEffect(() => {
    if (selectedMaterialId && activeTab === "materials") {
      const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);
      if (selectedMaterial) {
        setNewMaterial({
          title: selectedMaterial.title,
          description: selectedMaterial.description,
          material_type: selectedMaterial.material_type,
          source_type: selectedMaterial.source_type,
          file_url: selectedMaterial.file_url || "",
          external_url: selectedMaterial.external_url || "",
        });
      }
    } else if (!selectedMaterialId) {
      // Reset form when deselected
      setNewMaterial({
        title: "",
        description: "",
        material_type: "video",
        source_type: "upload",
        file_url: "",
        external_url: "",
      });
    }
  }, [selectedMaterialId, activeTab, materials]);

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

  // Handle add module
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

  // Handle add/update lesson
  const handleAddLesson = async () => {
    if (!newLesson.title.trim() || !selectedModuleId) {
      setError(
        !newLesson.title.trim()
          ? "Judul pelajaran diperlukan"
          : "Pilih modul terlebih dahulu"
      );
      return;
    }

    try {
      setError("");
      const currentModuleId = selectedModuleId;

      // If editing an existing lesson
      if (selectedLessonId) {
        const { error: updateError } = await supabase
          .from("module_lessons")
          .update({
            title: newLesson.title,
            description: newLesson.description,
            content: newLesson.content,
            lesson_type: newLesson.lesson_type,
          })
          .eq("id", selectedLessonId);

        if (updateError) throw updateError;

        // Update local state
        const updatedLessons = lessons.map((l) =>
          l.id === selectedLessonId
            ? {
                ...l,
                title: newLesson.title,
                description: newLesson.description,
                content: newLesson.content,
                lesson_type: newLesson.lesson_type,
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
            module_id: currentModuleId,
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
        setNewLesson({
          title: "",
          description: "",
          content: "",
          lesson_type: "explanation",
        });
        setSelectedLessonId(null);
        setSuccess("Pelajaran berhasil ditambahkan!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan pelajaran");
    }
  };

  // Handle add/update material
  const handleAddMaterial = async () => {
    if (!newMaterial.title.trim() || !selectedModuleId) {
      setError(
        !newMaterial.title.trim()
          ? "Judul bahan diperlukan"
          : "Pilih modul terlebih dahulu"
      );
      return;
    }

    try {
      setError("");
      const currentModuleId = selectedModuleId;

      // If editing an existing material
      if (selectedMaterialId) {
        const { error: updateError } = await supabase
          .from("module_materials")
          .update({
            title: newMaterial.title,
            description: newMaterial.description,
            material_type: newMaterial.material_type,
            source_type: newMaterial.source_type,
            file_url:
              newMaterial.source_type === "upload"
                ? newMaterial.file_url
                : null,
            external_url:
              newMaterial.source_type !== "upload"
                ? newMaterial.external_url
                : null,
          })
          .eq("id", selectedMaterialId);

        if (updateError) throw updateError;

        // Update local state
        const updatedMaterials = materials.map((m) =>
          m.id === selectedMaterialId
            ? {
                ...m,
                title: newMaterial.title,
                description: newMaterial.description,
                material_type: newMaterial.material_type,
                source_type: newMaterial.source_type,
                file_url:
                  newMaterial.source_type === "upload"
                    ? newMaterial.file_url
                    : null,
                external_url:
                  newMaterial.source_type !== "upload"
                    ? newMaterial.external_url
                    : null,
              }
            : m
        );
        setMaterials(updatedMaterials);
        setSuccess("Bahan berhasil diperbarui!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        // Creating new material
        const orderIndex = materials.length;

        const { data, error: insertError } = await supabase
          .from("module_materials")
          .insert({
            module_id: currentModuleId,
            title: newMaterial.title,
            description: newMaterial.description,
            material_type: newMaterial.material_type,
            source_type: newMaterial.source_type,
            file_url:
              newMaterial.source_type === "upload"
                ? newMaterial.file_url
                : null,
            external_url:
              newMaterial.source_type !== "upload"
                ? newMaterial.external_url
                : null,
            file_size_mb: null,
            duration_seconds: null,
            order_index: orderIndex,
            is_active: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setMaterials([...materials, data]);
        setNewMaterial({
          title: "",
          description: "",
          material_type: "video",
          source_type: "upload",
          file_url: "",
          external_url: "",
        });
        setSelectedMaterialId(null);
        setSuccess("Bahan berhasil ditambahkan!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan bahan");
    }
  };

  // Handle delete lesson
  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pelajaran ini?")) return;

    try {
      const { error } = await supabase
        .from("module_lessons")
        .delete()
        .eq("id", lessonId);

      if (error) throw error;

      setLessons(lessons.filter((l) => l.id !== lessonId));
      setSelectedLessonId(null);
      setSuccess("Pelajaran berhasil dihapus!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal menghapus pelajaran");
    }
  };

  // Handle delete material
  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus bahan ini?")) return;

    try {
      const { error } = await supabase
        .from("module_materials")
        .delete()
        .eq("id", materialId);

      if (error) throw error;

      setMaterials(materials.filter((m) => m.id !== materialId));
      setSelectedMaterialId(null);
      setSuccess("Bahan berhasil dihapus!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal menghapus bahan");
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#FFFFFC" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: "rgba(26, 26, 26, 0.95)",
          borderBottomColor: "#333333",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ color: "#E8B824" }}>
            {course?.title}
          </h1>
          <Button
            onClick={() => router.push(`/home/teacher?tab=open-courses`)}
            className="font-semibold"
            style={{
              backgroundColor: "#E8B824",
              color: "#1A1A1A",
            }}
          >
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 w-full">
        {/* Left Sidebar - Modules */}
        <div
          className="w-80 border-r p-6 overflow-y-auto"
          style={{
            borderRightColor: "#E5E5E5",
            backgroundColor: "#FFFFFC",
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>
                Modul
              </h2>
              {modules.length > 0 && (
                <button
                  onClick={() => setShowModuleModal(true)}
                  className="py-2 px-4 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                  style={{
                    backgroundColor: "#E8B824",
                    color: "#1A1A1A",
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Modul Baru
                </button>
              )}
            </div>

            {modules.length === 0 ? (
              <p className="text-sm" style={{ color: "#999999" }}>
                Belum ada modul. Buat satu di bawah.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleModuleDragEnd}
              >
                <SortableContext
                  items={modules.map((m) => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {modules.map((module, index) => (
                      <div
                        key={module.id}
                        onClick={() => setSelectedModuleId(module.id)}
                        className="rounded-lg p-3 cursor-pointer transition-all flex items-start gap-2"
                        style={{
                          backgroundColor: selectedModuleId === module.id ? "#E8B824" : "#F5F5F5",
                          border: `1px solid ${selectedModuleId === module.id ? "#D4A71F" : "#E5E5E5"}`,
                        }}
                      >
                        <GripVertical
                          className="h-4 w-4 flex-shrink-0 mt-1"
                          style={{
                            color: selectedModuleId === module.id ? "#1A1A1A" : "#999999",
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-xs font-bold uppercase tracking-wide"
                            style={{
                              color: selectedModuleId === module.id ? "#1A1A1A" : "#999999",
                            }}
                          >
                            Module {index + 1}
                          </div>
                          <p
                            className="text-sm font-semibold line-clamp-2"
                            style={{
                              color: selectedModuleId === module.id ? "#1A1A1A" : "#1A1A1A",
                            }}
                          >
                            {module.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            <div
              className="p-3 rounded-lg mt-4"
              style={{
                backgroundColor: "#F5F5F5",
                border: "1px solid #E5E5E5",
              }}
            >
              <p className="text-xs font-semibold" style={{ color: "#999999" }}>
                Total Modul: {modules.length}
              </p>
            </div>

            {/* Create First Module Button - Show only if no modules */}
            {modules.length === 0 && (
              <button
                onClick={() => setShowModuleModal(true)}
                className="w-full mt-6 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "#E8B824",
                  color: "#1A1A1A",
                }}
              >
                <Plus className="h-4 w-4" />
                Buat Modul Pertama
              </button>
            )}

            {/* Tab Selector - Only show if module selected */}
            {selectedModuleId && (
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setActiveTab("lessons")}
                  className="flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all"
                  style={{
                    backgroundColor: activeTab === "lessons" ? "#E8B824" : "#F5F5F5",
                    color: activeTab === "lessons" ? "#1A1A1A" : "#999999",
                  }}
                >
                  Pelajaran
                </button>
                <button
                  onClick={() => setActiveTab("materials")}
                  className="flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all"
                  style={{
                    backgroundColor: activeTab === "materials" ? "#E87835" : "#F5F5F5",
                    color: activeTab === "materials" ? "#1A1A1A" : "#999999",
                  }}
                >
                  Bahan
                </button>
              </div>
            )}

            {/* Content List - Only show if module selected */}
            {selectedModuleId && (
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold" style={{ color: "#1A1A1A" }}>
                    {activeTab === "lessons" ? "Pelajaran" : "Bahan"}
                  </h3>
                  <button
                    onClick={() => {
                      if (activeTab === "lessons") {
                        setSelectedLessonId(null);
                      } else {
                        setSelectedMaterialId(null);
                      }
                    }}
                    className="p-2 rounded-lg transition-all flex items-center gap-1"
                    style={{
                      backgroundColor: activeTab === "lessons" ? "#E8B824" : "#E87835",
                      color: "#1A1A1A",
                    }}
                    title={activeTab === "lessons" ? "Tambah Pelajaran Baru" : "Tambah Bahan Baru"}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-xs font-semibold">
                      {activeTab === "lessons" ? "Pelajaran" : "Bahan"}
                    </span>
                  </button>
                </div>

                {activeTab === "lessons" ? (
                  <>
                    {lessons.length === 0 ? (
                      <p className="text-xs" style={{ color: "#999999" }}>
                        Belum ada pelajaran
                      </p>
                    ) : (
                      <DndContext
                        key="lessons"
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleLessonDragEnd}
                      >
                        <SortableContext
                          items={lessons.map((l) => l.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {lessons.map((lesson, index) => (
                              <div key={lesson.id}>
                                <SortableLessonItem
                                  lesson={lesson}
                                  index={index}
                                  isSelected={selectedLessonId === lesson.id}
                                  isLocked={isLessonLocked(index)}
                                  onSelect={(id) => {
                                    setSelectedLessonId(id);
                                    setSelectedMaterialId(null);
                                  }}
                                  getLessonIcon={getLessonIcon}
                                />
                                {selectedLessonId === lesson.id && (
                                  <>
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() => handleDeleteLesson(lesson.id)}
                                        className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                                        style={{
                                          backgroundColor: "#DC2626",
                                          color: "#FFFFFF",
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                      </button>
                                      <button
                                        onClick={() => setShowPreviewModal(true)}
                                        className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                                        style={{
                                          backgroundColor: "#1A1A1A",
                                          color: "#FFFFFF",
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                        Preview
                                      </button>
                                    </div>
                                    <div
                                      className="mt-3"
                                      style={{
                                        height: "1px",
                                        backgroundColor: "#E5E5E5",
                                      }}
                                    ></div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </>
                ) : (
                  <>
                    {materials.length === 0 ? (
                      <p className="text-xs" style={{ color: "#999999" }}>
                        Belum ada bahan
                      </p>
                    ) : (
                      <DndContext
                        key="materials"
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleMaterialDragEnd}
                      >
                        <SortableContext
                          items={materials.map((m) => m.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {materials.map((material, index) => (
                              <div key={material.id}>
                                <SortableMaterialItem
                                  material={material}
                                  index={index}
                                  isSelected={selectedMaterialId === material.id}
                                  onSelect={(id) => {
                                    setSelectedMaterialId(id);
                                    setSelectedLessonId(null);
                                  }}
                                  getMaterialIcon={getMaterialIcon}
                                />
                                {selectedMaterialId === material.id && (
                                  <>
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() => handleDeleteMaterial(material.id)}
                                        className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                                        style={{
                                          backgroundColor: "#DC2626",
                                          color: "#FFFFFF",
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Hapus
                                      </button>
                                      <button
                                        onClick={() => setShowPreviewModal(true)}
                                        className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                                        style={{
                                          backgroundColor: "#1A1A1A",
                                          color: "#FFFFFF",
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                        Pratinjau
                                      </button>
                                    </div>
                                    <div
                                      className="mt-3"
                                      style={{
                                        height: "1px",
                                        backgroundColor: "#E5E5E5",
                                      }}
                                    ></div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center Content Area - Forms */}
        <div
          className="flex-1 p-8 overflow-y-auto"
          style={{
            backgroundColor: "#FFFFFC",
          }}
        >
          {!selectedModuleId ? (
            <div
              className="rounded-lg p-12 text-center"
              style={{
                backgroundColor: "#FFFFFC",
                border: "2px dashed #E5E5E5",
              }}
            >
              <Layers
                className="h-16 w-16 mx-auto mb-4"
                style={{ color: "#D4D4D4" }}
              />
              <p className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>
                Pilih atau Buat Modul
              </p>
              <p className="text-sm mt-2" style={{ color: "#999999" }}>
                Pilih modul yang ada dari daftar atau buat yang baru untuk mulai menambahkan pelajaran dan bahan.
              </p>
            </div>
          ) : (
            <>
            {/* Success Alert */}
            {success && (
              <div className="p-4 rounded-lg border border-green-200 bg-green-50 flex items-center gap-3 mb-6">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="p-4 rounded-lg border border-red-200 bg-red-50 flex items-center gap-3 mb-6">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {activeTab === "lessons" ? (
              // Lesson Form
              <div
                className="rounded-lg p-6 shadow-md"
                style={{
                  backgroundColor: "#FFFFFC",
                  border: "1px solid #E5E5E5",
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Lightbulb
                    className="h-6 w-6"
                    style={{ color: "#E8B824" }}
                  />
                  <h2 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>
                    {selectedLessonId ? "Edit Pelajaran" : "Tambah Pelajaran Baru"}
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Lesson Type */}
                  <div>
                    <Label
                      htmlFor="lesson_type"
                      className="text-sm font-semibold"
                      style={{ color: "#1A1A1A" }}
                    >
                      Jenis Pelajaran
                    </Label>
                    <select
                      id="lesson_type"
                      value={newLesson.lesson_type}
                      onChange={(e) =>
                        setNewLesson({
                          ...newLesson,
                          lesson_type: e.target.value as any,
                        })
                      }
                      className="w-full h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 px-3 mt-1"
                      style={{ backgroundColor: "#FFFFFC", color: "#1A1A1A" }}
                    >
                      <option value="explanation">Penjelasan</option>
                      <option value="vocabulary">Kosakata</option>
                      <option value="dialogue">Dialog</option>
                      <option value="reading">Membaca</option>
                      <option value="listening">Mendengarkan</option>
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <Label
                      htmlFor="lesson_title"
                      className="text-sm font-semibold"
                      style={{ color: "#1A1A1A" }}
                    >
                      Judul *
                    </Label>
                    <Input
                      id="lesson_title"
                      placeholder="cth: Dasar-Dasar Alfabet Jerman"
                      value={newLesson.title}
                      onChange={(e) =>
                        setNewLesson({ ...newLesson, title: e.target.value })
                      }
                      className="h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1"
                      style={{ backgroundColor: "#FFFFFC" }}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label
                      htmlFor="lesson_description"
                      className="text-sm font-semibold"
                      style={{ color: "#1A1A1A" }}
                    >
                      Deskripsi
                    </Label>
                    <Input
                      id="lesson_description"
                      placeholder="Deskripsi singkat pelajaran ini"
                      value={newLesson.description}
                      onChange={(e) =>
                        setNewLesson({
                          ...newLesson,
                          description: e.target.value,
                        })
                      }
                      className="h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1"
                      style={{ backgroundColor: "#FFFFFC" }}
                    />
                  </div>

                  {/* Content - Rich Editor */}
                  <div>
                    <Label
                      htmlFor="lesson_content"
                      className="text-sm font-semibold"
                      style={{ color: "#1A1A1A" }}
                    >
                      Konten dengan Dukungan Media
                    </Label>
                    <LessonContentEditor
                      content={newLesson.content}
                      onChange={(content) =>
                        setNewLesson({ ...newLesson, content })
                      }
                    />
                  </div>

                  {/* Add/Update Button */}
                  <div className="flex gap-3">
                    {selectedLessonId && (
                      <Button
                        onClick={() => {
                          setSelectedLessonId(null);
                          setNewLesson({
                            title: "",
                            description: "",
                            content: "",
                            lesson_type: "explanation",
                          });
                        }}
                        className="flex-1 h-11 font-semibold"
                        style={{
                          backgroundColor: "#F5F5F5",
                          color: "#1A1A1A",
                          border: "1px solid #E5E5E5",
                        }}
                      >
                        Batal
                      </Button>
                    )}
                    <Button
                      onClick={handleAddLesson}
                      className="flex-1 h-11 font-semibold flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: "#E8B824",
                        color: "#1A1A1A",
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      {selectedLessonId ? "Perbarui Pelajaran" : "Tambah Pelajaran"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // Material Form
              <div
                className="rounded-lg p-6 shadow-md"
                style={{
                  backgroundColor: "#FFFFFC",
                  border: "1px solid #E5E5E5",
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Upload
                    className="h-6 w-6"
                    style={{ color: "#E87835" }}
                  />
                  <h2 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>
                    {selectedMaterialId ? "Edit Bahan" : "Tambah Bahan Baru"}
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Material Type */}
                  <div>
                    <Label
                      htmlFor="material_type"
                      className="text-sm font-semibold"
                      style={{ color: "#1A1A1A" }}
                    >
                      Jenis Bahan
                    </Label>
                    <select
                      id="material_type"
                      value={newMaterial.material_type}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          material_type: e.target.value as any,
                        })
                      }
                      className="w-full h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 px-3 mt-1"
                      style={{ backgroundColor: "#FFFFFC", color: "#1A1A1A" }}
                    >
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                      <option value="pdf">PDF</option>
                      <option value="image">Gambar</option>
                      <option value="resource">Sumber Daya</option>
                    </select>
                  </div>

                  {/* Source Type */}
                  <div>
                    <Label
                      htmlFor="source_type"
                      className="text-sm font-semibold"
                      style={{ color: "#1A1A1A" }}
                    >
                      Jenis Sumber
                    </Label>
                    <select
                      id="source_type"
                      value={newMaterial.source_type}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          source_type: e.target.value as any,
                        })
                      }
                      className="w-full h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 px-3 mt-1"
                      style={{ backgroundColor: "#FFFFFC", color: "#1A1A1A" }}
                    >
                      <option value="upload">Unggah File</option>
                      <option value="youtube_link">Tautan YouTube</option>
                      <option value="external_link">Tautan Eksternal</option>
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <Label
                      htmlFor="material_title"
                      className="text-sm font-semibold"
                      style={{ color: "#1A1A1A" }}
                    >
                      Judul *
                    </Label>
                    <Input
                      id="material_title"
                      placeholder="cth: Video Alfabet Jerman"
                      value={newMaterial.title}
                      onChange={(e) =>
                        setNewMaterial({ ...newMaterial, title: e.target.value })
                      }
                      className="h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1"
                      style={{ backgroundColor: "#FFFFFC" }}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label
                      htmlFor="material_description"
                      className="text-sm font-semibold"
                      style={{ color: "#1A1A1A" }}
                    >
                      Deskripsi
                    </Label>
                    <Input
                      id="material_description"
                      placeholder="Deskripsi singkat bahan ini"
                      value={newMaterial.description}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          description: e.target.value,
                        })
                      }
                      className="h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1"
                      style={{ backgroundColor: "#FFFFFC" }}
                    />
                  </div>

                  {/* Source Input */}
                  {newMaterial.source_type === "upload" ? (
                    <div>
                      <Label
                        htmlFor="file_input"
                        className="text-sm font-semibold"
                        style={{ color: "#1A1A1A" }}
                      >
                        Unggah File (Maks 50MB)
                      </Label>
                      <Input
                        id="file_input"
                        type="file"
                        onChange={(e) => {
                          // To be implemented with Supabase storage
                          const file = e.target.files?.[0];
                          if (file) {
                            setNewMaterial({
                              ...newMaterial,
                              file_url: file.name,
                            });
                          }
                        }}
                        className="h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1 file:bg-gray-100 file:border-0 file:rounded file:px-3 file:py-1"
                        style={{ backgroundColor: "#FFFFFC" }}
                      />
                      <p className="text-xs mt-1" style={{ color: "#999999" }}>
                        Didukung: MP4, WebM, MP3, WAV, PDF, JPG, PNG
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Label
                        htmlFor="external_url"
                        className="text-sm font-semibold"
                        style={{ color: "#1A1A1A" }}
                      >
                        {newMaterial.source_type === "youtube_link"
                          ? "URL YouTube"
                          : "URL Eksternal"}
                      </Label>
                      <Input
                        id="external_url"
                        placeholder="Tempel URL di sini"
                        value={newMaterial.external_url}
                        onChange={(e) =>
                          setNewMaterial({
                            ...newMaterial,
                            external_url: e.target.value,
                          })
                        }
                        className="h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1"
                        style={{ backgroundColor: "#FFFFFC" }}
                      />
                    </div>
                  )}

                  {/* Form Buttons */}
                  <div className="flex gap-3">
                    {selectedMaterialId && (
                      <Button onClick={() => setSelectedMaterialId(null)} className="flex-1 h-11 font-semibold"
                        style={{
                          backgroundColor: "#F5F5F5",
                          color: "#1A1A1A",
                          border: "1px solid #E5E5E5",
                        }}
                      >
                        Batal
                      </Button>
                    )}
                    <Button
                      onClick={handleAddMaterial}
                      className="flex-1 h-11 font-semibold flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: "#E87835",
                        color: "#1A1A1A",
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      {selectedMaterialId ? "Perbarui Bahan" : "Tambah Bahan"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </div>

      {/* Create Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div
            className="rounded-lg max-w-md w-full p-6"
            style={{ backgroundColor: "#FFFFFC" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>
                Create New Module
              </h2>
              <button
                onClick={() => setShowModuleModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" style={{ color: "#1A1A1A" }} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="modal_title"
                  className="text-sm font-semibold"
                  style={{ color: "#1A1A1A" }}
                >
                  Module Title *
                </Label>
                <Input
                  id="modal_title"
                  placeholder="e.g., German A1 Basics"
                  value={newModule.title}
                  onChange={(e) =>
                    setNewModule({ ...newModule, title: e.target.value })
                  }
                  className="h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1"
                  style={{ backgroundColor: "#FFFFFC" }}
                />
              </div>

              <div>
                <Label
                  htmlFor="modal_description"
                  className="text-sm font-semibold"
                  style={{ color: "#1A1A1A" }}
                >
                  Description (Optional)
                </Label>
                <Input
                  id="modal_description"
                  placeholder="Brief description of this module"
                  value={newModule.description}
                  onChange={(e) =>
                    setNewModule({ ...newModule, description: e.target.value })
                  }
                  className="h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1"
                  style={{ backgroundColor: "#FFFFFC" }}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowModuleModal(false)}
                  className="flex-1 h-10 font-semibold"
                  style={{
                    backgroundColor: "#F5F5F5",
                    color: "#1A1A1A",
                    border: "1px solid #E5E5E5",
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleAddModule();
                    setShowModuleModal(false);
                  }}
                  className="flex-1 h-10 font-semibold flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "#E8B824",
                    color: "#1A1A1A",
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal - Slides from Right */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex">
          {/* Modal Content */}
          <div
            className="ml-auto w-full max-w-3xl h-full bg-white overflow-y-auto animate-in slide-in-from-right-96"
            style={{ backgroundColor: "#FFFFFC" }}
          >
            <div className="p-8">
              {/* Close Button */}
              <button
                onClick={() => setShowPreviewModal(false)}
                className="mb-6 text-sm font-semibold px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: "#E87835",
                  color: "#FFFFFF",
                }}
              >
                ← Tutup Pratinjau
              </button>

              {/* Lesson Preview */}
              {activeTab === "lessons" && selectedLessonId && (
                <>
                  {lessons
                    .filter((l) => l.id === selectedLessonId)
                    .map((lesson) => (
                      <div key={lesson.id} className="space-y-6">
                        {/* Header */}
                        <div>
                          <p
                            className="text-xs font-bold uppercase tracking-wide"
                            style={{ color: "#999999" }}
                          >
                            {lesson.lesson_type}
                          </p>
                          <h2
                            className="text-4xl font-bold mt-2"
                            style={{ color: "#1A1A1A" }}
                          >
                            {lesson.title}
                          </h2>
                          {lesson.description && (
                            <p
                              className="text-lg mt-4"
                              style={{ color: "#4A4A4A" }}
                            >
                              {lesson.description}
                            </p>
                          )}
                        </div>

                        {/* Content Rendered */}
                        {lesson.content && (
                          <div
                            className="prose prose-sm max-w-none"
                            style={{
                              color: "#1A1A1A",
                            }}
                          >
                            <div
                              className="space-y-4"
                              dangerouslySetInnerHTML={{
                                __html: lesson.content,
                              }}
                              style={{
                                lineHeight: "1.8",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                </>
              )}

              {/* Material Preview */}
              {activeTab === "materials" && selectedMaterialId && (
                <>
                  {materials
                    .filter((m) => m.id === selectedMaterialId)
                    .map((material) => (
                      <div key={material.id} className="space-y-6">
                        {/* Header */}
                        <div>
                          <p
                            className="text-xs font-bold uppercase tracking-wide"
                            style={{ color: "#999999" }}
                          >
                            {material.material_type}
                          </p>
                          <h2
                            className="text-4xl font-bold mt-2"
                            style={{ color: "#1A1A1A" }}
                          >
                            {material.title}
                          </h2>
                          {material.description && (
                            <p
                              className="text-lg mt-4"
                              style={{ color: "#4A4A4A" }}
                            >
                              {material.description}
                            </p>
                          )}
                        </div>

                        {/* Material Content */}
                        <div
                          className="rounded-lg p-6"
                          style={{
                            backgroundColor: "#F5F5F5",
                            border: "1px solid #E5E5E5",
                          }}
                        >
                          {material.material_type === "video" && (
                            <div>
                              <p
                                className="text-sm font-semibold mb-3"
                                style={{ color: "#1A1A1A" }}
                              >
                                Video:
                              </p>
                              {material.source_type === "youtube_link" &&
                              material.external_url ? (
                                <div
                                  style={{
                                    aspectRatio: "16/9",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                  }}
                                >
                                  <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${extractYouTubeId(
                                      material.external_url
                                    )}`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  ></iframe>
                                </div>
                              ) : material.file_url ? (
                                <video
                                  controls
                                  style={{
                                    width: "100%",
                                    borderRadius: "8px",
                                    backgroundColor: "#000",
                                  }}
                                >
                                  <source src={material.file_url} />
                                </video>
                              ) : (
                                <p style={{ color: "#999999" }}>
                                  Tidak ada sumber video
                                </p>
                              )}
                            </div>
                          )}

                          {material.material_type === "audio" && (
                            <div>
                              <p
                                className="text-sm font-semibold mb-3"
                                style={{ color: "#1A1A1A" }}
                              >
                                Audio:
                              </p>
                              {material.file_url || material.external_url ? (
                                <audio
                                  controls
                                  style={{
                                    width: "100%",
                                  }}
                                >
                                  <source
                                    src={material.file_url || material.external_url || ""}
                                  />
                                </audio>
                              ) : (
                                <p style={{ color: "#999999" }}>
                                  Tidak ada sumber audio
                                </p>
                              )}
                            </div>
                          )}

                          {material.material_type === "image" && (
                            <div>
                              <p
                                className="text-sm font-semibold mb-3"
                                style={{ color: "#1A1A1A" }}
                              >
                                Gambar:
                              </p>
                              {material.file_url || material.external_url ? (
                                <img
                                  src={material.file_url || material.external_url || ""}
                                  alt={material.title}
                                  style={{
                                    maxWidth: "100%",
                                    height: "auto",
                                    borderRadius: "8px",
                                    maxHeight: "500px",
                                  }}
                                />
                              ) : (
                                <p style={{ color: "#999999" }}>
                                  Tidak ada sumber gambar
                                </p>
                              )}
                            </div>
                          )}

                          {material.material_type === "pdf" && (
                            <div>
                              <p
                                className="text-sm font-semibold mb-3"
                                style={{ color: "#1A1A1A" }}
                              >
                                File PDF:
                              </p>
                              {material.file_url || material.external_url ? (
                                <a
                                  href={material.file_url || material.external_url || ""}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline font-semibold"
                                >
                                  Buka PDF →
                                </a>
                              ) : (
                                <p style={{ color: "#999999" }}>
                                  Tidak ada sumber PDF
                                </p>
                              )}
                            </div>
                          )}

                          {material.material_type === "resource" && (
                            <div>
                              <p
                                className="text-sm font-semibold mb-3"
                                style={{ color: "#1A1A1A" }}
                              >
                                Tautan Sumber Daya:
                              </p>
                              {material.external_url ? (
                                <a
                                  href={material.external_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold"
                                  style={{ color: "#E87835", textDecoration: "underline" }}
                                >
                                  {material.external_url}
                                </a>
                              ) : (
                                <p style={{ color: "#999999" }}>
                                  Tidak ada tautan sumber daya
                                </p>
                              )}
                            </div>
            )}
          </div>
                        {/* File Info */}
                        <div
                          className="rounded-lg p-4"
                          style={{
                            backgroundColor: "#F5F5F5",
                            border: "1px solid #E5E5E5",
                          }}
                        >
                          <p
                            className="text-xs font-semibold"
                            style={{ color: "#999999" }}
                          >
                            Source: {material.source_type.toUpperCase()}
                          </p>
                          {material.file_size_mb && (
                            <p
                              className="text-xs mt-1"
                              style={{ color: "#999999" }}
                            >
                              Size: {material.file_size_mb} MB
                            </p>
                          )}
                          {material.duration_seconds && (
                            <p
                              className="text-xs mt-1"
                              style={{ color: "#999999" }}
                            >
                              Duration: {Math.floor(material.duration_seconds / 60)}m{" "}
                              {material.duration_seconds % 60}s
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

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
}
