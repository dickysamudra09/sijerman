"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserMenuDropdown from "@/components/UserMenuDropdown";
import { ArrowRight, Lock, BookOpen, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Course {
  id: string;
  title: string;
  description: string;
  teacher_id: string;
  is_paid: boolean;
  created_at: string;
  teacher?: { id: string; name: string; email: string };
  isEnrolled?: boolean;
}

export default function OpenCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "free" | "paid">(
    "all"
  );
  const [enrollmentFilter, setEnrollmentFilter] = useState<"all" | "enrolled" | "not-enrolled">(
    "all"
  );
  const [sortBy, setSortBy] = useState<"terbaru" | "populer">("terbaru");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from("courses")
          .select(
            `
            id,
            title,
            description,
            teacher_id,
            is_paid,
            created_at
          `
          )
          .eq("class_type", "open")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const teacherIds = [...new Set(data.map((c) => c.teacher_id))];

          const { data: allUsers } = await supabase
            .from("users")
            .select("id, name, email");

          const teachersData = allUsers?.filter((u) => teacherIds.includes(u.id)) || [];

          let coursesWithTeachers = data.map((course) => ({
            ...course,
            teacher: teachersData.find((t) => t.id === course.teacher_id),
            isEnrolled: false,
          }));

          if (user) {
            const { data: enrollments, error: enrollError } = await supabase
              .from("course_enrollments")
              .select("course_id")
              .eq("user_id", user.id);

            console.log("Enrollment data:", enrollments);
            console.log("Enrollment error:", enrollError);
            console.log("Current user ID:", user.id);

            if (enrollments) {
              const enrolledCourseIds = new Set(enrollments.map((e) => e.course_id));
              console.log("Enrolled course IDs:", enrolledCourseIds);
              coursesWithTeachers = coursesWithTeachers.map((course) => ({
                ...course,
                isEnrolled: enrolledCourseIds.has(course.id),
              }));
            }
          }

          setCourses(coursesWithTeachers || []);
          setFilteredCourses(coursesWithTeachers || []);
        } else {
          setCourses(data || []);
          setFilteredCourses(data || []);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  useEffect(() => {
    let filtered = courses;

    if (selectedFilter === "free") {
      filtered = filtered.filter((course) => !course.is_paid);
    } else if (selectedFilter === "paid") {
      filtered = filtered.filter((course) => course.is_paid);
    }

    if (enrollmentFilter === "enrolled") {
      filtered = filtered.filter((course) => course.isEnrolled);
    } else if (enrollmentFilter === "not-enrolled") {
      filtered = filtered.filter((course) => !course.isEnrolled);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.description?.toLowerCase().includes(query)
      );
    }

    if (sortBy === "terbaru") {
      filtered = filtered.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortBy === "populer") {
      filtered = filtered.sort((a, b) => b.title.localeCompare(a.title));
    }

    setFilteredCourses(filtered);
  }, [searchQuery, selectedFilter, enrollmentFilter, sortBy, courses]);

  const handlePreview = (courseId: string) => {
    router.push(`/open-courses/${courseId}/preview`);
  };

  const handleEnroll = (courseId: string) => {
    if (!user) {
      router.push("/auth/register");
      return;
    }
    router.push(`/open-courses/${courseId}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFC" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b overflow-visible"
        style={{
          backgroundColor: "rgba(13, 13, 13, 0.90)",
          backdropFilter: "blur(10px)",
          borderBottomColor: "#333333",
          overflow: "visible"
        }}
      >
        <div className="container mx-auto px-4 py-4 overflow-visible" style={{ overflow: 'visible' }}>
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/img/1.png"
                alt="Logo"
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold" style={{ color: "#E8B824" }}>Si Jerman</h1>
                <p className="text-xs uppercase tracking-wider" style={{ color: "#FFFFFC" }}>Learning Platform</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/")}
                    style={{ color: "#FFFFFC" }}
                  >
                    Home
                  </Button>
                  <UserMenuDropdown
                    user={user}
                    onLogout={async () => {
                      await supabase.auth.signOut();
                      router.push("/auth/login");
                    }}
                    onNavigate={router.push}
                  />
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/auth/login")}
                    style={{ backgroundColor: "#FFFFFC", color: "#1A1A1A", borderColor: "#FFFFFC" }}
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => router.push("/auth/register")}
                    style={{ backgroundColor: "#E8B824", color: "#1A1A1A" }}
                  >
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-6 md:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1
            className="text-2xl sm:text-3xl font-bold mb-2 leading-tight"
            style={{ color: "#1A1A1A", lineHeight: "1.3" }}
          >
            Explore Open Courses
          </h1>
          <p
            className="text-sm mb-6"
            style={{ color: "#4A4A4A", lineHeight: "1.6" }}
          >
            Choose from our collection of free and premium self-paced learning
            courses
          </p>
        </div>
      </section>

      {/* Search & Filter dengan Sidebar */}
      <section className="px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="relative mb-6 pb-6 border-b" style={{ borderColor: "#E5E5E5" }}>
            <Input
              placeholder="Search courses by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 focus:outline-none pl-4 pr-10 text-base transition-colors"
              style={{
                backgroundColor: "#FFFFFC",
              }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="h-5 w-5"
                style={{ color: "#999999" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Sort Dropdown di Atas Garis Batas */}
          <div className="flex justify-end mb-6 pb-6 border-b" style={{ borderColor: "#E5E5E5" }}>
            <div className="flex items-center gap-2">
              <label 
                className="text-sm font-medium"
                style={{ color: "#4A4A4A" }}
              >
                Urutkan:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "terbaru" | "populer")}
                className="px-4 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400"
                style={{
                  backgroundColor: "#FFFFFC",
                  borderColor: "#E5E5E5",
                  color: "#1A1A1A",
                }}
              >
                <option value="terbaru">Terbaru</option>
                <option value="populer">Populer</option>
              </select>
            </div>
          </div>

          {/* Layout dengan Sidebar & Content */}
          <div className="flex gap-6 pt-6">
            {/* Sidebar Kiri */}
            <div className="w-64 flex-shrink-0 pr-6 border-r" style={{ borderColor: "#E5E5E5" }}>
              {/* Filter Tipe Kursus */}
              <div className="mb-8">
                <h3
                  className="font-bold mb-3 text-sm uppercase tracking-wider"
                  style={{ color: "#1A1A1A" }}
                >
                  Tipe Kursus
                </h3>
                <div className="space-y-2">
                  {(["all", "free", "paid"] as const).map((filter) => (
                    <Button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      variant="outline"
                      className="w-full justify-start text-sm font-medium transition-all"
                      style={{
                        backgroundColor:
                          selectedFilter === filter ? "#E8B824" : "#F5F5F5",
                        color:
                          selectedFilter === filter ? "#1A1A1A" : "#4A4A4A",
                        border:
                          selectedFilter === filter
                            ? "1px solid #E8B824"
                            : "1px solid #E5E5E5",
                      }}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Filter Status Pendaftaran */}
              <div>
                <h3
                  className="font-bold mb-3 text-sm uppercase tracking-wider"
                  style={{ color: "#1A1A1A" }}
                >
                  Status Pendaftaran
                </h3>
                <div className="space-y-2">
                  {(["all", "enrolled", "not-enrolled"] as const).map((filter) => (
                    <Button
                      key={filter}
                      onClick={() => setEnrollmentFilter(filter)}
                      variant="outline"
                      className="w-full justify-start text-sm font-medium transition-all"
                      style={{
                        backgroundColor:
                          enrollmentFilter === filter ? "#E8B824" : "#F5F5F5",
                        color:
                          enrollmentFilter === filter ? "#1A1A1A" : "#4A4A4A",
                        border:
                          enrollmentFilter === filter
                            ? "1px solid #E8B824"
                            : "1px solid #E5E5E5",
                      }}
                    >
                      {filter === "all"
                        ? "Semua Kursus"
                        : filter === "enrolled"
                        ? "✓ Terdaftar"
                        : "Belum Terdaftar"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Kanan */}
            <div className="flex-1 min-w-0">
              {loading ? (
            <div className="flex items-center justify-center py-20">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2"
                style={{ borderColor: "#E8B824" }}
              ></div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen
                className="h-16 w-16 mx-auto mb-4"
                style={{ color: "#999999" }}
              />
              <p
                className="text-lg"
                style={{ color: "#4A4A4A" }}
              >
                No courses found. Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                  style={{ backgroundColor: "#FFFFFC", border: "1px solid #E5E5E5" }}
                >
                  {/* Card Header */}
                  <div
                    className="h-32 p-4 flex items-end justify-between"
                    style={{
                      background: `linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)`,
                    }}
                  >
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                        {course.title}
                      </h3>
                    </div>
                    <div className="flex gap-2 flex-col items-end">
                      {course.is_paid && (
                        <div
                          className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold"
                          style={{
                            backgroundColor: "#E8B824",
                            color: "#1A1A1A",
                          }}
                        >
                          <Lock className="h-3 w-3" />
                          Paid
                        </div>
                      )}
                      {course.isEnrolled && (
                        <div
                          className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold"
                          style={{
                            backgroundColor: "#22C55E",
                            color: "#FFFFFF",
                          }}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Terdaftar
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    {/* Description */}
                    <p
                      className="text-sm mb-4 line-clamp-2"
                      style={{ color: "#4A4A4A" }}
                    >
                      {course.description || "No description available"}
                    </p>

                    {/* Teacher Info */}
                    <div className="mb-4 pb-4 border-t" style={{ borderColor: "#E5E5E5" }}>
                      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#999999" }}>
                        Teacher
                      </p>
                      <p
                        className="font-semibold"
                        style={{ color: "#1A1A1A" }}
                      >
                        {course.teacher?.name || "Unknown Teacher"}
                      </p>
                    </div>

                    {/* CTA Button */}
                    <Button
                      onClick={() =>
                        user
                          ? course.isEnrolled
                            ? router.push(`/open-courses/${course.id}`)
                            : handleEnroll(course.id)
                          : handlePreview(course.id)
                      }
                      className="w-full h-10 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: course.isEnrolled ? "#22C55E" : "#1A1A1A",
                        color: "#FFFFFC",
                      }}
                    >
                      {user ? (
                        course.isEnrolled ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Lanjutkan Belajar
                          </>
                        ) : (
                          <>
                            Daftar Sekarang
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )
                      ) : (
                        <>
                          Preview
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>

                    {!user && (
                      <p className="text-xs text-center mt-2" style={{ color: "#999999" }}>
                        Register to enroll in course
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
