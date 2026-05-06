"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LessonContentEditor } from "@/components/LessonContentEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContextualInlineEditor from "../ContextualInlineEditor";
import { EmbeddedExerciseBuilder } from "../EmbeddedExerciseBuilder";
import { AIFeedbackStudio } from "../AIFeedbackStudio";
import {
  Save,
  Eye,
  Plus,
  Settings,
  Brain,
  FileText,
  Video,
  Headphones,
  Image,
  Link2,
} from "lucide-react";

interface LessonData {
  id?: string;
  title: string;
  description: string;
  content: string;
  lesson_type: "explanation" | "vocabulary" | "dialogue" | "reading" | "listening";
  order_index: number;
  is_active: boolean;
}

interface ExerciseData {
  id?: string;
  title: string;
  description: string;
  exercise_type: "mcq" | "essay" | "puzzle";
  questions: Array<{
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
  }>;
  ai_feedback_enabled: boolean;
  ai_feedback_type: "instant" | "delayed" | "batch";
  order_index: number;
  is_active: boolean;
}

interface MaterialData {
  id?: string;
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
}

interface ContentEditorProps {
  contentType: "lesson" | "exercise" | "material";
  initialData?: LessonData | ExerciseData | MaterialData;
  onSave: (data: any) => void;
  onPreview?: (data: any) => void;
  moduleId: string;
  mode: "create" | "edit";
}

export function ContentEditor({
  contentType,
  initialData,
  onSave,
  onPreview,
  moduleId,
  mode,
}: ContentEditorProps) {
  const [activeTab, setActiveTab] = useState("content");
  const [data, setData] = useState<any>(initialData || {});
  const [showAIStudio, setShowAIStudio] = useState(false);
  const [showExerciseBuilder, setShowExerciseBuilder] = useState(false);

  const handleFieldChange = (key: string, value: any) => {
    setData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(data);
  };

  const getContentTypeIcon = () => {
    switch (contentType) {
      case "lesson":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "exercise":
        return <Brain className="h-5 w-5 text-green-600" />;
      case "material":
        return <Video className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getContentTypeLabel = () => {
    switch (contentType) {
      case "lesson":
        return "Pelajaran";
      case "exercise":
        return "Latihan";
      case "material":
        return "Materi";
      default:
        return "Konten";
    }
  };

  const renderLessonForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="title">Judul *</Label>
          <Input
            id="title"
            value={data.title || ""}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            placeholder="Masukkan judul pelajaran"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="lesson_type">Tipe Pelajaran</Label>
          <Select
            value={data.lesson_type || "explanation"}
            onValueChange={(value: any) => handleFieldChange("lesson_type", value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Pilih tipe pelajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="explanation">Penjelasan</SelectItem>
              <SelectItem value="vocabulary">Kosakata</SelectItem>
              <SelectItem value="dialogue">Dialog</SelectItem>
              <SelectItem value="reading">Bacaan</SelectItem>
              <SelectItem value="listening">Mendengar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          value={data.description || ""}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          placeholder="Deskripsi singkat tentang pelajaran ini"
          rows={3}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="content">Konten Pelajaran</Label>
        <div className="mt-2">
          <LessonContentEditor
            content={data.content || ""}
            onChange={(content) => handleFieldChange("content", content)}
            disabled={false}
          />
        </div>
      </div>
    </div>
  );

  const renderMaterialForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="title">Judul *</Label>
          <Input
            id="title"
            value={data.title || ""}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            placeholder="Masukkan judul materi"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="material_type">Tipe Materi</Label>
          <Select
            value={data.material_type || "video"}
            onValueChange={(value: any) => handleFieldChange("material_type", value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Pilih tipe materi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="image">Gambar</SelectItem>
              <SelectItem value="resource">Sumber Daya</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          value={data.description || ""}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          placeholder="Deskripsi singkat tentang materi ini"
          rows={3}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="source_type">Sumber</Label>
          <Select
            value={data.source_type || "upload"}
            onValueChange={(value: any) => handleFieldChange("source_type", value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Pilih sumber" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upload">Upload File</SelectItem>
              <SelectItem value="youtube_link">Link YouTube</SelectItem>
              <SelectItem value="external_link">Link Eksternal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.source_type === "external_link" && (
          <div>
            <Label htmlFor="external_url">URL Eksternal</Label>
            <Input
              id="external_url"
              value={data.external_url || ""}
              onChange={(e) => handleFieldChange("external_url", e.target.value)}
              placeholder="https://example.com/resource"
              className="mt-1"
            />
          </div>
        )}

        {data.source_type === "youtube_link" && (
          <div>
            <Label htmlFor="external_url">Link YouTube</Label>
            <Input
              id="external_url"
              value={data.external_url || ""}
              onChange={(e) => handleFieldChange("external_url", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="mt-1"
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getContentTypeIcon()}
            <div>
              <h2 className="text-xl font-bold">
                {mode === "create" ? "Buat" : "Edit"} {getContentTypeLabel()}
              </h2>
              <p className="text-sm text-gray-600">
                {mode === "create" ? "Membuat" : "Mengedit"} {getContentTypeLabel().toLowerCase()} untuk modul ini
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onPreview && (
              <Button
                variant="outline"
                onClick={() => onPreview(data)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            )}
            <Button
              onClick={handleSave}
              className="gap-2"
              style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
            >
              <Save className="h-4 w-4" />
              {mode === "create" ? "Buat" : "Simpan"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {contentType === "lesson" && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Konten</TabsTrigger>
                <TabsTrigger value="exercise">Latihan</TabsTrigger>
                <TabsTrigger value="ai">AI Feedback</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Konten Pelajaran</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderLessonForm()}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="exercise" className="mt-6">
                <EmbeddedExerciseBuilder
                  lessonId={data.id || "new"}
                  onExerciseCreate={(exercise: any) => {
                    console.log("Exercise created:", exercise);
                  }}
                  onExerciseUpdate={(exerciseId: any, exercise: any) => {
                    console.log("Exercise updated:", exerciseId, exercise);
                  }}
                />
              </TabsContent>

              <TabsContent value="ai" className="mt-6">
                <AIFeedbackStudio
                  exerciseId={data.id || "new"}
                  exerciseType="mcq"
                  onConfigSave={(config: any) => {
                    console.log("AI Config saved:", config);
                  }}
                  onPreview={(config: any) => {
                    console.log("AI Preview:", config);
                  }}
                />
              </TabsContent>
            </Tabs>
          )}

          {contentType === "material" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Konten Materi</CardTitle>
              </CardHeader>
              <CardContent>
                {renderMaterialForm()}
              </CardContent>
            </Card>
          )}

          {contentType === "exercise" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informasi Latihan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Judul Latihan *</Label>
                        <Input
                          id="title"
                          value={data.title || ""}
                          onChange={(e) => handleFieldChange("title", e.target.value)}
                          placeholder="Masukkan judul latihan"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="exercise_type">Tipe Latihan</Label>
                        <Select
                          value={data.exercise_type || "mcq"}
                          onValueChange={(value: any) => handleFieldChange("exercise_type", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Pilih tipe latihan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mcq">Pilihan Ganda</SelectItem>
                            <SelectItem value="essay">Essay</SelectItem>
                            <SelectItem value="puzzle">Puzzle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Deskripsi</Label>
                      <Textarea
                        id="description"
                        value={data.description || ""}
                        onChange={(e) => handleFieldChange("description", e.target.value)}
                        placeholder="Deskripsi singkat tentang latihan ini"
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={data.ai_feedback_enabled || false}
                        onCheckedChange={(checked) => handleFieldChange("ai_feedback_enabled", checked)}
                      />
                      <Label>Aktifkan AI Feedback</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={() => setShowExerciseBuilder(!showExerciseBuilder)}
                className="w-full gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                {showExerciseBuilder ? "Sembunyikan" : "Tampilkan"} Exercise Builder
              </Button>

              {showExerciseBuilder && (
                <EmbeddedExerciseBuilder
                  lessonId={moduleId}
                  onExerciseCreate={handleSave}
                  onExerciseUpdate={(exerciseId: any, exercise: any) => {
                    console.log("Exercise updated:", exerciseId, exercise);
                  }}
                />
              )}

              <Button
                onClick={() => setShowAIStudio(!showAIStudio)}
                className="w-full gap-2 mt-4"
                variant="outline"
              >
                <Brain className="h-4 w-4" />
                {showAIStudio ? "Sembunyikan" : "Tampilkan"} AI Feedback Studio
              </Button>

              {showAIStudio && (
                <AIFeedbackStudio
                  exerciseId={data.id || "new"}
                  exerciseType={data.exercise_type || "mcq"}
                  onConfigSave={(config: any) => {
                    handleFieldChange("ai_config", config);
                  }}
                  onPreview={(config: any) => {
                    console.log("AI Preview:", config);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
