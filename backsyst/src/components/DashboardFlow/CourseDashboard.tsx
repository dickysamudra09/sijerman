"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EditContentModal } from "@/components/DashboardFlow/EditContentModal";
import { AddContentModal } from "@/components/DashboardFlow/AddContentModal";
import { ExerciseBuilderModal } from "@/components/Exercise/ExerciseBuilderModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Plus,
  BookOpen,
  FileText,
  Video,
  Brain,
  Edit2,
  Trash2,
  Eye,
  ChevronDown,
} from "lucide-react";

interface CourseDashboardProps {
  course: any;
  modules: any[];
  lessons: any[];
  materials: any[];
  exercises: any[];
  onCreateModule: () => void;
  onEditModule: (module: any) => void;
  onDeleteModule: (moduleId: string) => void;
  onCreateLesson: (moduleId: string) => void;
  onCreateMaterial: (moduleId: string) => void;
  onCreateExercise: (moduleId: string) => void;
  onEditLesson: (lesson: any) => void;
  onEditMaterial: (material: any) => void;
  onEditExercise: (exercise: any) => void;
  onDeleteLesson: (lessonId: string) => void;
  onDeleteMaterial: (materialId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onPreviewLesson: (lesson: any) => void;
  onPreviewMaterial: (material: any) => void;
  onPreviewExercise: (exercise: any) => void;
  onAddModule: (module: any) => void;
  onAddLesson: (lesson: any) => void;
  onAddMaterial: (material: any) => void;
  onAddExercise: (exercise: any) => void;
  courseId: string;
  user: any;
}

export function CourseDashboard({
  course,
  modules,
  lessons,
  materials,
  exercises,
  onCreateModule,
  onEditModule,
  onDeleteModule,
  onCreateLesson,
  onCreateMaterial,
  onCreateExercise,
  onEditLesson,
  onEditMaterial,
  onEditExercise,
  onDeleteLesson,
  onDeleteMaterial,
  onDeleteExercise,
  onPreviewLesson,
  onPreviewMaterial,
  onPreviewExercise,
  onAddModule,
  onAddLesson,
  onAddMaterial,
  onAddExercise,
  courseId,
  user,
}: CourseDashboardProps) {
  const router = useRouter();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean;
    type: "lesson" | "material" | "exercise" | "module";
    initialData: any;
  }>({
    isOpen: false,
    type: "lesson",
    initialData: null,
  });

  const [addModalState, setAddModalState] = useState<{
    isOpen: boolean;
    type: "lesson" | "material" | "exercise" | "module";
    moduleId?: string;
  }>({
    isOpen: false,
    type: "lesson",
    moduleId: undefined,
  });

  const [showExerciseBuilder, setShowExerciseBuilder] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);

  const toggleModule = (moduleId: string) => {
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

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,253,248,1) 100%)' }}>
      {/* Course Header */}
      <div style={{ backgroundColor: '#1A1A1A' }} className="relative overflow-hidden">
        {/* Decorative Blobs */}
        <div className="absolute top-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ backgroundColor: '#E8B824' }}></div>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-15" style={{ backgroundColor: '#E8B824' }}></div>
        <div className="absolute bottom-0 left-1/2 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ backgroundColor: '#E8B824' }}></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/home/teacher?tab=my-courses')}
                className="p-2 rounded-lg hover:bg-yellow-50 transition-colors"
                style={{ backgroundColor: 'rgba(255, 255, 252, 0.1)', border: '1px solid rgba(255, 255, 252, 0.2)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 252, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 252, 0.1)';
                }}
              >
                <ArrowLeft className="h-5 w-5" style={{ color: '#FFFFFC' }} />
              </Button>
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#FFFFFC' }}>
                  {course?.title || "Course Dashboard"}
                </h1>
                <p className="text-gray-300" style={{ color: 'rgba(255, 255, 252, 0.7)' }}>
                  Kelola konten kursus Anda dengan mudah
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(255, 255, 252, 0.1)', border: '1px solid rgba(255, 255, 252, 0.2)' }}>
                <span className="text-sm font-semibold" style={{ color: '#FFFFFC' }}>
                  {modules.length} Modul
                </span>
              </div>
              <div className="px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(255, 255, 252, 0.1)', border: '1px solid rgba(255, 255, 252, 0.2)' }}>
                <span className="text-sm font-semibold" style={{ color: '#FFFFFC' }}>
                  {lessons.length} Pelajaran
                </span>
              </div>
              <div className="px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(255, 255, 252, 0.1)', border: '1px solid rgba(255, 255, 252, 0.2)' }}>
                <span className="text-sm font-semibold" style={{ color: '#FFFFFC' }}>
                  {materials.length} Materi
                </span>
              </div>
              <div className="px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(255, 255, 252, 0.1)', border: '1px solid rgba(255, 255, 252, 0.2)' }}>
                <span className="text-sm font-semibold" style={{ color: '#FFFFFC' }}>
                  {exercises.length} Latihan
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Bottom Border */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #E8B824 0%, rgba(232, 184, 36, 0) 100%)' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
        {/* Course Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "#1A1A1A" }}>Ringkasan Kursus</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Modules Card */}
            <div 
              className="rounded-xl p-6 transition-all duration-300 hover:shadow-lg cursor-pointer backdrop-blur-md" 
              style={{
                backgroundColor: 'rgba(255, 255, 252, 0.8)',
                borderColor: 'rgba(232, 184, 36, 0.2)',
                borderWidth: '1px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(232, 184, 36, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm mb-3" style={{ color: "#4A4A4A" }}>Modul</p>
                  <p className="text-4xl font-bold mb-1" style={{ color: '#1A1A1A' }}>{modules.length}</p>
                  <p className="text-xs" style={{ color: "#4A4A4A" }}>Total modul</p>
                </div>
                <div className="p-3 rounded-lg transform transition-transform hover:scale-110" style={{backgroundColor: '#E8B824'}}>
                  <BookOpen className="h-6 w-6" style={{color: '#1E1E1E'}} />
                </div>
              </div>
            </div>

            {/* Lessons Card */}
            <div 
              className="rounded-xl p-6 transition-all duration-300 hover:shadow-lg cursor-pointer backdrop-blur-md" 
              style={{
                backgroundColor: 'rgba(255, 255, 252, 0.8)',
                borderColor: 'rgba(232, 184, 36, 0.2)',
                borderWidth: '1px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(232, 184, 36, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm mb-3" style={{ color: "#4A4A4A" }}>Pelajaran</p>
                  <p className="text-4xl font-bold mb-1" style={{ color: '#1A1A1A' }}>{lessons.length}</p>
                  <p className="text-xs" style={{ color: "#4A4A4A" }}>Total pelajaran</p>
                </div>
                <div className="p-3 rounded-lg transform transition-transform hover:scale-110" style={{backgroundColor: '#E8B824'}}>
                  <FileText className="h-6 w-6" style={{color: '#1E1E1E'}} />
                </div>
              </div>
            </div>

            {/* Materials Card */}
            <div 
              className="rounded-xl p-6 transition-all duration-300 hover:shadow-lg cursor-pointer backdrop-blur-md" 
              style={{
                backgroundColor: 'rgba(255, 255, 252, 0.8)',
                borderColor: 'rgba(232, 184, 36, 0.2)',
                borderWidth: '1px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(232, 184, 36, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm mb-3" style={{ color: "#4A4A4A" }}>Materi</p>
                  <p className="text-4xl font-bold mb-1" style={{ color: '#1A1A1A' }}>{materials.length}</p>
                  <p className="text-xs" style={{ color: "#4A4A4A" }}>Total materi</p>
                </div>
                <div className="p-3 rounded-lg transform transition-transform hover:scale-110" style={{backgroundColor: '#E8B824'}}>
                  <Video className="h-6 w-6" style={{color: '#1E1E1E'}} />
                </div>
              </div>
            </div>

            {/* Exercises Card */}
            <div 
              className="rounded-xl p-6 transition-all duration-300 hover:shadow-lg cursor-pointer backdrop-blur-md" 
              style={{
                backgroundColor: 'rgba(255, 255, 252, 0.8)',
                borderColor: 'rgba(232, 184, 36, 0.2)',
                borderWidth: '1px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(232, 184, 36, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm mb-3" style={{ color: "#4A4A4A" }}>Latihan</p>
                  <p className="text-4xl font-bold mb-1" style={{ color: '#1A1A1A' }}>{exercises.length}</p>
                  <p className="text-xs" style={{ color: "#4A4A4A" }}>Total latihan</p>
                </div>
                <div className="p-3 rounded-lg transform transition-transform hover:scale-110" style={{backgroundColor: '#E8B824'}}>
                  <Brain className="h-6 w-6" style={{color: '#1E1E1E'}} />
                </div>
              </div>
            </div>
          </div>
        </div>

        
        {/* Course Structure */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Struktur Kursus</h2>
            <Button 
              onClick={onCreateModule}
              className="font-semibold transition-all hover:opacity-90 gap-2"
              style={{ backgroundColor: '#E8B824', color: '#1A1A1A' }}
            >
              <Plus className="h-4 w-4" />
              Tambah Modul
            </Button>
          </div>
          
          {modules.length === 0 ? (
            <div className="text-center py-12 rounded-xl" style={{
              backgroundColor: 'rgba(255, 255, 252, 0.8)',
              borderColor: 'rgba(232, 184, 36, 0.2)',
              borderWidth: '1px'
            }}>
              <div className="p-4 bg-yellow-100 rounded-full inline-flex mb-4">
                <BookOpen className="h-12 w-12 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "#1A1A1A" }}>
                Belum ada modul
              </h3>
              <p className="mb-6" style={{ color: "#4A4A4A" }}>
                Mulai dengan membuat modul pertama untuk kursus Anda
              </p>
              <Button 
                onClick={() => setAddModalState({
                  isOpen: true,
                  type: "module",
                  moduleId: undefined
                })} 
                className="font-semibold transition-all hover:opacity-90 gap-2"
                style={{ backgroundColor: '#E8B824', color: '#1A1A1A' }}
              >
                <Plus className="h-4 w-4" />
                Buat Modul Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {modules.map((module) => (
                <Card key={module.id} className="overflow-hidden" style={{
                  backgroundColor: 'rgba(255, 255, 252, 0.8)',
                  borderColor: 'rgba(232, 184, 36, 0.2)',
                  borderWidth: '1px'
                }}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{backgroundColor: '#E8B824'}}>
                          <BookOpen className="h-5 w-5" style={{color: '#1E1E1E'}} />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>
                            {module.title}
                          </CardTitle>
                          <p className="text-sm" style={{ color: "#4A4A4A" }}>
                            {module.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleModule(module.id)}
                          className="p-2 rounded-lg hover:bg-yellow-50 transition-colors"
                        >
                          <ChevronDown 
                            className={`h-4 w-4 transition-transform ${
                              expandedModules.has(module.id) ? 'rotate-180' : ''
                            }`} 
                            style={{ color: '#E8B824' }} 
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditModalState({
                            isOpen: true,
                            type: "module",
                            initialData: module
                          })}
                          className="p-2 rounded-lg hover:bg-yellow-50 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" style={{ color: '#E8B824' }} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteModule(module.id)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {expandedModules.has(module.id) && (
                    <CardContent className="pt-0 pb-6">
                      <div className="space-y-6">
                        {/* Lessons */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-green-500 rounded">
                                <FileText className="h-3 w-3 text-white" />
                              </div>
                              <div className="text-sm font-bold text-green-800">
                                Lessons ({lessons.filter(l => l.module_id === module.id).length})
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => setAddModalState({
                                isOpen: true,
                                type: "lesson",
                                moduleId: module.id
                              })}
                              className="gap-1 h-7 text-xs font-semibold"
                              style={{ backgroundColor: '#E8B824', color: '#1A1A1A' }}
                            >
                              <Plus className="h-3 w-3" />
                              Add
                            </Button>
                          </div>
                          {lessons.filter(l => l.module_id === module.id).map((lesson) => {
                            // Get exercises for this lesson
                            const lessonExercises = exercises.filter(e => e.lesson_id === lesson.id);
                            
                            return (
                              <div key={lesson.id} className="mb-4">
                                {/* Lesson Header */}
                                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200 hover:bg-green-50 hover:shadow-md transition-all duration-200">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 bg-green-100 rounded">
                                      <FileText className="h-3 w-3 text-green-600" />
                                    </div>
                                    <span className="text-sm font-medium">{lesson.title}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onPreviewLesson(lesson)}
                                      className="p-1 h-6 w-6 rounded hover:bg-green-50"
                                    >
                                      <Eye className="h-3 w-3 text-green-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditModalState({
                                        isOpen: true,
                                        type: "lesson",
                                        initialData: lesson
                                      })}
                                      className="p-1 h-6 w-6 rounded hover:bg-green-50"
                                    >
                                      <Edit2 className="h-3 w-3 text-green-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onDeleteLesson(lesson.id)}
                                      className="p-1 h-6 w-6 rounded hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3 w-3 text-red-600" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Exercise Management Section */}
                                <div className="ml-8 mt-2 space-y-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-purple-700">Exercises ({lessonExercises.length}/2)</span>
                                    <div className="flex gap-1">
                                      {lessonExercises.length < 2 && (
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            // Open ExerciseBuilderModal with lesson context
                                            const exerciseNumber = lessonExercises.length + 1;
                                            setEditingExercise({
                                              lesson_id: lesson.id,
                                              lesson_title: lesson.title,
                                              exercise_number: exerciseNumber,
                                              exercise_type: 'multiple_choice'
                                            });
                                            setShowExerciseBuilder(true);
                                          }}
                                          className="gap-1 h-6 text-xs"
                                          style={{ backgroundColor: '#E8B824', color: '#1A1A1A' }}
                                        >
                                          <Plus className="h-3 w-3" />
                                          Exercise {lessonExercises.length + 1}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Exercise Items */}
                                  <div className="space-y-1">
                                    {/* Exercise 1 */}
                                    {lessonExercises.find(e => e.exercise_number === 1) ? (
                                      <div className="flex items-center justify-between p-2 bg-purple-50 rounded border border-purple-200">
                                        <div className="flex items-center gap-2">
                                          <div className="p-1 bg-purple-200 rounded">
                                            <Brain className="h-2 w-2 text-purple-700" />
                                          </div>
                                          <div>
                                            <span className="text-xs font-medium text-purple-700">
                                              Exercise 1: {lessonExercises.find(e => e.exercise_number === 1)?.title || 'Untitled'}
                                            </span>
                                            <span className="text-xs text-purple-500 ml-1">
                                              ({lessonExercises.find(e => e.exercise_number === 1)?.exercise_type})
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onPreviewExercise(lessonExercises.find(e => e.exercise_number === 1))}
                                            className="p-1 h-5 w-5 rounded hover:bg-purple-100"
                                          >
                                            <Eye className="h-2 w-2 text-purple-600" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEditExercise(lessonExercises.find(e => e.exercise_number === 1))}
                                            className="p-1 h-5 w-5 rounded hover:bg-purple-100"
                                          >
                                            <Edit2 className="h-2 w-2 text-purple-600" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDeleteExercise(lessonExercises.find(e => e.exercise_number === 1)?.id)}
                                            className="p-1 h-5 w-5 rounded hover:bg-red-100"
                                          >
                                            <Trash2 className="h-2 w-2 text-red-600" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                        <div className="flex items-center gap-2">
                                          <div className="p-1 bg-gray-200 rounded">
                                            <Brain className="h-2 w-2 text-gray-400" />
                                          </div>
                                          <span className="text-xs text-gray-500">Exercise 1: (Empty)</span>
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setEditingExercise({
                                              lesson_id: lesson.id,
                                              lesson_title: lesson.title,
                                              exercise_number: 1,
                                              exercise_type: 'multiple_choice'
                                            });
                                            setShowExerciseBuilder(true);
                                          }}
                                          className="gap-1 h-5 text-xs"
                                          style={{ backgroundColor: '#E8B824', color: '#1A1A1A' }}
                                        >
                                          <Plus className="h-2 w-2" />
                                          Add
                                        </Button>
                                      </div>
                                    )}
                                    
                                    {/* Exercise 2 */}
                                    {lessonExercises.find(e => e.exercise_number === 2) ? (
                                      <div className="flex items-center justify-between p-2 bg-purple-50 rounded border border-purple-200">
                                        <div className="flex items-center gap-2">
                                          <div className="p-1 bg-purple-200 rounded">
                                            <Brain className="h-2 w-2 text-purple-700" />
                                          </div>
                                          <div>
                                            <span className="text-xs font-medium text-purple-700">
                                              Exercise 2: {lessonExercises.find(e => e.exercise_number === 2)?.title || 'Untitled'}
                                            </span>
                                            <span className="text-xs text-purple-500 ml-1">
                                              ({lessonExercises.find(e => e.exercise_number === 2)?.exercise_type})
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onPreviewExercise(lessonExercises.find(e => e.exercise_number === 2))}
                                            className="p-1 h-5 w-5 rounded hover:bg-purple-100"
                                          >
                                            <Eye className="h-2 w-2 text-purple-600" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEditExercise(lessonExercises.find(e => e.exercise_number === 2))}
                                            className="p-1 h-5 w-5 rounded hover:bg-purple-100"
                                          >
                                            <Edit2 className="h-2 w-2 text-purple-600" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDeleteExercise(lessonExercises.find(e => e.exercise_number === 2)?.id)}
                                            className="p-1 h-5 w-5 rounded hover:bg-red-100"
                                          >
                                            <Trash2 className="h-2 w-2 text-red-600" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                        <div className="flex items-center gap-2">
                                          <div className="p-1 bg-gray-200 rounded">
                                            <Brain className="h-2 w-2 text-gray-400" />
                                          </div>
                                          <span className="text-xs text-gray-500">Exercise 2: (Empty)</span>
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setEditModalState({
                                              isOpen: true,
                                              type: "exercise",
                                              initialData: {
                                                lesson_id: lesson.id,
                                                lesson_title: lesson.title,
                                                exercise_number: 2,
                                                exercise_type: 'multiple_choice'
                                              }
                                            });
                                          }}
                                          className="gap-1 h-5 text-xs"
                                          style={{ backgroundColor: '#E8B824', color: '#1A1A1A' }}
                                        >
                                          <Plus className="h-2 w-2" />
                                          Add
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {lessons.filter(l => l.module_id === module.id).length === 0 && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              Belum ada pelajaran
                            </div>
                          )}
                        </div>

                        {/* Materials */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-orange-500 rounded">
                                <Video className="h-3 w-3 text-white" />
                              </div>
                              <div className="text-sm font-bold text-orange-800">
                                Materials ({materials.filter(m => {
                                  const lessonIds = lessons.filter(l => l.module_id === module.id).map(l => l.id);
                                  return lessonIds.includes(m.lesson_id);
                                }).length})
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => setAddModalState({
                                isOpen: true,
                                type: "material",
                                moduleId: module.id
                              })}
                              className="gap-1 h-7 text-xs font-semibold"
                              style={{ backgroundColor: '#E8B824', color: '#1A1A1A' }}
                            >
                              <Plus className="h-3 w-3" />
                              Add
                            </Button>
                          </div>
                          {materials.filter(m => {
                            const lessonIds = lessons.filter(l => l.module_id === module.id).map(l => l.id);
                            return lessonIds.includes(m.lesson_id);
                          }).map((material) => (
                            <div key={material.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200 hover:bg-orange-50 hover:shadow-md transition-all duration-200 mb-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1 bg-orange-100 rounded">
                                  <Video className="h-3 w-3 text-orange-600" />
                                </div>
                                <span className="text-sm font-medium">{material.title}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onPreviewMaterial(material)}
                                  className="p-1 h-6 w-6 rounded hover:bg-orange-50"
                                >
                                  <Eye className="h-3 w-3 text-orange-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditModalState({
                                    isOpen: true,
                                    type: "material",
                                    initialData: material
                                  })}
                                  className="p-1 h-6 w-6 rounded hover:bg-orange-50"
                                >
                                  <Edit2 className="h-3 w-3 text-orange-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDeleteMaterial(material.id)}
                                  className="p-1 h-6 w-6 rounded hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {materials.filter(m => {
                            const lessonIds = lessons.filter(l => l.module_id === module.id).map(l => l.id);
                            return lessonIds.includes(m.lesson_id);
                          }).length === 0 && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              Belum ada materi
                            </div>
                          )}
                        </div>

                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Content Modal */}
      <EditContentModal
        isOpen={editModalState.isOpen}
        onClose={() => setEditModalState(prev => ({ ...prev, isOpen: false }))}
        type={editModalState.type}
        initialData={editModalState.initialData}
        onSave={async (data) => {
          try {
            if (editModalState.type === "module") {
              await onEditModule && onEditModule(data);
            } else if (editModalState.type === "lesson") {
              await onEditLesson && onEditLesson(data);
            } else if (editModalState.type === "material") {
              await onEditMaterial && onEditMaterial(data);
            }
            // Note: Exercise type is handled by ExerciseBuilderModal, not EditContentModal
          } catch (error) {
            console.error("Edit failed:", error);
          }
        }}
      />

      {/* Add Content Modal */}
      <AddContentModal
        isOpen={addModalState.isOpen}
        onClose={() => setAddModalState(prev => ({ ...prev, isOpen: false }))}
        type={addModalState.type}
        moduleId={addModalState.moduleId}
        onSave={async (data) => {
          try {
            if (addModalState.type === "module") {
              await onAddModule && onAddModule(data);
            } else if (addModalState.type === "lesson") {
              await onAddLesson && onAddLesson(data);
            } else if (addModalState.type === "material") {
              await onAddMaterial && onAddMaterial(data);
            } else if (addModalState.type === "exercise") {
              await onAddExercise && onAddExercise(data);
            }
          } catch (error) {
            console.error("Add failed:", error);
          }
        }}
      />

      {/* Exercise Builder Modal */}
      <ExerciseBuilderModal
        isOpen={showExerciseBuilder}
        onClose={() => {
          setShowExerciseBuilder(false);
          setEditingExercise(null);
        }}
        onSave={async (data) => {
          try {
            await onAddExercise && onAddExercise(data);
            setShowExerciseBuilder(false);
            setEditingExercise(null);
          } catch (error) {
            console.error("Exercise builder failed:", error);
          }
        }}
        initialData={editingExercise}
        mode="create"
        lessonId={editingExercise?.lesson_id}
        lessonTitle={editingExercise?.lesson_title}
        exerciseNumber={editingExercise?.exercise_number}
        exerciseType={editingExercise?.exercise_type}
      />
    </div>
  );
}
