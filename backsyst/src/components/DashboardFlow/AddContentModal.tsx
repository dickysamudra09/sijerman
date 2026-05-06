"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LessonContentEditor } from "@/components/LessonContentEditor";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  BookOpen,
  FileText,
  Video,
  Brain,
} from "lucide-react";

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "lesson" | "material" | "exercise" | "module";
  moduleId?: string;
  onSave: (data: any) => Promise<void>;
}

export function AddContentModal({
  isOpen,
  onClose,
  type,
  moduleId,
  onSave,
}: AddContentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    lesson_type: "explanation",
    material_type: "video",
    source_type: "upload",
    file_url: "",
    external_url: "",
    is_active: true,
    questions: [],
    module_id: moduleId || "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: "",
        description: "",
        content: "",
        lesson_type: "explanation",
        material_type: "video",
        source_type: "upload",
        file_url: "",
        external_url: "",
        is_active: true,
        questions: [],
        module_id: moduleId || "",
      });
    }
  }, [isOpen, moduleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsLoading(true);
    try {
      console.log("Creating new item:", { type, data: formData });
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Create failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case "module":
        return <BookOpen className="h-5 w-5" style={{ color: '#1E1E1E' }} />;
      case "lesson":
        return <FileText className="h-5 w-5" style={{ color: '#1E1E1E' }} />;
      case "material":
        return <Video className="h-5 w-5" style={{ color: '#1E1E1E' }} />;
      case "exercise":
        return <Brain className="h-5 w-5" style={{ color: '#1E1E1E' }} />;
      default:
        return <FileText className="h-5 w-5" style={{ color: '#1E1E1E' }} />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "module":
        return "Modul";
      case "lesson":
        return "Pelajaran";
      case "material":
        return "Materi";
      case "exercise":
        return "Latihan";
      default:
        return "Item";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card 
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl backdrop-blur-sm hover:scale-[1.01] transform transition-all duration-300" 
        style={{
          backgroundColor: 'rgba(255, 255, 252, 0.95)',
          borderColor: 'rgba(232, 184, 36, 0.2)',
          borderWidth: '1px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 25px 50px rgba(232, 184, 36, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(232, 184, 36, 0.12)';
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
                {getTypeIcon()}
              </div>
              <div>
                <CardTitle className="text-xl font-bold mb-1" style={{ color: "#1A1A1A" }}>Tambah {getTypeLabel()}</CardTitle>
                <p className="text-sm" style={{ color: "#4A4A4A" }}>Buat {getTypeLabel().toLowerCase()} baru</p>
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
          {/* Basic Information */}
          <div 
            className="rounded-xl p-5 shadow-sm backdrop-blur-sm" 
            style={{
              backgroundColor: 'rgba(255, 255, 252, 0.8)',
              borderColor: 'rgba(232, 184, 36, 0.2)',
              borderWidth: '1px'
            }}
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "#1A1A1A" }}>
              <div className="p-2 rounded-lg transform transition-transform hover:scale-110" style={{backgroundColor: '#E8B824'}}>
                <FileText className="h-4 w-4" style={{color: '#1E1E1E'}} />
              </div>
              Informasi Dasar
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-semibold mb-1" style={{ color: "#1A1A1A" }}>Judul *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={`Masukkan judul ${getTypeLabel().toLowerCase()}`}
                  className="mt-1"
                  style={{
                    backgroundColor: 'rgba(255, 255, 252, 0.8)',
                    borderColor: 'rgba(232, 184, 36, 0.2)',
                    borderWidth: '1px'
                  }}
                />
              </div>

              {(type === "module" || type === "lesson") && (
                <div>
                  <Label htmlFor="description" className="text-sm font-semibold mb-1" style={{ color: "#1A1A1A" }}>Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={`Deskripsi ${getTypeLabel().toLowerCase()} (opsional)`}
                    rows={3}
                    className="mt-1"
                    style={{
                      backgroundColor: 'rgba(255, 255, 252, 0.8)',
                      borderColor: 'rgba(232, 184, 36, 0.2)',
                      borderWidth: '1px'
                    }}
                  />
                </div>
              )}

              {type === "lesson" && (
                <>
                  <div>
                    <Label htmlFor="lesson_type" className="text-sm font-semibold mb-1" style={{ color: "#1A1A1A" }}>Tipe Pelajaran</Label>
                    <Select
                      value={formData.lesson_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, lesson_type: value }))}
                    >
                      <SelectTrigger className="mt-1" style={{
                        backgroundColor: 'rgba(255, 255, 252, 0.8)',
                        borderColor: 'rgba(232, 184, 36, 0.2)',
                        borderWidth: '1px'
                      }}>
                        <SelectValue placeholder="Pilih tipe pelajaran" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="explanation">Penjelasan</SelectItem>
                        <SelectItem value="vocabulary">Kosakata</SelectItem>
                        <SelectItem value="dialogue">Dialog</SelectItem>
                        <SelectItem value="reading">Membaca</SelectItem>
                        <SelectItem value="listening">Mendengar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="content" className="text-sm font-semibold mb-1" style={{ color: "#1A1A1A" }}>Konten Pelajaran</Label>
                    <div className="mt-2">
                      <LessonContentEditor
                        content={formData.content}
                        onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                        disabled={false}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Material Specific Fields */}
          {type === "material" && (
            <div 
              className="rounded-xl p-5 shadow-sm backdrop-blur-sm" 
              style={{
                backgroundColor: 'rgba(255, 255, 252, 0.8)',
                borderColor: 'rgba(232, 184, 36, 0.2)',
                borderWidth: '1px'
              }}
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "#1A1A1A" }}>
                <div className="p-2 rounded-lg transform transition-transform hover:scale-110" style={{backgroundColor: '#E8B824'}}>
                  <Video className="h-4 w-4" style={{color: '#1E1E1E'}} />
                </div>
                Pengaturan Materi
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="material_type" className="text-sm font-semibold mb-1" style={{ color: "#1A1A1A" }}>Tipe Materi</Label>
                  <Select
                    value={formData.material_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, material_type: value }))}
                  >
                    <SelectTrigger className="mt-1" style={{
                      backgroundColor: 'rgba(255, 255, 252, 0.8)',
                      borderColor: 'rgba(232, 184, 36, 0.2)',
                      borderWidth: '1px'
                    }}>
                      <SelectValue placeholder="Pilih tipe materi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="image">Gambar</SelectItem>
                      <SelectItem value="resource">Link Eksternal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="source_type" className="text-sm font-semibold mb-1" style={{ color: "#1A1A1A" }}>Sumber</Label>
                  <Select
                    value={formData.source_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, source_type: value }))}
                  >
                    <SelectTrigger className="mt-1" style={{
                      backgroundColor: 'rgba(255, 255, 252, 0.8)',
                      borderColor: 'rgba(232, 184, 36, 0.2)',
                      borderWidth: '1px'
                    }}>
                      <SelectValue placeholder="Pilih sumber" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upload">Upload File</SelectItem>
                      <SelectItem value="youtube_link">YouTube Link</SelectItem>
                      <SelectItem value="external_link">Link Eksternal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.source_type === "external_link" ? (
                <div>
                  <Label htmlFor="external_url" className="text-sm font-semibold mb-1" style={{ color: "#1A1A1A" }}>URL Eksternal</Label>
                  <Input
                    id="external_url"
                    value={formData.external_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, external_url: e.target.value }))}
                    placeholder="https://example.com"
                    className="mt-1"
                    style={{
                      backgroundColor: 'rgba(255, 255, 252, 0.8)',
                      borderColor: 'rgba(232, 184, 36, 0.2)',
                      borderWidth: '1px'
                    }}
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="file_url" className="text-sm font-semibold mb-1" style={{ color: "#1A1A1A" }}>File URL</Label>
                  <Input
                    id="file_url"
                    value={formData.file_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value }))}
                    placeholder="File path atau URL"
                    className="mt-1"
                    style={{
                      backgroundColor: 'rgba(255, 255, 252, 0.8)',
                      borderColor: 'rgba(232, 184, 36, 0.2)',
                      borderWidth: '1px'
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Exercise Specific Fields */}
          {type === "exercise" && (
            <div 
              className="rounded-xl p-5 shadow-sm backdrop-blur-sm" 
              style={{
                backgroundColor: 'rgba(255, 255, 252, 0.8)',
                borderColor: 'rgba(232, 184, 36, 0.2)',
                borderWidth: '1px'
              }}
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "#1A1A1A" }}>
                <div className="p-2 rounded-lg transform transition-transform hover:scale-110" style={{backgroundColor: '#E8B824'}}>
                  <Brain className="h-4 w-4" style={{color: '#1E1E1E'}} />
                </div>
                Pengaturan Latihan
              </h3>
              
              <div>
                <Label htmlFor="description" className="text-sm font-semibold mb-1" style={{ color: "#1A1A1A" }}>Deskripsi Latihan</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
          )}

          {/* Settings */}
          <div 
            className="rounded-xl p-5 shadow-sm backdrop-blur-sm" 
            style={{
              backgroundColor: 'rgba(255, 255, 252, 0.8)',
              borderColor: 'rgba(232, 184, 36, 0.2)',
              borderWidth: '1px'
            }}
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "#1A1A1A" }}>
              <div className="p-2 rounded-lg transform transition-transform hover:scale-110" style={{backgroundColor: '#E8B824'}}>
                <Brain className="h-4 w-4" style={{color: '#1E1E1E'}} />
              </div>
              Pengaturan
            </h3>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg" style={{
              backgroundColor: 'rgba(255, 255, 252, 0.8)',
              borderColor: 'rgba(232, 184, 36, 0.2)',
              borderWidth: '1px'
            }}>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                style={{
                  backgroundColor: formData.is_active ? '#E8B824' : '#E5E7EB'
                }}
              />
              <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer" style={{ color: "#1A1A1A" }}>Aktif</Label>
            </div>
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
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(232, 184, 36, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 252, 0.8)';
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.title.trim() || isLoading}
              className="flex-1 gap-2 font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: '#E8B824', color: '#1A1A1A' }}
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Menyimpan..." : "Buat Baru"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
