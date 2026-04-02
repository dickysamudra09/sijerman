"use client";

import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/AuthDialog";
import { ArrowRight, BookOpen, Users, Award } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

interface HeroSectionProps {
  language?: 'id' | 'de';
}

export function HeroSection({ language = 'id' }: HeroSectionProps) {
  const getText = (id: string, de: string) => {
    return language === 'de' ? de : id;
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
      {/* Background animated character */}
      <div className="absolute inset-0 z-0">
        <div className="absolute right-10 top-10 animate-bounce">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-blue-600" />
          </div>
        </div>
        <div className="absolute left-20 bottom-20 animate-pulse">
          <div className="w-24 h-24 bg-gradient-to-br from-green-200 to-blue-200 rounded-full flex items-center justify-center">
            <Award className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <div className="absolute right-1/4 bottom-32 animate-bounce delay-500">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full flex items-center justify-center">
            <Users className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        
        {/* Main character illustration */}
        <div className="absolute right-1/4 top-1/2 transform -translate-y-1/2 animate-float">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=300&h=400&fit=crop&crop=face"
            alt="Learning character"
            className="w-48 h-60 object-cover rounded-2xl shadow-2xl"
          />
        </div>
        
        {/* Floating elements */}
        <div className="absolute left-10 top-1/3 animate-float delay-1000">
          <div className="w-8 h-8 bg-pink-300 rounded-full opacity-60"></div>
        </div>
        <div className="absolute right-16 top-2/3 animate-float delay-700">
          <div className="w-6 h-6 bg-blue-300 rounded-full opacity-60"></div>
        </div>
        <div className="absolute left-1/3 bottom-1/4 animate-float delay-300">
          <div className="w-10 h-10 bg-purple-300 rounded-full opacity-60"></div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {getText(
                  "Belajar Jadi Lebih Mudah & Menyenangkan",
                  "Lernen wird einfacher & macht mehr Spaß"
                )}
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl">
                {getText(
                  "Platform pembelajaran online terbaik untuk siswa kelas A-1 dan A-2. Dengan materi berkualitas, metode interaktif, dan dukungan tutor profesional.",
                  "Die beste Online-Lernplattform für Schüler der Klassen A-1 und A-2. Mit hochwertigen Materialien, interaktiven Methoden und professioneller Betreuung."
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <AuthDialog>
                <Button size="lg" className="group">
                  {getText("Mulai Belajar Sekarang", "Jetzt mit dem Lernen beginnen")}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </AuthDialog>
              <Button size="lg" variant="outline">
                {getText("Lihat Course Gratis", "Kostenlose Kurse ansehen")}
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">500+</div>
                <div className="text-sm text-muted-foreground">
                  {getText("Siswa Aktif", "Aktive Schüler")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">20+</div>
                <div className="text-sm text-muted-foreground">
                  {getText("Course Tersedia", "Verfügbare Kurse")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">4.8★</div>
                <div className="text-sm text-muted-foreground">
                  {getText("Rating Siswa", "Schülerbewertung")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}