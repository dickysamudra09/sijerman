'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CourseSyllabusPreview } from '@/components/CourseSyllabusPreview';
import { ModuleSyllabusItem } from '@/components/ModuleSyllabusItem';
import { Button } from '@/components/ui/button';
import UserMenuDropdown from '@/components/UserMenuDropdown';
import { ArrowLeft, BookOpen } from 'lucide-react';
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
        setModules(modulesData || []);
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
      // Redirect to login
      router.push('/auth/login');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518]"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-gray-700 mb-4">Kursus tidak ditemukan</p>
          <Button onClick={() => router.push('/open-courses')}>
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
    <div className="min-h-screen syllabus-page-bg relative overflow-hidden">
      {/* Floating Blobs */}
      <div className="blob-left"></div>
      <div className="blob-right"></div>
      <div className="blob-center"></div>

      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-30 border-b bg-white w-full"
        style={{
          backgroundColor: 'rgba(13, 13, 13, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottomColor: '#333333',
        }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/img/1.png" alt="Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-[#F5C518]">Si Jerman</h1>
              <p className="text-xs uppercase tracking-wider text-white">Learning Platform</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/open-courses')}
              className="flex items-center gap-2 text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>

            <UserMenuDropdown
              user={user}
              onLogout={async () => {
                await supabase.auth.signOut();
                router.push('/auth/login');
              }}
              onNavigate={router.push}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full relative z-10 pt-28">
        {/* Course Overview - Full Width Section */}
        <div className="w-full bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <CourseSyllabusPreview
              courseTitle={course.title}
              courseDescription={course.description}
              teacherName={course.teacher?.name || 'Instruktur'}
              classLevel={course.class_level || 'A1'}
              totalModules={modules.length}
              estimatedHours={Math.ceil(totalDuration / 60)}
              learningOutcomes={aggregatedOutcomes}
            />
          </div>
        </div>

        {/* Syllabus Section - Full Width */}
        <div className="w-full bg-white">
          <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
          {/* Section Header with Gradient */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-gray-900">Daftar Silabus</h2>
              <p className="text-gray-600 mt-1">{modules.length} modul pembelajaran untuk Anda</p>
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
                />
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* CTA Section - Sticky */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl z-20">
          <div className="container mx-auto px-4 py-4 max-w-7xl flex items-center justify-between gap-4 mx-auto">
            <div>
              {enrollment ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <p className="text-sm font-semibold text-emerald-700">✓ Sudah terdaftar di kursus ini</p>
                </div>
              ) : user ? (
                <p className="text-sm font-semibold text-gray-700">Siap untuk memulai belajar?</p>
              ) : (
                <p className="text-sm font-semibold text-gray-700">Login terlebih dahulu untuk mendaftar</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!enrollment && (
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  className="h-10 px-6 font-semibold border-2 hover:bg-gray-50 transition-all"
                >
                  👁️ Preview Gratis
                </Button>
              )}

              <Button
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="h-10 px-8 font-bold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{
                  background: enrollment 
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
                    : 'linear-gradient(135deg, #F5C518 0%, #F59E0B 100%)',
                  color: enrollment ? '#FFFFFF' : '#1A1A1A',
                }}
              >
                {isEnrolling
                  ? '⏳ Mendaftar...'
                  : enrollment
                    ? '✓ Lanjutkan Belajar →'
                    : user
                      ? '🚀 Daftar Sekarang'
                      : '🔐 Login dulu'}
              </Button>
            </div>
          </div>
        </div>

        {/* Spacing for sticky footer */}
        <div className="h-24"></div>
      </main>
    </div>
  );
}
