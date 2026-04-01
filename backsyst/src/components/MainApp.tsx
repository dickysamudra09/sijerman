"use client";
import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/sonner";
import {
  GraduationCap,
  User,
  Search,
  Moon,
  Sun,
  Globe,
  Brain,
  Users,
  Gamepad2,
  BarChart3,
  Target,
  MessageSquare,
  Menu,
  X,
  BookOpen,
  Smile,
  Compass,
  ChevronDown,
  Home,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Tipe data untuk prop language
type LanguageProps = {
  language: "id" | "de";
};

// Data course untuk kelas A-1
const coursesA1 = [
  {
    id: "a1-1",
    title: "Matematika Dasar",
    description: "Pelajari konsep dasar matematika dengan pendekatan yang mudah dipahami",
    duration: "8 minggu",
    students: 45,
    lessons: 24,
  },
  {
    id: "a1-2",
    title: "Bahasa Indonesia",
    description: "Meningkatkan kemampuan berbahasa Indonesia yang baik dan benar",
    duration: "6 minggu",
    students: 52,
    lessons: 18,
  },
  {
    id: "a1-3",
    title: "IPA Terpadu",
    description: "Eksplorasi dunia sains melalui eksperimen dan praktik langsung",
    duration: "10 minggu",
    students: 38,
    lessons: 30,
  },
];

// Data course untuk kelas A-2
const coursesA2 = [
  {
    id: "a2-1",
    title: "Mathematik Fortgeschritten",
    description: "Erweiterte mathematische Konsepte mit praktischen Anwendungen",
    duration: "10 minggu",
    students: 42,
    lessons: 28,
  },
  {
    id: "a2-2",
    title: "Deutsche Sprache A2",
    description: "Lernen Sie Deutsch für den täglichen dan akademischen Gebrauch",
    duration: "8 minggu",
    students: 48,
    lessons: 32,
  },
  {
    id: "a2-3",
    title: "Geschichte Deutschlands",
    description: "Die Reise der deutschen Geschichte von der Vergangenheit bis zur Moderne verstehen",
    duration: "6 minggu",
    students: 35,
    lessons: 20,
  },
];

type ViewType =
  | "home"
  | "course-detail"
  | "interactive-quiz"
  | "ai-analysis"
  | "teacher-student"
  | "mini-quiz"
  | "stats-tracking"
  | "forum";

interface UserDropdownProps {
  user: SupabaseUser;
  language: "id" | "de";
  onLogout: () => void;
}

// Custom Hook for Scroll-Triggered Animations
const useScrollAnimation = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return { ref, isVisible };
};

const HeroSection = ({ language }: LanguageProps) => {
  const getText = (id: string, de: string) => (language === "de" ? de : id);
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section 
      ref={ref}
      className="relative w-full overflow-hidden px-4 py-12 md:py-16 lg:py-24" 
      style={{
        visibility: isVisible ? 'visible' : 'hidden',
        animation: isVisible ? 'fadeScaleIn 0.8s ease-out forwards' : 'none'
      }}
    >
      {/* Background Gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,251,235,0.5) 100%)',
        zIndex: 0
      }} />

      {/* Decorative Blobs */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232, 184, 36, 0.08) 0%, rgba(232, 184, 36, 0) 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-5%',
        left: '-8%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232, 184, 36, 0.05) 0%, rgba(232, 184, 36, 0) 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Star decorations */}
      <div style={{position: 'absolute', top: '15%', right: '10%', width: '20px', height: '20px', opacity: '0.3', zIndex: 0}}>
        <svg viewBox="0 0 20 20" fill="#E8B824"><polygon points="10,2 13,10 21,10 15,15 18,23 10,19 2,23 5,15 -1,10 7,10"/></svg>
      </div>
      <div style={{position: 'absolute', bottom: '20%', right: '15%', width: '16px', height: '16px', opacity: '0.2', zIndex: 0}}>
        <svg viewBox="0 0 20 20" fill="#E8B824"><polygon points="10,2 13,10 21,10 15,15 18,23 10,19 2,23 5,15 -1,10 7,10"/></svg>
      </div>

      {/* Content Container */}
      <div className="container mx-auto px-0 lg:px-4 relative z-10 max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-14">
          
          {/* Left Content */}
          <div className="w-full lg:w-1/2 px-4 lg:px-0">
            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 max-w-2xl" style={{color: '#1A1A1A', lineHeight: '1.1'}}>
              {getText("Kembangkan Potensimu, dengan", "Entwickle dein Potenzial mit")}
              <span style={{color: '#E8B824', marginLeft: '8px'}}>
                {getText("Si Jerman.", "Si Jerman.")}
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg leading-relaxed mb-8 max-w-md" style={{color: '#4A4A4A', lineHeight: '1.6'}}>
              {getText(
                "Pelajari Bahasa Jerman dengan latihan AI cerdas, kuis interaktif, serta sistem pembelajaran yang terstruktur dan kolaboratif.",
                "Lernen Sie Deutsch mit intelligenten KI-Übungen, interaktiven Quizzes und strukturiertem Lernsystem."
              )}
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8 w-full sm:w-auto">
              <Button
                onClick={() => window.location.href = '/open-courses'}
                className="px-6 py-2.5 rounded-full font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg text-sm"
                style={{
                  backgroundColor: '#E8B824',
                  color: '#1A1A1A'
                }}
              >
                <span>▶</span>
                {getText("Mulai Belajar Gratis", "Kostenlos Starten")}
              </Button>
              <Button
                className="px-6 py-2.5 rounded-full font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg text-sm"
                style={{
                  backgroundColor: '#1A1A1A',
                  color: '#FFFFFF'
                }}
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                {getText("Coba Latihan AI", "KI-Übungen Testen")}
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
              <div className="flex items-center gap-2" style={{color: '#4A4A4A'}}>
                <svg className="w-4 h-4" style={{color: '#10B981'}} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{getText("1000+ pelajar", "1000+ Lernende")}</span>
              </div>
              <div className="flex items-center gap-2" style={{color: '#4A4A4A'}}>
                <svg className="w-4 h-4" style={{color: '#F59E0B'}} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-semibold">4.8 (350+ reviews)</span>
              </div>
            </div>
          </div>

          {/* Right Side - Image & Cards */}
          <div className="w-full lg:w-1/2 flex justify-center items-center relative px-4 lg:px-0" style={{minHeight: '520px', position: 'relative'}}>
            {/* Animated Circle Gradient */}
            <div style={{
              position: 'absolute',
              width: '420px',
              height: '420px',
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, rgba(232, 184, 36, 0.35), rgba(245, 158, 11, 0.25), rgba(232, 184, 36, 0.15), rgba(232, 184, 36, 0.35))',
              filter: 'blur(70px)',
              animation: 'spinGradient 15s linear infinite',
              opacity: 0.8,
              zIndex: 0
            }} />

            {/* Floating Card 1 - Progress/Modul (Top Left) */}
            <div style={{
              position: 'absolute',
              top: '25px',
              left: '25px',
              backgroundColor: '#1A1A1A',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '260px',
              border: '2px solid #E8B824',
              zIndex: 2,
              animation: 'floatCard1 5s ease-in-out infinite',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)'
            }}>
              <h3 className="font-bold mb-3" style={{color: '#E8B824', fontSize: '14px'}}>Pertemuan 1</h3>
              <div className="flex items-center gap-2 mb-3" style={{fontSize: '12px', color: '#FFFFFC'}}>
                <BookOpen className="w-3 h-3" /> 2 / 11 konten
              </div>
              <div style={{backgroundColor: '#E8B824', height: '5px', borderRadius: '3px', marginBottom: '5px'}}></div>
              <p style={{fontSize: '12px', color: '#E8B824', fontWeight: 'bold', marginBottom: '10px'}}>18%</p>
              <div className="space-y-1">
                <div style={{backgroundColor: '#2A2A2A', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', color: '#FFFFFC', display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <div style={{width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#6366F1'}}></div>
                  <span>Materi</span>
                  <span style={{marginLeft: 'auto', color: '#E8B824'}}>2</span>
                </div>
                <div style={{backgroundColor: '#2A2A2A', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', color: '#FFFFFC', display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <div style={{width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#F59E0B'}}></div>
                  <span>Tugas</span>
                  <span style={{marginLeft: 'auto', color: '#E8B824'}}>2</span>
                </div>
                <div style={{backgroundColor: '#2A2A2A', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', color: '#FFFFFC', display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <div style={{width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#A78BFA'}}></div>
                  <span>Latihan</span>
                  <span style={{marginLeft: 'auto', color: '#E8B824'}}>7</span>
                </div>
              </div>
            </div>

            {/* Floating Card 2 - Course Info (Bottom Left - Behind Cat) */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '-30px',
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '16px',
              maxWidth: '300px',
              zIndex: 4,
              animation: 'floatCard2 4.5s ease-in-out infinite',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
            }}>
              <p style={{fontSize: '9px', fontWeight: 'bold', color: '#6366F1', marginBottom: '4px', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Pembelajaran</p>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                <p style={{fontSize: '14px', fontWeight: 'bold', color: '#1A1A1A'}}>Haustiere</p>
                <p style={{fontSize: '12px', fontWeight: 'bold', color: '#999999', marginLeft: '8px'}}>Pets</p>
              </div>
              <p style={{fontSize: '10px', color: '#6B7280', marginBottom: '8px', lineHeight: '1.3'}}>Pelajari tentang hewan peliharaan dan cara merawatnya</p>
              <div className="flex items-center gap-2" style={{fontSize: '10px', color: '#4A4A4A', paddingTop: '4px', borderTop: '1px solid #E5E7EB'}}>
                <svg className="w-3 h-3" style={{color: '#10B981'}} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span style={{fontWeight: 'bold'}}>Mulai Belajar</span>
              </div>
            </div>

            {/* Floating Card 3 - Feedback AI (Top Right) */}
            <div style={{
              position: 'absolute',
              top: '15px',
              right: '-40px',
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '16px',
              maxWidth: '260px',
              zIndex: 4,
              animation: 'floatCard3 5.5s ease-in-out infinite',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
            }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#E8B824',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg className="w-5 h-5" style={{color: '#1A1A1A'}} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.343a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 100-2h-1a1 1 0 100 2h1zM15.657 14.657a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM11 17a1 1 0 102 0v-1a1 1 0 10-2 0v1zM4.343 15.657a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM2 10a1 1 0 100-2H1a1 1 0 100 2h1zM4.343 4.343a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707z" />
                    </svg>
                  </div>
                  <span style={{fontSize: '13px', fontWeight: 'bold', color: '#1A1A1A'}}>Feedback AI</span>
                </div>
                <span style={{fontSize: '9px', fontWeight: 'bold', backgroundColor: '#E8B824', color: '#1A1A1A', padding: '2px 8px', borderRadius: '12px'}}>Pilihan</span>
              </div>
              <div style={{fontSize: '10px', color: '#4A4A4A', lineHeight: '1.4'}}>
                <p style={{marginBottom: '4px'}}>✓ <strong style={{color: '#10B981'}}>Status</strong></p>
                <p style={{fontSize: '9px', color: '#6B7280', marginBottom: '4px'}}>Jawaban Anda salah</p>
                <p style={{marginBottom: '4px'}}>? <strong style={{color: '#6366F1'}}>Penjelasan</strong></p>
                <p style={{fontSize: '9px', color: '#6B7280'}}>Lihat alasan</p>
              </div>
            </div>

            {/* Floating Card 4 - Stats (Bottom Right) */}
            <div style={{
              position: 'absolute',
              bottom: '50px',
              right: '25px',
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '16px',
              maxWidth: '240px',
              zIndex: 2,
              animation: 'floatCard4 6s ease-in-out infinite',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)'
            }}>
              <div className="flex items-center gap-2 mb-3" style={{fontSize: '12px'}}>
                <svg className="w-4 h-4" style={{color: '#E8B824'}} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                <span style={{color: '#1A1A1A', fontWeight: 'bold'}}>Progress</span>
                <span style={{marginLeft: 'auto', fontSize: '10px', color: '#999999'}}>目标</span>
              </div>
              <p style={{fontSize: '14px', color: '#E8B824', fontWeight: 'bold', marginBottom: '4px'}}>100%</p>
              <div style={{backgroundColor: '#E8B824', height: '4px', borderRadius: '2px', marginBottom: '8px'}}></div>
              <div style={{fontSize: '11px', color: '#4A4A4A'}}>
                <p style={{marginBottom: '3px'}}>🎓 <strong>5 Modul</strong></p>
                <p>✅ Selesai</p>
              </div>
            </div>

            {/* Image Container - Static (No Animation) */}
            <div style={{
              position: 'relative',
              zIndex: 3,
              width: '100%',
              maxWidth: '320px'
            }}>
              <img
                src="/img/3.png"
                alt="Black cat character"
                className="w-full h-auto object-contain"
                style={{transform: 'scaleX(-1)'}}
              />
            </div>

            {/* Animations */}
            <style>{`
              @keyframes floatCard1 {
                0%, 100% {
                  transform: translateY(0px) translateX(0px);
                  opacity: 0.94;
                }
                50% {
                  transform: translateY(-10px) translateX(3px);
                  opacity: 1;
                }
              }

              @keyframes floatCard2 {
                0%, 100% {
                  transform: translateY(0px) translateX(0px);
                  opacity: 0.94;
                }
                50% {
                  transform: translateY(-8px) translateX(-5px);
                  opacity: 1;
                }
              }

              @keyframes floatCard3 {
                0%, 100% {
                  transform: translateY(0px) translateX(0px);
                  opacity: 0.94;
                }
                50% {
                  transform: translateY(-10px) translateX(-3px);
                  opacity: 1;
                }
              }

              @keyframes floatCard4 {
                0%, 100% {
                  transform: translateY(0px) translateX(0px);
                  opacity: 0.94;
                }
                50% {
                  transform: translateY(8px) translateX(3px);
                  opacity: 1;
                }
              }
              
              @keyframes spinGradient {
                0% {
                  transform: rotate(0deg);
                }
                100% {
                  transform: rotate(360deg);
                }
              }
            `}</style>
          </div>
        </div>
      </div>
    </section>
  );
};

const MainFeatures = ({ language }: LanguageProps) => {
  const getText = (id: string, de: string) => (language === "de" ? de : id);
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="relative w-full overflow-hidden px-4 py-12 md:py-20 lg:py-24" ref={ref}>
      {/* Gradient Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 1) 0%, rgba(42, 42, 42, 0.8) 100%)',
        zIndex: 0
      }} />

      {/* Decorative Blobs */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-8%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232, 184, 36, 0.12) 0%, rgba(232, 184, 36, 0) 70%)',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-5%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0) 70%)',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Content Container */}
      <div className="container mx-auto px-0 lg:px-4 relative z-10 max-w-6xl">
        {/* Heading */}
        <div className="text-center mb-12 md:mb-16">
          <span className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full inline-block" style={{backgroundColor: 'rgba(232, 184, 36, 0.15)', color: '#E8B824', border: '1px solid rgba(232, 184, 36, 0.3)', letterSpacing: '0.1em'}}>
            {getText("Mengapa Si Jerman?", "Warum Si Jerman?")}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-6 leading-tight max-w-3xl mx-auto" style={{color: '#FFFFFC', lineHeight: '1.3'}}>
            {getText(
              "Platform Pembelajaran dengan Fitur Lengkap dan Inovatif",
              "Lernplattform mit vollständigen und innovativen Funktionen"
            )}
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Card 1 - Interactive Exercises - Yellow */}
          <div 
            style={{
              backgroundColor: 'rgba(232, 184, 36, 0.08)',
              borderRadius: '16px',
              padding: '32px 24px',
              border: '1px solid rgba(232, 184, 36, 0.25)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            className="hover:shadow-2xl hover:border-opacity-50 group"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = 'rgba(232, 184, 36, 0.5)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(232, 184, 36, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(232, 184, 36, 0.25)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: '#E8B824',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <span style={{fontSize: '28px'}}>✓</span>
            </div>
            <h3 className="text-4xl font-bold mb-2" style={{color: '#E8B824'}}>96+</h3>
            <h4 className="text-lg font-bold mb-3" style={{color: '#FFFFFC'}}>
              {getText("Latihan Interaktif", "Interaktive Übungen")}
            </h4>
            <p className="text-sm leading-relaxed" style={{color: '#CCCCCC', lineHeight: '1.6'}}>
              {getText(
                "Nikmati berbagai latihan soal dengan analisis AI — bukan sekadar teori, tapi praktik bahasa yang nyata.",
                "Genießen Sie verschiedene Übungsaufgaben mit KI-Analyse – nicht nur Theorie, sondern echte Sprachpraxis."
              )}
            </p>
          </div>

          {/* Card 2 - Projects - Amber */}
          <div 
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              borderRadius: '16px',
              padding: '32px 24px',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            className="hover:shadow-2xl hover:border-opacity-50 group"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.5)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(245, 158, 11, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.25)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <span style={{fontSize: '28px'}}>⭐</span>
            </div>
            <h3 className="text-4xl font-bold mb-2" style={{color: '#F59E0B'}}>4+</h3>
            <h4 className="text-lg font-bold mb-3" style={{color: '#FFFFFC'}}>
              {getText("Proyek Tiap Level", "Projekte pro Level")}
            </h4>
            <p className="text-sm leading-relaxed" style={{color: '#CCCCCC', lineHeight: '1.6'}}>
              {getText(
                "Setiap level menghadirkan tugas nyata yang melatih kosakata, tata bahasa, serta kreativitas pengguna.",
                "Jedes Level bietet echte Aufgaben, die Wortschatz, Grammatik und Kreativität trainieren."
              )}
            </p>
          </div>

          {/* Card 3 - Learning Hours - Yellow */}
          <div 
            style={{
              backgroundColor: 'rgba(232, 184, 36, 0.08)',
              borderRadius: '16px',
              padding: '32px 24px',
              border: '1px solid rgba(232, 184, 36, 0.25)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            className="hover:shadow-2xl hover:border-opacity-50 group"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = 'rgba(232, 184, 36, 0.5)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(232, 184, 36, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(232, 184, 36, 0.25)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: '#E8B824',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <span style={{fontSize: '28px'}}>🎯</span>
            </div>
            <h3 className="text-4xl font-bold mb-2" style={{color: '#E8B824'}}>192+</h3>
            <h4 className="text-lg font-bold mb-3" style={{color: '#FFFFFC'}}>
              {getText("Total Jam Belajar", "Gesamte Lernstunden")}
            </h4>
            <p className="text-sm leading-relaxed" style={{color: '#CCCCCC', lineHeight: '1.6'}}>
              {getText(
                "Kurikulum dirancang seimbang antara keseruan kuis, forum diskusi, dan pembelajaran mendalam dari materi.",
                "Lehrplan ausgewogen zwischen unterhaltsamen Quizzes, Forumsdiskussionen und tiefem Lernen."
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes gradientShift {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.95;
          }
        }
      `}</style>
    </section>
  );
};

const AboutSection = ({ language }: LanguageProps) => {
  const getText = (id: string, de: string) => (language === "de" ? de : id);
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="relative w-full overflow-hidden px-4 py-12 md:py-24" ref={ref}>
      {/* Gradient Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,253,248,1) 100%)',
        zIndex: 0
      }} />

      {/* Decorative Blobs - Subtle */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232, 184, 36, 0.06) 0%, rgba(232, 184, 36, 0) 70%)',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-5%',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.04) 0%, rgba(245, 158, 11, 0) 70%)',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Content Container */}
      <div className="container mx-auto px-0 lg:px-4 relative z-10 max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
          {/* Image - Left side with styling */}
          <div className="relative flex-shrink-0 w-full max-w-md order-2 lg:order-1" style={{visibility: isVisible ? 'visible' : 'hidden', animation: isVisible ? 'slideLeftFade 0.9s ease-out forwards' : 'none'}}>
            {/* Image Frame */}
            <div 
              style={{
                position: 'relative',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '2px solid rgba(232, 184, 36, 0.2)',
                padding: '12px',
                background: 'linear-gradient(135deg, rgba(232, 184, 36, 0.05), rgba(245, 158, 11, 0.03))',
                boxShadow: '0 20px 40px rgba(232, 184, 36, 0.1)',
                transition: 'all 0.4s ease',
                cursor: 'pointer',
                animation: 'float 4s ease-in-out infinite'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(232, 184, 36, 0.5)';
                e.currentTarget.style.boxShadow = '0 30px 60px rgba(232, 184, 36, 0.25)';
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(232, 184, 36, 0.2)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(232, 184, 36, 0.1)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
              }}
            >
              <img
                src="/img/1.png"
                alt="Black cat mascot reading a book"
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
            {/* Decorative accent line */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              width: '60px',
              height: '3px',
              backgroundColor: '#E8B824',
              borderRadius: '2px',
              opacity: 0.6
            }} />

            {/* Animations */}
            <style>{`
              @keyframes float {
                0%, 100% {
                  transform: translateY(0px);
                }
                50% {
                  transform: translateY(-12px);
                }
              }
            `}</style>
          </div>

          {/* Text Content - Right side */}
          <div className="relative z-10 text-center lg:text-left w-full lg:w-1/2 order-1 lg:order-2 px-4 lg:px-0" style={{visibility: isVisible ? 'visible' : 'hidden', animation: isVisible ? 'slideRightFade 0.9s ease-out forwards' : 'none'}}>
            {/* Badge */}
            <div style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#E8B824',
              paddingLeft: '12px',
              marginBottom: '20px',
              position: 'relative'
            }}>
              <span style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '3px',
                height: '16px',
                backgroundColor: '#E8B824',
                borderRadius: '2px'
              }} />
              {getText("Sapa Si Jerman?", "Wer ist Si Jerman?")}
            </div>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-2 mb-6 leading-tight max-w-xl" style={{color: '#1A1A1A', lineHeight: '1.3'}}>
              {getText(
                "Temui Si Jerman - Tempat Belajar Bahasa Jerman yang Interaktif dan Menyenangkan",
                "Treffen Sie Si Jerman - Ihr interaktiver und unterhaltsamer Ort, um Deutsch zu lernen"
              )}
            </h2>

            {/* Description paragraphs */}
            <p className="text-base sm:text-lg mb-4 max-w-lg leading-relaxed" style={{color: '#4A4A4A', lineHeight: '1.8'}}>
              {getText(
                "Si Jerman adalah platform edukasi digital untuk mengembangkan kompetensi bahasa Jerman secara efektif.",
                "Si Jerman ist eine digitale Bildungsplattform zur effektiven Entwicklung von Deutschkenntnissen."
              )}
            </p>
            <p className="text-base sm:text-lg mb-8 max-w-lg leading-relaxed" style={{color: '#4A4A4A', lineHeight: '1.8'}}>
              {getText(
                "Dengan fitur interaktif seperti latihan soal AI, kuis multiplayer, dashboard, forum, dan course terstruktur, kami membantu Anda membangun keterampilan bahasa, berpikir kritis, dan kepercayaan diri.",
                "Mit interaktiven Funktionen wie KI-Übungsaufgaben, Multiplayer-Quizzes, Dashboard, Forum und strukturierten Kursen helfen wir Ihnen, Ihre Sprachkenntnisse, Ihr kritisches Denken und Ihr Selbstvertrauen aufzubauen."
              )}
            </p>

            {/* CTA Button */}
            <button
              className="px-8 py-3 rounded-full font-bold transition-all duration-300 shadow-md hover:shadow-lg"
              style={{
                backgroundColor: '#E8B824',
                color: '#1A1A1A'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(232, 184, 36, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              {getText("Mulai Sekarang", "Jetzt Starten")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const WhyChooseSection = ({ language }: LanguageProps) => {
  const getText = (id: string, de: string) => (language === "de" ? de : id);
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="relative w-full overflow-hidden px-4 py-12 md:py-24" ref={ref}>
      {/* Gradient Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 1) 0%, rgba(42, 42, 42, 0.8) 100%)',
        zIndex: 0
      }} />

      {/* Decorative Blobs - Subtle */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        right: '-8%',
        width: '420px',
        height: '420px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232, 184, 36, 0.07) 0%, rgba(232, 184, 36, 0) 70%)',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-5%',
        width: '380px',
        height: '380px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0) 70%)',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Content Container */}
      <div className="container mx-auto px-0 lg:px-4 relative z-10 max-w-6xl">
        {/* Heading */}
        <div className="text-center mb-16">
          {/* Badge */}
          <div style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#E8B824',
            paddingLeft: '12px',
            marginBottom: '16px',
            position: 'relative'
          }}>
            <span style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '3px',
              height: '16px',
              backgroundColor: '#E8B824',
              borderRadius: '2px'
            }} />
            {getText("Mengapa Si Jerman?", "Warum Si Jerman?")}
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-2 leading-tight" style={{color: '#FFFFFC', lineHeight: '1.3'}}>
            {getText("Belajar. Berlatih. Kuasai. Ulangi.", "Lernen. Üben. Meistern. Wiederholen.")}
          </h2>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-12">
          {/* Left cards */}
          <div className="flex flex-col gap-8" style={{visibility: isVisible ? 'visible' : 'hidden', animation: isVisible ? 'slideUpFade 0.8s ease-out forwards' : 'none'}}>
            {/* Card 1 - Yellow */}
            <div 
              style={{
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                animation: isVisible ? 'slideUpFade 0.6s ease-out forwards' : 'none'
              }}
              className="group"
              onMouseEnter={(e) => {
                const parent = e.currentTarget;
                parent.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                const parent = e.currentTarget;
                parent.style.transform = 'translateY(0)';
              }}
            >
              <div className="flex items-start gap-4">
                {/* Icon Box */}
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                  style={{
                    backgroundColor: '#E8B824',
                    boxShadow: '0 8px 16px rgba(232, 184, 36, 0.2)'
                  }}
                >
                  <BookOpen className="w-8 h-8" style={{color: '#1A1A1A'}} />
                </div>
                {/* Text */}
                <div>
                  <h3 className="font-bold text-lg leading-tight mt-1" style={{color: '#FFFFFC'}}>
                    {getText("Belajar dengan Praktik", "Lernen durch Übung")}
                  </h3>
                  <p className="text-sm sm:text-base mt-3 leading-relaxed" style={{color: '#CCCCCC', lineHeight: '1.6'}}>
                    {getText(
                      "Tidak ada pembelajaran membosankan — hanya latihan interaktif, analisis AI, dan tantangan bahasa yang kreatif.",
                      "Kein langweiliges Lernen mehr, nur interaktive Übungen, KI-Analysen und kreative Quizzes."
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 - Amber */}
            <div 
              style={{
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                animation: isVisible ? 'slideUpFade 0.6s ease-out forwards' : 'none'
              }}
              className="group"
              onMouseEnter={(e) => {
                const parent = e.currentTarget;
                parent.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                const parent = e.currentTarget;
                parent.style.transform = 'translateY(0)';
              }}
            >
              <div className="flex items-start gap-4">
                {/* Icon Box */}
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                  style={{
                    backgroundColor: '#F59E0B',
                    boxShadow: '0 8px 16px rgba(245, 158, 11, 0.2)'
                  }}
                >
                  <Smile className="w-8 h-8" style={{color: '#FFFFFF'}} />
                </div>
                {/* Text */}
                <div>
                  <h3 className="font-bold text-lg leading-tight mt-1" style={{color: '#FFFFFC'}}>
                    {getText("Suasana Menyenangkan & Ramah", "Spaßige und freundliche Atmosphäre")}
                  </h3>
                  <p className="text-sm sm:text-base mt-3 leading-relaxed" style={{color: '#CCCCCC', lineHeight: '1.6'}}>
                    {getText(
                      "Dari kuis seru hingga pengajar yang inspiratif, kami membuat belajar Bahasa Jerman terasa seperti bermain.",
                      "In einer freundlichen und unterstützenden Umgebung helfen wir Ihnen, Deutsch ohne den Druck von Nachhilfe zu lernen."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Center image */}
          <div className="flex justify-center order-first lg:order-none" style={{visibility: isVisible ? 'visible' : 'hidden', animation: isVisible ? 'fadeScaleIn 0.8s ease-out forwards' : 'none'}}>
            {/* Image Frame with Float Animation */}
            <div 
              style={{
                position: 'relative',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '2px solid rgba(232, 184, 36, 0.2)',
                padding: '12px',
                background: 'linear-gradient(135deg, rgba(232, 184, 36, 0.05), rgba(245, 158, 11, 0.03))',
                boxShadow: '0 20px 40px rgba(232, 184, 36, 0.1)',
                transition: 'all 0.4s ease',
                cursor: 'pointer',
                animation: 'float 4s ease-in-out infinite'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(232, 184, 36, 0.5)';
                e.currentTarget.style.boxShadow = '0 30px 60px rgba(232, 184, 36, 0.25)';
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(232, 184, 36, 0.2)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(232, 184, 36, 0.1)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
              }}
            >
              <img
                src="/img/2.png"
                alt="Black cat mascot waving"
                className="w-full max-w-sm h-auto object-contain rounded-lg"
              />
            </div>
          </div>

          {/* Right cards */}
          <div className="flex flex-col gap-8" style={{visibility: isVisible ? 'visible' : 'hidden', animation: isVisible ? 'slideUpFade 0.8s ease-out forwards' : 'none'}}>
            {/* Card 3 - Yellow */}
            <div 
              style={{
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                animation: isVisible ? 'slideUpFade 0.6s ease-out forwards' : 'none'
              }}
              className="group"
              onMouseEnter={(e) => {
                const parent = e.currentTarget;
                parent.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                const parent = e.currentTarget;
                parent.style.transform = 'translateY(0)';
              }}
            >
              <div className="flex items-start gap-4">
                {/* Icon Box */}
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                  style={{
                    backgroundColor: '#E8B824',
                    boxShadow: '0 8px 16px rgba(232, 184, 36, 0.2)'
                  }}
                >
                  <Compass className="w-8 h-8" style={{color: '#1A1A1A'}} />
                </div>
                {/* Text */}
                <div>
                  <h3 className="font-bold text-lg leading-tight mt-1" style={{color: '#FFFFFC'}}>
                    {getText("Pilih Jalur Belajarmu", "Wählen Sie Ihren Lernpfad")}
                  </h3>
                  <p className="text-sm sm:text-base mt-3 leading-relaxed" style={{color: '#CCCCCC', lineHeight: '1.6'}}>
                    {getText(
                      "Ikuti course sesuai level, tantang diri dengan latihan soal, atau jelajah forum untuk diskusi dan berbagi ide.",
                      "Folgen Sie Kursen je nach Niveau, legen Sie die Dauer mit Übungsaufgaben fest oder erkunden Sie andere Funktionen."
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 4 - Amber */}
            <div 
              style={{
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                animation: isVisible ? 'slideUpFade 0.6s ease-out forwards' : 'none'
              }}
              className="group"
              onMouseEnter={(e) => {
                const parent = e.currentTarget;
                parent.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                const parent = e.currentTarget;
                parent.style.transform = 'translateY(0)';
              }}
            >
              <div className="flex items-start gap-4">
                {/* Icon Box */}
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                  style={{
                    backgroundColor: '#F59E0B',
                    boxShadow: '0 8px 16px rgba(245, 158, 11, 0.2)'
                  }}
                >
                  <Target className="w-8 h-8" style={{color: '#FFFFFF'}} />
                </div>
                {/* Text */}
                <div>
                  <h3 className="font-bold text-lg leading-tight mt-1" style={{color: '#FFFFFC'}}>
                    {getText("Keterampilan yang Melekat", "Feste Fähigkeiten")}
                  </h3>
                  <p className="text-sm sm:text-base mt-3 leading-relaxed" style={{color: '#CCCCCC', lineHeight: '1.6'}}>
                    {getText(
                      "Penguasaan kosakata, tata bahasa, percakapan, serta berpikir kritis — semua bekal untuk masa depanmu.",
                      "Wortschatz, Grammatik, Konversation und Schreibfähigkeiten können Sie sofort im Alltag anwenden."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        
        @keyframes fadeScaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideLeftFade {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideRightFade {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
};

const UserDropdownMenu = ({ user, language, onLogout }: UserDropdownProps) => {
  const getText = (id: string, de: string) => (language === "de" ? de : id);
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>("student");
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      if (data?.role) {
        setUserRole(data.role);
      }
    };
    fetchUserRole();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && 
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const myCoursesUrl = userRole === "teacher" ? "/home/teacher?tab=my-courses" : "/home/student";

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="font-semibold flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-gray-700"
        style={{ color: "#FFFFFC" }}
      >
        <User className="h-4 w-4" />
        {displayName}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E5E5",
            zIndex: 99999,
            top: "100%",
            marginTop: "8px"
          }}
        >
          <div
            className="px-4 py-2 text-sm font-medium border-b"
            style={{ color: "#1A1A1A", borderColor: "#E5E5E5" }}
          >
            {displayName}
          </div>

          <button
            onClick={() => {
              window.location.href = "/";
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
            style={{ color: "#1A1A1A" }}
          >
            <Home className="h-4 w-4" />
            {getText("Home", "Startseite")}
          </button>

          <button
            onClick={() => {
              window.location.href = myCoursesUrl;
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
            style={{ color: "#1A1A1A" }}
          >
            <BookOpen className="h-4 w-4" />
            {getText("My Courses", "Meine Kurse")}
          </button>

          <button
            onClick={() => {
              window.location.href = "/open-courses";
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
            style={{ color: "#1A1A1A" }}
          >
            <Globe className="h-4 w-4" />
            {getText("Open Courses", "Offene Kurse")}
          </button>

          <div style={{ borderColor: "#E5E5E5" }} className="border-t my-1"></div>

          <button
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
            style={{ color: "#DC2626" }}
          >
            {getText("Logout", "Abmelden")}
          </button>
        </div>
      )}
    </div>
  );
};

const UserDropdown = ({ user, language, onLogout }: UserDropdownProps) => {
  const getText = (id: string, de: string) => (language === "de" ? de : id);

  return (
    <UserDropdownMenu user={user} language={language} onLogout={onLogout} />
  );
};

// --- Main App Component
export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState<"id" | "de">("id");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null); // State untuk menyimpan data user
  const router = useRouter();

  useEffect(() => {
    // Fungsi untuk mendapatkan sesi saat komponen dimuat
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    // Panggil fungsi getSession
    getSession();

    // Dengarkan event perubahan otentikasi Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Clean-up function untuk berhenti mendengarkan event
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout Error:", error.message);
    } else {
      router.push("/"); // Arahkan kembali ke halaman utama setelah logout
    }
  };

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentView("course-detail");
  };

  const handleBackToHome = () => {
    setCurrentView("home");
    setSelectedCourseId("");
  };

  const handleFilterChange = (filters: any) => {
    console.log("Filters changed:", filters);
  };

  const toggleLanguage = () => {
    setLanguage(language === "id" ? "de" : "id");
  };

  const getText = (id: string, de: string) => (language === "de" ? de : id);

  const navigateToFeature = (feature: ViewType) => {
    setCurrentView(feature);
    setIsMobileMenuOpen(false);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "course-detail":
        // Placeholder, implement as needed
        return (
          <div className="container mx-auto py-12 text-center">
            <h2 className="text-2xl font-bold">Course Detail for {selectedCourseId}</h2>
            <p className="text-gray-500 mt-4">
              {getText("Halaman ini belum diimplementasikan.", "Diese Seite ist noch nicht implementiert.")}
            </p>
            <Button onClick={handleBackToHome} className="mt-8">
              {getText("Kembali ke Beranda", "Zurück zur Startseite")}
            </Button>
          </div>
        );
      case "interactive-quiz":
        return (
          <div className="container mx-auto py-12 text-center">
            <h2 className="text-2xl font-bold">Interactive Quiz</h2>
            <p className="text-gray-500 mt-4">
              {getText("Halaman ini belum diimplementasikan.", "Diese Seite ist noch nicht implementiert.")}
            </p>
            <Button onClick={handleBackToHome} className="mt-8">
              {getText("Kembali ke Beranda", "Zurück zur Startseite")}
            </Button>
          </div>
        );
      case "ai-analysis":
        return (
          <div className="container mx-auto py-12 text-center">
            <h2 className="text-2xl font-bold">AI Analysis</h2>
            <p className="text-gray-500 mt-4">
              {getText("Halaman ini belum diimplementasikan.", "Diese Seite ist noch nicht implementiert.")}
            </p>
            <Button onClick={handleBackToHome} className="mt-8">
              {getText("Kembali ke Beranda", "Zurück zur Startseite")}
            </Button>
          </div>
        );
      case "teacher-student":
        return (
          <div className="container mx-auto py-12 text-center">
            <h2 className="text-2xl font-bold">Teacher & Student Mode</h2>
            <p className="text-gray-500 mt-4">
              {getText("Halaman ini belum diimplementasikan.", "Diese Seite ist noch nicht implementiert.")}
            </p>
            <Button onClick={handleBackToHome} className="mt-8">
              {getText("Kembali ke Beranda", "Zurück zur Startseite")}
            </Button>
          </div>
        );
      case "mini-quiz":
        return (
          <div className="container mx-auto py-12 text-center">
            <h2 className="text-2xl font-bold">Mini Quiz Game</h2>
            <p className="text-gray-500 mt-4">
              {getText("Halaman ini belum diimplementasikan.", "Diese Seite ist noch nicht diimplementasikan.")}
            </p>
            <Button onClick={handleBackToHome} className="mt-8">
              {getText("Kembali ke Beranda", "Zurück zur Startseite")}
            </Button>
          </div>
        );
      case "stats-tracking":
        return (
          <div className="container mx-auto py-12 text-center">
            <h2 className="text-2xl font-bold">Statistics & Tracking</h2>
            <p className="text-gray-500 mt-4">
              {getText("Halaman ini belum diimplementasikan.", "Diese Seite ist noch nicht implementiert.")}
            </p>
            <Button onClick={handleBackToHome} className="mt-8">
              {getText("Kembali ke Beranda", "Zurück zur Startseite")}
            </Button>
          </div>
        );
      case "forum":
        return (
          <div className="container mx-auto py-12 text-center">
            <h2 className="text-2xl font-bold">Forum Discussion</h2>
            <p className="text-gray-500 mt-4">
              {getText("Halaman ini belum diimplementasikan.", "Diese Seite ist noch nicht diimplementasikan.")}
            </p>
            <Button onClick={handleBackToHome} className="mt-8">
              {getText("Kembali ke Beranda", "Zurück zur Startseite")}
            </Button>
          </div>
        );
      default:
        return renderHomePage();
    }
  };

  const renderHomePage = () => (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header style={{
        backgroundColor: 'rgba(13, 13, 13, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 40,
        overflow: 'visible',
        borderBottom: '2px solid',
        borderBottomColor: 'rgba(232, 184, 36, 0.3)',
        boxShadow: '0 4px 20px rgba(232, 184, 36, 0.05)'
      }} className="sticky top-0 overflow-visible">
        <div className="container mx-auto px-4 py-4 overflow-visible" style={{ overflow: 'visible' }}>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/img/1.png"
                alt="Logo"
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold" style={{color: '#F59E0B'}}>Si Jerman</h1>
                <p className="text-xs uppercase tracking-wider" style={{color: '#FFFFFC', letterSpacing: '0.05em'}}>Learning Platform</p>
              </div>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-6">
              <Button 
                variant="ghost" 
                className="font-semibold transition-all duration-300"
                style={{color: '#F59E0B'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#E8B824';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#F59E0B';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {getText("Home", "Startseite")}
              </Button>
              <Button 
                variant="ghost" 
                className="font-semibold transition-all duration-300"
                style={{color: '#F59E0B'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#E8B824';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#F59E0B';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {getText("Fitur", "Funktionen")}
              </Button>
              <Button 
                variant="ghost" 
                className="font-semibold transition-all duration-300"
                style={{color: '#F59E0B'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#E8B824';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#F59E0B';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {getText("Forum", "Forum")}
              </Button>
              <Button 
                variant="ghost" 
                className="font-semibold transition-all duration-300"
                style={{color: '#F59E0B'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#E8B824';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#F59E0B';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {getText("Contact Us", "Kontakt")}
              </Button>
            </nav>

            {/* Action Buttons & Language/Theme - Desktop */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="relative flex items-center">
                <Input
                  placeholder={getText("Cari course...", "Kurse suchen...")}
                  className="pl-8 w-48 transition-all duration-300"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFC',
                    border: '1px solid rgba(232, 184, 36, 0.3)',
                    borderRadius: '8px'
                  }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(232, 184, 36, 0.8)';
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(232, 184, 36, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(232, 184, 36, 0.3)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="flex items-center gap-1 transition-all duration-300"
                style={{color: '#FFFFFC'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#E8B824';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#FFFFFC';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Globe className="h-4 w-4" />
                {language === "id" ? "ID" : "DE"}
              </Button>
              {user ? (
                <UserDropdown
                  user={user}
                  language={language}
                  onLogout={handleLogout}
                />
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = "/auth/login")}
                    style={{
                      backgroundColor: 'rgba(255, 255, 252, 0.9)',
                      color: '#1E1E1E',
                      borderColor: '#FFFFFC',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFC';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 255, 252, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 252, 0.9)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {getText("Login", "Anmelden")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => (window.location.href = "/auth/register")}
                    style={{
                      backgroundColor: '#E8B824',
                      color: '#1A1A1A',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F59E0B';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(232, 184, 36, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#E8B824';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {getText("Register", "Registrieren")}
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" style={{color: '#FFFFFC'}} />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                    <SheetDescription>
                      {getText(
                        "Akses fitur dan navigasi",
                        "Zugang zu Funktionen und Navigation"
                      )}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder={getText("Cari course...", "Kurse suchen...")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => navigateToFeature("home")}
                      className="w-full justify-start"
                    >
                      {getText("Home", "Startseite")}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => navigateToFeature("forum")}
                      className="w-full justify-start"
                    >
                      {getText("Forum", "Forum")}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => navigateToFeature("home")}
                      className="w-full justify-start"
                    >
                      {getText("Contact Us", "Kontakt")}
                    </Button>
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {getText("Bahasa", "Sprache")}
                        </span>
                        <Button variant="ghost" size="sm" onClick={toggleLanguage}>
                          <Globe className="h-4 w-4 mr-2" />
                          {language.toUpperCase()}
                        </Button>
                      </div>
                    </div>
                    <div className="pt-4 border-t space-y-2">
                      {user ? (
                        <>
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              router.push("/dashboard");
                            }}
                          >
                            <User className="h-4 w-4 mr-2" />
                            {getText("Dashboard", "Dashboard")}
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={handleLogout}
                          >
                            <User className="h-4 w-4 mr-2" />
                            {getText("Keluar", "Abmelden")}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              router.push("/auth/login");
                            }}
                          >
                            <User className="h-4 w-4 mr-2" />
                            {getText("Login", "Anmelden")}
                          </Button>
                          <Button
                            className="w-full"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              router.push("/auth/register");
                            }}
                            style={{backgroundColor: '#E8B824', color: '#1A1A1A'}}
                          >
                            {getText("Register", "Registrieren")}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection language={language} />

      {/* Main Features */}
      <MainFeatures language={language} />

      {/* About Section */}
      <AboutSection language={language} />

      {/* Why Choose Section */}
      <WhyChooseSection language={language} />

      {/* Footer */}
      <footer className="border-t py-16 md:py-20" style={{backgroundColor: '#1A1A1A', borderColor: '#333333'}}>
        <div className="container mx-auto px-4 lg:px-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-16">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/img/1.png"
                  alt="Logo"
                  className="h-12 w-auto"
                />
                <div>
                  <span className="font-bold text-xl" style={{color: '#F59E0B'}}>Si Jerman</span>
                  <p className="text-xs uppercase tracking-wider" style={{color: '#999999', letterSpacing: '0.05em'}}>
                    {getText("Belajar tanpa batas", "Lernen ohne Grenzen")}
                  </p>
                </div>
              </div>
              <p className="text-base leading-relaxed" style={{color: '#CCCCCC', lineHeight: '1.6'}}>
                {getText(
                  "Platform pembelajaran online terbaik untuk siswa Indonesia",
                  "Die beste Online-Lernplattform für indonesische Studenten"
                )}
              </p>
            </div>

            {/* Course Section */}
            <div>
              <h4 className="font-bold text-base mb-6 uppercase tracking-wider" style={{color: '#E8B824', letterSpacing: '0.05em'}}>
                {getText("Course", "Kurse")}
              </h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-base transition-colors hover:text-white" style={{color: '#CCCCCC'}}>{getText("Kelas A-1", "Klasse A-1")}</a></li>
                <li><a href="#" className="text-base transition-colors hover:text-white" style={{color: '#CCCCCC'}}>{getText("Kelas A-2", "Klasse A-2")}</a></li>
                <li><a href="#" className="text-base transition-colors hover:text-white" style={{color: '#CCCCCC'}}>{getText("Course Gratis", "Kostenlose Kurse")}</a></li>
                <li><a href="#" className="text-base transition-colors hover:text-white" style={{color: '#CCCCCC'}}>{getText("Sertifikasi", "Zertifizierung")}</a></li>
              </ul>
            </div>

            {/* Support Section */}
            <div>
              <h4 className="font-bold text-base mb-6 uppercase tracking-wider" style={{color: '#E8B824', letterSpacing: '0.05em'}}>
                {getText("Dukungan", "Unterstützung")}
              </h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-base transition-colors hover:text-white" style={{color: '#CCCCCC'}}>FAQ</a></li>
                <li><a href="#" className="text-base transition-colors hover:text-white" style={{color: '#CCCCCC'}}>{getText("Bantuan", "Hilfe")}</a></li>
                <li><a href="#" className="text-base transition-colors hover:text-white" style={{color: '#CCCCCC'}}>{getText("Kontak", "Kontakt")}</a></li>
                <li>
                  <button
                    onClick={() => navigateToFeature("forum")}
                    className="text-base transition-colors hover:text-white"
                    style={{color: '#CCCCCC'}}
                  >
                    Forum
                  </button>
                </li>
              </ul>
            </div>

            {/* Company Section */}
            <div>
              <h4 className="font-bold text-base mb-6 uppercase tracking-wider" style={{color: '#E8B824', letterSpacing: '0.05em'}}>
                {getText("Perusahaan", "Unternehmen")}
              </h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-base transition-colors hover:text-white" style={{color: '#CCCCCC'}}>{getText("Tentang Kami", "Über uns")}</a></li>
                <li><a href="#" className="text-base transition-colors hover:text-white" style={{color: '#CCCCCC'}}>{getText("Karir", "Karriere")}</a></li>
                <li><a href="#" className="text-base transition-colors hover:text-white" style={{color: '#CCCCCC'}}>Blog</a></li>
                <li><a href="#" className="text-base transition-colors hover:text-white" style={{color: '#CCCCCC'}}>Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t mt-12 md:mt-16 pt-8" style={{borderColor: '#333333'}}>
            <p className="text-center text-sm" style={{color: '#999999'}}>
              &copy; 2025 Si Jerman. {getText("Semua hak dilindungi.", "Alle Rechte vorbehalten.")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );

  return (
    <>
      {renderCurrentView()}
      <Toaster />
    </>
  );
}