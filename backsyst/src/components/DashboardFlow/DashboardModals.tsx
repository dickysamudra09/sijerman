"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LessonContentEditor } from "@/components/LessonContentEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  X,
  Save,
  Plus,
} from "lucide-react";

interface DashboardModalsProps {
  isOpen: boolean;
  onClose: () => void;
  type: "module" | "lesson" | "material" | "exercise";
  mode: "create" | "edit";
  initialData?: any;
  onSave: (data: any) => Promise<void>;
  moduleId?: string;
  courseId?: string;
}

export function DashboardModals({
  isOpen,
  onClose,
  type,
  mode,
  initialData,
  onSave,
  moduleId,
  courseId,
}: DashboardModalsProps) {
  const [formData, setFormData] = useState({
    title: initialData?.judul_latihan || initialData?.title || "",  // Use judul_latihan for exercise
    description: initialData?.deskripsi || initialData?.description || "",  // Use deskripsi for exercise
    content: initialData?.content || "",
    is_active: initialData?.is_active ?? true,
    material_type: initialData?.material_type || "video",
    source_type: initialData?.source_type || "upload",
    file_url: initialData?.file_url || "",
    external_url: initialData?.external_url || "",
    module_id: initialData?.module_id || moduleId || "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const dataToSave = {
        ...formData,
        ...(type === "lesson" && { 
          lesson_type: "explanation",
          module_id: moduleId || formData.module_id,
        }),
        ...(type === "material" && { 
          module_id: moduleId || formData.module_id,
          material_type: formData.material_type,
          source_type: formData.source_type,
          file_url: formData.file_url,
          external_url: formData.external_url,
        }),
        ...(type === "exercise" && { 
          judul_latihan: formData.title,  // Use correct field name
          deskripsi: formData.description,  // Use correct field name
          course_id: courseId,  // Use course_id for exercise
          context_type: 'course',  // Set context type
          pembuat_id: null,  // Will be set by parent
          is_active: formData.is_active,
          pertemuan: 1,  // Default pertemuan
        }),
        ...(type === "module" && { course_id: courseId }),
        ...(mode === "edit" && { id: initialData?.id }),
      };
      
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsLoading(false);
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <Card className={`w-full ${type === "lesson" ? "max-w-4xl" : "max-w-md"} my-8`} style={{ backgroundColor: '#FFFFFF' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {mode === "create" ? "Tambah" : "Edit"} {getTypeLabel()}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div>
            <Label htmlFor="title">Judul *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={`Masukkan judul ${getTypeLabel().toLowerCase()}`}
              className="mt-1"
            />
          </div>

          {(type === "module" || type === "lesson" || type === "exercise") && (
            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={`Deskripsi ${getTypeLabel().toLowerCase()} (opsional)`}
                rows={3}
                className="mt-1"
              />
            </div>
          )}

          {type === "lesson" && (
            <div>
              <Label htmlFor="content">Konten Pelajaran</Label>
              <div className="mt-2">
                <LessonContentEditor
                  content={formData.content}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {type === "material" && (
            <>
              <div>
                <Label htmlFor="material_type">Tipe Materi</Label>
                <select
                  id="material_type"
                  value={formData.material_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, material_type: e.target.value }))}
                  className="mt-1 w-full p-2 border rounded"
                >
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="pdf">PDF</option>
                  <option value="image">Gambar</option>
                  <option value="resource">Link Eksternal</option>
                </select>
              </div>

              <div>
                <Label htmlFor="source_type">Sumber</Label>
                <select
                  id="source_type"
                  value={formData.source_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, source_type: e.target.value }))}
                  className="mt-1 w-full p-2 border rounded"
                >
                  <option value="upload">Upload File</option>
                  <option value="youtube_link">YouTube Link</option>
                  <option value="external_link">Link Eksternal</option>
                </select>
              </div>

              {formData.source_type === "external_link" ? (
                <div>
                  <Label htmlFor="external_url">URL Eksternal</Label>
                  <Input
                    id="external_url"
                    value={formData.external_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, external_url: e.target.value }))}
                    placeholder="https://example.com"
                    className="mt-1"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="file_url">File URL</Label>
                  <Input
                    id="file_url"
                    value={formData.file_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value }))}
                    placeholder="File path atau URL"
                    className="mt-1"
                  />
                </div>
              )}
            </>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Aktif</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.title.trim() || isLoading}
              className="flex-1 gap-2"
              style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
