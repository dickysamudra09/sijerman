"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Edit2,
  Save,
  X,
  ChevronDown,
  Eye,
  Settings,
  Trash2,
  Plus,
  GripVertical,
} from "lucide-react";

interface InlineFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  type?: "text" | "textarea" | "select";
  options?: Array<{ value: string; label: string }>;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
  label?: string;
}

interface ContextualInlineEditorProps {
  entity: any;
  entityType: "module" | "lesson" | "material" | "exercise";
  fields: Array<{
    key: string;
    label: string;
    type: "text" | "textarea" | "select";
    options?: Array<{ value: string; label: string }>;
    required?: boolean;
    maxLength?: number;
  }>;
  onSave: (updates: Record<string, any>) => void;
  onDelete?: () => void;
  onPreview?: () => void;
  isCompact?: boolean;
}

function InlineField({
  value,
  onChange,
  onSave,
  onCancel,
  placeholder,
  type = "text",
  options,
  maxLength,
  className = "",
  disabled = false,
  label,
}: InlineFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const startEdit = () => {
    setIsEditing(true);
    setEditValue(value);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        if ('select' in inputRef.current) {
          inputRef.current.select();
        }
      }
    }, 0);
  };

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
    onSave?.();
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-1">
        {label && <Label className="text-xs font-medium">{label}</Label>}
        <div className="flex items-center gap-2">
          {type === "textarea" ? (
            <Textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              className={`flex-1 ${className}`}
              rows={3}
            />
          ) : type === "select" ? (
            <Select
              value={editValue}
              onValueChange={(value) => setEditValue(value)}
              onOpenChange={(open) => {
                if (!open) {
                  handleSave();
                }
              }}
            >
              <SelectTrigger ref={inputRef as React.RefObject<HTMLButtonElement>} className="flex-1">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              className={`flex-1 ${className}`}
            />
          )}
          
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              onClick={handleSave}
              className="h-7 px-2 text-xs"
              style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
            >
              <Save className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="h-7 px-2 text-xs"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {maxLength && (
          <div className="text-xs text-gray-500 text-right">
            {editValue.length} / {maxLength}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="group">
      <div 
        className="flex items-center justify-between p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={disabled ? undefined : startEdit}
      >
        <div className="flex-1 min-w-0">
          {value ? (
            <div className="text-sm font-medium truncate">{value}</div>
          ) : (
            <div className="text-sm text-gray-400 italic">{placeholder || "Klik untuk mengedit"}</div>
          )}
        </div>
        {!disabled && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit2 className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}

export function ContextualInlineEditor({
  entity,
  entityType,
  fields,
  onSave,
  onDelete,
  onPreview,
  isCompact = false,
}: ContextualInlineEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const initialValues: Record<string, any> = {};
    fields.forEach(field => {
      initialValues[field.key] = entity[field.key] || "";
    });
    setEditValues(initialValues);
  }, [entity, fields]);

  const handleFieldChange = (key: string, value: any) => {
    setEditValues(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(editValues);
    setHasChanges(false);
  };

  const handleCancel = () => {
    const initialValues: Record<string, any> = {};
    fields.forEach(field => {
      initialValues[field.key] = entity[field.key] || "";
    });
    setEditValues(initialValues);
    setHasChanges(false);
  };

  const getEntityTypeColor = () => {
    switch (entityType) {
      case "module":
        return "#E8B824";
      case "lesson":
        return "#3B82F6";
      case "material":
        return "#E87835";
      case "exercise":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const getEntityTypeIcon = () => {
    switch (entityType) {
      case "module":
        return <div className="h-4 w-4 rounded" style={{ backgroundColor: getEntityTypeColor() }} />;
      case "lesson":
        return <div className="h-4 w-4 rounded" style={{ backgroundColor: getEntityTypeColor() }} />;
      case "material":
        return <div className="h-4 w-4 rounded" style={{ backgroundColor: getEntityTypeColor() }} />;
      case "exercise":
        return <div className="h-4 w-4 rounded" style={{ backgroundColor: getEntityTypeColor() }} />;
      default:
        return <div className="h-4 w-4 rounded bg-gray-400" />;
    }
  };

  if (isCompact) {
    return (
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getEntityTypeIcon()}
            <span className="font-semibold capitalize">{entityType}</span>
          </div>
          <div className="flex items-center gap-1">
            {hasChanges && (
              <Button
                size="sm"
                onClick={handleSave}
                className="h-7 px-2 text-xs"
                style={{ backgroundColor: getEntityTypeColor(), color: "#FFFFFF" }}
              >
                <Save className="h-3 w-3" />
              </Button>
            )}
            {onPreview && (
              <Button
                size="sm"
                variant="outline"
                onClick={onPreview}
                className="h-7 px-2 text-xs"
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 px-2 text-xs"
            >
              {isExpanded ? <X className="h-3 w-3" /> : <Settings className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-3 pt-3 border-t">
            {fields.map((field) => (
              <InlineField
                key={field.key}
                value={editValues[field.key] || ""}
                onChange={(value) => handleFieldChange(field.key, value)}
                label={field.label}
                type={field.type}
                options={field.options}
                maxLength={field.maxLength}
                placeholder={field.required ? "Wajib diisi" : `Opsional ${field.label}`}
              />
            ))}

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="text-xs text-gray-500">
                {hasChanges ? "Ada perubahan belum disimpan" : "Tidak ada perubahan"}
              </div>
              <div className="flex items-center gap-2">
                {onDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onDelete}
                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                    Hapus
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={hasChanges ? handleSave : handleCancel}
                  className="h-7 px-2 text-xs"
                  style={{ 
                    backgroundColor: hasChanges ? getEntityTypeColor() : "#F5F5F5", 
                    color: hasChanges ? "#FFFFFF" : "#1A1A1A" 
                  }}
                >
                  {hasChanges ? <Save className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {hasChanges ? "Simpan" : "Batal"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ backgroundColor: getEntityTypeColor() + "10" }}
      >
        <div className="flex items-center gap-3">
          <GripVertical className="h-4 w-4 text-gray-400" />
          {getEntityTypeIcon()}
          <div>
            <div className="font-semibold capitalize">{entityType}</div>
            <div className="text-xs text-gray-600">
              {entity.title || entity.name || "Untitled"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
          )}
          <ChevronDown 
            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 border-t bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <InlineField
                key={field.key}
                value={editValues[field.key] || ""}
                onChange={(value) => handleFieldChange(field.key, value)}
                label={field.label}
                type={field.type}
                options={field.options}
                maxLength={field.maxLength}
                placeholder={field.required ? "Wajib diisi" : `Opsional ${field.label}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-xs text-gray-500">
              {hasChanges ? "Ada perubahan belum disimpan" : "Tidak ada perubahan"}
            </div>
            <div className="flex items-center gap-2">
              {onPreview && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onPreview}
                  className="gap-1"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDelete}
                  className="gap-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </Button>
              )}
              <Button
                size="sm"
                onClick={hasChanges ? handleSave : handleCancel}
                className="gap-1"
                style={{ 
                  backgroundColor: hasChanges ? getEntityTypeColor() : "#F5F5F5", 
                  color: hasChanges ? "#FFFFFF" : "#1A1A1A" 
                }}
              >
                {hasChanges ? <Save className="h-4 w-4" /> : <X className="h-4 w-4" />}
                {hasChanges ? "Simpan Perubahan" : "Tutup"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContextualInlineEditor;
