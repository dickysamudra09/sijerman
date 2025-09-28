"use client";
import { useState, useEffect } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

// Tipe data untuk props UserDropdown
interface UserDropdownProps {
  user: SupabaseUser;
  language: "id" | "de";
  onLogout: () => void;
}

// --- Components
const HeroSection = ({ language }: LanguageProps) => {
  const getText = (id: string, de: string) => (language === "de" ? de : id);

  return (
    <section className="relative overflow-hidden px-4">
      <div className="container mx-auto px-4 lg:px-20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Text Content */}
          <div className="text-center lg:text-left flex-1">
            {/* Judul */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-900 leading-snug mb-4 max-w-2xl">
              {getText("Kembangkan Potensimu, dengan ", "Entwickle dein Potenzial, mit ")}
              <span className="bg-gradient-to-r from-blue-500 to-blue-800 bg-clip-text text-transparent">
                Si Jerman.
              </span>
            </h2>

            {/* Subjudul */}
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900 mb-6 max-w-2xl">
              {getText(
                "“Temukan fitur yang belum pernah kamu coba.”",
                "“Entdecke Funktionen, die du noch nie ausprobiert hast.”"
              )}
            </p>

            {/* Deskripsi */}
            <p className="text-gray-800 text-lg max-w-xl">
              {getText(
                "Si Jerman, ruang belajar digital dengan latihan soal AI, kuis interaktif, dashboard analisis, forum diskusi, dan course terstruktur untuk belajar cerdas dan kolaboratif.",
                "Si Jerman, der digitale Lernraum mit KI-Übungsaufgaben, interaktiven Quizzes, Dashboard, Forum und strukturierten Kursen für intelligentes und kollaboratives Lernen."
              )}
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4">
              {/* Explore button */}
              <Button className="w-full sm:w-auto px-6 py-3 font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors shadow-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                {getText("Explore Our Fitur", "Unsere Funktionen erkunden")}
              </Button>

              {/* Phone contact */}
              <div className="flex items-center gap-2 text-gray-900 font-semibold">
                <div className="w-10 h-10 flex items-center justify-center bg-yellow-400 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="white"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 16.92v3a2.06 2.06 0 01-2.23 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2.06 2.06 0 014.11 2h3a2.06 2.06 0 012 1.72 12.84 12.84 0 00.7 2.81 2.06 2.06 0 01-.45 2.18L8.09 9.91a16 16 0 006 6l1.2-1.2a2.06 2.06 0 012.18-.45 12.84 12.84 0 002.81.7A2.06 2.06 0 0122 16.92z" />
                  </svg>
                </div>
                <span>087812186453</span>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <img
              src="/img/3.png"
              alt="Black cat character holding a yellow book and pencil"
              className="w-full max-w-md h-auto object-contain"
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
        <div className="bg-blue-50 rounded-2xl shadow-md p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {/* Card 1 */}
            <div>
              <h3 className="text-5xl font-bold text-blue-900">
                <span className="text-yellow-400">+</span>96
              </h3>
              <h4 className="text-xl font-bold mt-2 text-blue-900">
                Latihan Interaktif
              </h4>
              <p className="text-sm text-gray-600 mt-2">
                Nikmati berbagai latihan soal dengan analisis AI — bukan sekadar teori, tapi praktik bahasa yang nyata.
              </p>
            </div>

            {/* Card 2 */}
            <div>
              <h3 className="text-5xl font-bold text-blue-900">
                <span className="text-yellow-400">+</span>4
              </h3>
              <h4 className="text-xl font-bold mt-2 text-blue-900">
                Proyek Tiap Level
              </h4>
              <p className="text-sm text-gray-600 mt-2">
                Setiap level menghadirkan tugas nyata yang melatih kosakata, tata bahasa, serta kreativitas pengguna.
              </p>
            </div>

            {/* Card 3 */}
            <div>
              <h3 className="text-5xl font-bold text-blue-900">
                <span className="text-yellow-400">+</span>192
              </h3>
              <h4 className="text-xl font-bold mt-2 text-blue-900">
                Total Jam Belajar
              </h4>
              <p className="text-sm text-gray-600 mt-2">
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
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-16">
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
            <span className="text-sm font-semibold uppercase text-blue-200">
              {getText("Sapa Si Jerman?", "Wer ist Si Jerman?")}
            </span>
            <h2 className="text-3xl font-bold text-gray-800 mt-2 mb-4">
              {getText(
                "Temui Si Jerman - Tempat Belajar Bahasa Jerman yang Interaktif dan Menyenangkan",
                "Treffen Sie Si Jerman - Ihr interaktiver und unterhaltsamer Ort, um Deutsch zu lernen"
              )}
            </h2>
            <p className="text-gray-600 mb-6 max-w-xl">
              {getText(
                "Si Jerman adalah platform edukasi digital untuk mengembangkan kompetensi bahasa Jerman secara efektif.",
                "Si Jerman ist eine digitale Bildungsplattform zur effektiven Entwicklung von Deutschkenntnissen."
              )}
            </p>
            <p className="text-gray-500 mb-8 max-w-xl">
              {getText(
                "Dengan fitur interaktif seperti latihan soal AI, kuis multiplayer, dashboard, forum, dan course terstruktur, kami membantu Anda membangun keterampilan bahasa, berpikir kritis, dan kepercayaan diri. Mari belajar sekarang!",
                "Mit interaktiven Funktionen wie KI-Übungsaufgaben, Multiplayer-Quizzes, Dashboard, Forum und strukturierten Kursen helfen wir Ihnen, Ihre Sprachkenntnisse, Ihr kritisches Denken und Ihr Selbstvertrauen aufzubauen. Fangen Sie jetzt an zu lernen!"
              )}
            </p>
            <Button className="px-8 py-3 bg-blue-200 hover:bg-blue-300 text-gray-900 rounded-full font-semibold">
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
    <section className="bg-blue-50 py-16 px-6">
      <div className="container mx-auto">
        {/* Heading */}
        <div className="text-center mt-12">
          <span className="text-sm font-semibold uppercase bg-yellow-400 px-4 py-1 rounded">
            {getText("Mengapa Si Jerman?", "Warum Si Jerman?")}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-blue-900 mt-10">
            {getText("Belajar. Berlatih. Kuasai. Ulangi.", "Lernen. Üben. Meistern. Wiederholen.")}
          </h2>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-12">
          {/* Left cards */}
          <div className="flex flex-col gap-12">
            {/* Card 1 */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-lg bg-orange-200 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-7 h-7 text-blue-900" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 text-lg">
                  {getText("Belajar dengan Praktik", "Lernen durch Übung")}
                </h3>
                <p className="text-gray-700 text-sm mt-2">
                  {getText(
                    "Tidak ada pembelajaran membosankan — hanya latihan interaktif, analisis AI, dan tantangan bahasa yang kreatif.",
                    "Kein langweiliges Lernen mehr, nur interaktive Übungen, KI-Analysen und kreative Quizzes."
                  )}
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-lg bg-purple-200 flex items-center justify-center flex-shrink-0">
                <Smile className="w-7 h-7 text-blue-900" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 text-lg">
                  {getText("Suasana Menyenangkan & Ramah", "Spaßige und freundliche Atmosphäre")}
                </h3>
                <p className="text-gray-700 text-sm mt-2">
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
              <div className="w-14 h-14 rounded-lg bg-blue-200 flex items-center justify-center flex-shrink-0">
                <Compass className="w-7 h-7 text-blue-900" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 text-lg">
                  {getText("Pilih Jalur Belajarmu", "Wählen Sie Ihren Lernpfad")}
                </h3>
                <p className="text-gray-700 text-sm mt-2">
                  {getText(
                    "Ikuti course sesuai level, tantang diri dengan latihan soal, atau jelajah forum untuk diskusi dan berbagi ide.",
                    "Folgen Sie Kursen je nach Niveau, legen Sie die Dauer mit Übungsaufgaben fest oder erkunden Sie andere Funktionen."
                  )}
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-lg bg-pink-200 flex items-center justify-center flex-shrink-0">
                <Target className="w-7 h-7 text-blue-900" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 text-lg">
                  {getText("Keterampilan yang Melekat", "Feste Fähigkeiten")}
                </h3>
                <p className="text-gray-700 text-sm mt-2">
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

// Komponen Dropdown untuk Pengguna
const UserDropdown = ({ user, language, onLogout }: UserDropdownProps) => {
  const getText = (id: string, de: string) => (language === "de" ? de : id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="font-semibold text-gray-900">
          <User className="mr-2 h-4 w-4" />
          {user.user_metadata.full_name || user.email?.split("@")[0]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          {user.user_metadata.full_name || getText("Akun Saya", "Mein Konto")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <a href="/dashboard">
            {getText("Dashboard", "Dashboard")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <a href="/home/teacher">
            {getText("Beranda", "Startseite")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          {getText("Keluar", "Abmelden")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
      <header className="bg-blue-50 border-b bg-white backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/img/1.png"
                alt="Logo"
                className="h-12 w-auto mr-2"
              />
              <div>
                <h1 className="text-xl font-bold text-blue-700">Si Jerman</h1>
                <p className="text-sm text-gray-500">
                  {getText("Belajar tanpa batas", "Lernen ohne Grenzen")}
                </p>
              </div>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-6">
              <Button variant="ghost" className="font-semibold text-gray-900">
                {getText("Home", "Startseite")}
              </Button>
              <Button variant="ghost" className="font-semibold text-gray-900">
                {getText("Fitur", "Funktionen")}
              </Button>
              <Button variant="ghost" className="font-semibold text-gray-900">
                {getText("Forum", "Forum")}
              </Button>
              <Button variant="ghost" className="font-semibold text-gray-900">
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
                className="flex items-center gap-1 text-gray-900"
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
                    className="bg-gray-100 text-gray-900 border-gray-200"
                  >
                    {getText("Login", "Anmelden")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => (window.location.href = "/auth/register")}
                    className="bg-blue-200 hover:bg-blue-300 text-gray-900"
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
                    <Menu className="h-5 w-5 text-gray-900" />
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
      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img
                  src="/img/1.png"
                  alt="Logo"
                  className="h-12 w-auto mr-2"
                />
                <span className="font-bold text-gray-700">Si Jerman</span>
              </div>
              <p className="text-gray-500 text-sm">
                {getText(
                  "Platform pembelajaran online terbaik untuk siswa Indonesia",
                  "Die beste Online-Lernplattform für indonesische Studenten"
                )}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-gray-900">
                {getText("Course", "Kurse")}
              </h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>{getText("Kelas A-1", "Klasse A-1")}</li>
                <li>{getText("Kelas A-2", "Klasse A-2")}</li>
                <li>{getText("Course Gratis", "Kostenlose Kurse")}</li>
                <li>{getText("Sertifikasi", "Zertifizierung")}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-gray-900">
                {getText("Dukungan", "Unterstützung")}
              </h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>FAQ</li>
                <li>{getText("Bantuan", "Hilfe")}</li>
                <li>{getText("Kontak", "Kontakt")}</li>
                <li>
                  <button
                    onClick={() => navigateToFeature("forum")}
                    className="text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Forum
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-gray-900">
                {getText("Perusahaan", "Unternehmen")}
              </h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>{getText("Tentang Kami", "Über uns")}</li>
                <li>{getText("Karir", "Karriere")}</li>
                <li>Blog</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; 2025 Si. {getText("Semua hak dilindungi.", "Alle Rechte vorbehalten.")}</p>
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