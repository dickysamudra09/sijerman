import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/sonner";
import { ClassSection } from "@/components/ClassSection";
import { FAQ } from "@/components/FAQ";
import { HeroSection } from "@/components/HeroSection";
import { ClassFilter } from "@/components/ClassFilter";
import { CourseDetail } from "@/components/CourseDetail";
import { AuthDialog } from "@/components/AuthDialog";
import { InteractiveQuiz } from "@/components/InteractiveQuiz";
import { AIAnalysis } from "@/components/AIAnalysis";
import { TeacherStudentMode } from "@/components/TeacherStudentMode";
import { MiniQuizGame } from "@/components/MiniQuizGame";
import { StatsTracking } from "@/components/StatsTracking";
import { Forum } from "@/components/Forum";
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
  Zap,
  BookOpen,
  MessageSquare,
  Menu,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";


// Data course untuk kelas A-1
const coursesA1 = [
  {
    id: "a1-1",
    title: "Matematika Dasar",
    description: "Pelajari konsep dasar matematika dengan pendekatan yang mudah dipahami",
    duration: "8 minggu",
    students: 45,
    lessons: 24
  },
  {
    id: "a1-2",
    title: "Bahasa Indonesia",
    description: "Meningkatkan kemampuan berbahasa Indonesia yang baik dan benar",
    duration: "6 minggu",
    students: 52,
    lessons: 18
  },
  {
    id: "a1-3",
    title: "IPA Terpadu",
    description: "Eksplorasi dunia sains melalui eksperimen dan praktik langsung",
    duration: "10 minggu",
    students: 38,
    lessons: 30
  }
];

// Data course untuk kelas A-2
const coursesA2 = [
  {
    id: "a2-1",
    title: "Mathematik Fortgeschritten",
    description: "Erweiterte mathematische Konzepte mit praktischen Anwendungen",
    duration: "10 minggu",
    students: 42,
    lessons: 28
  },
  {
    id: "a2-2",
    title: "Deutsche Sprache A2",
    description: "Lernen Sie Deutsch für den täglichen und akademischen Gebrauch",
    duration: "8 minggu",
    students: 48,
    lessons: 32
  },
  {
    id: "a2-3",
    title: "Geschichte Deutschlands",
    description: "Die Reise der deutschen Geschichte von der Vergangenheit bis zur Moderne verstehen",
    duration: "6 minggu",
    students: 35,
    lessons: 20
  }
];

type ViewType = 'home' | 'course-detail' | 'interactive-quiz' | 'ai-analysis' | 'teacher-student' | 'mini-quiz' | 'stats-tracking' | 'forum';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<'id' | 'de'>('id');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentView('course-detail');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedCourseId('');
  };

  const handleFilterChange = (filters: any) => {
    console.log('Filters changed:', filters);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'id' ? 'de' : 'id');
  };

  const getText = (id: string, de: string) => {
    return language === 'de' ? de : id;
  };

  // Feature navigation handlers
  const navigateToFeature = (feature: ViewType) => {
    setCurrentView(feature);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'course-detail':
        return (
          <CourseDetail 
            courseId={selectedCourseId}
            onBack={handleBackToHome}
          />
        );
      case 'interactive-quiz':
        return <InteractiveQuiz onBack={handleBackToHome} />;
      case 'ai-analysis':
        return <AIAnalysis onBack={handleBackToHome} />;
      case 'teacher-student':
        return <TeacherStudentMode onBack={handleBackToHome} />;
      case 'mini-quiz':
        return <MiniQuizGame onBack={handleBackToHome} />;
      case 'stats-tracking':
        return <StatsTracking onBack={handleBackToHome} />;
      case 'forum':
        return <Forum onBack={handleBackToHome} language={language} />;
      default:
        return renderHomePage();
    }
  };

  const renderHomePage = () => (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/95 dark:bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">EduPlatform</h1>
                <p className="text-sm text-muted-foreground">
                  {getText("Belajar tanpa batas", "Lernen ohne Grenzen")}
                </p>
              </div>
            </div>
            
            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex items-center gap-4 flex-1 max-w-md mx-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={getText("Cari course, materi, atau topik...", "Kurse, Materialien oder Themen suchen...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Navigation - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {/* Forum Button - Prominent */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToFeature('forum')}
                className="flex items-center gap-2 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <MessageSquare className="h-4 w-4" />
                {getText("Forum", "Forum")}
              </Button>

              {/* Language Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                {language.toUpperCase()}
              </Button>

              {/* Dark Mode Toggle */}
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={setIsDarkMode}
                />
                <Moon className="h-4 w-4" />
              </div>

              {/* Auth Buttons */}
              <AuthDialog>
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  {getText("Masuk", "Anmelden")}
                </Button>
              </AuthDialog>
              <AuthDialog>
                <Button size="sm">
                  {getText("Daftar Gratis", "Kostenlos registrieren")}
                </Button>
              </AuthDialog>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                    <SheetDescription>
                      {getText("Akses fitur dan navigasi", "Zugang zu Funktionen und Navigation")}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    {/* Search Mobile */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={getText("Cari course...", "Kurse suchen...")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Forum Button Mobile - Prominent */}
                    <Button
                      variant="outline"
                      onClick={() => navigateToFeature('forum')}
                      className="w-full justify-start gap-2 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {getText("Forum Diskusi", "Diskussionsforum")}
                    </Button>

                    {/* Other Features */}
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        onClick={() => navigateToFeature('interactive-quiz')}
                        className="w-full justify-start gap-2"
                      >
                        <Target className="h-4 w-4" />
                        {getText("Latihan Interaktif", "Interaktive Übungen")}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => navigateToFeature('ai-analysis')}
                        className="w-full justify-start gap-2"
                      >
                        <Brain className="h-4 w-4" />
                        {getText("Analisis AI", "KI-Analyse")}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => navigateToFeature('teacher-student')}
                        className="w-full justify-start gap-2"
                      >
                        <Users className="h-4 w-4" />
                        {getText("Mode Guru & Siswa", "Lehrer- & Schülermodus")}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => navigateToFeature('mini-quiz')}
                        className="w-full justify-start gap-2"
                      >
                        <Gamepad2 className="h-4 w-4" />
                        {getText("Mini Quiz Game", "Mini-Quiz-Spiel")}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => navigateToFeature('stats-tracking')}
                        className="w-full justify-start gap-2"
                      >
                        <BarChart3 className="h-4 w-4" />
                        {getText("Statistik", "Statistiken")}
                      </Button>
                    </div>

                    {/* Settings */}
                    <div className="pt-4 border-t space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {getText("Bahasa", "Sprache")}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleLanguage}
                        >
                          <Globe className="h-4 w-4 mr-2" />
                          {language.toUpperCase()}
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {getText("Mode Gelap", "Dunkler Modus")}
                        </span>
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          <Switch
                            checked={isDarkMode}
                            onCheckedChange={setIsDarkMode}
                          />
                          <Moon className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    {/* Auth Buttons Mobile */}
                    <div className="pt-4 border-t space-y-2">
                      <AuthDialog>
                        <Button variant="ghost" className="w-full justify-start">
                          <User className="h-4 w-4 mr-2" />
                          {getText("Masuk", "Anmelden")}
                        </Button>
                      </AuthDialog>
                      <AuthDialog>
                        <Button className="w-full">
                          {getText("Daftar Gratis", "Kostenlos registrieren")}
                        </Button>
                      </AuthDialog>
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

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="mb-4">
            {getText("Fitur Pembelajaran Interaktif", "Interaktive Lernfunktionen")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {getText(
              "Jelajahi berbagai fitur canggih yang dirancang untuk meningkatkan pengalaman belajar Anda",
              "Entdecken Sie verschiedene fortschrittliche Funktionen, die entwickelt wurden, um Ihre Lernerfahrung zu verbessern"
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {/* Interactive Quiz */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigateToFeature('interactive-quiz')}>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="flex items-center gap-2">
                {getText("Latihan Interaktif A2", "Interaktive Übungen A2")}
              </CardTitle>
              <CardDescription>
                {getText(
                  "Soal pilihan ganda dengan timer, skor, dan pembahasan detail",
                  "Multiple-Choice-Fragen mit Timer, Punktzahl und detaillierter Erklärung"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {getText("Mulai Latihan", "Übung starten")}
              </Button>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigateToFeature('ai-analysis')}>
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Brain className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>
                {getText("Analisis AI", "KI-Analyse")}
              </CardTitle>
              <CardDescription>
                {getText(
                  "Feedback otomatis dan penjelasan grammar dengan teknologi AI",
                  "Automatisches Feedback und Grammatikerklärungen mit KI-Technologie"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                {getText("Analisis Teks", "Text analysieren")}
              </Button>
            </CardContent>
          </Card>

          {/* Forum Discussion - Highlighted */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-orange-200 bg-orange-50/30 dark:bg-orange-900/10" onClick={() => navigateToFeature('forum')}>
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 dark:group-hover:bg-orange-800/30 transition-colors">
                <MessageSquare className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-orange-900 dark:text-orange-100">
                {getText("Forum Diskusi", "Diskussionsforum")}
              </CardTitle>
              <CardDescription>
                {getText(
                  "Bergabung dengan komunitas, tanya jawab, dan berbagi pengetahuan",
                  "Treten Sie der Community bei, stellen Sie Fragen und teilen Sie Wissen"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full group-hover:bg-orange-600 group-hover:text-white transition-colors">
                {getText("Buka Forum", "Forum öffnen")}
              </Button>
            </CardContent>
          </Card>

          {/* Teacher Student Mode */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigateToFeature('teacher-student')}>
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                <Users className="h-6 w-6 text-secondary-foreground" />
              </div>
              <CardTitle>
                {getText("Mode Guru & Siswa", "Lehrer- & Schülermodus")}
              </CardTitle>
              <CardDescription>
                {getText(
                  "Buat kelas, bagikan latihan, dan pantau progres siswa",
                  "Klassen erstellen, Übungen teilen und Schülerfortschritt verfolgen"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                {getText("Masuk Kelas", "Klasse betreten")}
              </Button>
            </CardContent>
          </Card>

          {/* Mini Quiz Game */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigateToFeature('mini-quiz')}>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <Gamepad2 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>
                {getText("Mini Quiz Game", "Mini-Quiz-Spiel")}
              </CardTitle>
              <CardDescription>
                {getText(
                  "Multiplayer quiz realtime dengan leaderboard seperti Kahoot",
                  "Multiplayer-Echtzeit-Quiz mit Bestenliste wie Kahoot"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full group-hover:bg-green-600 group-hover:text-white transition-colors">
                {getText("Main Sekarang", "Jetzt spielen")}
              </Button>
            </CardContent>
          </Card>

          {/* Stats Tracking */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigateToFeature('stats-tracking')}>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>
                {getText("Statistik & Tracking", "Statistik & Verfolgung")}
              </CardTitle>
              <CardDescription>
                {getText(
                  "Grafik progres harian/mingguan dan rekomendasi pembelajaran",
                  "Tägliche/wöchentliche Fortschrittsgrafiken und Lernempfehlungen"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {getText("Lihat Statistik", "Statistiken anzeigen")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Classes Section */}
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="mb-4">
              {getText("Jelajahi Course Kami", "Entdecken Sie unsere Kurse")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {getText(
                "Kami menyediakan course yang disesuaikan dengan tingkat kelas. Pilih kelas Anda dan mulai perjalanan belajar yang menarik.",
                "Wir bieten Kurse an, die auf das Klassenniveau zugeschnitten sind. Wählen Sie Ihre Klasse und beginnen Sie eine spannende Lernreise."
              )}
            </p>
          </div>
          
          <div className="flex gap-8">
            {/* Sidebar Filter */}
            <div className="hidden lg:block flex-shrink-0">
              <ClassFilter onFilterChange={handleFilterChange} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
              <Tabs defaultValue="a1" className="w-full">
                <div className="flex justify-center mb-8">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="a1">
                      {getText("Kelas A-1", "Klasse A-1")}
                    </TabsTrigger>
                    <TabsTrigger value="a2">
                      {getText("Kelas A-2", "Klasse A-2")}
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="a1">
                  <ClassSection 
                    className="A-1" 
                    courses={coursesA1} 
                    onCourseSelect={handleCourseSelect}
                  />
                </TabsContent>
                <TabsContent value="a2">
                  <ClassSection 
                    className="A-2" 
                    courses={language === 'de' ? coursesA2 : coursesA2.map(course => ({
                      ...course,
                      title: course.id === 'a2-1' ? 'Matematika Lanjutan' :
                             course.id === 'a2-2' ? 'Bahasa Inggris' :
                             'Sejarah Indonesia',
                      description: course.id === 'a2-1' ? 'Konsep matematika tingkat menengah dengan aplikasi praktis' :
                                  course.id === 'a2-2' ? 'Pelajari bahasa Inggris untuk komunikasi sehari-hari dan akademik' :
                                  'Memahami perjalanan sejarah bangsa Indonesia dari masa ke masa'
                    }))}
                    onCourseSelect={handleCourseSelect}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-muted/30 -mx-4 px-4 py-16 mt-20">
          <div className="container mx-auto">
            <FAQ />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-primary" />
                <span className="font-bold">EduPlatform</span>
              </div>
              <p className="text-muted-foreground text-sm">
                {getText(
                  "Platform pembelajaran online terbaik untuk siswa Indonesia",
                  "Die beste Online-Lernplattform für indonesische Studenten"
                )}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">
                {getText("Course", "Kurse")}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{getText("Kelas A-1", "Klasse A-1")}</li>
                <li>{getText("Kelas A-2", "Klasse A-2")}</li>
                <li>{getText("Course Gratis", "Kostenlose Kurse")}</li>
                <li>{getText("Sertifikasi", "Zertifizierung")}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">
                {getText("Dukungan", "Unterstützung")}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>FAQ</li>
                <li>{getText("Bantuan", "Hilfe")}</li>
                <li>{getText("Kontak", "Kontakt")}</li>
                <li>
                  <button 
                    onClick={() => navigateToFeature('forum')}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forum
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">
                {getText("Perusahaan", "Unternehmen")}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{getText("Tentang Kami", "Über uns")}</li>
                <li>{getText("Karir", "Karriere")}</li>
                <li>Blog</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground text-sm">
            <p>&copy; 2025 EduPlatform. {getText("Semua hak dilindungi.", "Alle Rechte vorbehalten.")}</p>
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