"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  ArrowLeft, 
  Plus, 
  Save, 
  Trash2, 
  Clock, 
  Users, 
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Question {
  id: string;
  question_text: string;
  points: number;
  options: Option[];
  tempId?: string;
  isSaved?: boolean;
}

interface Option {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
  tempId?: string;
  isSaved?: boolean;
}

interface ExerciseSet {
  id: string;
  judul_latihan: string;
  deskripsi: string;
  deadline_enabled: boolean;
  deadline: string | null;
  max_attempts: number;
  time_limit_minutes: number | null;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  questions: Question[];
}

export default function LatihanSoalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [exerciseSets, setExerciseSets] = useState<ExerciseSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingExercise, setEditingExercise] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session?.user) {
          toast.error("Sesi tidak ditemukan. Silakan login.");
          router.push("/auth/login");
          return;
        }

        const userId = sessionData.session.user.id;
        setUserId(userId);

        await fetchExerciseSets(userId);
      } catch (error) {
        console.error("Error initializing data:", error);
        toast.error("Gagal memuat data");
      } finally {
        setIsLoading(false);
      }
    };

    if (classId) {
      initializeData();
    }
  }, [classId, router]);

  const fetchExerciseSets = async (userId: string) => {
    try {
      const { data: exerciseData, error } = await supabase
        .from("exercise_sets")
        .select(`
          *,
          questions (
            *,
            options (*)
          )
        `)
        .eq("kelas_id", classId)
        .eq("pembuat_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedData = exerciseData.map(exercise => ({
        ...exercise,
        questions: exercise.questions.map((q: any) => ({
          ...q,
          isSaved: true,
          options: q.options.map((o: any) => ({
            ...o,
            isSaved: true
          }))
        }))
      }));

      setExerciseSets(formattedData || []);
    } catch (error) {
      console.error("Error fetching exercise sets:", error);
      toast.error("Gagal memuat latihan soal");
    }
  };

  const createNewExercise = async () => {
    if (!newTitle.trim() || !userId || !classId) {
      toast.error("Judul latihan tidak boleh kosong");
      return;
    }

    setIsSaving(true);
    try {
        const { data: exerciseSet, error } = await supabase
        .from("exercise_sets")
        .insert({
            judul_latihan: newTitle.trim(),
            deskripsi: "",
            kelas_id: classId,
            pembuat_id: userId,
            deadline_enabled: false,
            max_attempts: 1,
            shuffle_questions: false,
            shuffle_options: false,
            is_active: true
        })
        .select()
        .single();

        if (error) throw error;

        // Tambahkan ini untuk menyimpan ke teacher_create
        const { error: teacherCreateError } = await supabase
        .from("teacher_create")
        .insert({
            judul: "latihan",
            sub_judul: newTitle.trim(),
            kelas: classId,
            pembuat: userId,
            jenis_create: "Latihan soal",
            konten: ""
        });

        if (teacherCreateError) throw teacherCreateError;

        const newExerciseSet: ExerciseSet = {
        ...exerciseSet,
        questions: []
        };


      setExerciseSets(prev => [newExerciseSet, ...prev]);
      setNewTitle("");
      setIsCreating(false);
      setEditingExercise(exerciseSet.id);
      
      toast.success("Latihan soal berhasil dibuat!");
    } catch (error) {
      console.error("Error creating exercise:", error);
      toast.error("Gagal membuat latihan soal");
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = (exerciseId: string) => {
    const currentExercise = exerciseSets.find(ex => ex.id === exerciseId);
    const orderIndex = (currentExercise?.questions.length || 0) + 1;

    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      question_text: "",
      points: 1.0,
      isSaved: false,
      options: Array.from({ length: 4 }, (_, index) => ({
        id: `temp-opt-${Date.now()}-${index}`,
        option_text: "",
        is_correct: index === 0,
        order_index: index + 1,
        isSaved: false
      }))
    };

    setExerciseSets(prev => 
      prev.map(exercise => 
        exercise.id === exerciseId 
          ? { ...exercise, questions: [...exercise.questions, newQuestion] }
          : exercise
      )
    );
  };

  const saveQuestion = async (exerciseId: string, question: Question) => {
    if (!userId || !question.question_text.trim()) {
      toast.error("Pertanyaan tidak boleh kosong");
      return;
    }

    setIsSaving(true);
    try {
      const { data: savedQuestion, error: questionError } = await supabase
        .from("questions")
        .insert({
          exercise_set_id: exerciseId,
          question_text: question.question_text,
          question_type: "multiple_choice",
          points: question.points,
          order_index: question.options.length + 1
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Save options
      const optionsToCreate = question.options.map(opt => ({
        question_id: savedQuestion.id,
        option_text: opt.option_text,
        is_correct: opt.is_correct,
        order_index: opt.order_index
      }));

      const { data: savedOptions, error: optionsError } = await supabase
        .from("options")
        .insert(optionsToCreate)
        .select();

      if (optionsError) throw optionsError;

      setExerciseSets(prev => 
        prev.map(exercise => 
          exercise.id === exerciseId 
            ? {
                ...exercise,
                questions: exercise.questions.map(q => 
                  q.id === question.id 
                    ? { 
                        ...savedQuestion, 
                        options: savedOptions,
                        isSaved: true
                      } 
                    : q
                )
              }
            : exercise
        )
      );

      toast.success("Pertanyaan berhasil disimpan!");
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Gagal menyimpan pertanyaan");
    } finally {
      setIsSaving(false);
    }
  };

  const updateQuestion = async (exerciseId: string, question: Question) => {
    if (!question.question_text.trim()) {
      toast.error("Pertanyaan tidak boleh kosong");
      return;
    }

    setIsSaving(true);
    try {
      // Update question
      const { error: questionError } = await supabase
        .from("questions")
        .update({ question_text: question.question_text })
        .eq("id", question.id);

      if (questionError) throw questionError;

      // Update options
      const optionUpdates = question.options.map(opt => 
        supabase
          .from("options")
          .update({
            option_text: opt.option_text,
            is_correct: opt.is_correct
          })
          .eq("id", opt.id)
      );

      await Promise.all(optionUpdates);

      setExerciseSets(prev => 
        prev.map(exercise => 
          exercise.id === exerciseId 
            ? {
                ...exercise,
                questions: exercise.questions.map(q => 
                  q.id === question.id ? { ...q, question_text: question.question_text } : q
                )
              }
            : exercise
        )
      );

      toast.success("Pertanyaan berhasil diupdate!");
    } catch (error) {
      console.error("Error updating question:", error);
      toast.error("Gagal mengupdate pertanyaan");
    } finally {
      setIsSaving(false);
    }
  };

  const updateOption = async (exerciseId: string, questionId: string, option: Option) => {
    if (!option.isSaved) {
      toast.error("Harap simpan pertanyaan terlebih dahulu");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("options")
        .update({ 
          option_text: option.option_text,
          is_correct: option.is_correct
        })
        .eq("id", option.id);

      if (error) throw error;

      setExerciseSets(prev => 
        prev.map(exercise => 
          exercise.id === exerciseId 
            ? {
                ...exercise,
                questions: exercise.questions.map(q => 
                  q.id === questionId 
                    ? {
                        ...q,
                        options: q.options.map(opt => 
                          opt.id === option.id 
                            ? { ...opt, option_text: option.option_text, is_correct: option.is_correct }
                            : opt
                        )
                      }
                    : q
                )
              }
            : exercise
        )
      );

      toast.success("Opsi berhasil diupdate!");
    } catch (error) {
      console.error("Error updating option:", error);
      toast.error("Gagal mengupdate opsi");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteQuestion = async (exerciseId: string, questionId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pertanyaan ini?")) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId);

      if (error) throw error;

      setExerciseSets(prev => 
        prev.map(exercise => 
          exercise.id === exerciseId 
            ? {
                ...exercise,
                questions: exercise.questions.filter(q => q.id !== questionId)
              }
            : exercise
        )
      );

      toast.success("Pertanyaan berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Gagal menghapus pertanyaan");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteExerciseSet = async (exerciseId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus latihan soal ini? Semua pertanyaan akan ikut terhapus.")) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("exercise_sets")
        .delete()
        .eq("id", exerciseId);

      if (error) throw error;

      setExerciseSets(prev => prev.filter(ex => ex.id !== exerciseId));
      toast.success("Latihan soal berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting exercise set:", error);
      toast.error("Gagal menghapus latihan soal");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat latihan soal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6 hover:bg-white/50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Latihan Soal
          </h1>
          <p className="text-gray-600 mb-6">
            Buat dan kelola latihan soal untuk kelas {classId}
          </p>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white mb-8">
            <CardContent className="p-6">
              {!isCreating ? (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Buat Latihan Soal Baru</h3>
                    <p className="text-indigo-100">Mulai membuat set latihan soal untuk siswa</p>
                  </div>
                  <Button 
                    onClick={() => setIsCreating(true)}
                    className="bg-white text-indigo-600 hover:bg-gray-100 transition-colors"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Buat Baru
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">Judul Latihan Soal</Label>
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Contoh: Latihan Soal Matematika Bab 1"
                      className="bg-white text-gray-900 border-0 focus:ring-2 focus:ring-white/50"
                      onKeyPress={(e) => e.key === 'Enter' && createNewExercise()}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={createNewExercise}
                      disabled={!newTitle.trim() || isSaving}
                      className="bg-white text-indigo-600 hover:bg-gray-100 transition-colors"
                    >
                      {isSaving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {isSaving ? "Menyimpan..." : "Simpan"}
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsCreating(false);
                        setNewTitle("");
                      }}
                      variant="outline"
                      className="border-white text-white hover:bg-white/10 transition-colors"
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {exerciseSets.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Belum Ada Latihan Soal
                </h3>
                <p className="text-gray-600 mb-6">
                  Mulai dengan membuat latihan soal pertama untuk siswa Anda
                </p>
              </CardContent>
            </Card>
          ) : (
            <Accordion 
              type="single" 
              collapsible 
              value={editingExercise || ""}
              onValueChange={setEditingExercise}
            >
              {exerciseSets.map((exercise) => (
                <AccordionItem key={exercise.id} value={exercise.id} className="border-0 mb-4">
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <AccordionTrigger className="hover:no-underline p-0">
                      <CardHeader className="w-full text-left p-6">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <CheckCircle className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-semibold text-gray-900">
                                {exercise.judul_latihan}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>{exercise.questions.length} Pertanyaan</span>
                                </div>
                                {exercise.deadline_enabled && exercise.deadline && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>Deadline: {new Date(exercise.deadline).toLocaleDateString('id-ID')}</span>
                                  </div>
                                )}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteExerciseSet(exercise.id);
                              }}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </AccordionTrigger>
                    
                    <AccordionContent className="p-0">
                      <CardContent className="px-6 pb-6">
                        <div className="space-y-6">
                          {exercise.questions.map((question, qIndex) => (
                            <Card key={question.id} className="bg-gray-50 border-0">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                                    {qIndex + 1}
                                  </div>
                                  <div className="flex-1 space-y-4">
                                    <div>
                                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Pertanyaan
                                      </Label>
                                      <Textarea
                                        value={question.question_text}
                                        onChange={(e) => 
                                          setExerciseSets(prev => 
                                            prev.map(ex => 
                                              ex.id === exercise.id
                                                ? {
                                                    ...ex,
                                                    questions: ex.questions.map(q => 
                                                      q.id === question.id 
                                                        ? { ...q, question_text: e.target.value }
                                                        : q
                                                    )
                                                  }
                                                : ex
                                            )
                                          )
                                        }
                                        placeholder="Masukkan pertanyaan di sini..."
                                        className="bg-white border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        rows={3}
                                        disabled={false}
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {question.options
                                        .sort((a, b) => a.order_index - b.order_index)
                                        .map((option, optIndex) => (
                                          <div key={option.id} className="flex items-center gap-3">
                                            <div className="flex items-center">
                                              <input
                                                type="radio"
                                                name={`correct-${question.id}`}
                                                checked={option.is_correct}
                                                onChange={() => {
                                                  setExerciseSets(prev => 
                                                    prev.map(ex => 
                                                      ex.id === exercise.id 
                                                        ? {
                                                            ...ex,
                                                            questions: ex.questions.map(q => 
                                                              q.id === question.id 
                                                                ? {
                                                                    ...q,
                                                                    options: q.options.map(opt => ({
                                                                      ...opt,
                                                                      is_correct: opt.id === option.id
                                                                    }))
                                                                  }
                                                                : q
                                                            )
                                                          }
                                                        : ex
                                                    )
                                                  );
                                                }}
                                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                                disabled={false}
                                              />
                                            </div>
                                            <div className="flex-1">
                                              <Input
                                                value={option.option_text}
                                                onChange={(e) => 
                                                  setExerciseSets(prev => 
                                                    prev.map(ex => 
                                                      ex.id === exercise.id 
                                                        ? {
                                                            ...ex,
                                                            questions: ex.questions.map(q => 
                                                              q.id === question.id 
                                                                ? {
                                                                    ...q,
                                                                    options: q.options.map(opt => 
                                                                      opt.id === option.id 
                                                                        ? { ...opt, option_text: e.target.value }
                                                                        : opt
                                                                    )
                                                                  }
                                                                : q
                                                            )
                                                          }
                                                        : ex
                                                    )
                                                  )
                                                }
                                                placeholder={`Pilihan ${String.fromCharCode(65 + optIndex)}`}
                                                className="bg-white border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                disabled={false}
                                              />
                                            </div>
                                          </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-end gap-2">
                                      {!question.isSaved ? (
                                        <Button
                                          onClick={() => saveQuestion(exercise.id, question)}
                                          disabled={isSaving || !question.question_text.trim() || question.options.some(opt => !opt.option_text.trim())}
                                          className="bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                                        >
                                          {isSaving ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                          ) : (
                                            <Save className="h-4 w-4 mr-2" />
                                          )}
                                          {isSaving ? "Menyimpan..." : "Simpan Pertanyaan"}
                                        </Button>
                                      ) : (
                                        <Button
                                          onClick={() => updateQuestion(exercise.id, question)}
                                          disabled={isSaving}
                                          className="bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                                        >
                                          {isSaving ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                          ) : (
                                            <Save className="h-4 w-4 mr-2" />
                                          )}
                                          {isSaving ? "Mengupdate..." : "Update Pertanyaan"}
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteQuestion(exercise.id, question.id)}
                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                        disabled={isSaving}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Hapus Pertanyaan
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}

                          <Button
                            onClick={() => {
                              const unsavedQuestions = exercise.questions.some(q => !q.isSaved);
                              if (unsavedQuestions) {
                                toast.error("Harap simpan semua pertanyaan terlebih dahulu");
                                return;
                              }
                              addQuestion(exercise.id);
                            }}
                            disabled={isSaving || exercise.questions.some(q => !q.isSaved)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                            size="lg"
                          >
                            {isSaving ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                            ) : (
                              <Plus className="h-5 w-5 mr-2" />
                            )}
                            Tambah Pertanyaan Baru
                          </Button>
                        </div>
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}