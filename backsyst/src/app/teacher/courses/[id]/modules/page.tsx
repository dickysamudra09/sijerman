"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
            Lesson {index + 1}
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
              Locked - Complete previous lesson first
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

  // Module form state
  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
  });

  // Lesson form state
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    content: "",
    lesson_type: "explanation" as const,
  });

  // Material form state
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
    material_type: "video" as const,
    source_type: "upload" as const,
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
        setError(err.message || "Failed to fetch data");
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
        setError(err.message || "Failed to fetch module content");
      }
    };

    fetchModuleContent();
  }, [selectedModuleId]);

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

        for (const update of updates) {
          const { error } = await supabase
            .from("course_modules")
            .update({ order_index: update.order_index })
            .eq("id", update.id);

          if (error) throw error;
        }

        setSuccess("Module order updated!");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err: any) {
        setError(err.message || "Failed to update module order");
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

        for (const update of updates) {
          const { error } = await supabase
            .from("module_lessons")
            .update({ order_index: update.order_index })
            .eq("id", update.id);

          if (error) throw error;
        }

        setSuccess("Lesson order updated!");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err: any) {
        setError(err.message || "Failed to update lesson order");
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

        for (const update of updates) {
          const { error } = await supabase
            .from("module_materials")
            .update({ order_index: update.order_index })
            .eq("id", update.id);

          if (error) throw error;
        }

        setSuccess("Material order updated!");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err: any) {
        setError(err.message || "Failed to update material order");
        setMaterials(materials);
      }
    }
  };

  // Handle add module
  const handleAddModule = async () => {
    if (!newModule.title.trim()) {
      setError("Module title is required");
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
      setSuccess("Module created successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to create module");
    }
  };

  // Handle add lesson
  const handleAddLesson = async () => {
    if (!newLesson.title.trim() || !selectedModuleId) {
      setError(
        !newLesson.title.trim()
          ? "Lesson title is required"
          : "Please select a module first"
      );
      return;
    }

    try {
      setError("");
      const orderIndex = lessons.length;
      const currentModuleId = selectedModuleId;

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
      setSuccess("Lesson added successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to add lesson");
    }
  };

  // Handle add material
  const handleAddMaterial = async () => {
    if (!newMaterial.title.trim() || !selectedModuleId) {
      setError(
        !newMaterial.title.trim()
          ? "Material title is required"
          : "Please select a module first"
      );
      return;
    }

    try {
      setError("");
      const orderIndex = materials.length;
      const currentModuleId = selectedModuleId;

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
      setSuccess("Material added successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to add material");
    }
  };

  // Handle delete lesson
  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;

    try {
      const { error } = await supabase
        .from("module_lessons")
        .delete()
        .eq("id", lessonId);

      if (error) throw error;

      setLessons(lessons.filter((l) => l.id !== lessonId));
      setSelectedLessonId(null);
      setSuccess("Lesson deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete lesson");
    }
  };

  // Handle delete material
  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const { error } = await supabase
        .from("module_materials")
        .delete()
        .eq("id", materialId);

      if (error) throw error;

      setMaterials(materials.filter((m) => m.id !== materialId));
      setSelectedMaterialId(null);
      setSuccess("Material deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete material");
    }
  };

  // Check if lesson is locked (needs previous lessons completed)
  const isLessonLocked = (index: number): boolean => {
    return index > 0; // For now, all lessons except first are locked until completed
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
            <h2 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>
              Modules
            </h2>

            {modules.length === 0 ? (
              <p className="text-sm" style={{ color: "#999999" }}>
                No modules yet. Create one below.
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
                Total Modules: {modules.length}
              </p>
            </div>

            {/* Create Module Form */}
            <div
              className="rounded-lg p-4 mt-6"
              style={{
                backgroundColor: "#FFFFFC",
                border: "2px solid #E8B824",
              }}
            >
              <h3 className="text-sm font-bold mb-3" style={{ color: "#1A1A1A" }}>
                Create New Module
              </h3>
              <div className="space-y-2">
                <Input
                  placeholder="Module title"
                  value={newModule.title}
                  onChange={(e) =>
                    setNewModule({ ...newModule, title: e.target.value })
                  }
                  className="h-9 rounded-lg border-2 border-gray-200 focus:border-yellow-400 text-sm"
                  style={{ backgroundColor: "#FFFFFC" }}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newModule.description}
                  onChange={(e) =>
                    setNewModule({ ...newModule, description: e.target.value })
                  }
                  className="h-9 rounded-lg border-2 border-gray-200 focus:border-yellow-400 text-sm"
                  style={{ backgroundColor: "#FFFFFC" }}
                />
                <Button
                  onClick={handleAddModule}
                  className="w-full h-9 font-semibold flex items-center justify-center gap-2 text-sm"
                  style={{
                    backgroundColor: "#E8B824",
                    color: "#1A1A1A",
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create Module
                </Button>
              </div>
            </div>

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
                  Lessons
                </button>
                <button
                  onClick={() => setActiveTab("materials")}
                  className="flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all"
                  style={{
                    backgroundColor: activeTab === "materials" ? "#E87835" : "#F5F5F5",
                    color: activeTab === "materials" ? "#1A1A1A" : "#999999",
                  }}
                >
                  Materials
                </button>
              </div>
            )}

            {/* Content List - Only show if module selected */}
            {selectedModuleId && (
              <div className="space-y-4 mt-6">
                <h3 className="text-sm font-bold" style={{ color: "#1A1A1A" }}>
                  {activeTab === "lessons" ? "Lessons" : "Materials"}
                </h3>

                {activeTab === "lessons" ? (
                  <>
                    {lessons.length === 0 ? (
                      <p className="text-xs" style={{ color: "#999999" }}>
                        No lessons yet.
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
                              <SortableLessonItem
                                key={lesson.id}
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
                        No materials yet.
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
                              <SortableMaterialItem
                                key={material.id}
                                material={material}
                                index={index}
                                isSelected={selectedMaterialId === material.id}
                                onSelect={(id) => {
                                  setSelectedMaterialId(id);
                                  setSelectedLessonId(null);
                                }}
                                getMaterialIcon={getMaterialIcon}
                              />
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
          className="flex-1 p-8 overflow-y-auto border-r"
          style={{
            borderRightColor: "#E5E5E5",
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
                Select or Create a Module
              </p>
              <p className="text-sm mt-2" style={{ color: "#999999" }}>
                Choose an existing module from the list or create a new one to start adding lessons and materials.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-2xl">
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
                    Add New Lesson
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
                      Lesson Type
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
                      <option value="explanation">Explanation</option>
                      <option value="vocabulary">Vocabulary</option>
                      <option value="dialogue">Dialogue</option>
                      <option value="reading">Reading</option>
                      <option value="listening">Listening</option>
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <Label
                      htmlFor="lesson_title"
                      className="text-sm font-semibold"
                      style={{ color: "#1A1A1A" }}
                    >
                      Title *
                    </Label>
                    <Input
                      id="lesson_title"
                      placeholder="e.g., German Alphabet Basics"
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
                      Description
                    </Label>
                    <Input
                      id="lesson_description"
                      placeholder="Brief description of this lesson"
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

                  {/* Content */}
                  <div>
                    <Label
                      htmlFor="lesson_content"
                      className="text-sm font-semibold"
                      style={{ color: "#1A1A1A" }}
                    >
                      Content (HTML)
                    </Label>
                    <textarea
                      id="lesson_content"
                      placeholder="Add your lesson content here... (supports HTML)"
                      value={newLesson.content}
                      onChange={(e) =>
                        setNewLesson({ ...newLesson, content: e.target.value })
                      }
                      rows={6}
                      className="w-full rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 p-3 text-base resize-none mt-1"
                      style={{
                        backgroundColor: "#FFFFFC",
                        fontFamily: "monospace",
                        fontSize: "12px",
                      }}
                    />
                    <p className="text-xs mt-1" style={{ color: "#999999" }}>
                      You can use basic HTML tags or Markdown
                    </p>
                  </div>

                  {/* Add Button */}
                  <Button
                    onClick={handleAddLesson}
                    className="w-full h-11 font-semibold flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: "#E8B824",
                      color: "#1A1A1A",
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Lesson
                  </Button>
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
                    Add New Material
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
                      Material Type
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
                      <option value="image">Image</option>
                      <option value="resource">Resource</option>
                    </select>
                  </div>

                  {/* Source Type */}
                  <div>
                    <Label
                      htmlFor="source_type"
                      className="text-sm font-semibold"
                      style={{ color: "#1A1A1A" }}
                    >
                      Source Type
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
                      <option value="upload">Upload File</option>
                      <option value="youtube_link">YouTube Link</option>
                      <option value="external_link">External Link</option>
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <Label
                      htmlFor="material_title"
                      className="text-sm font-semibold"
                      style={{ color: "#1A1A1A" }}
                    >
                      Title *
                    </Label>
                    <Input
                      id="material_title"
                      placeholder="e.g., German Alphabet Video"
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
                      Description
                    </Label>
                    <Input
                      id="material_description"
                      placeholder="Brief description of this material"
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
                        Upload File (Max 50MB)
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
                        Supported: MP4, WebM, MP3, WAV, PDF, JPG, PNG
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
                          ? "YouTube URL"
                          : "External URL"}
                      </Label>
                      <Input
                        id="external_url"
                        placeholder="Paste the URL here"
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

                  {/* Add Button */}
                  <Button
                    onClick={handleAddMaterial}
                    className="w-full h-11 font-semibold flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: "#E87835",
                      color: "#1A1A1A",
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Material
                  </Button>
                </div>
              </div>
            )}
            </div>
          )}
        </div>

        {/* Right Preview Panel */}
        <div
          className="w-80 p-6 overflow-y-auto"
          style={{
            backgroundColor: "#F9F7F4",
            borderLeft: "1px solid #E5E5E5",
          }}
        >
          {activeTab === "lessons" && selectedLessonId ? (
            <>
              {lessons
                .filter((l) => l.id === selectedLessonId)
                .map((lesson) => (
                  <div key={lesson.id} className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className="text-lg font-bold"
                        style={{ color: "#1A1A1A" }}
                      >
                        Preview
                      </h3>
                      <Button
                        onClick={() => handleDeleteLesson(selectedLessonId)}
                        size="sm"
                        className="text-xs"
                        style={{
                          borderColor: "#DC2626",
                          color: "#DC2626",
                          backgroundColor: "transparent",
                          border: "1px solid #DC2626",
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>

                    <div
                      className="p-3 rounded-lg"
                      style={{
                        backgroundColor: "#FFFFFC",
                        border: "1px solid #E5E5E5",
                      }}
                    >
                      <p
                        className="text-xs font-bold uppercase"
                        style={{ color: "#999999" }}
                      >
                        {lesson.lesson_type}
                      </p>
                      <h4
                        className="text-lg font-bold mt-2"
                        style={{ color: "#1A1A1A" }}
                      >
                        {lesson.title}
                      </h4>
                      {lesson.description && (
                        <p className="text-sm mt-2" style={{ color: "#4A4A4A" }}>
                          {lesson.description}
                        </p>
                      )}
                    </div>

                    {lesson.content && (
                      <div>
                        <p
                          className="text-xs font-semibold mb-2"
                          style={{ color: "#999999" }}
                        >
                          Content Preview:
                        </p>
                        <div
                          className="p-3 rounded-lg text-xs line-clamp-4"
                          style={{
                            backgroundColor: "#FFFFFC",
                            border: "1px solid #E5E5E5",
                            color: "#4A4A4A",
                          }}
                        >
                          {lesson.content.substring(0, 150)}...
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </>
          ) : activeTab === "materials" && selectedMaterialId ? (
            <>
              {materials
                .filter((m) => m.id === selectedMaterialId)
                .map((material) => (
                  <div key={material.id} className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className="text-lg font-bold"
                        style={{ color: "#1A1A1A" }}
                      >
                        Preview
                      </h3>
                      <Button
                        onClick={() => handleDeleteMaterial(selectedMaterialId)}
                        size="sm"
                        className="text-xs"
                        style={{
                          borderColor: "#DC2626",
                          color: "#DC2626",
                          backgroundColor: "transparent",
                          border: "1px solid #DC2626",
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>

                    <div
                      className="p-3 rounded-lg"
                      style={{
                        backgroundColor: "#FFFFFC",
                        border: "1px solid #E5E5E5",
                      }}
                    >
                      <p
                        className="text-xs font-bold uppercase"
                        style={{ color: "#999999" }}
                      >
                        {material.material_type}
                      </p>
                      <h4
                        className="text-lg font-bold mt-2"
                        style={{ color: "#1A1A1A" }}
                      >
                        {material.title}
                      </h4>
                      {material.description && (
                        <p className="text-sm mt-2" style={{ color: "#4A4A4A" }}>
                          {material.description}
                        </p>
                      )}

                      {material.source_type === "youtube_link" ? (
                        <p className="text-xs mt-2" style={{ color: "#E87835" }}>
                          YouTube Link
                        </p>
                      ) : material.source_type === "upload" ? (
                        <p className="text-xs mt-2" style={{ color: "#E8B824" }}>
                          Uploaded File
                        </p>
                      ) : (
                        <p className="text-xs mt-2" style={{ color: "#A86A32" }}>
                          External Link
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </>
          ) : (
            <div
              className="rounded-lg p-6 text-center"
              style={{
                backgroundColor: "#FFFFFC",
                border: "2px dashed #E5E5E5",
              }}
            >
              <Layers
                className="h-12 w-12 mx-auto mb-3"
                style={{ color: "#D4D4D4" }}
              />
              <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                Select a {activeTab === "lessons" ? "lesson" : "material"} to
                preview
              </p>
            </div>
          )}
        </div>
      </div>
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
}
