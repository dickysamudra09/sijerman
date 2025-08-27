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
  GraduationCap,
  Copy,
  Eye,
  Edit3,
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
  const [userName, setUserName] = useState<string>("");
  const [classroomName, setClassroomName] = useState<string>("");
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

        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("name")
          .eq("id", userId)
          .single();

        if (userData) {
          setUserName(userData.name);
        }

        // Fetch classroom name
        if (classId) {
          const { data: classroomData, error: classroomError } = await supabase
            .from("classrooms")
            .select("name")
            .eq("id", classId)
            .single();

          if (classroomData) {
            setClassroomName(classroomData.name);
          } else {
            console.error("Failed to fetch classroom name:", classroomError);
          }
        }

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
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white shadow-2xl border-0 rounded-2xl">
            <CardContent className="flex items-center justify-center p-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Memuat latihan soal...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Main Card Container */}
        <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-gray-100 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => router.back()}
                  className="hover:bg-white/50 transition-colors border-gray-300 text-gray-600 shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-500 rounded-full shadow-lg">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Latihan Soal</h1>
                    <p className="text-gray-600">
                      Buat dan kelola latihan soal untuk kelas{" "}
                      <span className="font-semibold text-gray-800">
                        {classroomName || "..."}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {/* Create New Exercise Section */}
            <Card className="bg-gray-50 border border-gray-200 shadow-lg rounded-xl mb-8">
              <CardContent className="p-6">
                {!isCreating ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-sky-500 rounded-lg shadow-md">
                        <Plus className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Buat Latihan Soal Baru</h3>
                        <p className="text-gray-600">Mulai membuat set latihan soal untuk siswa</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setIsCreating(true)}
                      className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-lg"
                      size="lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Buat Baru
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-sky-500 rounded-lg">
                        <Plus className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">Buat Latihan Soal Baru</h3>
                    </div>
                    <div>
                      <Label className="block mb-3 text-sm font-semibold text-gray-700">Judul Latihan Soal</Label>
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Contoh: Latihan Soal Matematika Bab 1"
                        className="border-gray-300 focus:border-sky-500 focus:ring-sky-200 bg-white shadow-sm text-lg py-3"
                        onKeyPress={(e) => e.key === 'Enter' && createNewExercise()}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={createNewExercise}
                        disabled={!newTitle.trim() || isSaving}
                        className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3"
                      >
                        {isSaving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
                        className="border-gray-300 text-gray-600 hover:bg-gray-50 shadow-sm px-8 py-3"
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exercise Sets List */}
            <div className="space-y-6">
              {exerciseSets.length === 0 ? (
                <Card className="bg-white border border-gray-100 shadow-lg rounded-xl">
                  <CardContent className="p-12 text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
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
                <div className="grid grid-cols-1 gap-6">
                  {exerciseSets.map((exercise) => (
                    <Card key={exercise.id} className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
                      <div className="relative">
                        {/* Button Delete terpisah dari AccordionTrigger */}
                        <div className="absolute top-4 right-4 z-10">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteExerciseSet(exercise.id);
                            }}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Custom Accordion-like behavior */}
                        <button
                          className="w-full text-left focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-inset"
                          onClick={() => setEditingExercise(editingExercise === exercise.id ? null : exercise.id)}
                        >
                          <CardHeader className="p-6 pr-16 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-sky-600" />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-xl font-semibold text-gray-900 mb-2">
                                  {exercise.judul_latihan}
                                </CardTitle>
                                <div className="flex items-center gap-4">
                                  <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700 px-3 py-1">
                                    <Users className="h-4 w-4 mr-1" />
                                    {exercise.questions.length} Pertanyaan
                                  </Badge>
                                  {exercise.deadline_enabled && exercise.deadline && (
                                    <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 px-3 py-1">
                                      <Clock className="h-4 w-4 mr-1" />
                                      Deadline: {new Date(exercise.deadline).toLocaleDateString('id-ID')}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className="bg-sky-500 text-white">
                                  <Edit3 className="h-4 w-4 mr-1" />
                                  Edit
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                        </button>
                      </div>
                      
                      {editingExercise === exercise.id && (
                        <CardContent className="px-6 pb-6 bg-gray-50">
                          <div className="space-y-6">
                            {exercise.questions.map((question, qIndex) => (
                              <Card key={question.id} className="bg-white border border-gray-200 shadow-sm rounded-xl">
                                <CardContent className="p-6">
                                  <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-sky-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                                      {qIndex + 1}
                                    </div>
                                    <div className="flex-1 space-y-4">
                                      <div>
                                        <Label className="text-sm font-semibold text-gray-700 mb-3 block">
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
                                          className="border-gray-300 focus:border-sky-500 focus:ring-sky-200 bg-white shadow-sm min-h-[100px]"
                                          rows={3}
                                        />
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {question.options
                                          .sort((a, b) => a.order_index - b.order_index)
                                          .map((option, optIndex) => (
                                            <div key={option.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
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
                                                  className="w-4 h-4 text-sky-600 focus:ring-sky-500"
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
                                                  className="border-gray-300 focus:border-sky-500 focus:ring-sky-200 bg-white shadow-sm"
                                                />
                                              </div>
                                            </div>
                                          ))}
                                      </div>

                                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                        {!question.isSaved ? (
                                          <Button
                                            onClick={() => saveQuestion(exercise.id, question)}
                                            disabled={isSaving || !question.question_text.trim() || question.options.some(opt => !opt.option_text.trim())}
                                            className="bg-sky-500 hover:bg-sky-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
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
                                            className="bg-sky-500 hover:bg-sky-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
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
                                          className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 shadow-sm"
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
                              className="w-full bg-sky-500 hover:bg-sky-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
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
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}