"use client";

import React, { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Upload,
  Music,
  Video,
  Image,
  X,
  Plus,
  Code,
  Strikethrough,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LessonContentEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function LessonContentEditor({ content, onChange }: LessonContentEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const [videoUrl, setVideoUrl] = useState("");
  const [videoType, setVideoType] = useState<"youtube" | "mp4">("youtube");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);

  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const [audioUrl, setAudioUrl] = useState("");
  const [audioType, setAudioType] = useState<"mp3" | "wav">("mp3");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUploading, setAudioUploading] = useState(false);

  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  const insertAtCursor = (text: string) => {
    if (editorRef.current) {
      const startPos = editorRef.current.selectionStart;
      const endPos = editorRef.current.selectionEnd;
      const newContent =
        content.substring(0, startPos) + text + content.substring(endPos);
      onChange(newContent);

      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = editorRef.current.selectionEnd =
            startPos + text.length;
          editorRef.current.focus();
        }
      }, 0);
    }
  };

  const insertBold = () => {
    insertAtCursor("<strong>bold text</strong>");
  };

  const insertItalic = () => {
    insertAtCursor("<em>italic text</em>");
  };

  const insertUnderline = () => {
    insertAtCursor("<u>underlined text</u>");
  };

  const insertStrikethrough = () => {
    insertAtCursor("<s>strikethrough text</s>");
  };

  const insertHeading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
    insertAtCursor(`\n<h${level}>Heading ${level}</h${level}>\n`);
  };

  const insertList = () => {
    insertAtCursor(
      "\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>\n"
    );
  };

  const insertOrderedList = () => {
    insertAtCursor(
      "\n<ol>\n  <li>First item</li>\n  <li>Second item</li>\n  <li>Third item</li>\n</ol>\n"
    );
  };

  const insertCode = () => {
    insertAtCursor(
      "<pre><code>// Your code here\nlet example = 'code';</code></pre>"
    );
  };

  const uploadFileToSupabase = async (
    file: File,
    folder: string
  ): Promise<string | null> => {
    try {
      const timestamp = Date.now();
      const filename = `${timestamp}-${file.name}`;
      const path = `${folder}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from("lesson-media")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert(`Upload error: ${uploadError.message}`);
        return null;
      }

      const { data } = supabase.storage
        .from("lesson-media")
        .getPublicUrl(path);

      return data?.publicUrl || null;
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please check console for details.");
      return null;
    }
  };

  const insertVideo = async () => {
    if (videoFile) {
      setVideoUploading(true);
      const publicUrl = await uploadFileToSupabase(videoFile, "videos");

      if (!publicUrl) {
        setVideoUploading(false);
        return;
      }

      const videoHtml = `<div style="margin: 16px 0; aspect-ratio: 16/9; border-radius: 8px; overflow: hidden; background-color: #000;">
  <video controls style="width: 100%; height: 100%; border: none;">
    <source src="${publicUrl}" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</div>`;

      insertAtCursor(videoHtml);
      setVideoFile(null);
      setVideoUrl("");
      setVideoUploading(false);
      setShowVideoModal(false);
      return;
    }

    if (!videoUrl.trim()) return;

    let videoHtml = "";
    if (videoType === "youtube") {
      const videoId = extractYouTubeId(videoUrl);
      if (videoId) {
        videoHtml = `<div style="margin: 16px 0; aspect-ratio: 16/9; border-radius: 8px; overflow: hidden;">
  <iframe 
    width="100%" 
    height="100%" 
    src="https://www.youtube.com/embed/${videoId}" 
    frameBorder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
    allowFullScreen
    style="border: none;"
  ></iframe>
</div>`;
      }
    } else {
      videoHtml = `<div style="margin: 16px 0; aspect-ratio: 16/9; border-radius: 8px; overflow: hidden; background-color: #000;">
  <video controls style="width: 100%; height: 100%; border: none;">
    <source src="${videoUrl}" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</div>`;
    }

    if (videoHtml) {
      insertAtCursor(videoHtml);
      setVideoUrl("");
      setShowVideoModal(false);
    }
  };

  const insertImage = async () => {
    if (imageFile) {
      setImageUploading(true);
      const publicUrl = await uploadFileToSupabase(imageFile, "images");

      if (!publicUrl) {
        setImageUploading(false);
        return;
      }

      const imageHtml = `<div style="margin: 16px 0; text-align: center;">
  <img 
    src="${publicUrl}" 
    alt="Lesson image" 
    style="max-width: 100%; height: auto; border-radius: 8px; display: inline-block; max-height: 400px;"
  />
</div>`;

      insertAtCursor(imageHtml);
      setImageFile(null);
      setImageUrl("");
      setImageUploading(false);
      setShowImageModal(false);
      return;
    }

    if (!imageUrl.trim()) return;

    const imageHtml = `<div style="margin: 16px 0; text-align: center;">
  <img 
    src="${imageUrl}" 
    alt="Lesson image" 
    style="max-width: 100%; height: auto; border-radius: 8px; display: inline-block; max-height: 400px;"
  />
</div>`;

    insertAtCursor(imageHtml);
    setImageUrl("");
    setShowImageModal(false);
  };

  const insertAudio = async () => {
    if (audioFile) {
      setAudioUploading(true);
      const publicUrl = await uploadFileToSupabase(audioFile, "audio");

      if (!publicUrl) {
        setAudioUploading(false);
        return;
      }

      const audioHtml = `<div style="margin: 16px 0; padding: 12px; background-color: #f5f5f5; border-radius: 8px;">
  <audio controls style="width: 100%;">
    <source src="${publicUrl}" type="audio/${audioType}">
    Your browser does not support the audio element.
  </audio>
</div>`;

      insertAtCursor(audioHtml);
      setAudioFile(null);
      setAudioUrl("");
      setAudioUploading(false);
      setShowAudioModal(false);
      return;
    }

    if (!audioUrl.trim()) return;

    const audioHtml = `<div style="margin: 16px 0; padding: 12px; background-color: #f5f5f5; border-radius: 8px;">
  <audio controls style="width: 100%;">
    <source src="${audioUrl}" type="audio/${audioType}">
    Your browser does not support the audio element.
  </audio>
</div>`;

    insertAtCursor(audioHtml);
    setAudioUrl("");
    setShowAudioModal(false);
  };

  const insertLink = () => {
    if (!linkUrl.trim() || !linkText.trim()) return;

    const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color: #E87835; text-decoration: underline; font-weight: 500;">${linkText}</a>`;

    insertAtCursor(linkHtml);
    setLinkUrl("");
    setLinkText("");
    setShowLinkModal(false);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar - Row 1: Text Formatting */}
      <div className="flex gap-1 flex-wrap p-2 rounded-lg border border-gray-200" style={{ backgroundColor: "#F5F5F5" }}>
        <div className="flex gap-1 border-r pr-2" style={{ borderRightColor: "#D4D4D4" }}>
          <button
            onClick={insertBold}
            className="p-2 rounded hover:bg-yellow-100 transition-colors"
            title="Bold"
            style={{ backgroundColor: "transparent", color: "#1A1A1A" }}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={insertItalic}
            className="p-2 rounded hover:bg-yellow-100 transition-colors"
            title="Italic"
            style={{ backgroundColor: "transparent", color: "#1A1A1A" }}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={insertUnderline}
            className="p-2 rounded hover:bg-yellow-100 transition-colors"
            title="Underline"
            style={{ backgroundColor: "transparent", color: "#1A1A1A" }}
          >
            <Underline className="h-4 w-4" />
          </button>
          <button
            onClick={insertStrikethrough}
            className="p-2 rounded hover:bg-yellow-100 transition-colors"
            title="Strikethrough"
            style={{ backgroundColor: "transparent", color: "#1A1A1A" }}
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <button
            onClick={insertCode}
            className="p-2 rounded hover:bg-yellow-100 transition-colors"
            title="Code Block"
            style={{ backgroundColor: "transparent", color: "#1A1A1A" }}
          >
            <Code className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 border-r pr-2" style={{ borderRightColor: "#D4D4D4" }}>
          <button
            onClick={() => insertHeading(1)}
            className="px-2 py-2 rounded hover:bg-yellow-100 transition-colors text-sm font-bold"
            title="Heading 1"
            style={{ backgroundColor: "transparent", color: "#1A1A1A" }}
          >
            H1
          </button>
          <button
            onClick={() => insertHeading(2)}
            className="px-2 py-2 rounded hover:bg-yellow-100 transition-colors text-sm font-bold"
            title="Heading 2"
            style={{ backgroundColor: "transparent", color: "#1A1A1A" }}
          >
            H2
          </button>
          <button
            onClick={() => insertHeading(3)}
            className="px-2 py-2 rounded hover:bg-yellow-100 transition-colors text-sm font-bold"
            title="Heading 3"
            style={{ backgroundColor: "transparent", color: "#1A1A1A" }}
          >
            H3
          </button>
        </div>

        <div className="flex gap-1">
          <button
            onClick={insertList}
            className="p-2 rounded hover:bg-yellow-100 transition-colors"
            title="Bullet List"
            style={{ backgroundColor: "transparent", color: "#1A1A1A" }}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={insertOrderedList}
            className="p-2 rounded hover:bg-yellow-100 transition-colors"
            title="Numbered List"
            style={{ backgroundColor: "transparent", color: "#1A1A1A" }}
          >
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Toolbar - Row 2: Media Insertion */}
      <div className="flex gap-1 flex-wrap p-2 rounded-lg border border-gray-200" style={{ backgroundColor: "#F5F5F5" }}>
        <div className="flex gap-1">
          <button
            onClick={() => setShowVideoModal(true)}
            className="p-2 rounded hover:bg-yellow-100 transition-colors"
            title="Add Video"
            style={{ backgroundColor: "transparent", color: "#E87835" }}
          >
            <Video className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowImageModal(true)}
            className="p-2 rounded hover:bg-yellow-100 transition-colors"
            title="Add Image"
            style={{ backgroundColor: "transparent", color: "#E8B824" }}
          >
            <Image className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowAudioModal(true)}
            className="p-2 rounded hover:bg-yellow-100 transition-colors"
            title="Add Audio"
            style={{ backgroundColor: "transparent", color: "#9333EA" }}
          >
            <Music className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowLinkModal(true)}
            className="p-2 rounded hover:bg-yellow-100 transition-colors"
            title="Add Link"
            style={{ backgroundColor: "transparent", color: "#0891B2" }}
          >
            <Link2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor Textarea */}
      <textarea
        ref={editorRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add your lesson content here... Use the toolbar above for media, formatting, and more."
        rows={10}
        className="w-full rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 p-3 text-sm resize-none"
        style={{
          backgroundColor: "#FFFFFC",
          fontFamily: "monospace",
          fontSize: "12px",
        }}
      />

      <p className="text-xs" style={{ color: "#999999" }}>
        💡 Tip: Use formatting buttons to add media and content, or write HTML directly.
      </p>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="rounded-lg max-w-md w-full p-6"
            style={{ backgroundColor: "#FFFFFC" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>
                Add Video
              </h3>
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setVideoFile(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                  Video Source Type
                </label>
                <select
                  value={videoType}
                  onChange={(e) => setVideoType(e.target.value as any)}
                  className="w-full h-9 rounded-lg border-2 border-gray-200 focus:border-yellow-400 px-3 mt-1 text-sm"
                  style={{ backgroundColor: "#FFFFFC", color: "#1A1A1A" }}
                >
                  <option value="youtube">YouTube Link</option>
                  <option value="mp4">Upload/External MP4</option>
                </select>
              </div>

              {videoType === "youtube" ? (
                <div>
                  <label className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                    YouTube URL
                  </label>
                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="e.g., https://www.youtube.com/watch?v=..."
                    className="h-9 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1 text-sm"
                    style={{ backgroundColor: "#FFFFFC" }}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-semibold mb-2 block" style={{ color: "#1A1A1A" }}>
                      Upload Video File (MP4, WebM)
                    </label>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={(e) => {
                        setVideoFile(e.target.files?.[0] || null);
                        setVideoUrl("");
                      }}
                      disabled={videoUploading}
                      className="w-full h-9 rounded-lg border-2 border-gray-200 px-3 text-sm file:bg-gray-100 file:border-0 file:rounded file:px-3 file:py-1 file:text-xs file:font-semibold disabled:opacity-50"
                      style={{ backgroundColor: "#FFFFFC" }}
                    />
                    <p className="text-xs mt-1" style={{ color: "#999999" }}>
                      {videoFile ? `Selected: ${videoFile.name}` : "Will upload to Supabase Storage"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs" style={{ color: "#999999" }}>
                    <span>OR</span>
                  </div>

                  <div>
                    <label className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                      Paste Video URL
                    </label>
                    <Input
                      value={videoUrl}
                      onChange={(e) => {
                        setVideoUrl(e.target.value);
                        setVideoFile(null);
                      }}
                      disabled={videoUploading}
                      placeholder="e.g., https://example.com/video.mp4"
                      className="h-9 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1 text-sm disabled:opacity-50"
                      style={{ backgroundColor: "#FFFFFC" }}
                    />
                  </div>
                </>
              )}

              <Button
                onClick={insertVideo}
                disabled={(!videoUrl.trim() && !videoFile) || videoUploading}
                className="w-full h-9 font-semibold flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "#E87835",
                  color: "#1A1A1A",
                }}
              >
                {videoUploading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Insert Video
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="rounded-lg max-w-md w-full p-6"
            style={{ backgroundColor: "#FFFFFC" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>
                Add Image
              </h3>
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setImageFile(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold mb-2 block" style={{ color: "#1A1A1A" }}>
                  Upload Image File (JPG, PNG, WebP)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    setImageFile(e.target.files?.[0] || null);
                    setImageUrl("");
                  }}
                  disabled={imageUploading}
                  className="w-full h-9 rounded-lg border-2 border-gray-200 px-3 text-sm file:bg-gray-100 file:border-0 file:rounded file:px-3 file:py-1 file:text-xs file:font-semibold disabled:opacity-50"
                  style={{ backgroundColor: "#FFFFFC" }}
                />
                <p className="text-xs mt-1" style={{ color: "#999999" }}>
                  {imageFile ? `Selected: ${imageFile.name}` : "Will upload to Supabase Storage"}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs" style={{ color: "#999999" }}>
                <span>OR</span>
              </div>

              <div>
                <label className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                  Paste Image URL
                </label>
                <Input
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImageFile(null);
                  }}
                  disabled={imageUploading}
                  placeholder="e.g., https://example.com/image.jpg"
                  className="h-9 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1 text-sm disabled:opacity-50"
                  style={{ backgroundColor: "#FFFFFC" }}
                />
              </div>

              <Button
                onClick={insertImage}
                disabled={(!imageUrl.trim() && !imageFile) || imageUploading}
                className="w-full h-9 font-semibold flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "#E8B824",
                  color: "#1A1A1A",
                }}
              >
                {imageUploading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Insert Image
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Modal */}
      {showAudioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="rounded-lg max-w-md w-full p-6"
            style={{ backgroundColor: "#FFFFFC" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>
                Add Audio
              </h3>
              <button
                onClick={() => {
                  setShowAudioModal(false);
                  setAudioFile(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                  Audio Format
                </label>
                <select
                  value={audioType}
                  onChange={(e) => setAudioType(e.target.value as any)}
                  className="w-full h-9 rounded-lg border-2 border-gray-200 focus:border-yellow-400 px-3 mt-1 text-sm"
                  style={{ backgroundColor: "#FFFFFC", color: "#1A1A1A" }}
                >
                  <option value="mp3">MP3</option>
                  <option value="wav">WAV</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block" style={{ color: "#1A1A1A" }}>
                  Upload Audio File
                </label>
                <input
                  type="file"
                  accept="audio/mp3,audio/wav,audio/mpeg,audio/wav"
                  onChange={(e) => {
                    setAudioFile(e.target.files?.[0] || null);
                    setAudioUrl("");
                  }}
                  disabled={audioUploading}
                  className="w-full h-9 rounded-lg border-2 border-gray-200 px-3 text-sm file:bg-gray-100 file:border-0 file:rounded file:px-3 file:py-1 file:text-xs file:font-semibold disabled:opacity-50"
                  style={{ backgroundColor: "#FFFFFC" }}
                />
                <p className="text-xs mt-1" style={{ color: "#999999" }}>
                  {audioFile ? `Selected: ${audioFile.name}` : "Will upload to Supabase Storage"}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs" style={{ color: "#999999" }}>
                <span>OR</span>
              </div>

              <div>
                <label className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                  Paste Audio URL
                </label>
                <Input
                  value={audioUrl}
                  onChange={(e) => {
                    setAudioUrl(e.target.value);
                    setAudioFile(null);
                  }}
                  disabled={audioUploading}
                  placeholder="e.g., https://example.com/audio.mp3"
                  className="h-9 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1 text-sm disabled:opacity-50"
                  style={{ backgroundColor: "#FFFFFC" }}
                />
              </div>

              <Button
                onClick={insertAudio}
                disabled={(!audioUrl.trim() && !audioFile) || audioUploading}
                className="w-full h-9 font-semibold flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "#9333EA",
                  color: "#FFFFFF",
                }}
              >
                {audioUploading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Insert Audio
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="rounded-lg max-w-md w-full p-6"
            style={{ backgroundColor: "#FFFFFC" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>
                Add Link
              </h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                  Link Text
                </label>
                <Input
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g., Click here for more info"
                  className="h-9 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1 text-sm"
                  style={{ backgroundColor: "#FFFFFC" }}
                />
              </div>

              <div>
                <label className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                  Link URL
                </label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="e.g., https://example.com"
                  className="h-9 rounded-lg border-2 border-gray-200 focus:border-yellow-400 mt-1 text-sm"
                  style={{ backgroundColor: "#FFFFFC" }}
                />
              </div>

              <Button
                onClick={insertLink}
                disabled={!linkUrl.trim() || !linkText.trim()}
                className="w-full h-9 font-semibold"
                style={{
                  backgroundColor: "#0891B2",
                  color: "#FFFFFF",
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Insert Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function extractYouTubeId(url: string): string | null {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length == 11) {
    return match[2];
  } else {
    return null;
  }
}
