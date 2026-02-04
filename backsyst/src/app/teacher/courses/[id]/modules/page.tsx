"use client";

import { useEffect, useState } from "react";
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

interface Module {
  id: string;
  title: string;
  description: string;
  content: string;
  module_type: string;
  order_index: number;
}

function SortableModuleItem({
  module,
  index,
  isSelected,
  onSelect,
  getModuleIcon,
}: {
  module: Module;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  getModuleIcon: (type: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

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
        border: "1px solid #E5E5E5",
      }}
      onClick={() => onSelect(module.id)}
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
        <span className="text-lg flex-shrink-0">{getModuleIcon(module.module_type)}</span>
        <div className="flex-1 min-w-0">
          <div
            className="text-xs font-bold uppercase tracking-wide"
            style={{
              color: isSelected ? "#1A1A1A" : "#999999",
            }}
          >
            {index + 1}
          </div>
          <p
            className="text-sm font-semibold line-clamp-2"
            style={{
              color: isSelected ? "#1A1A1A" : "#1A1A1A",
            }}
          >
            {module.title}
          </p>
          <p
            className="text-xs line-clamp-1 mt-1"
            style={{
              color: isSelected ? "#4A4A4A" : "#999999",
            }}
          >
            {module.description || "No description"}
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

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
    content: "",
    module_type: "module",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
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
          content: newModule.content,
          module_type: newModule.module_type,
          order_index: orderIndex,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setModules([...modules, data]);
      setNewModule({
        title: "",
        description: "",
        content: "",
        module_type: "module",
      });
      setSuccess("Module added successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to add module");
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module?")) return;

    try {
      const { error } = await supabase
        .from("course_modules")
        .delete()
        .eq("id", moduleId);

      if (error) throw error;

      setModules(modules.filter((m) => m.id !== moduleId));
      setSelectedModuleId(null);
      setSuccess("Module deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete module");
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

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 w-full">
        {/* Left Sidebar */}
        <div
          className="w-64 border-r p-6 overflow-y-auto"
          style={{
            borderRightColor: "#E5E5E5",
            backgroundColor: "#FFFFFC",
          }}
        >
          <div className="space-y-4">
            <h2 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>
              Course Modules
            </h2>

            {modules.length === 0 ? (
              <p className="text-sm" style={{ color: "#999999" }}>
                No modules yet. Add one to get started.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={modules.map((m) => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {modules.map((module, index) => (
                      <SortableModuleItem
                        key={module.id}
                        module={module}
                        index={index}
                        isSelected={selectedModuleId === module.id}
                        onSelect={setSelectedModuleId}
                        getModuleIcon={getModuleIcon}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Module Count */}
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
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="w-full">
            {/* Success Alert */}
            {success && (
              <div
                className="p-4 rounded-lg border border-green-200 bg-green-50 flex items-center gap-3 mb-6"
              >
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div
                className="p-4 rounded-lg border border-red-200 bg-red-50 flex items-center gap-3 mb-6"
              >
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Add Module Form */}
            <div
              className="rounded-lg p-6 shadow-md"
              style={{
                backgroundColor: "#FFFFFC",
                border: "1px solid #E5E5E5",
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="h-6 w-6" style={{ color: "#E8B824" }} />
                <h2
                  className="text-2xl font-bold"
                  style={{ color: "#1A1A1A" }}
                >
                  Add New Module
                </h2>
              </div>

              <div className="space-y-4">
                {/* Module Type */}
                <div>
                  <Label
                    htmlFor="module_type"
                    className="text-sm font-semibold"
                    style={{ color: "#1A1A1A" }}
                  >
                    Module Type
                  </Label>
                  <select
                    id="module_type"
                    value={newModule.module_type}
                    onChange={(e) =>
                      setNewModule({ ...newModule, module_type: e.target.value })
                    }
                    className="w-full h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 px-3 mt-1"
                    style={{ backgroundColor: "#FFFFFC", color: "#1A1A1A" }}
                  >
                    <option value="introduction">📖 Introduction</option>
                    <option value="how-to">🎯 How To</option>
                    <option value="module">📚 Module</option>
                    <option value="practice">✍️ Practice</option>
                    <option value="resources">📎 Resources</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <Label
                    htmlFor="title"
                    className="text-sm font-semibold"
                    style={{ color: "#1A1A1A" }}
                  >
                    Module Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., German Alphabet & Pronunciation"
                    value={newModule.title}
                    onChange={(e) =>
                      setNewModule({ ...newModule, title: e.target.value })
                    }
                    className="h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1"
                    style={{ backgroundColor: "#FFFFFC" }}
                  />
                </div>

                {/* Description */}
                <div>
                  <Label
                    htmlFor="description"
                    className="text-sm font-semibold"
                    style={{ color: "#1A1A1A" }}
                  >
                    Description
                  </Label>
                  <Input
                    id="description"
                    placeholder="Brief description of this module"
                    value={newModule.description}
                    onChange={(e) =>
                      setNewModule({ ...newModule, description: e.target.value })
                    }
                    className="h-10 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1"
                    style={{ backgroundColor: "#FFFFFC" }}
                  />
                </div>

                {/* Content */}
                <div>
                  <Label
                    htmlFor="content"
                    className="text-sm font-semibold"
                    style={{ color: "#1A1A1A" }}
                  >
                    Content (HTML)
                  </Label>
                  <textarea
                    id="content"
                    placeholder="Add your module content here... (supports HTML)"
                    value={newModule.content}
                    onChange={(e) =>
                      setNewModule({ ...newModule, content: e.target.value })
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
                    You can use basic HTML tags: &lt;p&gt;, &lt;h1&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, etc.
                  </p>
                </div>

                {/* Add Button */}
                <Button
                  onClick={handleAddModule}
                  className="w-full h-11 font-semibold flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "#E8B824",
                    color: "#1A1A1A",
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Module
                </Button>
              </div>
            </div>

            {/* Preview Section */}
            {selectedModuleId && (
              <div
                className="rounded-lg p-6 shadow-md mt-6"
                style={{
                  backgroundColor: "#FFFFFC",
                  border: "2px solid #E8B824",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-lg font-bold"
                    style={{ color: "#1A1A1A" }}
                  >
                    Module Details
                  </h3>
                  <Button
                    onClick={() => handleDeleteModule(selectedModuleId)}
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
                {modules
                  .filter((m) => m.id === selectedModuleId)
                  .map((module) => (
                    <div key={module.id} className="space-y-4">
                      <div>
                        <p
                          className="text-xs font-bold uppercase"
                          style={{ color: "#999999" }}
                        >
                          {module.module_type}
                        </p>
                        <h4
                          className="text-xl font-bold mt-1"
                          style={{ color: "#1A1A1A" }}
                        >
                          {module.title}
                        </h4>
                      </div>
                      {module.description && (
                        <p
                          className="text-sm"
                          style={{ color: "#4A4A4A" }}
                        >
                          {module.description}
                        </p>
                      )}
                      {module.content && (
                        <div>
                          <p
                            className="text-xs font-semibold mb-2"
                            style={{ color: "#999999" }}
                          >
                            Content Preview:
                          </p>
                          <div
                            className="p-3 rounded-lg"
                            style={{
                              backgroundColor: "#F5F5F5",
                              border: "1px solid #E5E5E5",
                            }}
                          >
                            <p
                              className="text-xs font-mono line-clamp-4"
                              style={{ color: "#4A4A4A" }}
                            >
                              {module.content.substring(0, 200)}...
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function getModuleIcon(type: string) {
    const icons: { [key: string]: string } = {
      introduction: "📖",
      "how-to": "🎯",
      module: "📚",
      practice: "✍️",
      resources: "📎",
    };
    return icons[type] || "📄";
  }
}
