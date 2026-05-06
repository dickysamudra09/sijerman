"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserMenuDropdown from "@/components/UserMenuDropdown";
import { BookOpen, CheckCircle2, X } from "lucide-react";
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
  const [showSidebar, setShowSidebar] = useState(false); // Sidebar hidden by default on mobile

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
    <div className="min-h-screen" style={{ backgroundColor: "#F5F5F0" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b overflow-visible"
        style={{
          backgroundColor: "rgba(13, 13, 13, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottomColor: "#333333",
          overflow: "visible"
        }}
      >
        <div className="container mx-auto px-3 py-3 md:px-4 md:py-4 overflow-visible" style={{ overflow: 'visible' }}>
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-2 md:gap-3 min-w-0">
              <img
                src="/img/1.png"
                alt="Logo"
                className="h-8 md:h-12 w-auto flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-base md:text-xl font-bold truncate" style={{ color: "#E8B824" }}>Si Jerman</h1>
                <p className="text-xs uppercase tracking-wider hidden sm:block" style={{ color: "#FFFFFC" }}>Learning Platform</p>
              </div>
            </Link>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
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
                    className="text-xs md:text-sm"
                    style={{ backgroundColor: "#FFFFFC", color: "#1A1A1A", borderColor: "#FFFFFC" }}
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => router.push("/auth/register")}
                    className="text-xs md:text-sm"
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
      <section className="py-6 md:py-8 lg:py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#FAFAF7", borderBottom: "1px solid #E0DDD0" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-4 md:mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 rounded-lg" style={{ backgroundColor: "#E8E5D8" }}>
                  <BookOpen className="h-4 w-4 md:h-6 md:w-6" style={{ color: "#0F766E" }} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#0F766E" }}>Koleksi Kursus</span>
              </div>
              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-3 leading-tight"
                style={{ color: "#1A1A1A", lineHeight: "1.2" }}
              >
                Jelajahi Kursus Terbuka
              </h1>
              <p
                className="text-sm mb-4 md:mb-6"
                style={{ color: "#4A4A4A", lineHeight: "1.6" }}
              >
                Pilih dari koleksi kursus pembelajaran self-paced gratis dan premium kami
              </p>
              <div className="flex flex-wrap gap-4 md:gap-6">
                <div>
                  <p className="text-xl md:text-2xl font-bold" style={{ color: "#1A1A1A" }}>{filteredCourses.length}</p>
                  <p className="text-xs" style={{ color: "#64748B" }}>Kursus Tersedia</p>
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold" style={{ color: "#14B8A6" }}>100%</p>
                  <p className="text-xs" style={{ color: "#64748B" }}>Gratis & Premium</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter dengan Sidebar */}
      <section className="px-4 sm:px-6 lg:px-8 mb-8 md:mb-12">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="relative mb-4 md:mb-6 pb-4 md:pb-6 border-b" style={{ borderColor: "#E0DDD0" }}>
            <div className="relative">
              <div className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2">
                <svg
                  className="h-4 w-4 md:h-5 md:w-5"
                  style={{ color: "#92400E" }}
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
                placeholder="Cari kursus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 md:h-12 rounded-lg border-2 focus:ring-2 focus:outline-none pl-10 md:pl-12 pr-4 text-sm md:text-base transition-all"
                style={{
                  backgroundColor: "#FAFAF7",
                  borderColor: "#E0DDD0",
                }}
              />
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="flex justify-between md:justify-end items-center mb-4 md:mb-6 pb-4 md:pb-6 border-b" style={{ borderColor: "#E0DDD0" }}>
            {/* Mobile: Filter toggle button */}
            <button
              onClick={() => setShowSidebar(true)}
              className="md:hidden flex items-center gap-2 px-3 py-2 rounded-lg border transition-all"
              style={{
                backgroundColor: "#FAFAF7",
                borderColor: "#E0DDD0",
                color: "#1A1A1A",
              }}
            >
              <svg
                className="h-4 w-4"
                style={{ color: "#92400E" }}
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
              <span className="text-sm font-medium">Filter</span>
            </button>

            <div className="flex items-center gap-2 md:gap-3">
              <svg
                className="h-4 w-4 md:h-5 md:w-5 hidden md:block"
                style={{ color: "#92400E" }}
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
                className="text-xs md:text-sm font-medium"
                style={{ color: "#64748B" }}
              >
                Urutkan:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "terbaru" | "populer")}
                className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg border text-xs md:text-sm font-medium transition-all cursor-pointer focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: "#FAFAF7",
                  borderColor: "#E0DDD0",
                  color: "#1A1A1A",
                }}
              >
                <option value="terbaru">Terbaru</option>
                <option value="populer">Populer</option>
              </select>
            </div>
          </div>

          {/* Layout dengan Sidebar & Content */}
          <div className="flex gap-6 pt-4 md:pt-6 relative">
            {/* Mobile Overlay */}
            {showSidebar && (
              <div
                className="fixed inset-0 bg-black/30 z-40 md:hidden"
                onClick={() => setShowSidebar(false)}
                style={{ top: '0', height: '100vh' }}
              />
            )}

            {/* Sidebar Kiri - Collapsible */}
            <aside
              className={`${
                showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
              } fixed md:sticky w-3/4 md:w-64 bg-white border-r rounded-xl p-4 md:p-4 transition-all duration-300 ease-out flex-shrink-0`}
              style={{
                backgroundColor: '#FAF8F3',
                borderColor: '#E0DDD0',
                top: showSidebar ? '0' : '100px', // Mobile: full screen, Desktop: more space below header
                left: 0,
                height: showSidebar ? '100vh' : 'auto', // Mobile: full height, Desktop: auto
                maxHeight: showSidebar ? '100vh' : 'calc(100vh - 120px)', // Desktop: more space for header
                zIndex: showSidebar ? 50 : 10, // Mobile: high z-index, Desktop: lower to avoid overlap
              }}
            >
              {/* Close button - Mobile only */}
              <button
                onClick={() => setShowSidebar(false)}
                className="md:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10"
              >
                <X className="h-5 w-5" style={{ color: "#64748B" }} />
              </button>

              {/* Scrollable Content Wrapper */}
              <div className="h-full overflow-y-auto">
                <div className="space-y-6 md:space-y-8 mt-12 md:mt-0 pb-4">{/* Filter Tipe Kursus */}
              <div className="mb-6 md:mb-8">
                <div
                  className="font-bold mb-3 md:mb-4 text-xs md:text-sm uppercase tracking-wider p-2.5 md:p-3 rounded-lg flex items-center gap-2"
                  style={{ backgroundColor: "#F5F1E8", color: "#92400E" }}
                >
                  <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  Tipe Kursus
                </div>
                <div className="space-y-2">
                  {(["all", "free", "paid"] as const).map((filter) => (
                    <Button
                      key={filter}
                      onClick={() => {
                        setSelectedFilter(filter);
                        setShowSidebar(false); // Close sidebar on mobile after selection
                      }}
                      variant="outline"
                      className="w-full justify-start text-xs md:text-sm font-normal transition-colors"
                      style={{
                        backgroundColor:
                          selectedFilter === filter ? "#FFF9EB" : "#FAFAF7",
                        color:
                          selectedFilter === filter ? "#92400E" : "#64748B",
                        border:
                          selectedFilter === filter
                            ? "1.5px solid #D97706"
                            : "1px solid #E0DDD0",
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
                  className="font-bold mb-3 md:mb-4 text-xs md:text-sm uppercase tracking-wider p-2.5 md:p-3 rounded-lg flex items-center gap-2"
                  style={{ backgroundColor: "#F5F1E8", color: "#92400E" }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  Status Pendaftaran
                </div>
                <div className="space-y-2">
                  {(["all", "enrolled", "not-enrolled"] as const).map((filter) => (
                    <Button
                      key={filter}
                      onClick={() => {
                        setEnrollmentFilter(filter);
                        setShowSidebar(false); // Close sidebar on mobile after selection
                      }}
                      variant="outline"
                      className="w-full justify-start text-xs md:text-sm font-normal transition-colors"
                      style={{
                        backgroundColor:
                          enrollmentFilter === filter ? "#FFF9EB" : "#FAFAF7",
                        color:
                          enrollmentFilter === filter ? "#92400E" : "#64748B",
                        border:
                          enrollmentFilter === filter
                            ? "1.5px solid #D97706"
                            : "1px solid #E0DDD0",
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
              </div> {/* Close scrollable wrapper */}
            </aside>

            {/* Content Kanan */}
            <div className={`flex-1 min-w-0 transition-all duration-300 ${showSidebar ? 'md:ml-0' : 'md:ml-0'}`}>
              {loading ? (
            <div className="flex items-center justify-center py-12 md:py-20">
              <div
                className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2"
                style={{ borderColor: "#E8B824" }}
              ></div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12 md:py-20">
              <BookOpen
                className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4"
                style={{ color: "#999999" }}
              />
              <p
                className="text-base md:text-lg"
                style={{ color: "#4A4A4A" }}
              >
                No courses found. Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {filteredCourses.map((course) => {
                return (
                  <div
                    key={course.id}
                    className="rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-all flex flex-col h-full"
                    style={{ backgroundColor: "#FAFAF7", borderColor: "#E0DDD0" }}
                  >
                    {/* Image/Thumbnail Area */}
                    <div className="h-40 md:h-48 relative overflow-hidden bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-100 flex items-center justify-center">
                      {/* Status Badges - Left/Right */}
                      <div className="absolute top-2 md:top-3 left-2 md:left-3 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-bold text-white bg-red-500">
                        FREE
                      </div>
                      
                      {/* Enrolled Badge - Right */}
                      {course.isEnrolled && (
                        <div className="absolute top-2 md:top-3 right-2 md:right-3 flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-bold text-white bg-green-500">
                          <CheckCircle2 className="h-3 w-3" />
                          Terdaftar
                        </div>
                      )}
                      
                      {/* Default Placeholder with Text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                        <BookOpen className="h-12 w-12 md:h-16 md:w-16 mb-2" style={{ color: "#D97706", opacity: 0.7 }} />
                        <p className="font-bold text-base md:text-lg drop-shadow-lg" style={{ color: "#78350F" }}>Kursus</p>
                        <p className="text-sm drop-shadow-lg" style={{ color: "#92400E", opacity: 0.9 }}>Terbuka</p>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3 md:p-4 space-y-2 md:space-y-3 flex-1 flex flex-col">
                      {/* Category Tag */}
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
                          style={{
                            backgroundColor: "#F5F1E8",
                            color: "#92400E",
                          }}
                        >
                          Pembelajaran
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-base md:text-lg line-clamp-2 leading-snug" style={{ color: "#1A1A1A" }}>
                        {course.title}
                      </h3>

                      {/* Description */}
                      <p
                        className="text-xs md:text-sm line-clamp-3 leading-relaxed"
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

                      {/* Teacher Info - Flexible Height */}
                      <div
                        className="flex items-center gap-2 p-2.5 md:p-3 rounded-lg"
                        style={{ backgroundColor: "#F5F1E8" }}
                      >
                        <div
                          className="h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: "#2F3E75" }}
                        >
                          {course.teacher?.name?.charAt(0).toUpperCase() || "T"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs" style={{ color: "#999999" }}>Pengajar</p>
                          <p className="text-xs md:text-sm font-semibold truncate" style={{ color: "#1A1A1A" }}>
                            {course.teacher?.name || "Pengajar"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Fixed Button at Bottom */}
                    <div className="p-3 md:p-4 pt-2 md:pt-3 border-t" style={{ borderColor: "#E0DDD0" }}>
                      <Button
                        onClick={() => router.push(course.isEnrolled ? `/open-courses/${course.id}` : `/open-courses/${course.id}/syllabus`)}
                        className="w-full h-11 md:h-10 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm md:text-base hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                          backgroundColor: course.isEnrolled ? "#16A34A" : "#E8B824",
                          color: course.isEnrolled ? "#FFFFFF" : "#1A1A1A",
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
