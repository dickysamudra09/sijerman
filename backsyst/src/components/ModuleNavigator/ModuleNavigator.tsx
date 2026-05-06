"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContextualInlineEditor from "../ContextualInlineEditor";
import {
  Plus,
  GripVertical,
  Eye,
  Trash2,
  Edit2,
  Layers,
  Lock,
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileText,
  Video,
  Music,
  Image,
  Link2,
} from "lucide-react";

interface ModuleData {
  id: string;
  title: string;
  description: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LessonData {
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

interface MaterialData {
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

interface ExerciseData {
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

interface ModuleNavigatorProps {
  modules: ModuleData[];
  lessons: Record<string, LessonData[]>;
  materials: Record<string, MaterialData[]>;
  exercises: Record<string, ExerciseData[]>;
  selectedModuleId: string | null;
  onModuleSelect: (moduleId: string) => void;
  onModuleCreate: (module: Omit<ModuleData, "id" | "created_at" | "updated_at">) => void;
  onModuleUpdate: (moduleId: string, updates: Partial<ModuleData>) => void;
  onModuleDelete: (moduleId: string) => void;
  onLessonSelect: (lessonId: string) => void;
  onMaterialSelect: (materialId: string) => void;
  onExerciseSelect: (exerciseId: string) => void;
  onReorder: (type: "module" | "lesson" | "material" | "exercise", items: any[]) => void;
}

export function ModuleNavigator({
  modules,
  lessons,
  materials,
  exercises,
  selectedModuleId,
  onModuleSelect,
  onModuleCreate,
  onModuleUpdate,
  onModuleDelete,
  onLessonSelect,
  onMaterialSelect,
  onExerciseSelect,
  onReorder,
}: ModuleNavigatorProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"lessons" | "materials">("lessons");
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
  });

  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handleModuleCreate = () => {
    if (!newModule.title.trim()) return;
    
    onModuleCreate({
      title: newModule.title,
      description: newModule.description,
      order_index: modules.length,
      is_active: true,
    });
    
    setNewModule({ title: "", description: "" });
    setShowModuleForm(false);
  };

  const handleModuleEdit = (moduleId: string, updates: Partial<ModuleData>) => {
    onModuleUpdate(moduleId, updates);
    setEditingModule(null);
  };

  const getModuleIcon = (moduleId: string) => {
    const moduleLessons = lessons[moduleId] || [];
    const moduleMaterials = materials[moduleId] || [];
    const moduleExercises = exercises[moduleId] || [];
    
    const totalItems = moduleLessons.length + moduleMaterials.length + moduleExercises.length;
    
    if (totalItems === 0) {
      return <Layers className="h-4 w-4 text-gray-400" />;
    }
    
    return <BookOpen className="h-4 w-4 text-blue-600" />;
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "explanation":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "vocabulary":
        return <FileText className="h-4 w-4 text-green-600" />;
      case "dialogue":
        return <FileText className="h-4 w-4 text-purple-600" />;
      case "reading":
        return <FileText className="h-4 w-4 text-orange-600" />;
      case "listening":
        return <FileText className="h-4 w-4 text-red-600" />;
      case "video":
        return <Video className="h-4 w-4 text-blue-600" />;
      case "audio":
        return <Music className="h-4 w-4 text-green-600" />;
      case "pdf":
        return <FileText className="h-4 w-4 text-red-600" />;
      case "image":
        return <Image className="h-4 w-4 text-purple-600" />;
      case "resource":
        return <Link2 className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="w-80 border-r bg-gray-50 h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Modul</h2>
          <Button
            onClick={() => setShowModuleForm(!showModuleForm)}
            size="sm"
            className="gap-2"
            style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
          >
            <Plus className="h-4 w-4" />
            Modul Baru
          </Button>
        </div>

        {/* Module Form */}
        {showModuleForm && (
          <Card className="border-2" style={{ borderColor: "#E8B824" }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {editingModule ? "Edit Modul" : "Modul Baru"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="module-title">Judul Modul</Label>
                <Input
                  id="module-title"
                  value={newModule.title}
                  onChange={(e) => setNewModule(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., German A1 Basics"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="module-description">Deskripsi</Label>
                <Input
                  id="module-description"
                  value={newModule.description}
                  onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Deskripsi modul (opsional)"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModuleForm(false);
                    setEditingModule(null);
                    setNewModule({ title: "", description: "" });
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleModuleCreate}
                  className="flex-1"
                  style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
                >
                  {editingModule ? "Simpan" : "Buat"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modules List */}
        <div className="space-y-2">
          {modules.map((module, index) => {
            const isExpanded = expandedModules.has(module.id);
            const isSelected = selectedModuleId === module.id;
            const moduleLessons = lessons[module.id] || [];
            const moduleMaterials = materials[module.id] || [];
            const moduleExercises = exercises[module.id] || [];

            return (
              <Card
                key={module.id}
                className={`cursor-pointer transition-all ${
                  isSelected 
                    ? 'ring-2 ring-yellow-400 bg-yellow-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => {
                  onModuleSelect(module.id);
                  toggleModuleExpansion(module.id);
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      {getModuleIcon(module.id)}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold uppercase tracking-wide text-gray-600">
                          Module {index + 1}
                        </div>
                        <CardTitle className="text-sm truncate">{module.title}</CardTitle>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {moduleLessons.length + moduleMaterials.length + moduleExercises.length}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    {/* Content Tabs */}
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "lessons" | "materials")}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="lessons" className="text-xs">
                          Pelajaran ({moduleLessons.length})
                        </TabsTrigger>
                        <TabsTrigger value="materials" className="text-xs">
                          Materi ({moduleMaterials.length})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="lessons" className="mt-3 space-y-2">
                        {moduleLessons.length === 0 ? (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            Belum ada pelajaran
                          </div>
                        ) : (
                          moduleLessons.map((lesson, lessonIndex) => (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                onLessonSelect(lesson.id);
                              }}
                            >
                              {getContentTypeIcon(lesson.lesson_type)}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">
                                  Pelajaran {lessonIndex + 1}
                                </div>
                                <div className="text-sm truncate">{lesson.title}</div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Edit lesson logic
                                  }}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </TabsContent>

                      <TabsContent value="materials" className="mt-3 space-y-2">
                        {moduleMaterials.length === 0 ? (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            Belum ada materi
                          </div>
                        ) : (
                          moduleMaterials.map((material, materialIndex) => (
                            <div
                              key={material.id}
                              className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMaterialSelect(material.id);
                              }}
                            >
                              {getContentTypeIcon(material.material_type)}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">
                                  Materi {materialIndex + 1}
                                </div>
                                <div className="text-sm truncate">{material.title}</div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Edit material logic
                                  }}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </TabsContent>
                    </Tabs>

                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLessonSelect(""); // Create new lesson
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        Pelajaran
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMaterialSelect(""); // Create new material
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        Materi
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {modules.length === 0 && (
          <div className="text-center py-8">
            <Layers className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Belum Ada Modul
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Mulai dengan membuat modul pertama
            </p>
            <Button
              onClick={() => setShowModuleForm(true)}
              className="gap-2"
              style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
            >
              <Plus className="h-4 w-4" />
              Buat Modul Pertama
            </Button>
          </div>
        )}

        {/* Statistics */}
        <div className="pt-4 border-t">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Total Modul:</span>
              <span className="font-semibold">{modules.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Pelajaran:</span>
              <span className="font-semibold">
                {Object.values(lessons).reduce((sum, arr) => sum + arr.length, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Materi:</span>
              <span className="font-semibold">
                {Object.values(materials).reduce((sum, arr) => sum + arr.length, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
