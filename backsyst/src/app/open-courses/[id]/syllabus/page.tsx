'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CourseSyllabusPreview } from '@/components/CourseSyllabusPreview';
import { ModuleSyllabusItem } from '@/components/ModuleSyllabusItem';
import { Button } from '@/components/ui/button';
import UserMenuDropdown from '@/components/UserMenuDropdown';
import { BookOpen } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Course {
  id: string;
  title: string;
  description: string;
  is_paid: boolean;
  class_level: string;
  teacher_id: string;
  teacher?: { id: string; name: string; email: string };
}

interface Module {
  id: string;
  title: string;
  description: string;
  module_type: string;
  order_index: number;
  duration_minutes?: number;
  learning_outcomes?: string;
  lessons?: Array<{
    id: string;
    title: string;
    lesson_type: string;
    order_index: number;
  }>;
}

interface Enrollment {
  id: string;
  user_id: string;
}

export default function CourseSyllabusPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [user, setUser] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Check auth & enrollment status
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Check if already enrolled
        const { data: enrollmentData } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('course_id', courseId)
          .eq('user_id', user.id)
          .single();

        if (enrollmentData) {
          setEnrollment(enrollmentData);
        }
      }
    };

    checkAuth();
  }, [courseId]);

  // Fetch course & modules
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, title, description, is_paid, class_level, teacher_id')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;

        // Fetch teacher info
        if (courseData && courseData.teacher_id) {
          const { data: teacherData } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', courseData.teacher_id)
            .single();

          const courseWithTeacher = {
            ...courseData,
            teacher: teacherData
              ? { id: teacherData.id, name: teacherData.name, email: teacherData.email }
              : undefined,
          };
          setCourse(courseWithTeacher);
        } else {
          setCourse(courseData);
        }

        // Fetch modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('course_modules')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });

        if (modulesError) throw modulesError;
        
        // Fetch lessons for each module
        const modulesWithLessons = await Promise.all(
          (modulesData || []).map(async (module) => {
            const { data: lessonsData } = await supabase
              .from('module_lessons')
              .select('id, title, lesson_type, order_index')
              .eq('module_id', module.id)
              .order('order_index', { ascending: true });
            
            return {
              ...module,
              lessons: lessonsData || []
            };
          })
        );
        
        setModules(modulesWithLessons);
      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  // Handle enrollment
  const handleEnroll = async () => {
    if (!user) {
      // Redirect to login with return URL so user comes back to course after login
      router.push(`/auth/login?redirect=/open-courses/${courseId}`);
      return;
    }

    if (enrollment) {
      // Already enrolled - go to learning
      router.push(`/open-courses/${courseId}`);
      return;
    }

    setIsEnrolling(true);
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .insert([
          {
            user_id: user.id,
            course_id: courseId,
            enrollment_type: course?.is_paid ? 'paid' : 'free',
            access_level: course?.is_paid ? 'full' : 'limited',
            progress_percentage: 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Set enrollment state & redirect to learning
      setEnrollment(data);
      router.push(`/open-courses/${courseId}`);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      alert('Failed to enroll. Please try again.');
    } finally {
      setIsEnrolling(false);
    }
  };

  // Handle preview (guest)
  const handlePreview = () => {
    router.push(`/open-courses/${courseId}/preview`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5F5F0" }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "#92400E" }}></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5F5F0" }}>
        <div className="text-center">
          <p className="text-lg" style={{ color: "#1A1A1A" }}>Kursus tidak ditemukan</p>
          <Button onClick={() => router.push('/open-courses')} className="mt-4">
            Kembali ke Daftar Kursus
          </Button>
        </div>
      </div>
    );
  }

  const aggregatedOutcomes = modules
    .flatMap((m) => m.learning_outcomes?.split('|').map((o) => o.trim()) || [])
    .filter((o) => o.length > 0)
    .filter((o, i, arr) => arr.indexOf(o) === i)
    .join('|');

  const totalDuration = modules.reduce((sum, m) => sum + (m.duration_minutes || 0), 0);
  const outcomes = aggregatedOutcomes.split('|').filter((o) => o.trim().length > 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F5F0" }}>
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-30 border-b w-full"
        style={{
          backgroundColor: "rgba(13, 13, 13, 0.90)",
          backdropFilter: "blur(10px)",
          borderBottomColor: "#333333",
        }}
      >
        <div className="container mx-auto px-3 py-3 md:px-4 md:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <img src="/img/1.png" alt="Logo" className="h-8 md:h-12 w-auto" />
            <div>
              <h1 className="text-base md:text-xl font-bold" style={{ color: "#E8B824" }}>Si Jerman</h1>
              <p className="text-xs uppercase tracking-wider hidden sm:block" style={{ color: "#FFFFFC" }}>Platform Pembelajaran</p>
            </div>
          </Link>

          <UserMenuDropdown
            user={user}
            onLogout={async () => {
              await supabase.auth.signOut();
              router.push('/auth/login');
            }}
            onNavigate={router.push}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full relative z-10 pt-20 md:pt-28">
        {/* Breadcrumbs */}
        <div className="w-full" style={{ backgroundColor: "#F5F5F0", borderBottom: "1px solid #E0DDD0" }}>
          <div className="max-w-7xl mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-xs md:text-sm flex-wrap">
              <Link 
                href="/" 
                className="hover:underline transition-colors"
                style={{ color: "#64748B" }}
              >
                Beranda
              </Link>
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" style={{ color: "#94A3B8" }} />
              <Link 
                href="/open-courses" 
                className="hover:underline transition-colors"
                style={{ color: "#64748B" }}
              >
                Kursus
              </Link>
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" style={{ color: "#94A3B8" }} />
              <span className="font-semibold" style={{ color: "#92400E" }}>
                Silabus
              </span>
            </nav>
          </div>
        </div>

        {/* Course Overview - Full Width Section */}
        <div className="w-full" style={{ backgroundColor: "#FAFAF7", borderBottom: "1px solid #E0DDD0" }}>
          <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
            <CourseSyllabusPreview
              courseTitle={course.title}
              courseDescription={course.description}
              teacherName={course.teacher?.name || 'Instruktur'}
              classLevel={course.class_level || 'A1'}
              totalModules={modules.length}
              estimatedHours={Math.ceil(totalDuration / 60)}
              learningOutcomes={aggregatedOutcomes}
              courseId={courseId}
            />
          </div>
        </div>

        {/* Syllabus Section - Full Width */}
        <div className="w-full" style={{ backgroundColor: "#F5F5F0" }}>
          <div className="max-w-7xl mx-auto px-4 py-6 md:py-12 space-y-6">
          {/* Section Header */}
          <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="p-2 md:p-3 rounded-lg" style={{ backgroundColor: "#F5F1E8" }}>
              <BookOpen className="h-5 w-5 md:h-6 md:w-6" style={{ color: "#92400E" }} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: "#1A1A1A" }}>Daftar Modul</h2>
              <p className="text-xs md:text-sm mt-1" style={{ color: "#64748B" }}>{modules.length} modul pembelajaran untuk Anda</p>
            </div>
          </div>

          {/* Module Cards Timeline */}
          <div className="space-y-4">
            {modules.map((module, index) => (
              <div key={module.id} className="animate-slide-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                <ModuleSyllabusItem
                  moduleNumber={module.order_index + 1}
                  title={module.title}
                  moduleType={module.module_type}
                  durationMinutes={module.duration_minutes}
                  learningOutcomes={module.learning_outcomes || ''}
                  lessons={module.lessons || []}
                />
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* CTA Section - Sticky */}
        <div className="fixed bottom-0 left-0 right-0 shadow-2xl z-20" style={{ backgroundColor: "rgba(250, 250, 247, 0.95)", backdropFilter: "blur(10px)", borderTop: "1px solid #E0DDD0" }}>
          <div className="container mx-auto px-4 py-3 md:py-4 max-w-7xl">
            {/* Mobile: Stack vertically */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="text-center sm:text-left">
                {enrollment ? (
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#92400E" }}></div>
                    <p className="text-xs md:text-sm font-semibold" style={{ color: "#92400E" }}>✓ Sudah terdaftar di kursus ini</p>
                  </div>
                ) : user ? (
                  <p className="text-xs md:text-sm font-semibold" style={{ color: "#1A1A1A" }}>Siap untuk memulai belajar?</p>
                ) : (
                  <p className="text-xs md:text-sm font-semibold" style={{ color: "#1A1A1A" }}>Login terlebih dahulu untuk mendaftar</p>
                )}
              </div>

              <div className="flex items-center justify-center sm:justify-end gap-2 md:gap-3">
                {/* Preview button hidden for now */}
                {/* {!enrollment && (
                  <Button
                    variant="outline"
                    onClick={handlePreview}
                    className="h-9 md:h-10 px-4 md:px-6 text-xs md:text-sm font-semibold transition-all"
                    style={{ borderColor: "#E0DDD0", color: "#64748B" }}
                  >
                    <span className="hidden sm:inline">Preview Gratis</span>
                    <span className="sm:hidden">Preview</span>
                  </Button>
                )} */}

                <Button
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                  className="h-9 md:h-10 px-6 md:px-8 text-xs md:text-sm font-semibold rounded-lg transition-all"
                  style={{
                    backgroundColor: enrollment ? "#92400E" : "#E8B824",
                    color: "#FFFFFF",
                  }}
                >
                  {isEnrolling
                    ? 'Mendaftar...'
                    : enrollment
                      ? '✓ Lanjutkan →'
                      : user
                        ? 'Daftar Sekarang'
                        : 'Login dulu'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Spacing for sticky footer */}
        <div className="h-20 md:h-24"></div>
      </main>
    </div>
  );
}
