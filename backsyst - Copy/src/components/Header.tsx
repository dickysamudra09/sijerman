"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AuthDialog } from "@/components/AuthDialog";
import { GraduationCap, User, Search, Moon, Sun, Globe } from "lucide-react";

interface HeaderProps {
  isDarkMode?: boolean;
  onDarkModeToggle?: (isDark: boolean) => void;
  language?: 'id' | 'de';
  onLanguageToggle?: () => void;
}

export function Header({ 
  isDarkMode = false, 
  onDarkModeToggle, 
  language = 'id', 
  onLanguageToggle 
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const getText = (id: string, de: string) => {
    return language === 'de' ? de : id;
  };

  return (
    <header className="border-b bg-white/95 dark:bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">EduPlatform</h1>
              <p className="text-sm text-muted-foreground">
                {getText("Belajar tanpa batas", "Lernen ohne Grenzen")}
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 flex-1 max-w-md mx-8">
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

          <div className="flex items-center gap-4">
            {/* Language Toggle */}
            {onLanguageToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLanguageToggle}
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                {language.toUpperCase()}
              </Button>
            )}

            {/* Dark Mode Toggle */}
            {onDarkModeToggle && (
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={onDarkModeToggle}
                />
                <Moon className="h-4 w-4" />
              </div>
            )}

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
        </div>
      </div>
    </header>
  );
}