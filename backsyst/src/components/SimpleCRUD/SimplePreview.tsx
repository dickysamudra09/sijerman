"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  X,
  FileText,
  Brain,
  Video,
  Image,
  Music,
  Link2,
} from "lucide-react";

interface SimplePreviewProps {
  item: any;
  itemType: "lesson" | "exercise" | "material" | "module";
  onClose: () => void;
}

export function SimplePreview({ item, itemType, onClose }: SimplePreviewProps) {
  const getItemIcon = () => {
    switch (itemType) {
      case "module":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "lesson":
        return <FileText className="h-5 w-5 text-green-600" />;
      case "material":
        return <Video className="h-5 w-5 text-orange-600" />;
      case "exercise":
        return <Brain className="h-5 w-5 text-purple-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
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

  const renderExercisePreview = () => {
    if (itemType !== "exercise" || !item.questions) {
      return null;
    }

    return (
      <div className="space-y-6">
        {/* Exercise Info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
          {item.description && (
            <p className="text-gray-600 mb-4">{item.description}</p>
          )}
          <div className="flex gap-4 text-sm">
            <Badge variant="outline">
              {item.questions.length} Soal
            </Badge>
            <Badge variant="outline">
              {item.questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0)} Poin
            </Badge>
            {item.ai_feedback_enabled && (
              <Badge className="bg-green-100 text-green-800">
                ✓ AI Feedback
              </Badge>
            )}
          </div>
        </div>

        {/* Questions Preview */}
        <div className="space-y-4">
          <h4 className="font-semibold mb-3">Daftar Soal</h4>
          {item.questions.map((question: any, index: number) => (
            <Card key={question.id} className="border-l-4" style={{ borderLeftColor: "#E8B824" }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Soal {index + 1}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {question.points} poin
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {question.type === "multiple_choice" ? "Pilihan Ganda" : "Benar/Salah"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Question */}
                <div>
                  <h5 className="font-medium mb-2">Pertanyaan:</h5>
                  <div className="p-3 bg-gray-50 rounded border">
                    <p className="text-sm">{question.question}</p>
                  </div>
                </div>

                {/* Options */}
                {question.type === "multiple_choice" && question.options && (
                  <div>
                    <h5 className="font-medium mb-2">Opsi Jawaban:</h5>
                    <div className="space-y-2">
                      {question.options.map((option: any, optIndex: number) => (
                        <div key={option.id} className="flex items-center gap-2 p-2 rounded border">
                          <div className={`w-4 h-4 rounded-full mr-2 ${
                            option.is_correct ? 'bg-green-500' : 'bg-gray-300'
                          }`}>
                            {option.is_correct && (
                              <span className="text-white text-xs">✓</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {String.fromCharCode(65 + optIndex)}. {option.text || "(kosong)"}
                            </div>
                            <div className="text-xs">
                              {option.is_correct ? "✓ Jawaban Benar" : "Jawaban Salah"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* True/False */}
                {question.type === "true_false" && question.options && (
                  <div>
                    <h5 className="font-medium mb-2">Jawaban Benar/Salah:</h5>
                    <div className="grid grid-cols-2 gap-4">
                      {question.options.map((option: any) => (
                        <div key={option.id} className={`p-3 rounded-lg border ${
                          option.is_correct 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${
                              option.is_correct ? 'bg-green-500' : 'bg-gray-300'
                            }`}>
                              {option.is_correct && (
                                <span className="text-white text-xs">✓</span>
                              )}
                            </div>
                            <div className="text-sm font-medium">
                              {option.is_correct ? "BENAR" : "SALAH"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {question.explanation && (
                  <div>
                    <h5 className="font-medium mb-2">Penjelasan:</h5>
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm">{question.explanation}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-semibold mb-2">Ringkasan Latihan</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Total Soal</div>
              <div className="font-semibold">{item.questions.length}</div>
            </div>
            <div>
              <div className="text-gray-600">Total Poin</div>
              <div className="font-semibold">
                {item.questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0)}
              </div>
            </div>
            <div>
              <div className="text-gray-600">AI Feedback</div>
              <div className="font-semibold">
                {item.ai_feedback_enabled ? "Aktif" : "Non-aktif"}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Status</div>
              <div className="font-semibold">
                {item.is_active ? "Aktif" : "Non-aktif"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLessonPreview = () => {
    if (itemType !== "lesson" || !item.content) {
      return null;
    }

    return (
      <div className="space-y-6">
        {/* Lesson Info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
          {item.description && (
            <p className="text-gray-600 mb-4">{item.description}</p>
          )}
          <div className="flex gap-4 text-sm">
            <Badge variant="outline">
              {item.lesson_type || "explanation"}
            </Badge>
            <Badge variant="outline">
              {item.is_active ? "Aktif" : "Non-aktif"}
            </Badge>
          </div>
        </div>

        {/* Content Preview */}
        <div>
          <h4 className="font-semibold mb-3">Konten Pelajaran:</h4>
          <div className="p-4 bg-white rounded-lg border">
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderMaterialPreview = () => {
    if (itemType !== "material") {
      return null;
    }

    return (
      <div className="space-y-6">
        {/* Material Info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
          {item.description && (
            <p className="text-gray-600 mb-4">{item.description}</p>
          )}
          <div className="flex gap-4 text-sm">
            <Badge variant="outline">
              {item.material_type || "video"}
            </Badge>
            <Badge variant="outline">
              {item.source_type || "upload"}
            </Badge>
            <Badge variant="outline">
              {item.is_active ? "Aktif" : "Non-aktif"}
            </Badge>
          </div>
        </div>

        {/* Material Preview */}
        <div>
          <h4 className="font-semibold mb-3">Preview Materi:</h4>
          <div className="p-4 bg-white rounded-lg border">
            {item.material_type === "video" && (
              <div className="text-center">
                <Video className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Video akan ditampilkan di sini</p>
                {item.file_url && (
                  <p className="text-sm text-gray-500 mt-2">
                    URL: {item.file_url}
                  </p>
                )}
              </div>
            )}

            {item.material_type === "audio" && (
              <div className="text-center">
                <Music className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Audio akan ditampilkan di sini</p>
                {item.file_url && (
                  <p className="text-sm text-gray-500 mt-2">
                    URL: {item.file_url}
                  </p>
                )}
              </div>
            )}

            {item.material_type === "pdf" && (
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">PDF akan ditampilkan di sini</p>
                {item.file_url && (
                  <p className="text-sm text-gray-500 mt-2">
                    URL: {item.file_url}
                  </p>
                )}
              </div>
            )}

            {item.material_type === "image" && (
              <div className="text-center">
                <Image className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Gambar akan ditampilkan di sini</p>
                {item.file_url && (
                  <p className="text-sm text-gray-500 mt-2">
                    URL: {item.file_url}
                  </p>
                )}
              </div>
            )}

            {item.material_type === "resource" && (
              <div className="text-center">
                <Link2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Link eksternal akan ditampilkan di sini</p>
                {item.external_url && (
                  <p className="text-sm text-blue-600 mt-2">
                    <a href={item.external_url} target="_blank" rel="noopener noreferrer">
                      {item.external_url}
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderModulePreview = () => {
    if (itemType !== "module") {
      return null;
    }

    return (
      <div className="space-y-6">
        {/* Module Info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
          {item.description && (
            <p className="text-gray-600 mb-4">{item.description}</p>
          )}
          <div className="flex gap-4 text-sm">
            <Badge variant="outline">
              Modul {item.order_index + 1}
            </Badge>
            <Badge variant="outline">
              {item.is_active ? "Aktif" : "Non-aktif"}
            </Badge>
          </div>
        </div>

        {/* Module Content Summary */}
        <div>
          <h4 className="font-semibold mb-3">Ringkasan Modul:</h4>
          <div className="p-4 bg-white rounded-lg border">
            <p className="text-gray-600">
              Modul ini berisi pelajaran, materi, dan latihan yang terkait.
              Preview lengkap akan menampilkan konten yang ada di dalam modul.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (itemType) {
      case "exercise":
        return renderExercisePreview();
      case "lesson":
        return renderLessonPreview();
      case "material":
        return renderMaterialPreview();
      case "module":
        return renderModulePreview();
      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Preview tidak tersedia</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {getItemIcon()}
            <div>
              <h2 className="text-xl font-bold">Preview {getItemTypeLabel()}</h2>
              <p className="text-sm text-gray-600">
                Tampilan siswa untuk {getItemTypeLabel().toLowerCase()}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Preview mode • Tidak ada perubahan yang disimpan
            </div>
            <Button
              onClick={onClose}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Tutup Preview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
