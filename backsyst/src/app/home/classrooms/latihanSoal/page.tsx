"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FileText,
  List,
  Star,
  Move,
  Square,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface Option {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
  sentence_fragment?: string;
  correct_order?: number;
  is_blank_position?: boolean;
  tempId?: string;
  isSaved?: boolean;
}

interface Question {
  id: string;
  question_text: string;
  points: number;
  question_type: 'multiple_choice' | 'essay' | 'sentence_arrangement';
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
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>("");
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
          // Tambahkan config sentence_arrangement dari question_text
          sentence_arrangement_config: q.question_type === 'sentence_arrangement' ? { complete_sentence: q.question_text } : q.sentence_arrangement_config,
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

  const addQuestion = (exerciseId: string, questionType: string) => {
    const currentExercise = exerciseSets.find(ex => ex.id === exerciseId);
    const orderIndex = (currentExercise?.questions.length || 0) + 1;

    let newQuestion: Question = {
      id: `temp-${Date.now()}`,
      question_text: "",
      points: 10,
      question_type: questionType as 'multiple_choice' | 'essay' | 'sentence_arrangement',
      isSaved: false,
      options: []
    };

    // Setup berdasarkan tipe pertanyaan
    if (questionType === 'multiple_choice') {
      newQuestion.options = Array.from({ length: 4 }, (_, index) => ({
        id: `temp-opt-${Date.now()}-${index}`,
        option_text: "",
        is_correct: index === 0,
        order_index: index + 1,
        isSaved: false
      }));
    } else if (questionType === 'essay') {
      newQuestion.essay_config = {
        max_length: 500,
        min_length: 50,
        expected_keywords: []
      };
    } else if (questionType === 'sentence_arrangement') {
      newQuestion.sentence_arrangement_config = {
        complete_sentence: "",
        sentence_with_blanks: "",
        blank_words: [],
        distractor_words: []
      };
      newQuestion.options = [];
    }

    setExerciseSets(prev => 
      prev.map(exercise => 
        exercise.id === exerciseId 
          ? { ...exercise, questions: [...exercise.questions, newQuestion] }
          : exercise
      )
    );
  };

  // Fungsi untuk mengcreate sentence dengan blanks dan extract kata-kata yang kosong
  const createSentenceWithBlanks = (completeSentence: string, blankPositions: number[]): { 
    sentenceWithBlanks: string; 
    blankWords: string[]; 
  } => {
    const words = completeSentence.split(' ');
    const blankWords: string[] = [];
    const sentenceWords = words.map((word, index) => {
      if (blankPositions.includes(index)) {
        blankWords.push(word);
        return '___';
      }
      return word;
    });
    
    return {
      sentenceWithBlanks: sentenceWords.join(' '),
      blankWords: blankWords
    };
  };

  // Fungsi untuk auto-generate blanks dari kalimat
  const autoGenerateBlanks = (exerciseId: string, questionId: string, completeSentence: string) => {
    const words = completeSentence.split(' ').filter(word => word.trim().length > 0);
    
    if (words.length < 3) {
      toast.error("Kalimat terlalu pendek untuk dijadikan puzzle");
      return;
    }

    // Ambil 2-3 kata secara acak untuk dijadikan blank (tapi tidak lebih dari 50% kata)
    const maxBlanks = Math.min(3, Math.floor(words.length / 2));
    const blankCount = Math.max(1, Math.min(maxBlanks, 2));
    
    const blankPositions: number[] = [];
    while (blankPositions.length < blankCount) {
      const randomIndex = Math.floor(Math.random() * words.length);
      if (!blankPositions.includes(randomIndex)) {
        blankPositions.push(randomIndex);
      }
    }
    
    const { sentenceWithBlanks, blankWords } = createSentenceWithBlanks(completeSentence, blankPositions);
    
    // Generate beberapa distractor words
    const commonWords = ['dan', 'atau', 'tetapi', 'karena', 'jika', 'maka', 'untuk', 'dari', 'ke', 'di', 'pada'];
    const distractorWords = commonWords.filter(word => 
      !blankWords.includes(word) && !words.includes(word)
    ).slice(0, 2);

    setExerciseSets(prev => 
      prev.map(exercise => 
        exercise.id === exerciseId 
          ? {
              ...exercise,
              questions: exercise.questions.map(q => 
                q.id === questionId 
                  ? {
                      ...q,
                      sentence_arrangement_config: {
                        complete_sentence: completeSentence,
                        sentence_with_blanks: sentenceWithBlanks,
                        blank_words: blankWords,
                        distractor_words: distractorWords
                      }
                    }
                  : q
              )
            }
          : exercise
      )
    );
  };

  const saveQuestion = async (exerciseId: string, question: Question) => {
    // Validasi dasar
    if (!userId) {
      toast.error("User ID tidak ditemukan. Silakan login ulang.");
      return;
    }
    if (!question.question_text.trim()) {
      toast.error("Pertanyaan tidak boleh kosong");
      return;
    }

    // Validasi berdasarkan tipe pertanyaan
    if (question.question_type === 'multiple_choice') {
      if (question.options.some(opt => !opt.option_text.trim())) {
        toast.error("Semua pilihan jawaban harus diisi");
        return;
      }
    } else if (question.question_type === 'sentence_arrangement') {
      if (!question.question_text.trim()) {
        toast.error("Kalimat lengkap harus diisi");
        return;
      }
      if (!question.sentence_arrangement_config?.blank_words?.length) {
        toast.error("Belum ada kata yang dijadikan blank. Gunakan tombol 'Auto Generate Puzzle'");
        return;
      }
    }

    setIsSaving(true);
    try {
      let questionConfig = {};
      
      if (question.question_type === 'essay' && question.essay_config) {
        questionConfig = { essay_config: question.essay_config };
      } else if (question.question_type === 'sentence_arrangement' && question.sentence_arrangement_config) {
        questionConfig = { sentence_arrangement_config: question.sentence_arrangement_config };
      }

      const { data: savedQuestion, error: questionError } = await supabase
        .from("questions")
        .insert({
          exercise_set_id: exerciseId,
          question_text: question.question_text,
          question_type: question.question_type,
          points: question.points,
          order_index: question.options.length + 1,
          ...questionConfig
        })
        .select()
        .single();

      if (questionError) {
        console.error("Question save error:", questionError);
        throw questionError;
      }

      let savedOptions: any[] = [];

      // Save options berdasarkan tipe pertanyaan
      if (question.question_type === 'multiple_choice' && question.options.length > 0) {
        const optionsToCreate = question.options.map(opt => ({
          question_id: savedQuestion.id,
          option_text: opt.option_text,
          is_correct: opt.is_correct,
          order_index: opt.order_index
        }));

        const { data: optionsData, error: optionsError } = await supabase
          .from("options")
          .insert(optionsToCreate)
          .select();

        if (optionsError) {
          console.error("Options save error:", optionsError);
          throw optionsError;
        }
        savedOptions = optionsData || [];
      } else if (question.question_type === 'sentence_arrangement' && question.sentence_arrangement_config) {
        // Buat options untuk blank words dan distractor words
        const config = question.sentence_arrangement_config;
        const allWords = [...(config.blank_words || []), ...(config.distractor_words || [])];
        
        if (allWords.length > 0) {
          const wordOptions = allWords.map((word, index) => ({
            question_id: savedQuestion.id,
            option_text: word,
            sentence_fragment: word,
            is_blank_position: (config.blank_words || []).includes(word),
            order_index: index + 1,
            is_correct: (config.blank_words || []).includes(word)
          }));

          const { data: optionsData, error: optionsError } = await supabase
            .from("options")
            .insert(wordOptions)
            .select();

          if (optionsError) {
            console.error("Sentence arrangement options save error:", optionsError);
            throw optionsError;
          }
          savedOptions = optionsData || [];
        }
      }

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
                        isSaved: true,
                        essay_config: question.essay_config,
                        sentence_arrangement_config: question.sentence_arrangement_config
                      } 
                    : q
                )
              }
            : exercise
        )
      );

      toast.success("Pertanyaan berhasil disimpan!");
    } catch (error) {
      console.error("Error saving question - Full error details:", {
        error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        questionType: question.question_type,
        exerciseId
      });
      
      let errorMessage = "Gagal menyimpan pertanyaan";
      
      if (error instanceof Error) {
        errorMessage = `Gagal menyimpan pertanyaan: ${error.message}`;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `Gagal menyimpan pertanyaan: ${error.message}`;
      } else if (typeof error === 'string') {
        errorMessage = `Gagal menyimpan pertanyaan: ${error}`;
      } else {
        errorMessage = "Gagal menyimpan pertanyaan. Periksa console untuk detail error.";
      }
      
      toast.error(errorMessage);
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
      let updateData: any = {
        question_text: question.question_text,
        points: question.points
      };
      
      if (question.question_type === 'essay' && question.essay_config) {
        updateData.essay_config = question.essay_config;
      } else if (question.question_type === 'sentence_arrangement' && question.sentence_arrangement_config) {
        updateData.sentence_arrangement_config = question.sentence_arrangement_config;
      }

      // Update question
      const { error: questionError } = await supabase
        .from("questions")
        .update(updateData)
        .eq("id", question.id);

      if (questionError) throw questionError;

      // Update options berdasarkan tipe pertanyaan
      if (question.question_type === 'multiple_choice') {
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
      }

      setExerciseSets(prev => 
        prev.map(exercise => 
          exercise.id === exerciseId 
            ? {
                ...exercise,
                questions: exercise.questions.map(q => 
                  q.id === question.id 
                    ? { ...q, question_text: question.question_text, points: question.points } 
                    : q
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

  const updateEssayConfig = (question: Question, updates: Partial<Question['essay_config']>) => {
    const currentConfig = question.essay_config || { max_length: 500, min_length: 50, expected_keywords: [] };
    return {
      ...question,
      essay_config: {
        ...currentConfig,
        ...updates
      }
    };
  };

  const deleteQuestion = async (exerciseId: string, questionId: string) => {
    // Find the exercise and the question to delete
    const exerciseToUpdate = exerciseSets.find(ex => ex.id === exerciseId);
    const questionToDelete = exerciseToUpdate?.questions.find(q => q.id === questionId);

    if (!questionToDelete) {
      toast.error("Pertanyaan tidak ditemukan.");
      return;
    }

    // If the question is not saved, remove it from local state only
    if (!questionToDelete.isSaved) {
      setExerciseSets(prev =>
        prev.map(ex =>
          ex.id === exerciseId
            ? {
                ...ex,
                questions: ex.questions.filter(q => q.id !== questionId)
              }
            : ex
        )
      );
      toast.success("Pertanyaan berhasil dihapus.");
      return;
    }

    // If the question is saved, delete from the database
    setIsSaving(true);
    const { error } = await supabase.from('questions').delete().eq('id', questionId).single();
    setIsSaving(false);

    if (error) {
      toast.error(`Gagal menghapus pertanyaan: ${error.message}`);
      console.error("Error deleting question:", error);
      return;
    }

    // On successful deletion from DB, remove from local state
    setExerciseSets(prev =>
      prev.map(ex =>
        ex.id === exerciseId
          ? {
              ...ex,
              questions: ex.questions.filter(q => q.id !== questionId)
            }
          : ex
      )
    );
    toast.success("Pertanyaan berhasil dihapus.");
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

  const renderQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return <CheckCircle className="h-4 w-4" />;
      case 'essay':
        return <FileText className="h-4 w-4" />;
      case 'sentence_arrangement':
        return <Square className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const renderQuestionForm = (exercise: ExerciseSet, question: Question, qIndex: number) => {
    return (
      <Card key={question.id} className="bg-white border border-gray-200 shadow-sm rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-sky-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
              {qIndex + 1}
            </div>
            <div className="flex-1 space-y-4">
              {/* Header dengan tipe pertanyaan dan poin */}
              <div className="flex items-center gap-4 mb-4">
                <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                  {renderQuestionTypeIcon(question.question_type)}
                  <span className="ml-1 capitalize">
                    {question.question_type === 'multiple_choice' && 'Pilihan Ganda'}
                    {question.question_type === 'essay' && 'Essay'}
                    {question.question_type === 'sentence_arrangement' && 'Puzzle Kalimat'}
                  </span>
                </Badge>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <Input
                    type="number"
                    value={question.points}
                    onChange={(e) => 
                      setExerciseSets(prev => 
                        prev.map(ex => 
                          ex.id === exercise.id
                            ? {
                                ...ex,
                                questions: ex.questions.map(q => 
                                  q.id === question.id 
                                    ? { ...q, points: parseInt(e.target.value) || 0 }
                                    : q
                                )
                              }
                            : ex
                        )
                      )
                    }
                    min="1"
                    max="100"
                    className="w-20 border-gray-300 focus:border-yellow-500 focus:ring-yellow-200"
                  />
                  <span className="text-sm text-gray-600">poin</span>
                </div>
              </div>

              {/* Pertanyaan */}
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                  {question.question_type === 'sentence_arrangement' ? 'Kalimat Lengkap' : 'Pertanyaan'}
                </Label>
                <Textarea
                  value={question.question_text}
                  onChange={(e) => 
                    setExerciseSets(prev => 
                      prev.map(ex => 
                        ex.id === exercise.id
                          ? {
                              ...ex,
                              questions: ex.questions.map(q => {
                                if (q.id === question.id) {
                                  const updatedQuestion = { ...q, question_text: e.target.value };
                                  if (q.question_type === 'sentence_arrangement') {
                                    updatedQuestion.sentence_arrangement_config = {
                                      ...(updatedQuestion.sentence_arrangement_config || { complete_sentence: '', sentence_with_blanks: '', blank_words: [], distractor_words: [] }),
                                      complete_sentence: e.target.value
                                    };
                                  }
                                  return updatedQuestion;
                                }
                                return q;
                              })
                            }
                          : ex
                      )
                    )
                  }
                  placeholder={question.question_type === 'sentence_arrangement' ? "Masukkan kalimat lengkap yang akan dijadikan puzzle..." : "Masukkan pertanyaan di sini..."}
                  className="border-gray-300 focus:border-sky-500 focus:ring-sky-200 bg-white shadow-sm min-h-[100px]"
                  rows={3}
                />
              </div>

              {/* Form berdasarkan tipe pertanyaan */}
              {question.question_type === 'multiple_choice' && (
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
              )}

              {question.question_type === 'essay' && (
                <div className="space-y-4">
                  {/* Essay config... (kode yang sudah benar) */}
                </div>
              )}

              {question.question_type === 'sentence_arrangement' && (
                <div className="space-y-6">
                  {question.question_text && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          if (question.question_text) {
                            autoGenerateBlanks(exercise.id, question.id, question.question_text);
                          }
                        }}
                        className="bg-purple-500 hover:bg-purple-600 text-white text-sm px-4 py-2"
                        size="sm"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Auto Generate Puzzle
                      </Button>
                    </div>
                  )}

                  {question.sentence_arrangement_config?.sentence_with_blanks && (
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <Label className="text-sm font-semibold text-purple-800 mb-2 block">
                          Preview Puzzle
                        </Label>
                        <div className="text-lg text-purple-900 font-medium mb-3">
                          {question.sentence_arrangement_config.sentence_with_blanks}
                        </div>
                        <div className="text-xs text-purple-600">
                          Siswa akan mengisi bagian "___" dengan kata-kata yang tersedia
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-semibold text-green-700 mb-2 block flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Kata-kata yang Benar ({question.sentence_arrangement_config.blank_words.length})
                          </Label>
                          <div className="space-y-2">
                            {question.sentence_arrangement_config.blank_words.map((word, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                                <Square className="h-4 w-4 text-green-600" />
                                <span className="text-green-800 font-medium">{word}</span>
                                <Badge className="bg-green-500 text-white text-xs ml-auto">
                                  Blank {index + 1}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-semibold text-orange-700 mb-2 block flex items-center">
                            <X className="h-4 w-4 mr-1" />
                            Kata Pengecoh (Distractor)
                          </Label>
                          <div className="space-y-2">
                            {question.sentence_arrangement_config.distractor_words.map((word, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                                <X className="h-4 w-4 text-orange-600" />
                                <span className="text-orange-800">{word}</span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setExerciseSets(prev => 
                                      prev.map(ex => 
                                        ex.id === exercise.id 
                                          ? {
                                              ...ex,
                                              questions: ex.questions.map(q => 
                                                q.id === question.id && q.sentence_arrangement_config
                                                  ? {
                                                      ...q,
                                                      sentence_arrangement_config: {
                                                        ...q.sentence_arrangement_config,
                                                        distractor_words: q.sentence_arrangement_config.distractor_words.filter((_, i) => i !== index)
                                                      }
                                                    }
                                                  : q
                                              )
                                            }
                                          : ex
                                      )
                                    );
                                  }}
                                  className="text-red-500 hover:text-red-700 ml-auto"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <div className="flex gap-2">
                              <Input
                                placeholder="Tambah kata pengecoh..."
                                className="flex-1 text-sm border-orange-300 focus:border-orange-500"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    const input = e.target as HTMLInputElement;
                                    const word = input.value.trim();
                                    if (word) {
                                      setExerciseSets(prev => 
                                        prev.map(ex => 
                                          ex.id === exercise.id 
                                            ? {
                                                ...ex,
                                                questions: ex.questions.map(q => 
                                                  q.id === question.id && q.sentence_arrangement_config
                                                    ? {
                                                        ...q,
                                                        sentence_arrangement_config: {
                                                          ...q.sentence_arrangement_config,
                                                          distractor_words: [...(q.sentence_arrangement_config.distractor_words || []), word]
                                                        }
                                                      }
                                                    : q
                                                )
                                              }
                                            : ex
                                        )
                                      );
                                      input.value = '';
                                    }
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  const input = (e.target as HTMLElement).closest('.flex')?.querySelector('input') as HTMLInputElement;
                                  const word = input?.value.trim();
                                  if (word) {
                                    setExerciseSets(prev => 
                                      prev.map(ex => 
                                        ex.id === exercise.id 
                                          ? {
                                              ...ex,
                                              questions: ex.questions.map(q => 
                                                q.id === question.id && q.sentence_arrangement_config
                                                  ? {
                                                      ...q,
                                                      sentence_arrangement_config: {
                                                        ...q.sentence_arrangement_config,
                                                        distractor_words: [...(q.sentence_arrangement_config.distractor_words || []), word]
                                                      }
                                                    }
                                                  : q
                                              )
                                            }
                                          : ex
                                      )
                                    );
                                    if (input) input.value = '';
                                  }
                                }}
                                className="border-orange-300 text-orange-600 hover:bg-orange-50"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-800">
                          <strong>Cara Kerja Puzzle:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                            <li>Siswa melihat kalimat dengan bagian kosong (___)</li>
                            <li>Siswa memilih kata-kata dari kartu yang tersedia</li>
                            <li>Kartu berisi kata yang benar dan kata pengecoh</li>
                            <li>Siswa drag & drop atau klik untuk mengisi bagian kosong</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                {!question.isSaved ? (
                  <Button
                    onClick={() => saveQuestion(exercise.id, question)}
                    disabled={isSaving || !question.question_text.trim() || 
                      (question.question_type === 'multiple_choice' && question.options.some(opt => !opt.option_text.trim())) ||
                      (question.question_type === 'sentence_arrangement' && !question.question_text.trim())
                    }
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
    );
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
                                <div className="flex items-center gap-4 flex-wrap">
                                  <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700 px-3 py-1">
                                    <Users className="h-4 w-4 mr-1" />
                                    {exercise.questions.length} Pertanyaan
                                  </Badge>
                                  {/* Badge untuk total poin */}
                                  <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700 px-3 py-1">
                                    <Star className="h-4 w-4 mr-1" />
                                    {exercise.questions.reduce((total, q) => total + q.points, 0)} Poin
                                  </Badge>
                                  {/* Badge untuk tipe pertanyaan */}
                                  {exercise.questions.some(q => q.question_type === 'multiple_choice') && (
                                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 px-2 py-1">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      PG
                                    </Badge>
                                  )}
                                  {exercise.questions.some(q => q.question_type === 'essay') && (
                                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 px-2 py-1">
                                      <FileText className="h-3 w-3 mr-1" />
                                      Essay
                                    </Badge>
                                  )}
                                  {exercise.questions.some(q => q.question_type === 'sentence_arrangement') && (
                                    <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 px-2 py-1">
                                      <Square className="h-3 w-3 mr-1" />
                                      Puzzle
                                    </Badge>
                                  )}
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
                            {/* Existing Questions */}
                            {exercise.questions.map((question, qIndex) => 
                              renderQuestionForm(exercise, question, qIndex)
                            )}

                            {/* Add Question Section */}
                            <Card className="bg-white border-2 border-dashed border-gray-300 shadow-sm rounded-xl">
                              <CardContent className="p-6">
                                <div className="text-center">
                                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Tambah Pertanyaan Baru</h4>
                                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Button
                                      onClick={() => {
                                        const unsavedQuestions = exercise.questions.some(q => !q.isSaved);
                                        if (unsavedQuestions) {
                                          toast.error("Harap simpan semua pertanyaan terlebih dahulu");
                                          return;
                                        }
                                        addQuestion(exercise.id, 'multiple_choice');
                                      }}
                                      disabled={isSaving || exercise.questions.some(q => !q.isSaved)}
                                      className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-1 sm:flex-none"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Pilihan Ganda
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        const unsavedQuestions = exercise.questions.some(q => !q.isSaved);
                                        if (unsavedQuestions) {
                                          toast.error("Harap simpan semua pertanyaan terlebih dahulu");
                                          return;
                                        }
                                        addQuestion(exercise.id, 'essay');
                                      }}
                                      disabled={isSaving || exercise.questions.some(q => !q.isSaved)}
                                      className="bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-1 sm:flex-none"
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      Essay
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        const unsavedQuestions = exercise.questions.some(q => !q.isSaved);
                                        if (unsavedQuestions) {
                                          toast.error("Harap simpan semua pertanyaan terlebih dahulu");
                                          return;
                                        }
                                        addQuestion(exercise.id, 'sentence_arrangement');
                                      }}
                                      disabled={isSaving || exercise.questions.some(q => !q.isSaved)}
                                      className="bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-1 sm:flex-none"
                                    >
                                      <Square className="h-4 w-4 mr-2" />
                                      Puzzle Kalimat
                                    </Button>
                                  </div>
                                  {exercise.questions.some(q => !q.isSaved) && (
                                    <p className="text-sm text-orange-600 mt-2">
                                      Simpan semua pertanyaan terlebih dahulu sebelum menambah pertanyaan baru
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
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