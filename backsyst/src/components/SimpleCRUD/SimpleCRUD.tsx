"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LessonContentEditor } from "@/components/LessonContentEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";

interface SimpleCRUDItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface SimpleCRUDProps {
  title: string;
  items: SimpleCRUDItem[];
  itemType: "module" | "lesson" | "material" | "exercise";
  onCreate: (item: Omit<SimpleCRUDItem, "id" | "created_at" | "updated_at">) => Promise<void>;
  onUpdate: (id: string, updates: Partial<SimpleCRUDItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onPreview?: (item: SimpleCRUDItem) => void;
  isLoading?: boolean;
}

export function SimpleCRUD({
  title,
  items,
  itemType,
  onCreate,
  onUpdate,
  onDelete,
  onPreview,
  isLoading = false,
}: SimpleCRUDProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    is_active: true,
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const startEdit = (item: SimpleCRUDItem) => {
    setEditingItem(item.id);
    setFormData({
      title: item.title,
      description: item.description || "",
      content: item.content || "",
      is_active: item.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      description: "",
      content: "",
      is_active: true,
    });
  };

  const saveEdit = async (id: string) => {
    try {
      await onUpdate(id, formData);
      cancelEdit();
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleCreate = async () => {
    try {
      await onCreate({
        ...formData,
        order_index: items.length,
      });
      setFormData({
        title: "",
        description: "",
        content: "",
        is_active: true,
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Create failed:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus item ini?")) {
      return;
    }
    try {
      await onDelete(id);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const getItemIcon = () => {
    switch (itemType) {
      case "module":
        return <div className="h-4 w-4 rounded bg-blue-500" />;
      case "lesson":
        return <div className="h-4 w-4 rounded bg-green-500" />;
      case "material":
        return <div className="h-4 w-4 rounded bg-orange-500" />;
      case "exercise":
        return <div className="h-4 w-4 rounded bg-purple-500" />;
      default:
        return <div className="h-4 w-4 rounded bg-gray-500" />;
    }
  };

  const getItemTypeLabel = () => {
    switch (itemType) {
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="gap-2"
          style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
        >
          <Plus className="h-4 w-4" />
          {showCreateForm ? "Batal" : `Tambah ${getItemTypeLabel()}`}
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="border-2" style={{ borderColor: "#E8B824" }}>
          <CardHeader>
            <CardTitle className="text-lg">
              {`Tambah ${getItemTypeLabel()} Baru`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="create-title">Judul *</Label>
              <Input
                id="create-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={`Masukkan judul ${getItemTypeLabel().toLowerCase()}`}
                className="mt-1"
              />
            </div>

            {(itemType === "lesson" || itemType === "module") && (
              <div>
                <Label htmlFor="create-description">Deskripsi</Label>
                <Textarea
                  id="create-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={`Deskripsi ${getItemTypeLabel().toLowerCase()} (opsional)`}
                  rows={3}
                  className="mt-1"
                />
              </div>
            )}

            {itemType === "lesson" && (
              <div>
                <Label htmlFor="create-content">Konten</Label>
                <div className="mt-2">
                  <LessonContentEditor
                    content={formData.content}
                    onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                    disabled={false}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="create-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="create-active">Aktif</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({
                    title: "",
                    description: "",
                    content: "",
                    is_active: true,
                  });
                }}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                onClick={handleCreate}
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
      )}

      {/* Items List */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-gray-500">
                <div className="h-12 w-12 mx-auto mb-4 opacity-50">
                  {getItemIcon()}
                </div>
                <p className="text-lg font-semibold mb-2">
                  Belum Ada {title}
                </p>
                <p className="text-sm">
                  Klik tombol "Tambah {getItemTypeLabel()}" untuk memulai
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          items.map((item, index) => (
            <Card key={item.id} className="transition-all hover:shadow-md">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleExpand(item.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    {getItemIcon()}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold uppercase tracking-wide text-gray-600">
                        {getItemTypeLabel()} {index + 1}
                      </div>
                      <CardTitle className="text-base truncate">
                        {item.title}
                      </CardTitle>
                      {item.description && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.is_active ? "default" : "secondary"} className="text-xs">
                      {item.is_active ? "Aktif" : "Non-aktif"}
                    </Badge>
                    {expandedItems.has(item.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedItems.has(item.id) && (
                <CardContent className="space-y-4">
                  {editingItem === item.id ? (
                    // Edit Form
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`edit-title-${item.id}`}>Judul *</Label>
                        <Input
                          id={`edit-title-${item.id}`}
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Masukkan judul"
                          className="mt-1"
                        />
                      </div>

                      {(itemType === "lesson" || itemType === "module") && (
                        <div>
                          <Label htmlFor={`edit-description-${item.id}`}>Deskripsi</Label>
                          <Textarea
                            id={`edit-description-${item.id}`}
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Deskripsi (opsional)"
                            rows={3}
                            className="mt-1"
                          />
                        </div>
                      )}

                      {itemType === "lesson" && (
                        <div>
                          <Label htmlFor={`edit-content-${item.id}`}>Konten</Label>
                          <Textarea
                            id={`edit-content-${item.id}`}
                            value={formData.content}
                            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            placeholder="Konten pelajaran"
                            rows={6}
                            className="mt-1 font-mono text-sm"
                          />
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`edit-active-${item.id}`}
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                        />
                        <Label htmlFor={`edit-active-${item.id}`}>Aktif</Label>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={cancelEdit}
                          className="flex-1"
                        >
                          Batal
                        </Button>
                        <Button
                          onClick={() => saveEdit(item.id)}
                          disabled={!formData.title.trim() || isLoading}
                          className="flex-1 gap-2"
                          style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
                        >
                          <Save className="h-4 w-4" />
                          {isLoading ? "Menyimpan..." : "Simpan"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="space-y-4">
                      {itemType === "lesson" && item.content && (
                        <div>
                          <Label>Konten</Label>
                          <div 
                            className="mt-2 p-4 bg-gray-50 rounded border text-sm"
                            dangerouslySetInnerHTML={{ __html: item.content }}
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        {onPreview && (
                          <Button
                            variant="outline"
                            onClick={() => onPreview(item)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Preview
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => startEdit(item)}
                          className="gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDelete(item.id)}
                          className="gap-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Statistics */}
      <div className="text-sm text-gray-600 text-center">
        Total: {items.length} {title} • {items.filter(item => item.is_active).length} aktif
      </div>
    </div>
  );
}
