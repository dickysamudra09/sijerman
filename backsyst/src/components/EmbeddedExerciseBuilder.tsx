"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  GripVertical,
  Trash2,
  Edit,
  Brain,
  Eye,
  Settings,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  FileText,
  HelpCircle,
  Lightbulb,
} from "lucide-react";

interface ExerciseQuestion {
  id: string;
  type: "multiple_choice" | "true_false" | "essay" | "sentence_arrangement";
  question: string;
  points: number;
  options?: Array<{
    id: string;
    text: string;
    is_correct: boolean;
  }>;
  explanation?: string;
  ai_feedback_enabled: boolean;
}

interface EmbeddedExerciseBuilderProps {
  lessonId: string;
  onExerciseCreate: (exercise: ExerciseData) => void;
  onExerciseUpdate: (exerciseId: string, exercise: ExerciseData) => void;
  initialExercises?: ExerciseData[];
}

interface ExerciseData {
  id?: string;
  title: string;
  description: string;
  exercise_type: "mcq" | "essay" | "puzzle";
  questions: ExerciseQuestion[];
  ai_feedback_enabled: boolean;
  ai_feedback_type: "instant" | "delayed" | "batch";
  order_index: number;
}

export function EmbeddedExerciseBuilder({
  lessonId,
  onExerciseCreate,
  onExerciseUpdate,
  initialExercises = [],
}: EmbeddedExerciseBuilderProps) {
  const [exercises, setExercises] = useState<ExerciseData[]>(initialExercises);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [showAISettings, setShowAISettings] = useState<string | null>(null);

  const addExercise = () => {
    const newExercise: ExerciseData = {
      title: "Latihan Baru",
      description: "Deskripsi latihan",
      exercise_type: "mcq",
      questions: [],
      ai_feedback_enabled: true,
      ai_feedback_type: "instant",
      order_index: exercises.length,
    };
    
    setExercises([...exercises, newExercise]);
    setExpandedExercise(newExercise.id || `temp-${Date.now()}`);
  };

  const addQuestion = (exerciseId: string) => {
    const exerciseIndex = exercises.findIndex(ex => ex.id === exerciseId);
    if (exerciseIndex === -1) return;

    const newQuestion: ExerciseQuestion = {
      id: `q-${Date.now()}`,
      type: "multiple_choice",
      question: "Pertanyaan baru?",
      points: 10,
      options: [
        { id: "opt-1", text: "Opsi A", is_correct: true },
        { id: "opt-2", text: "Opsi B", is_correct: false },
        { id: "opt-3", text: "Opsi C", is_correct: false },
        { id: "opt-4", text: "Opsi D", is_correct: false },
      ],
      ai_feedback_enabled: true,
    };

    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      questions: [...updatedExercises[exerciseIndex].questions, newQuestion],
    };
    
    setExercises(updatedExercises);
    setEditingQuestion(newQuestion.id);
  };

  const updateQuestion = (exerciseId: string, questionId: string, updates: Partial<ExerciseQuestion>) => {
    const exerciseIndex = exercises.findIndex(ex => ex.id === exerciseId);
    if (exerciseIndex === -1) return;

    const updatedExercises = [...exercises];
    const questionIndex = updatedExercises[exerciseIndex].questions.findIndex(q => q.id === questionId);
    
    if (questionIndex !== -1) {
      updatedExercises[exerciseIndex].questions[questionIndex] = {
        ...updatedExercises[exerciseIndex].questions[questionIndex],
        ...updates,
      };
      setExercises(updatedExercises);
    }
  };

  const deleteQuestion = (exerciseId: string, questionId: string) => {
    const exerciseIndex = exercises.findIndex(ex => ex.id === exerciseId);
    if (exerciseIndex === -1) return;

    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].questions = updatedExercises[exerciseIndex].questions.filter(
      q => q.id !== questionId
    );
    
    setExercises(updatedExercises);
  };

  const saveExercise = (exercise: ExerciseData) => {
    if (exercise.id) {
      onExerciseUpdate(exercise.id, exercise);
    } else {
      onExerciseCreate({ ...exercise, id: `ex-${Date.now()}` });
    }
  };

  const getExerciseIcon = (type: string) => {
    switch (type) {
      case "mcq":
        return <HelpCircle className="h-4 w-4" />;
      case "essay":
        return <FileText className="h-4 w-4" />;
      case "puzzle":
        return <Dumbbell className="h-4 w-4" />;
      default:
        return <Dumbbell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5" style={{ color: "#E8B824" }} />
          <h3 className="text-lg font-bold">Latihan Terintegrasi</h3>
          <Badge variant="secondary" className="text-xs">
            {exercises.length} Latihan
          </Badge>
        </div>
        <Button
          onClick={addExercise}
          size="sm"
          className="gap-2"
          style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
        >
          <Plus className="h-4 w-4" />
          Tambah Latihan
        </Button>
      </div>

      {/* Exercises List */}
      <div className="space-y-4">
        {exercises.map((exercise, exerciseIndex) => (
          <Card key={exercise.id || `temp-${exerciseIndex}`} className="border-2">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedExercise(
                expandedExercise === (exercise.id || `temp-${exerciseIndex}`) 
                  ? null 
                  : (exercise.id || `temp-${exerciseIndex}`)
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getExerciseIcon(exercise.exercise_type)}
                  <div>
                    <CardTitle className="text-base">{exercise.title}</CardTitle>
                    <p className="text-sm text-gray-600">{exercise.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {exercise.questions.length} Soal
                  </Badge>
                  {exercise.ai_feedback_enabled && (
                    <Badge className="text-xs" style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}>
                      <Brain className="h-3 w-3 mr-1" />
                      AI
                    </Badge>
                  )}
                  {expandedExercise === (exercise.id || `temp-${exerciseIndex}`) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CardHeader>

            {expandedExercise === (exercise.id || `temp-${exerciseIndex}`) && (
              <CardContent className="space-y-4">
                {/* Exercise Settings */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor={`title-${exercise.id}`}>Judul Latihan</Label>
                    <Input
                      id={`title-${exercise.id}`}
                      value={exercise.title}
                      onChange={(e) => {
                        const updatedExercises = [...exercises];
                        updatedExercises[exerciseIndex] = {
                          ...updatedExercises[exerciseIndex],
                          title: e.target.value,
                        };
                        setExercises(updatedExercises);
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`type-${exercise.id}`}>Tipe Latihan</Label>
                    <Select
                      value={exercise.exercise_type}
                      onValueChange={(value: "mcq" | "essay" | "puzzle") => {
                        const updatedExercises = [...exercises];
                        updatedExercises[exerciseIndex] = {
                          ...updatedExercises[exerciseIndex],
                          exercise_type: value,
                        };
                        setExercises(updatedExercises);
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Pilihan Ganda</SelectItem>
                        <SelectItem value="essay">Essay</SelectItem>
                        <SelectItem value="puzzle">Puzzle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* AI Feedback Settings */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" style={{ color: "#E8B824" }} />
                      <Label className="font-semibold">AI Feedback</Label>
                    </div>
                    <Switch
                      checked={exercise.ai_feedback_enabled}
                      onCheckedChange={(enabled) => {
                        const updatedExercises = [...exercises];
                        updatedExercises[exerciseIndex] = {
                          ...updatedExercises[exerciseIndex],
                          ai_feedback_enabled: enabled,
                        };
                        setExercises(updatedExercises);
                      }}
                    />
                  </div>
                  
                  {exercise.ai_feedback_enabled && (
                    <div className="space-y-3">
                      <div>
                        <Label>Tipe Feedback</Label>
                        <Select
                          value={exercise.ai_feedback_type}
                          onValueChange={(value: "instant" | "delayed" | "batch") => {
                            const updatedExercises = [...exercises];
                            updatedExercises[exerciseIndex] = {
                              ...updatedExercises[exerciseIndex],
                              ai_feedback_type: value,
                            };
                            setExercises(updatedExercises);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instant">Instan</SelectItem>
                            <SelectItem value="delayed">Tertunda</SelectItem>
                            <SelectItem value="batch">Batch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setShowAISettings(
                          showAISettings === (exercise.id || `temp-${exerciseIndex}`) 
                            ? null 
                            : (exercise.id || `temp-${exerciseIndex}`)
                        )}
                      >
                        <Settings className="h-4 w-4" />
                        Konfigurasi AI Lanjutan
                      </Button>
                    </div>
                  )}
                </div>

                {/* Questions Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Pertanyaan</h4>
                    <Button
                      onClick={() => addQuestion(exercise.id || `temp-${exerciseIndex}`)}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Pertanyaan
                    </Button>
                  </div>

                  {exercise.questions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <HelpCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Belum ada pertanyaan</p>
                      <p className="text-sm">Tambahkan pertanyaan untuk memulai</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {exercise.questions.map((question, questionIndex) => (
                        <Card key={question.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-gray-400" />
                                <span className="font-semibold">Soal {questionIndex + 1}</span>
                                <Badge variant="outline" className="text-xs">
                                  {question.points} poin
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingQuestion(
                                    editingQuestion === question.id ? null : question.id
                                  )}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteQuestion(exercise.id || `temp-${exerciseIndex}`, question.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Question Content */}
                            <div className="space-y-3">
                              <div>
                                <Label>Pertanyaan</Label>
                                <Textarea
                                  value={question.question}
                                  onChange={(e) => updateQuestion(
                                    exercise.id || `temp-${exerciseIndex}`, 
                                    question.id, 
                                    { question: e.target.value }
                                  )}
                                  className="mt-1"
                                  rows={2}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Tipe Soal</Label>
                                  <Select
                                    value={question.type}
                                    onValueChange={(value: ExerciseQuestion["type"]) => updateQuestion(
                                      exercise.id || `temp-${exerciseIndex}`, 
                                      question.id, 
                                      { type: value }
                                    )}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
                                      <SelectItem value="true_false">Benar/Salah</SelectItem>
                                      <SelectItem value="essay">Essay</SelectItem>
                                      <SelectItem value="sentence_arrangement">Susun Kalimat</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Poin</Label>
                                  <Input
                                    type="number"
                                    value={question.points}
                                    onChange={(e) => updateQuestion(
                                      exercise.id || `temp-${exerciseIndex}`, 
                                      question.id, 
                                      { points: parseInt(e.target.value) || 0 }
                                    )}
                                    className="mt-1"
                                  />
                                </div>
                              </div>

                              {/* Options for MCQ */}
                              {question.type === "multiple_choice" && question.options && (
                                <div className="space-y-2">
                                  <Label>Opsi Jawaban</Label>
                                  {question.options.map((option, optionIndex) => (
                                    <div key={option.id} className="flex items-center gap-2">
                                      <Input
                                        value={option.text}
                                        onChange={(e) => {
                                          const updatedOptions = [...question.options!];
                                          updatedOptions[optionIndex] = {
                                            ...updatedOptions[optionIndex],
                                            text: e.target.value,
                                          };
                                          updateQuestion(
                                            exercise.id || `temp-${exerciseIndex}`, 
                                            question.id, 
                                            { options: updatedOptions }
                                          );
                                        }}
                                        placeholder={`Opsi ${String.fromCharCode(65 + optionIndex)}`}
                                        className="flex-1"
                                      />
                                      <Switch
                                        checked={option.is_correct}
                                        onCheckedChange={(correct) => {
                                          const updatedOptions = [...question.options!];
                                          updatedOptions[optionIndex] = {
                                            ...updatedOptions[optionIndex],
                                            is_correct: correct,
                                          };
                                          updateQuestion(
                                            exercise.id || `temp-${exerciseIndex}`, 
                                            question.id, 
                                            { options: updatedOptions }
                                          );
                                        }}
                                      />
                                      <span className="text-xs text-gray-500">
                                        {option.is_correct ? "Benar" : "Salah"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* AI Feedback per Question */}
                              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                                <Brain className="h-4 w-4" style={{ color: "#E8B824" }} />
                                <Label className="text-sm font-semibold">AI Feedback per Soal</Label>
                                <Switch
                                  checked={question.ai_feedback_enabled}
                                  onCheckedChange={(enabled) => updateQuestion(
                                    exercise.id || `temp-${exerciseIndex}`, 
                                    question.id, 
                                    { ai_feedback_enabled: enabled }
                                  )}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Preview functionality
                      console.log("Preview exercise:", exercise);
                    }}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    onClick={() => saveExercise(exercise)}
                    className="gap-2"
                    style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
                  >
                    <Plus className="h-4 w-4" />
                    Simpan Latihan
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {exercises.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <Dumbbell className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Belum Ada Latihan
            </h3>
            <p className="text-gray-500 mb-4">
              Tambahkan latihan untuk meningkatkan engagement siswa
            </p>
            <Button
              onClick={addExercise}
              className="gap-2"
              style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
            >
              <Plus className="h-4 w-4" />
              Buat Latihan Pertama
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
