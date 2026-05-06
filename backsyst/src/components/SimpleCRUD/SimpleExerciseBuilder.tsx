"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  GripVertical,
} from "lucide-react";

interface SimpleQuestion {
  id: string;
  type: "multiple_choice" | "true_false";
  question: string;
  points: number;
  options?: Array<{
    id: string;
    text: string;
    is_correct: boolean;
  }>;
  explanation?: string;
}

interface SimpleExerciseData {
  id?: string;
  title: string;
  description: string;
  questions: SimpleQuestion[];
  ai_feedback_enabled: boolean;
  order_index: number;
  is_active: boolean;
}

interface SimpleExerciseBuilderProps {
  exercise?: SimpleExerciseData;
  onSave: (exercise: SimpleExerciseData) => Promise<void>;
  onPreview?: (exercise: SimpleExerciseData) => void;
  isLoading?: boolean;
}

export function SimpleExerciseBuilder({
  exercise,
  onSave,
  onPreview,
  isLoading = false,
}: SimpleExerciseBuilderProps) {
  const [formData, setFormData] = useState<SimpleExerciseData>({
    title: exercise?.title || "",
    description: exercise?.description || "",
    questions: exercise?.questions || [],
    ai_feedback_enabled: exercise?.ai_feedback_enabled || true,
    order_index: exercise?.order_index || 0,
    is_active: exercise?.is_active ?? true,
  });

  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);

  const addQuestion = () => {
    const newQuestion: SimpleQuestion = {
      id: `q-${Date.now()}`,
      type: "multiple_choice",
      question: "",
      points: 10,
      options: [
        { id: "opt-1", text: "", is_correct: true },
        { id: "opt-2", text: "", is_correct: false },
        { id: "opt-3", text: "", is_correct: false },
        { id: "opt-4", text: "", is_correct: false },
      ],
    };
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
    setEditingQuestion(newQuestion.id);
  };

  const updateQuestion = (questionId: string, updates: Partial<SimpleQuestion>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      ),
    }));
  };

  const deleteQuestion = (questionId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus soal ini?")) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId),
    }));
  };

  const saveExercise = async () => {
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const startEditQuestion = (question: SimpleQuestion) => {
    setEditingQuestion(question.id);
  };

  const cancelEditQuestion = () => {
    setEditingQuestion(null);
  };

  return (
    <div className="space-y-6">
      {/* Exercise Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Latihan</span>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.ai_feedback_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ai_feedback_enabled: checked }))}
              />
              <Label>AI Feedback</Label>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="exercise-title">Judul Latihan *</Label>
            <Input
              id="exercise-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Masukkan judul latihan"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="exercise-description">Deskripsi</Label>
            <Textarea
              id="exercise-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Deskripsi latihan (opsional)"
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="exercise-active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="exercise-active">Aktif</Label>
          </div>
        </CardContent>
      </Card>

      {/* Questions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Soal</CardTitle>
            <Button
              onClick={addQuestion}
              className="gap-2"
              style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
            >
              <Plus className="h-4 w-4" />
              Tambah Soal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {formData.questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="h-12 w-12 mx-auto mb-4 opacity-50">
                <Plus className="h-12 w-12" />
              </div>
              <p className="text-lg font-semibold mb-2">
                Belum Ada Soal
              </p>
              <p className="text-sm">
                Klik "Tambah Soal" untuk memulai membuat soal
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.questions.map((question, index) => (
                <Card key={question.id} className="border-l-4" style={{ borderLeftColor: "#E8B824" }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          Soal {index + 1}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {question.type === "multiple_choice" ? "Pilihan Ganda" : "Benar/Salah"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {question.points} poin
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditQuestion(question)}
                          className="gap-1"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteQuestion(question.id)}
                          className="gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {editingQuestion === question.id ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`question-${question.id}`}>Pertanyaan *</Label>
                          <Textarea
                            id={`question-${question.id}`}
                            value={question.question}
                            onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                            placeholder="Masukkan pertanyaan"
                            rows={3}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`points-${question.id}`}>Poin</Label>
                          <Input
                            id={`points-${question.id}`}
                            type="number"
                            value={question.points}
                            onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) || 0 })}
                            placeholder="Poin soal"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`type-${question.id}`}>Tipe Soal</Label>
                          <select
                            id={`type-${question.id}`}
                            value={question.type}
                            onChange={(e) => updateQuestion(question.id, { type: e.target.value as "multiple_choice" | "true_false" })}
                            className="mt-1 w-full p-2 border rounded"
                          >
                            <option value="multiple_choice">Pilihan Ganda</option>
                            <option value="true_false">Benar/Salah</option>
                          </select>
                        </div>

                        {question.type === "multiple_choice" && question.options && (
                          <div className="space-y-2">
                            <Label>Opsi Jawaban</Label>
                            {question.options.map((option, optIndex) => (
                              <div key={option.id} className="flex items-center gap-2">
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    name={`correct-${question.id}`}
                                    checked={option.is_correct}
                                    onChange={() => {
                                      const updatedOptions = question.options?.map(opt => ({
                                        ...opt,
                                        is_correct: opt.id === option.id,
                                      }));
                                      updateQuestion(question.id, { options: updatedOptions });
                                    }}
                                    className="mr-2"
                                  />
                                  <Input
                                    value={option.text}
                                    onChange={(e) => {
                                      const updatedOptions = question.options?.map(opt => 
                                        opt.id === option.id ? { ...opt, text: e.target.value } : opt
                                      );
                                      updateQuestion(question.id, { options: updatedOptions });
                                    }}
                                    placeholder={`Opsi ${String.fromCharCode(65 + optIndex)}`}
                                    className="flex-1"
                                  />
                                </div>
                                <Label className="text-xs">
                                  {option.is_correct ? "✓ Benar" : "Salah"}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}

                        {question.type === "true_false" && (
                          <div className="space-y-2">
                            <Label>Jawaban Benar/Salah</Label>
                            <div className="flex gap-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`tf-${question.id}`}
                                  checked={question.options?.[0]?.is_correct}
                                  onChange={() => {
                                    const updatedOptions = [
                                      { ...question.options![0], is_correct: true },
                                      { ...question.options![1], is_correct: false },
                                    ];
                                    updateQuestion(question.id, { options: updatedOptions });
                                  }}
                                  className="mr-2"
                                />
                                <Label>Benar</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`tf-${question.id}`}
                                  checked={question.options?.[1]?.is_correct}
                                  onChange={() => {
                                    const updatedOptions = [
                                      { ...question.options![0], is_correct: false },
                                      { ...question.options![1], is_correct: true },
                                    ];
                                    updateQuestion(question.id, { options: updatedOptions });
                                  }}
                                  className="mr-2"
                                />
                                <Label>Salah</Label>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={cancelEditQuestion}
                            className="flex-1"
                          >
                            Batal
                          </Button>
                          <Button
                            onClick={cancelEditQuestion}
                            className="flex-1 gap-2"
                            style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
                          >
                            <Save className="h-4 w-4" />
                            Simpan Soal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="space-y-4">
                        <div>
                          <Label>Pertanyaan</Label>
                          <div className="mt-2 p-3 bg-gray-50 rounded border">
                            <p className="text-sm">{question.question}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-xs">
                            {question.points} poin
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {question.type === "multiple_choice" ? "Pilihan Ganda" : "Benar/Salah"}
                          </Badge>
                        </div>

                        {question.type === "multiple_choice" && question.options && (
                          <div className="space-y-2">
                            <Label>Opsi Jawaban</Label>
                            {question.options.map((option, optIndex) => (
                              <div key={option.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                <div className="flex items-center">
                                  <div className={`w-4 h-4 rounded-full mr-2 ${
                                    option.is_correct ? 'bg-green-500' : 'bg-gray-300'
                                  }`}>
                                    {option.is_correct && (
                                      <span className="text-white text-xs">✓</span>
                                    )}
                                  </div>
                                  <span className="flex-1 text-sm">
                                    {String.fromCharCode(65 + optIndex)}. {option.text || "(kosong)"}
                                  </span>
                                </div>
                                <Label className="text-xs">
                                  {option.is_correct ? "✓ Benar" : "Salah"}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}

                        {question.type === "true_false" && question.options && (
                          <div className="space-y-2">
                            <Label>Jawaban Benar/Salah</Label>
                            <div className="flex gap-4">
                              <div className={`flex items-center gap-2 p-3 rounded ${
                                question.options[0].is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                              }`}>
                                <div className={`w-4 h-4 rounded-full mr-2 ${
                                  question.options[0].is_correct ? 'bg-green-500' : 'bg-gray-300'
                                }`}>
                                  {question.options[0].is_correct && (
                                    <span className="text-white text-xs">✓</span>
                                  )}
                                </div>
                                <span className="text-sm font-medium">
                                  {question.options[0].is_correct ? "Benar" : "Salah"}
                                </span>
                              </div>
                              <div className={`flex items-center gap-2 p-3 rounded ${
                                question.options[1].is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                              }`}>
                                <div className={`w-4 h-4 rounded-full mr-2 ${
                                  question.options[1].is_correct ? 'bg-green-500' : 'bg-gray-300'
                                }`}>
                                  {question.options[1].is_correct && (
                                    <span className="text-white text-xs">✓</span>
                                  )}
                                </div>
                                <span className="text-sm font-medium">
                                  {question.options[1].is_correct ? "Benar" : "Salah"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Statistics */}
          <div className="text-sm text-gray-600 text-center pt-4">
            Total: {formData.questions.length} soal • {formData.questions.reduce((sum, q) => sum + q.points, 0)} poin total
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {onPreview && (
          <Button
            variant="outline"
            onClick={() => onPreview(formData)}
            className="gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Preview Latihan
          </Button>
        )}
        <Button
          onClick={saveExercise}
          disabled={!formData.title.trim() || formData.questions.length === 0 || isLoading}
          className="gap-2"
          style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
        >
          <Save className="h-4 w-4" />
          {isLoading ? "Menyimpan..." : "Simpan Latihan"}
        </Button>
      </div>
    </div>
  );
}
