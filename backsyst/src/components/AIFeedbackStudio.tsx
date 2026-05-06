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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Settings,
  Eye,
  Save,
  Plus,
  Trash2,
  Edit,
  MessageSquare,
  Lightbulb,
  Target,
  BookOpen,
  Play,
  CheckCircle,
  AlertCircle,
  Copy,
  Download,
  Upload,
} from "lucide-react";

interface AIPromptTemplate {
  id: string;
  name: string;
  description: string;
  category: "correction" | "encouragement" | "explanation" | "improvement";
  system_prompt: string;
  user_prompt_template: string;
  response_format: string;
  variables: string[];
}

interface FeedbackConfiguration {
  exercise_id: string;
  ai_enabled: boolean;
  feedback_type: "instant" | "delayed" | "batch";
  selected_templates: string[];
  custom_prompts: Record<string, string>;
  response_settings: {
    include_references: boolean;
    include_tips: boolean;
    include_explanation: boolean;
    max_length: number;
    tone: "formal" | "friendly" | "encouraging";
  };
}

interface AIFeedbackStudioProps {
  exerciseId: string;
  exerciseType: "mcq" | "essay" | "puzzle";
  initialConfig?: FeedbackConfiguration;
  onConfigSave: (config: FeedbackConfiguration) => void;
  onPreview: (config: FeedbackConfiguration) => void;
}

const DEFAULT_TEMPLATES: AIPromptTemplate[] = [
  {
    id: "mcq-basic",
    name: "MCQ - Basic Correction",
    description: "Template untuk pilihan ganda dengan feedback sederhana",
    category: "correction",
    system_prompt: "Anda adalah tutor AI yang membantu siswa memahami jawaban benar/salah.",
    user_prompt_template: "Siswa menjawab: {student_answer}\nJawaban benar: {correct_answer}\nPertanyaan: {question}\nBerikan feedback yang jelas dan singkat.",
    response_format: "JSON dengan keys: status, explanation, correct_answer, learning_tip",
    variables: ["student_answer", "correct_answer", "question"]
  },
  {
    id: "essay-detailed",
    name: "Essay - Detailed Analysis",
    description: "Template untuk essay dengan analisis mendalam",
    category: "explanation",
    system_prompt: "Anda adalah guru bahasa yang profesional dan memberikan feedback mendalam.",
    user_prompt_template: "Topik: {topic}\nJawaban siswa: {student_answer}\nKriteria penilaian: {rubric}\nAnalisis jawaban dan berikan feedback komprehensif.",
    response_format: "JSON dengan keys: overall_score, strengths, areas_to_improve, detailed_feedback, suggestions",
    variables: ["topic", "student_answer", "rubric"]
  },
  {
    id: "puzzle-hints",
    name: "Puzzle - Guided Hints",
    description: "Template untuk puzzle dengan hint bertahap",
    category: "improvement",
    system_prompt: "Anda adalah mentor yang memberikan bantuan bertahap tanpa memberikan jawaban langsung.",
    user_prompt_template: "Puzzle: {puzzle_description}\nJawaban siswa: {student_answer}\nJawaban benar: {correct_answer}\nBerikan hint yang membantu siswa menemukan jawaban sendiri.",
    response_format: "JSON dengan keys: is_correct, hint_level_1, hint_level_2, explanation_when_correct",
    variables: ["puzzle_description", "student_answer", "correct_answer"]
  }
];

export function AIFeedbackStudio({
  exerciseId,
  exerciseType,
  initialConfig,
  onConfigSave,
  onPreview,
}: AIFeedbackStudioProps) {
  const [activeTab, setActiveTab] = useState("templates");
  const [config, setConfig] = useState<FeedbackConfiguration>(
    initialConfig || {
      exercise_id: exerciseId,
      ai_enabled: true,
      feedback_type: "instant",
      selected_templates: [],
      custom_prompts: {},
      response_settings: {
        include_references: true,
        include_tips: true,
        include_explanation: true,
        max_length: 500,
        tone: "friendly"
      }
    }
  );
  const [customTemplates, setCustomTemplates] = useState<AIPromptTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [testInput, setTestInput] = useState({
    student_answer: "",
    correct_answer: "",
    question: "",
    topic: "",
    rubric: ""
  });

  const selectTemplate = (templateId: string) => {
    setConfig(prev => ({
      ...prev,
      selected_templates: prev.selected_templates.includes(templateId)
        ? prev.selected_templates.filter(id => id !== templateId)
        : [...prev.selected_templates, templateId]
    }));
  };

  const updateCustomPrompt = (key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      custom_prompts: {
        ...prev.custom_prompts,
        [key]: value
      }
    }));
  };

  const updateResponseSettings = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      response_settings: {
        ...prev.response_settings,
        [key]: value
      }
    }));
  };

  const addCustomTemplate = () => {
    const newTemplate: AIPromptTemplate = {
      id: `custom-${Date.now()}`,
      name: "Template Kustom Baru",
      description: "Deskripsi template",
      category: "correction",
      system_prompt: "",
      user_prompt_template: "",
      response_format: "",
      variables: []
    };
    setCustomTemplates([...customTemplates, newTemplate]);
    setEditingTemplate(newTemplate.id);
  };

  const saveTemplate = (template: AIPromptTemplate) => {
    setCustomTemplates(prev => 
      prev.map(t => t.id === template.id ? template : t)
    );
    setEditingTemplate(null);
  };

  const deleteTemplate = (templateId: string) => {
    setCustomTemplates(prev => prev.filter(t => t.id !== templateId));
    if (config.selected_templates.includes(templateId)) {
      setConfig(prev => ({
        ...prev,
        selected_templates: prev.selected_templates.filter(id => id !== templateId)
      }));
    }
  };

  const previewAIResponse = () => {
    // Simulate AI response for preview
    const mockResponse = {
      status: "success",
      feedback: "Ini adalah contoh feedback AI yang akan diberikan kepada siswa.",
      explanation: "Penjelasan mendalam tentang mengapa jawaban benar/salah.",
      learning_tips: ["Tips 1", "Tips 2"],
      references: [
        { title: "Referensi 1", url: "#" },
        { title: "Referensi 2", url: "#" }
      ]
    };
    
    console.log("AI Response Preview:", mockResponse);
    onPreview(config);
  };

  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates];
  const selectedTemplateObjects = allTemplates.filter(t => config.selected_templates.includes(t.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2" style={{ borderColor: "#E8B824" }}>
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6" style={{ color: "#E8B824" }} />
              <div>
                <CardTitle className="text-xl">AI Feedback Studio</CardTitle>
                <p className="text-sm text-gray-600">
                  Konfigurasi feedback AI yang personalized untuk latihan ini
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {exerciseType.toUpperCase()}
              </Badge>
              <Button
                onClick={previewAIResponse}
                size="sm"
                className="gap-2"
                variant="outline"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                onClick={() => onConfigSave(config)}
                size="sm"
                className="gap-2"
                style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
              >
                <Save className="h-4 w-4" />
                Simpan Konfigurasi
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pengaturan Utama</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.ai_enabled}
                onCheckedChange={(enabled) => setConfig(prev => ({ ...prev, ai_enabled: enabled }))}
              />
              <Label>Aktifkan AI Feedback</Label>
            </div>
            
            <div>
              <Label>Tipe Feedback</Label>
              <Select
                value={config.feedback_type}
                onValueChange={(value: "instant" | "delayed" | "batch") => 
                  setConfig(prev => ({ ...prev, feedback_type: value }))
                }
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

            <div className="flex items-center space-x-2">
              <Label>Template Terpilih:</Label>
              <Badge variant="secondary">{config.selected_templates.length}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="custom">Kustom</TabsTrigger>
          <TabsTrigger value="response">Response</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEFAULT_TEMPLATES.map((template) => (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-all ${
                  config.selected_templates.includes(template.id) 
                    ? 'ring-2 ring-yellow-400 bg-yellow-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => selectTemplate(template.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                    </div>
                    <Badge 
                      variant={template.category === "correction" ? "destructive" : 
                              template.category === "explanation" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {template.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-xs">
                      <span className="font-semibold">Variables:</span> {template.variables.join(", ")}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {config.selected_templates.includes(template.id) && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        <span className="text-xs text-gray-600">
                          {config.selected_templates.includes(template.id) ? "Dipilih" : "Klik untuk memilih"}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTemplate(template.id);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Custom Templates */}
          {customTemplates.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Template Kustom</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customTemplates.map((template) => (
                  <Card key={template.id} className="border-orange-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingTemplate(template.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={addCustomTemplate}
            className="gap-2"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            Tambah Template Kustom
          </Button>
        </TabsContent>

        {/* Custom Prompts Tab */}
        <TabsContent value="custom" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Prompt</CardTitle>
                <p className="text-sm text-gray-600">
                  Instruksi utama untuk AI tentang peran dan perilaku
                </p>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={config.custom_prompts.system_prompt || ""}
                  onChange={(e) => updateCustomPrompt("system_prompt", e.target.value)}
                  placeholder="Anda adalah tutor AI yang..."
                  rows={6}
                  className="w-full"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">User Prompt Template</CardTitle>
                <p className="text-sm text-gray-600">
                  Template untuk input user dengan variables {`{variable}`}
                </p>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={config.custom_prompts.user_prompt_template || ""}
                  onChange={(e) => updateCustomPrompt("user_prompt_template", e.target.value)}
                  placeholder="Siswa menjawab: {student_answer}..."
                  rows={6}
                  className="w-full"
                />
                <div className="mt-2 text-xs text-gray-600">
                  Variables yang tersedia: {`{student_answer}, {correct_answer}, {question}, dll.`}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Response Format</CardTitle>
              <p className="text-sm text-gray-600">
                Format output yang diharapkan dari AI
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={config.custom_prompts.response_format || ""}
                onChange={(e) => updateCustomPrompt("response_format", e.target.value)}
                placeholder="JSON dengan keys: status, explanation, tips..."
                rows={4}
                className="w-full"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Response Settings Tab */}
        <TabsContent value="response" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pengaturan Response</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.response_settings.include_references}
                      onCheckedChange={(checked) => updateResponseSettings("include_references", checked)}
                    />
                    <Label>Sertakan Referensi</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.response_settings.include_tips}
                      onCheckedChange={(checked) => updateResponseSettings("include_tips", checked)}
                    />
                    <Label>Sertakan Tips Pembelajaran</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.response_settings.include_explanation}
                      onCheckedChange={(checked) => updateResponseSettings("include_explanation", checked)}
                    />
                    <Label>Sertakan Penjelasan</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Tone Feedback</Label>
                    <Select
                      value={config.response_settings.tone}
                      onValueChange={(value: "formal" | "friendly" | "encouraging") => 
                        updateResponseSettings("tone", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="encouraging">Encouraging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Maksimum Karakter</Label>
                    <Input
                      type="number"
                      value={config.response_settings.max_length}
                      onChange={(e) => updateResponseSettings("max_length", parseInt(e.target.value) || 500)}
                      min={100}
                      max={2000}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Test AI Response</CardTitle>
              <p className="text-sm text-gray-600">
                Simulasi input untuk melihat bagaimana AI akan merespons
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Jawaban Siswa (Test)</Label>
                  <Input
                    value={testInput.student_answer}
                    onChange={(e) => setTestInput(prev => ({ ...prev, student_answer: e.target.value }))}
                    placeholder="Jawaban test..."
                  />
                </div>
                <div>
                  <Label>Jawaban Benar</Label>
                  <Input
                    value={testInput.correct_answer}
                    onChange={(e) => setTestInput(prev => ({ ...prev, correct_answer: e.target.value }))}
                    placeholder="Jawaban benar..."
                  />
                </div>
              </div>

              <div>
                <Label>Pertanyaan</Label>
                <Textarea
                  value={testInput.question}
                  onChange={(e) => setTestInput(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Pertanyaan lengkap..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={previewAIResponse}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Test Response
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setTestInput({
                    student_answer: "",
                    correct_answer: "",
                    question: "",
                    topic: "",
                    rubric: ""
                  })}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
