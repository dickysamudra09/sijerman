"use client";

import { Menu, LogOut, BookMarked } from "lucide-react";
import { motion } from "framer-motion";

interface MinimalTopBarProps {
  currentQuestion: number;
  totalQuestions: number;
  lessonTitle: string; // NEW: Lesson title to display
  onShowMenu: () => void;
  onExit: () => void;
  onShowSyllabus: () => void;
}

export function MinimalTopBar({
  currentQuestion,
  totalQuestions,
  lessonTitle,
  onShowMenu,
  onExit,
  onShowSyllabus,
}: MinimalTopBarProps) {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 h-14 px-4 flex items-center justify-between bg-white/90 backdrop-blur-lg border-b border-gray-200"
    >
      {/* Left: Menu button + Counter */}
      <div className="flex items-center gap-3">
        <button
          onClick={onShowMenu}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" style={{ color: '#1A1A1A' }} />
        </button>
        <span className="text-sm font-medium flex-shrink-0" style={{ color: '#6B7280' }}>
          {currentQuestion}/{totalQuestions}
        </span>
      </div>

      {/* Center: Lesson Title */}
      <div className="flex-1 px-3 flex items-center justify-center min-w-0">
        <h1 
          className="text-sm font-semibold truncate text-center max-w-[200px]"
          style={{ color: '#1A1A1A' }}
          title={lessonTitle}
        >
          {lessonTitle}
        </h1>
      </div>

      {/* Right: Syllabus + Exit */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onShowSyllabus}
          className="p-2 hover:bg-yellow-50 rounded-lg transition-colors"
          aria-label="Go to syllabus"
          title="Lihat silabus kursus"
        >
          <BookMarked className="h-5 w-5" style={{ color: '#E8B824' }} />
        </button>
        <button
          onClick={onExit}
          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
          aria-label="Exit course"
          title="Keluar dari kursus"
        >
          <LogOut className="h-5 w-5" style={{ color: '#DC2626' }} />
        </button>
      </div>
    </motion.header>
  );
}
