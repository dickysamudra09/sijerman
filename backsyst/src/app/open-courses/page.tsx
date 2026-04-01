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
      <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "#EFF6FF" }}>
                  <BookOpen className="h-6 w-6" style={{ color: "#0F766E" }} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#0F766E" }}>Koleksi Kursus</span>
              </div>
              <h1
                className="text-3xl sm:text-4xl font-bold mb-3 leading-tight"
                style={{ color: "#1A1A1A", lineHeight: "1.2" }}
              >
                Jelajahi Kursus Terbuka
              </h1>
              <p
                className="text-sm mb-6"
                style={{ color: "#4A4A4A", lineHeight: "1.6" }}
              >
                Pilih dari koleksi kursus pembelajaran self-paced gratis dan premium kami
              </p>
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>{filteredCourses.length}</p>
                  <p className="text-xs" style={{ color: "#64748B" }}>Kursus Tersedia</p>
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: "#14B8A6" }}>100%</p>
                  <p className="text-xs" style={{ color: "#64748B" }}>Gratis & Premium</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter dengan Sidebar */}
      <section className="px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="relative mb-6 pb-6 border-b" style={{ borderColor: "#E2E8F0" }}>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <svg
                  className="h-5 w-5"
                  style={{ color: "#64748B" }}
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
              <Input
                placeholder="Cari kursus berdasarkan nama atau deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 rounded-lg border-2 focus:ring-2 focus:outline-none pl-12 pr-4 text-base transition-all"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                }}
              />
            </div>
          </div>

          {/* Sort Dropdown di Atas Garis Batas */}
          <div className="flex justify-end mb-6 pb-6 border-b" style={{ borderColor: "#E2E8F0" }}>
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5"
                style={{ color: "#64748B" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 16a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"
                />
              </svg>
              <label 
                className="text-sm font-medium"
                style={{ color: "#64748B" }}
              >
                Urutkan:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "terbaru" | "populer")}
                className="px-4 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
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
            <div className="w-64 flex-shrink-0 pr-6 border-r rounded-xl p-4" style={{ borderColor: "#E5E5E5", backgroundColor: "#FFFFFF" }}>
              {/* Filter Tipe Kursus */}
              <div className="mb-8">
                <div
                  className="font-bold mb-4 text-sm uppercase tracking-wider p-3 rounded-lg flex items-center gap-2"
                  style={{ backgroundColor: "#EFF6FF", color: "#3B82F6" }}
                >
                  <BookOpen className="h-4 w-4" />
                  Tipe Kursus
                </div>
                <div className="space-y-2">
                  {(["all", "free", "paid"] as const).map((filter) => (
                    <Button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      variant="outline"
                      className="w-full justify-start text-sm font-normal transition-colors"
                      style={{
                        backgroundColor:
                          selectedFilter === filter ? "#F0FAFB" : "#FFFFFF",
                        color:
                          selectedFilter === filter ? "#0F766E" : "#64748B",
                        border:
                          selectedFilter === filter
                            ? "1.5px solid #14B8A6"
                            : "1px solid #E2E8F0",
                      }}
                    >
                      {filter === "all" ? "Semua" : filter === "free" ? "Gratis" : "Berbayar"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Filter Status Pendaftaran */}
              <div>
                <div
                  className="font-bold mb-4 text-sm uppercase tracking-wider p-3 rounded-lg flex items-center gap-2"
                  style={{ backgroundColor: "#FEF3C7", color: "#B45309" }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Status Pendaftaran
                </div>
                <div className="space-y-2">
                  {(["all", "enrolled", "not-enrolled"] as const).map((filter) => (
                    <Button
                      key={filter}
                      onClick={() => setEnrollmentFilter(filter)}
                      variant="outline"
                      className="w-full justify-start text-sm font-normal transition-colors"
                      style={{
                        backgroundColor:
                          enrollmentFilter === filter ? "#FFFBEB" : "#FFFFFF",
                        color:
                          enrollmentFilter === filter ? "#92400E" : "#64748B",
                        border:
                          enrollmentFilter === filter
                            ? "1.5px solid #F59E0B"
                            : "1px solid #E2E8F0",
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                return (
                  <div
                    key={course.id}
                    className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all flex flex-col h-full"
                    style={{ backgroundColor: "#FFFFFC" }}
                  >
                    {/* Image/Thumbnail Area */}
                    <div className="h-48 relative overflow-hidden bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 flex items-center justify-center">
                      {/* Status Badges - Left/Right */}
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white bg-red-500">
                        FREE
                      </div>
                      
                      {/* Enrolled Badge - Right */}
                      {course.isEnrolled && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white bg-green-500">
                          <CheckCircle2 className="h-3 w-3" />
                          Terdaftar
                        </div>
                      )}
                      
                      {/* Default Placeholder with Text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                        <BookOpen className="h-16 w-16 text-white/80 mb-2" />
                        <p className="text-white font-bold text-lg drop-shadow-lg">Kursus</p>
                        <p className="text-white/90 text-sm drop-shadow-lg">Terbuka</p>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col">
                      {/* Category Tag */}
                      <div className="flex items-center gap-2">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
                          style={{
                            backgroundColor: "#DBEAFE",
                            color: "#1E40AF",
                          }}
                        >
                          Pembelajaran
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-base line-clamp-2" style={{ color: "#1A1A1A" }}>
                        {course.title}
                      </h3>

                      {/* Description */}
                      <p
                        className="text-xs line-clamp-3"
                        style={{ color: "#666666" }}
                      >
                        {course.description || "Kursus pembelajaran berkualitas untuk Anda"}
                      </p>
                      
                      {/* Lihat Banyak Link */}
                      {course.description && course.description.length > 80 && (
                        <Link
                          href={`/open-courses/${course.id}/syllabus`}
                          className="text-xs font-semibold transition-colors hover:underline"
                          style={{ color: "#5B6570" }}
                        >
                          Lihat Banyak →
                        </Link>
                      )}

                      {/* Spacer - Takes remaining space */}
                      <div className="flex-1"></div>

                      {/* Teacher Info - Fixed Height */}
                      <div
                        className="flex items-center gap-2 p-3 rounded-lg h-16"
                        style={{ backgroundColor: "#F0FAFB" }}
                      >
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: "#2F3E75" }}
                        >
                          {course.teacher?.name?.charAt(0).toUpperCase() || "T"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs" style={{ color: "#999999" }}>Pengajar</p>
                          <p className="text-sm font-semibold truncate" style={{ color: "#1A1A1A" }}>
                            {course.teacher?.name || "Pengajar"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Fixed Button at Bottom */}
                    <div className="p-4 pt-3 border-t" style={{ borderColor: "#E2E8F0" }}>
                      <Button
                        onClick={() => router.push(course.isEnrolled ? `/open-courses/${course.id}` : `/open-courses/${course.id}/syllabus`)}
                        className="w-full h-10 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        style={{
                          backgroundColor: course.isEnrolled ? "#14B8A6" : "#F59E0B",
                          color: "#FFFFFF",
                        }}
                      >
                        {course.isEnrolled ? (
                          <>Belajar →</>
                        ) : (
                          <>Lihat Silabus</>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
