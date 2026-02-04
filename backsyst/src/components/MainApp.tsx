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

const HeroSection = ({ language }: LanguageProps) => {
  const getText = (id: string, de: string) => (language === "de" ? de : id);

  return (
    <section className="relative overflow-hidden px-4 py-12 md:py-20">
      <div className="container mx-auto px-4 lg:px-20">
        <div className="flex flex-col lg:flex-row items-center lg:justify-between gap-6 md:gap-8 lg:gap-10">
          {/* Text Content */}
          <div className="text-center lg:text-left flex-1 max-w-2xl">
            {/* Judul */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 max-w-3xl" style={{color: '#1A1A1A', lineHeight: '1.2'}}>
              {getText("Kembangkan Potensimu, dengan", "Entwickle dein Potenzial, mit")}
              <br />
              <span style={{color: '#E8B824'}} className="font-bold">
                Si Jerman.
              </span>
            </h1>

            {/* Deskripsi */}
            <p className="text-base sm:text-lg mb-10 max-w-2xl" style={{color: '#4A4A4A', lineHeight: '1.7', fontWeight: '400'}}>
              {getText(
                "Si Jerman adalah ruang belajar digital lengkap dengan latihan soal AI, kuis interaktif, dashboard analisis, forum diskusi, dan course terstruktur untuk belajar Bahasa Jerman secara cerdas dan kolaboratif.",
                "Si Jerman ist der digitale Lernraum mit KI-Übungsaufgaben, interaktiven Quizzes, Dashboard, Forum und strukturierten Kursen für intelligentes und kollaboratives Lernen der deutschen Sprache."
              )}
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4">
              {/* Explore Open Courses button */}
              <Button 
                onClick={() => window.location.href = '/open-courses'}
                className="w-full sm:w-auto px-8 py-3 font-semibold text-white rounded-full transition-all hover:opacity-90 shadow-lg flex items-center justify-center gap-2" 
                style={{backgroundColor: '#E8B824', color: '#1A1A1A'}}
              >
                <Compass className="h-5 w-5" />
                {getText("Explore Open Courses", "Offene Kurse erkunden")}
              </Button>
              
              {/* Explore Features button */}
              <Button className="w-full sm:w-auto px-8 py-3 font-semibold text-white rounded-full transition-all hover:opacity-90 shadow-lg flex items-center justify-center gap-2" style={{backgroundColor: '#1A1A1A'}}>
                <Search className="h-5 w-5" />
                {getText("Explore Our Fitur", "Unsere Funktionen erkunden")}
              </Button>
            </div>
          </div>

          {/* Image */}
          <div className="flex-1 flex justify-center items-center w-full max-w-sm lg:max-w-md">
            <img
              src="/img/3.png"
              alt="Black cat character holding a yellow book and pencil"
              className="w-full h-auto object-contain"
              style={{transform: 'scaleX(-1)'}}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const MainFeatures = ({ language }: LanguageProps) => {
  const getText = (id: string, de: string) => (language === "de" ? de : id);

  return (
    <section className="py-3">
      <div className="container mx-auto px-4">
        <div className="rounded-2xl shadow-md p-10" style={{backgroundColor: '#1A1A1A'}}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {/* Card 1 */}
            <div>
              <h3 className="text-5xl font-bold" style={{color: '#E8B824'}}>
                <span style={{color: '#FFFFFC'}}>+</span>96
              </h3>
              <h4 className="text-xl font-bold mt-2" style={{color: '#E8B824'}}>
                Latihan Interaktif
              </h4>
              <p className="text-sm mt-2" style={{color: '#FFFFFC'}}>
                Nikmati berbagai latihan soal dengan analisis AI — bukan sekadar teori, tapi praktik bahasa yang nyata.
              </p>
            </div>

            {/* Card 2 */}
            <div>
              <h3 className="text-5xl font-bold" style={{color: '#E8B824'}}>
                <span style={{color: '#FFFFFC'}}>+</span>4
              </h3>
              <h4 className="text-xl font-bold mt-2" style={{color: '#E8B824'}}>
                Proyek Tiap Level
              </h4>
              <p className="text-sm mt-2" style={{color: '#FFFFFC'}}>
                Setiap level menghadirkan tugas nyata yang melatih kosakata, tata bahasa, serta kreativitas pengguna.
              </p>
            </div>

            {/* Card 3 */}
            <div>
              <h3 className="text-5xl font-bold" style={{color: '#E8B824'}}>
                <span style={{color: '#FFFFFC'}}>+</span>192
              </h3>
              <h4 className="text-xl font-bold mt-2" style={{color: '#E8B824'}}>
                Total Jam Belajar
              </h4>
              <p className="text-sm mt-2" style={{color: '#FFFFFC'}}>
                Kurikulum dirancang seimbang antara keseruan kuis, forum diskusi, dan pembelajaran mendalam dari materi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const AboutSection = ({ language }: LanguageProps) => {
  const getText = (id: string, de: string) => (language === "de" ? de : id);

  return (
    <section className="py-16 md:py-28 px-4" style={{backgroundColor: '#FFFFFC'}}>
      <div className="container mx-auto px-4 lg:px-20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-20">
          {/* Image */}
          <div className="relative flex-shrink-0 w-full max-w-md">
            <img
              src="/img/1.png"
              alt="Black cat mascot reading a book"
              className="w-full h-auto object-contain"
            />
          </div>
          {/* Text Content */}
          <div className="relative z-10 text-center lg:text-left">
            <span className="text-xs font-bold uppercase tracking-wider" style={{color: '#E8B824', letterSpacing: '0.1em'}}>
              {getText("Sapa Si Jerman?", "Wer ist Si Jerman?")}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-4xl font-bold mt-4 mb-6 leading-tight" style={{color: '#1A1A1A', lineHeight: '1.3'}}>
              {getText(
                "Temui Si Jerman - Tempat Belajar Bahasa Jerman yang Interaktif dan Menyenangkan",
                "Treffen Sie Si Jerman - Ihr interaktiver und unterhaltsamer Ort, um Deutsch zu lernen"
              )}
            </h2>
            <p className="text-base sm:text-lg mb-5 max-w-xl leading-relaxed" style={{color: '#4A4A4A', lineHeight: '1.7'}}>
              {getText(
                "Si Jerman adalah platform edukasi digital untuk mengembangkan kompetensi bahasa Jerman secara efektif.",
                "Si Jerman ist eine digitale Bildungsplattform zur effektiven Entwicklung von Deutschkenntnissen."
              )}
            </p>
            <p className="text-base sm:text-lg mb-10 max-w-xl leading-relaxed" style={{color: '#4A4A4A', lineHeight: '1.7'}}>
              {getText(
                "Dengan fitur interaktif seperti latihan soal AI, kuis multiplayer, dashboard, forum, dan course terstruktur, kami membantu Anda membangun keterampilan bahasa, berpikir kritis, dan kepercayaan diri. Mari belajar sekarang!",
                "Mit interaktiven Funktionen wie KI-Übungsaufgaben, Multiplayer-Quizzes, Dashboard, Forum und strukturierten Kursen helfen wir Ihnen, Ihre Sprachkenntnisse, Ihr kritisches Denken und Ihr Selbstvertrauen aufzubauen. Fangen Sie jetzt an zu lernen!"
              )}
            </p>
            <Button className="px-8 py-3 rounded-full font-semibold transition-all hover:opacity-90 shadow-md" style={{backgroundColor: '#E8B824', color: '#1A1A1A'}}>
              {getText("Contact Us", "Kontaktieren Sie uns")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

const WhyChooseSection = ({ language }: LanguageProps) => {
  const getText = (id: string, de: string) => (language === "de" ? de : id);

  return (
    <section className="py-16 md:py-28 px-4" style={{backgroundColor: '#FFFFFC'}}>
      <div className="container mx-auto px-4 lg:px-20">
        {/* Heading */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded inline-block" style={{backgroundColor: '#E8B824', color: '#1A1A1A', letterSpacing: '0.1em'}}>
            {getText("Mengapa Si Jerman?", "Warum Si Jerman?")}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-4xl font-bold mt-6 leading-tight" style={{color: '#1A1A1A', lineHeight: '1.3'}}>
            {getText("Belajar. Berlatih. Kuasai. Ulangi.", "Lernen. Üben. Meistern. Wiederholen.")}
          </h2>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-12">
          {/* Left cards */}
          <div className="flex flex-col gap-12">
            {/* Card 1 */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#E8B824'}}>
                <BookOpen className="w-7 h-7" style={{color: '#1A1A1A'}} />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight mt-1" style={{color: '#1A1A1A'}}>
                  {getText("Belajar dengan Praktik", "Lernen durch Übung")}
                </h3>
                <p className="text-base sm:text-base mt-3 leading-relaxed" style={{color: '#4A4A4A', lineHeight: '1.6'}}>
                  {getText(
                    "Tidak ada pembelajaran membosankan — hanya latihan interaktif, analisis AI, dan tantangan bahasa yang kreatif.",
                    "Kein langweiliges Lernen mehr, nur interaktive Übungen, KI-Analysen und kreative Quizzes."
                  )}
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#E8B824'}}>
                <Smile className="w-7 h-7" style={{color: '#1A1A1A'}} />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight mt-1" style={{color: '#1A1A1A'}}>
                  {getText("Suasana Menyenangkan & Ramah", "Spaßige und freundliche Atmosphäre")}
                </h3>
                <p className="text-base sm:text-base mt-3 leading-relaxed" style={{color: '#4A4A4A', lineHeight: '1.6'}}>
                  {getText(
                    "Dari kuis seru hingga pengajar yang inspiratif, kami membuat belajar Bahasa Jerman terasa seperti bermain.",
                    "In einer freundlichen und unterstützenden Umgebung helfen wir Ihnen, Deutsch ohne den Druck von Nachhilfe zu lernen."
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Center image */}
          <div className="flex justify-center order-first lg:order-none">
            <img
              src="/img/2.png"
              alt="Black cat mascot waving"
              className="w-full max-w-sm h-auto object-contain"
            />
          </div>

          {/* Right cards */}
          <div className="flex flex-col gap-12">
            {/* Card 3 */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#E8B824'}}>
                <Compass className="w-7 h-7" style={{color: '#1A1A1A'}} />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight mt-1" style={{color: '#1A1A1A'}}>
                  {getText("Pilih Jalur Belajarmu", "Wählen Sie Ihren Lernpfad")}
                </h3>
                <p className="text-base sm:text-base mt-3 leading-relaxed" style={{color: '#4A4A4A', lineHeight: '1.6'}}>
                  {getText(
                    "Ikuti course sesuai level, tantang diri dengan latihan soal, atau jelajah forum untuk diskusi dan berbagi ide.",
                    "Folgen Sie Kursen je nach Niveau, legen Sie die Dauer mit Übungsaufgaben fest oder erkunden Sie andere Funktionen."
                  )}
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#E8B824'}}>
                <Target className="w-7 h-7" style={{color: '#1A1A1A'}} />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight mt-1" style={{color: '#1A1A1A'}}>
                  {getText("Keterampilan yang Melekat", "Feste Fähigkeiten")}
                </h3>
                <p className="text-base sm:text-base mt-3 leading-relaxed" style={{color: '#4A4A4A', lineHeight: '1.6'}}>
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
      <header style={{backgroundColor: 'rgba(13, 13, 13, 0.90)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 40, overflow: 'visible'}} className="border-b sticky top-0 overflow-visible">
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
                <h1 className="text-xl font-bold" style={{color: '#E8B824'}}>Si Jerman</h1>
                <p className="text-xs uppercase tracking-wider" style={{color: '#FFFFFC', letterSpacing: '0.05em'}}>Learning Platform</p>
              </div>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-6">
              <Button variant="ghost" className="font-semibold" style={{color: '#E8B824'}}>
                {getText("Home", "Startseite")}
              </Button>
              <Button variant="ghost" className="font-semibold" style={{color: '#E8B824'}}>
                {getText("Fitur", "Funktionen")}
              </Button>
              <Button variant="ghost" className="font-semibold" style={{color: '#E8B824'}}>
                {getText("Forum", "Forum")}
              </Button>
              <Button variant="ghost" className="font-semibold" style={{color: '#E8B824'}}>
                {getText("Contact Us", "Kontakt")}
              </Button>
            </nav>

            {/* Action Buttons & Language/Theme - Desktop */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="relative flex items-center">
                <Input
                  placeholder={getText("Cari course...", "Kurse suchen...")}
                  className="pl-8 w-48 bg-gray-100 text-gray-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="flex items-center gap-1"
                style={{color: '#FFFFFC'}}
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
                    style={{backgroundColor: '#FFFFFC', color: '#1E1E1E', borderColor: '#FFFFFC'}}
                  >
                    {getText("Login", "Anmelden")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => (window.location.href = "/auth/register")}
                    style={{backgroundColor: '#E8B824', color: '#FFFFFC'}}
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
                            className="w-full bg-blue-200 hover:bg-blue-300 text-gray-900"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              router.push("/auth/register");
                            }}
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
                  <span className="font-bold text-xl" style={{color: '#E8B824'}}>Si Jerman</span>
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