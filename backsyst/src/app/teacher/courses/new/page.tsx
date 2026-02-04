"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userData?.role !== "teacher") {
        router.push("/home");
        return;
      }

      setUser(user);
    };

    checkAuth();
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Course title is required");
      return;
    }

    if (!formData.description.trim()) {
      setError("Course description is required");
      return;
    }

    if (!user) {
      setError("User not found");
      return;
    }

    setLoading(true);

    try {
      const { data, error: createError } = await supabase
        .from("courses")
        .insert({
          title: formData.title,
          description: formData.description,
          teacher_id: user.id,
          class_type: "open",
          is_paid: false, 
        })
        .select()
        .single();

      if (createError) throw createError;

      router.push(`/teacher/courses/${data.id}/modules`);
    } catch (err: any) {
      setError(err.message || "Failed to create course");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFC" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: "rgba(26, 26, 26, 0.95)",
          borderBottomColor: "#333333",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="flex items-center gap-2"
            style={{ color: "#FFFFFC" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1
            className="text-4xl font-bold mb-2"
            style={{ color: "#1A1A1A", lineHeight: "1.3" }}
          >
            Create New Course
          </h1>
          <p style={{ color: "#4A4A4A" }}>
            Start by entering basic information about your course. You'll add
            modules and content in the next step.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Error Alert */}
          {error && (
            <div
              className="p-4 rounded-lg border border-red-200 bg-red-50 flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Course Title */}
          <div className="space-y-2">
            <Label
              htmlFor="title"
              className="text-sm font-semibold block"
              style={{ color: "#1A1A1A" }}
            >
              Course Title *
            </Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="e.g., Learn German from Zero"
              value={formData.title}
              onChange={handleInputChange}
              className="h-12 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 focus:outline-none pl-4 pr-10 text-base transition-colors"
              style={{
                backgroundColor: "#FFFFFC",
              }}
            />
            <p className="text-xs" style={{ color: "#999999" }}>
              Make it clear and descriptive
            </p>
          </div>

          {/* Course Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-sm font-semibold block"
              style={{ color: "#1A1A1A" }}
            >
              Course Description *
            </Label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe what students will learn in this course..."
              value={formData.description}
              onChange={handleInputChange}
              rows={5}
              className="w-full rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 focus:outline-none p-4 text-base transition-colors resize-none"
              style={{
                backgroundColor: "#FFFFFC",
                fontFamily: "inherit",
              }}
            />
            <p className="text-xs" style={{ color: "#999999" }}>
              This will be displayed in the course discovery page
            </p>
          </div>

          {/* Info Box */}
          <div
            className="p-4 rounded-lg border-2"
            style={{
              backgroundColor: "#FFFBF0",
              borderColor: "#E8B824",
            }}
          >
            <p className="text-sm font-semibold mb-2" style={{ color: "#E8B824" }}>
              📝 Course Type: Open Class (Free)
            </p>
            <p className="text-sm" style={{ color: "#4A4A4A" }}>
              You're creating an open, self-paced course. Students will be able
              to preview the first 3 modules before enrolling. You can change
              this to paid later.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6 border-t" style={{ borderColor: "#E5E5E5" }}>
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
              className="flex-1 h-12"
              style={{
                color: "#1A1A1A",
                borderColor: "#E5E5E5",
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 font-semibold"
              style={{
                backgroundColor: "#E8B824",
                color: "#1A1A1A",
              }}
            >
              {loading ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
