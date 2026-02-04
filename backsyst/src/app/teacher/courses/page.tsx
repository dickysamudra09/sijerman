"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Users,
  Lock,
} from "lucide-react";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  description: string;
  class_type: string;
  is_paid: boolean;
  created_at: string;
  course_enrollments?: any[];
}

export default function TeacherCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("courses")
          .select(
            `
            id,
            title,
            description,
            class_type,
            is_paid,
            created_at,
            course_enrollments(count)
          `
          )
          .eq("teacher_id", user.id)
          .eq("class_type", "open")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setCourses(data || []);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCourses();
    }
  }, [user]);

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (error) throw error;

      setCourses(courses.filter((c) => c.id !== courseId));
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Failed to delete course");
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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/home"
            className="flex items-center gap-2 text-white hover:opacity-70 transition-opacity"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: "#E8B824" }}>
            My Open Courses
          </h1>
          <Button
            onClick={() => router.push("/teacher/courses/new")}
            className="flex items-center gap-2 h-10"
            style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
          >
            <Plus className="h-4 w-4" />
            Create Course
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2"
              style={{ borderColor: "#E8B824" }}
            ></div>
          </div>
        ) : courses.length === 0 ? (
          <div
            className="rounded-lg p-12 text-center"
            style={{
              backgroundColor: "#F5F5F5",
              border: "2px dashed #E5E5E5",
            }}
          >
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#1A1A1A" }}>
              No Courses Yet
            </h2>
            <p className="mb-6" style={{ color: "#4A4A4A" }}>
              Create your first open course to start teaching!
            </p>
            <Button
              onClick={() => router.push("/teacher/courses/new")}
              className="flex items-center gap-2 mx-auto"
              style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
            >
              <Plus className="h-4 w-4" />
              Create Your First Course
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {courses.map((course) => {
              const enrollmentCount = (
                course.course_enrollments as any[]
              )?.[0]?.count || 0;

              return (
                <div
                  key={course.id}
                  className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                  style={{
                    backgroundColor: "#FFFFFC",
                    border: "1px solid #E5E5E5",
                  }}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3
                            className="text-2xl font-bold"
                            style={{ color: "#1A1A1A" }}
                          >
                            {course.title}
                          </h3>
                          {course.is_paid && (
                            <div
                              className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                              style={{
                                backgroundColor: "#E8B824",
                                color: "#1A1A1A",
                              }}
                            >
                              <Lock className="h-3 w-3" />
                              Paid
                            </div>
                          )}
                        </div>
                        <p
                          className="text-sm mb-3"
                          style={{ color: "#4A4A4A" }}
                        >
                          {course.description}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mb-4 pb-4 border-t border-b" style={{ borderColor: "#E5E5E5" }}>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ color: "#999999" }}>
                          Enrollments
                        </p>
                        <p className="text-xl font-bold flex items-center gap-2" style={{ color: "#1A1A1A" }}>
                          <Users className="h-5 w-5" style={{ color: "#E8B824" }} />
                          {enrollmentCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ color: "#999999" }}>
                          Created
                        </p>
                        <p style={{ color: "#1A1A1A" }}>
                          {new Date(course.created_at).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() =>
                          router.push(
                            `/teacher/courses/${course.id}/modules`
                          )
                        }
                        className="flex items-center gap-2 flex-1"
                        style={{
                          backgroundColor: "#1A1A1A",
                          color: "#FFFFFC",
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit Modules
                      </Button>
                      <Button
                        onClick={() =>
                          router.push(
                            `/open-courses/${course.id}/preview`
                          )
                        }
                        variant="outline"
                        className="flex items-center gap-2"
                        style={{
                          color: "#1A1A1A",
                          borderColor: "#E5E5E5",
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        onClick={() => handleDelete(course.id)}
                        variant="outline"
                        className="flex items-center gap-2"
                        style={{
                          color: "#DC2626",
                          borderColor: "#FCA5A5",
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
