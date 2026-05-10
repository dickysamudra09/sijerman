"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Question {
  id: string;
  pertanyaan: string;  // Untuk multiple_choice
  perintah: string;    // Untuk true_false
  jawaban: string;     // Untuk true_false (jawaban text)
  jawaban_benar: boolean; // Untuk true/false (true=benar, false=salah)
  points: number;
  question_type: "multiple_choice" | "true_false";
  options: Option[];
  essay_config?: {
    max_length: number;
    min_length: number;
    expected_keywords: string[];
  };
  sentence_arrangement_config?: {
    complete_sentence: string;
    sentence_with_blanks: string;
    blank_words: string[];
    distractor_words: string[];
  };
  tempId?: string;
  isSaved?: boolean;
}

interface Option {
  id: string;
  jawaban: string;  // Changed from option_text to jawaban
  is_correct: boolean;
  order_index: number;
}

interface ExerciseBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any; // For edit mode
  mode?: "create" | "edit"; // For edit mode
  lessonId?: string; // For lesson-based exercise creation
  lessonTitle?: string; // For display purposes
  exerciseNumber?: number; // Exercise 1 or 2
  exerciseType?: string; // Default exercise type
}

export function ExerciseBuilderModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = "create",
  lessonId,
  lessonTitle,
  exerciseNumber = 1,
  exerciseType = 'multiple_choice',
}: ExerciseBuilderModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [exerciseTitle, setExerciseTitle] = useState("");
  const [exerciseDescription, setExerciseDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState(lessonId || "");
  const [selectedExerciseNumber, setSelectedExerciseNumber] = useState(exerciseNumber);
  const [selectedExerciseType, setSelectedExerciseType] = useState(exerciseType);

  // Load exercise data for edit mode
  useEffect(() => {
    if (mode === "edit" && initialData && isOpen) {
      // Load exercise basic info (use course_exercises fields)
      setExerciseTitle(initialData.title || "");
      setExerciseDescription(initialData.description || "");
      
      // Load questions and options (use course_questions and course_options)
      if (initialData.course_questions && initialData.course_questions.length > 0) {
        const loadedQuestions = initialData.course_questions.map((q: any) => ({
          id: q.id,
          pertanyaan: q.pertanyaan || "",           // Direct field mapping
          perintah: q.perintah || "",              // Direct field mapping
          jawaban: q.jawaban || "",                 // Direct field mapping
          jawaban_benar: q.jawaban_benar !== undefined ? q.jawaban_benar : true, // Direct field mapping
          question_type: q.question_type,
          points: q.points || 10,
          options: q.question_type === 'multiple_choice' && q.course_options ? q.course_options.map((opt: any) => ({
            id: opt.id,
            jawaban: opt.jawaban || "",            // Direct field mapping
            is_correct: opt.is_correct,
            order_index: opt.order_index || 1,
          })) : []  // True/false tidak menggunakan options
        }));
        setQuestions(loadedQuestions);
      } else {
        setQuestions([]);
      }
    } else if (mode === "create" && isOpen) {
      // Reset form for create mode
      setExerciseTitle("");
      setExerciseDescription("");
      setQuestions([]);
      
      // Set lesson-based values from initialData
      if (initialData) {
        setSelectedLessonId(initialData.lesson_id || "");
        setSelectedExerciseNumber(initialData.exercise_number || 1);
        setSelectedExerciseType(initialData.exercise_type || 'multiple_choice');
      }
    }
  }, [mode, initialData, isOpen]);

  const addQuestion = (type: "multiple_choice" | "true_false") => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      pertanyaan: type === "multiple_choice" ? "" : "",  // Hanya untuk multiple_choice
      perintah: type === "true_false" ? "" : "",        // Hanya untuk true_false
      jawaban: type === "true_false" ? "" : "",         // Hanya untuk true_false
      jawaban_benar: type === "true_false" ? true : false, // Default true untuk true_false
      question_type: type,
      points: 10,
      options: type === "multiple_choice" 
        ? [
            { id: `opt-${Date.now()}-1`, jawaban: "", is_correct: true, order_index: 1 },
            { id: `opt-${Date.now()}-2`, jawaban: "", is_correct: false, order_index: 2 },
            { id: `opt-${Date.now()}-3`, jawaban: "", is_correct: false, order_index: 3 },
            { id: `opt-${Date.now()}-4`, jawaban: "", is_correct: false, order_index: 4 },
          ]
        : []  // True/false tidak menggunakan options
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (questionId: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (questionId: string, optionId: string, field: keyof Option, value: any) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? {
            ...q,
            options: q.options.map(opt => 
              opt.id === optionId ? { ...opt, [field]: value } : opt
            )
          }
        : q
    ));
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const setCorrectAnswer = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? {
            ...q,
            options: q.options.map(opt => 
              opt.id === optionId ? { ...opt, is_correct: true } : { ...opt, is_correct: false }
            )
          }
        : q
    ));
  };

  const setTrueFalseAnswer = (questionId: string, isBenar: boolean) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, jawaban_benar: isBenar }
        : q
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseTitle.trim()) return;

    setIsLoading(true);
    try {
      // ✨ AUTO-DETECT exercise_type based on question_type
      // If all questions are true_false, set exercise_type to 'true_false'
      // If all questions are multiple_choice, set exercise_type to 'multiple_choice'
      // If mixed, use the first question's type
      const questionTypes = questions.map(q => q.question_type);
      const allTrueFalse = questionTypes.every(type => type === 'true_false');
      const allMultipleChoice = questionTypes.every(type => type === 'multiple_choice');
      
      let autoDetectedExerciseType: 'multiple_choice' | 'true_false';
      if (allTrueFalse) {
        autoDetectedExerciseType = 'true_false';
      } else if (allMultipleChoice) {
        autoDetectedExerciseType = 'multiple_choice';
      } else {
        // Mixed types - use first question's type
        autoDetectedExerciseType = questionTypes[0] || 'multiple_choice';
      }
      
      console.log('[ExerciseBuilder] Auto-detected exercise_type:', autoDetectedExerciseType, 'from questions:', questionTypes);
      
      // Transform data to match lesson-based course_exercises schema
      const transformedData = {
        title: exerciseTitle, // Direct field mapping
        description: exerciseDescription, // Direct field mapping
        lesson_id: selectedLessonId, // Lesson-based field
        exercise_number: selectedExerciseNumber, // Exercise 1 or 2
        exercise_type: autoDetectedExerciseType, // ✨ AUTO-DETECTED from questions
        is_active: true,
        course_questions: questions.map((q, index) => ({
          exercise_id: null, // Will be set after exercise is created
          pertanyaan: q.pertanyaan, // Direct field mapping
          perintah: q.question_type === 'true_false' ? q.perintah : "", // Direct field mapping
          jawaban: q.question_type === 'true_false' ? q.jawaban : "", // Direct field mapping
          jawaban_benar: q.question_type === 'true_false' ? q.jawaban_benar : true, // Direct field mapping
          question_type: q.question_type, // Direct field mapping
          points: q.points || 10,
          order_index: index + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          course_options: q.question_type === 'multiple_choice' ? q.options.map((opt, optIndex) => ({
            question_id: null, // Will be set after question is created
            jawaban: opt.jawaban, // Direct field mapping
            is_correct: opt.is_correct,
            order_index: optIndex + 1,
            created_at: new Date().toISOString(),
          })) : [] // True/false tidak menggunakan options
        }))
      };

      console.log("Creating new exercise:", transformedData);
      await onSave(transformedData);
      onClose();
    } catch (error) {
      console.error("Create failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card 
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl backdrop-blur-sm hover:scale-[1.01] transform transition-all duration-300" 
        style={{
          backgroundColor: 'rgba(255, 255, 252, 0.95)',
          borderColor: 'rgba(232, 184, 36, 0.2)',
          borderWidth: '1px'
        }}
      >
        {/* Gradient Top Border */}
        <div 
          className="h-1"
          style={{ background: 'linear-gradient(90deg, #E8B824 0%, rgba(232, 184, 36, 0) 100%)' }}
        ></div>
        
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg transform transition-transform hover:scale-110" style={{backgroundColor: '#E8B824'}}>
                <CheckCircle className="h-5 w-5" style={{color: '#1E1E1E'}} />
              </div>
              <div>
                <CardTitle className="text-xl font-bold mb-1" style={{ color: "#1A1A1A" }}>Buat Latihan Soal</CardTitle>
                <p className="text-sm" style={{ color: "#4A4A4A" }}>Pilihan ganda dan benar/salah</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-yellow-50 transition-colors"
            >
              <X className="h-5 w-5" style={{ color: '#E8B824' }} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 p-6">
          {/* Exercise Info */}
          <div 
            className="rounded-xl p-5 shadow-sm backdrop-blur-sm" 
            style={{
              backgroundColor: 'rgba(255, 255, 252, 0.8)',
              borderColor: 'rgba(232, 184, 36, 0.2)',
              borderWidth: '1px'
            }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: "#1A1A1A" }}>Informasi Latihan</h3>
            <div className="space-y-4">
              {/* Lesson Selection */}
              {mode === "create" && !lessonId && (
                <div>
                  <Label htmlFor="lesson" className="text-sm font-semibold mb-1" style={{ color: "#1A1A1A" }}>Pilih Lesson *</Label>
                  <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                    <SelectTrigger className="mt-1" style={{
                      backgroundColor: 'rgba(255, 255, 252, 0.8)',
                      borderColor: 'rgba(232, 184, 36, 0.2)',
                      borderWidth: '1px'
                    }}>
                      <SelectValue placeholder="Pilih lesson untuk exercise ini" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* This should be populated with actual lessons */}
                      <SelectItem value="lesson-1">Lesson 1.1 - Basic Concepts</SelectItem>
                      <SelectItem value="lesson-2">Lesson 1.2 - Advanced Topics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Exercise Number Selection */}
              {mode === "create" && (
                <div>
                  <Label htmlFor="exercise-number" className="text-sm font-semibold mb-1" style={{ color: "#1A1A1A" }}>Nomor Exercise *</Label>
                  <Select value={selectedExerciseNumber.toString()} onValueChange={(value) => setSelectedExerciseNumber(parseInt(value))}>
                    <SelectTrigger className="mt-1" style={{
                      backgroundColor: 'rgba(255, 255, 252, 0.8)',
                      borderColor: 'rgba(232, 184, 36, 0.2)',
                      borderWidth: '1px'
                    }}>
                      <SelectValue placeholder="Pilih nomor exercise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Exercise 1</SelectItem>
                      <SelectItem value="2">Exercise 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Exercise Type Selection */}
              {mode === "create" && (
                <div>
                  <Label htmlFor="exercise-type" className="text-sm font-semibold mb-1" style={{ color: "#1A1A1A" }}>Tipe Exercise *</Label>
                  <Select value={selectedExerciseType} onValueChange={setSelectedExerciseType}>
                    <SelectTrigger className="mt-1" style={{
                      backgroundColor: 'rgba(255, 255, 252, 0.8)',
                      borderColor: 'rgba(232, 184, 36, 0.2)',
                      borderWidth: '1px'
                    }}>
                      <SelectValue placeholder="Pilih tipe exercise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="true_false">True/False</SelectItem>
                      <SelectItem value="essay">Essay</SelectItem>
                      <SelectItem value="sentence_arrangement">Sentence Arrangement</SelectItem>
                      <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label htmlFor="title" className="text-sm font-semibold mb-1" style={{ color: "#1A1A1A" }}>Judul Latihan *</Label>
                <Input
                  id="title"
                  value={exerciseTitle}
                  onChange={(e) => setExerciseTitle(e.target.value)}
                  placeholder={lessonTitle ? `Exercise ${selectedExerciseNumber}: ${lessonTitle}` : "Masukkan judul latihan"}
                  className="mt-1"
                  style={{
                    backgroundColor: 'rgba(255, 255, 252, 0.8)',
                    borderColor: 'rgba(232, 184, 36, 0.2)',
                    borderWidth: '1px'
                  }}
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-semibold mb-1" style={{ color: "#1A1A1A" }}>Deskripsi</Label>
                <Textarea
                  id="description"
                  value={exerciseDescription}
                  onChange={(e) => setExerciseDescription(e.target.value)}
                  placeholder="Deskripsi latihan (opsional)"
                  rows={3}
                  className="mt-1"
                  style={{
                    backgroundColor: 'rgba(255, 255, 252, 0.8)',
                    borderColor: 'rgba(232, 184, 36, 0.2)',
                    borderWidth: '1px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div 
            className="rounded-xl p-5 shadow-sm backdrop-blur-sm" 
            style={{
              backgroundColor: 'rgba(255, 255, 252, 0.8)',
              borderColor: 'rgba(232, 184, 36, 0.2)',
              borderWidth: '1px'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>Pertanyaan ({questions.length})</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => addQuestion("multiple_choice")}
                  className="gap-1 text-xs font-semibold"
                  style={{ backgroundColor: '#E8B824', color: '#1A1A1A' }}
                >
                  <Plus className="h-3 w-3" />
                  Pilihan Ganda
                </Button>
                <Button
                  size="sm"
                  onClick={() => addQuestion("true_false")}
                  className="gap-1 text-xs font-semibold"
                  style={{ backgroundColor: '#E8B824', color: '#1A1A1A' }}
                >
                  <Plus className="h-3 w-3" />
                  Benar/Salah
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((question, qIndex) => (
                <Card key={question.id} className="p-4" style={{
                  backgroundColor: 'rgba(255, 255, 252, 0.8)',
                  borderColor: 'rgba(232, 184, 36, 0.2)',
                  borderWidth: '1px'
                }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: "#4A4A4A" }}>
                        Pertanyaan {qIndex + 1}
                      </span>
                      <span className="text-xs px-2 py-1 rounded" style={{
                        backgroundColor: 'rgba(232, 184, 36, 0.1)',
                        color: '#E8B824'
                      }}>
                        {question.question_type === 'multiple_choice' ? 'Pilihan Ganda' : 'Benar/Salah'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteQuestion(question.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {/* Field untuk Multiple Choice */}
                    {question.question_type === 'multiple_choice' && (
                      <div>
                        <Label className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Pertanyaan</Label>
                        <Textarea
                          value={question.pertanyaan}
                          onChange={(e) => updateQuestion(question.id, 'pertanyaan', e.target.value)}
                          placeholder="Masukkan pertanyaan"
                          rows={2}
                          className="mt-1"
                          style={{
                            backgroundColor: 'rgba(255, 255, 252, 0.8)',
                            borderColor: 'rgba(232, 184, 36, 0.2)',
                            borderWidth: '1px'
                          }}
                        />
                      </div>
                    )}

                    {/* Field untuk True/False */}
                    {question.question_type === 'true_false' && (
                      <>
                        <div>
                          <Label className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Perintah</Label>
                          <Textarea
                            value={question.perintah}
                            onChange={(e) => updateQuestion(question.id, 'perintah', e.target.value)}
                            placeholder="Masukkan perintah"
                            rows={2}
                            className="mt-1"
                            style={{
                              backgroundColor: 'rgba(255, 255, 252, 0.8)',
                              borderColor: 'rgba(232, 184, 36, 0.2)',
                              borderWidth: '1px'
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Jawaban</Label>
                          <Input
                            value={question.jawaban}
                            onChange={(e) => updateQuestion(question.id, 'jawaban', e.target.value)}
                            placeholder="Masukkan jawaban"
                            className="mt-1"
                            style={{
                              backgroundColor: 'rgba(255, 255, 252, 0.8)',
                              borderColor: 'rgba(232, 184, 36, 0.2)',
                              borderWidth: '1px'
                            }}
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <Label className="text-sm font-semibold mb-2 block" style={{ color: "#1A1A1A" }}>
                        {question.question_type === 'multiple_choice' ? 'Pilihan Jawaban' : 'Pilih Jawaban Benar/Salah'}
                      </Label>
                      
                      {/* Multiple Choice Options */}
                      {question.question_type === 'multiple_choice' && (
                        <div className="space-y-2">
                          {question.options.map((option, oIndex) => (
                            <div key={option.id} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={option.is_correct}
                                onChange={() => setCorrectAnswer(question.id, option.id)}
                                className="w-4 h-4"
                                style={{ accentColor: '#E8B824' }}
                              />
                              <Input
                                value={option.jawaban}
                                onChange={(e) => updateOption(question.id, option.id, 'jawaban', e.target.value)}
                                placeholder={`Pilihan ${String.fromCharCode(65 + oIndex)}`}
                                className="flex-1"
                                style={{
                                  backgroundColor: 'rgba(255, 255, 252, 0.8)',
                                  borderColor: 'rgba(232, 184, 36, 0.2)',
                                  borderWidth: '1px'
                                }}
                              />
                              {option.is_correct && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* True/False Buttons */}
                      {question.question_type === 'true_false' && (
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            onClick={() => setTrueFalseAnswer(question.id, true)}
                            className={`flex-1 font-semibold transition-all ${
                              question.jawaban_benar 
                                ? 'bg-green-500 text-white hover:bg-green-600' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            style={{
                              ...(question.jawaban_benar ? {} : {
                                backgroundColor: 'rgba(232, 184, 36, 0.2)',
                                borderColor: 'rgba(232, 184, 36, 0.3)',
                                borderWidth: '1px',
                                color: '#1A1A1A'
                              })
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Benar
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setTrueFalseAnswer(question.id, false)}
                            className={`flex-1 font-semibold transition-all ${
                              !question.jawaban_benar 
                                ? 'bg-red-500 text-white hover:bg-red-600' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            style={{
                              ...(!question.jawaban_benar ? {} : {
                                backgroundColor: 'rgba(232, 184, 36, 0.2)',
                                borderColor: 'rgba(232, 184, 36, 0.3)',
                                borderWidth: '1px',
                                color: '#1A1A1A'
                              })
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Salah
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {questions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Belum ada pertanyaan. Tambah pertanyaan untuk memulai.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid rgba(232, 184, 36, 0.2)' }}>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 font-semibold"
              style={{
                backgroundColor: 'rgba(255, 255, 252, 0.8)',
                borderColor: 'rgba(232, 184, 36, 0.2)',
                borderWidth: '1px',
                color: '#1A1A1A'
              }}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!exerciseTitle.trim() || questions.length === 0 || isLoading}
              className="flex-1 gap-2 font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: '#E8B824', color: '#1A1A1A' }}
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Menyimpan..." : "Simpan Latihan"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
