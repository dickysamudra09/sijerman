"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle, Lock, LogOut } from "lucide-react";
import { MinimalTopBar } from "./MinimalTopBar";
import { CollapsibleTextSection } from "./CollapsibleTextSection";
import ExerciseHistoryCard from "./ExerciseHistoryCard";

interface Lesson {
  id: string;
  title: string;
  isCompleted: boolean;
  isLocked: boolean; // NEW: Lock status
}

interface ImmersiveCourseViewProps {
  courseId: string;
  lessonTitle: string;
  lessonContent: string;
  currentQuestionNumber: number;
  totalQuestions: number;
  overallProgress: number;
  lessons: Lesson[];
  currentLessonIndex: number;
  onSelectLesson: (index: number) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onComplete?: () => void; // Callback when completing the last lesson
  hasNext?: boolean;
  hasPrevious?: boolean;
  children: React.ReactNode;
  allExercisesCompleted?: boolean;
  hasExercises?: boolean; // If false, don't lock navigation
  // NEW: Exercise retry system props
  exerciseId?: string;
  exerciseTitle?: string;
  userId?: string;
  onStartExercise?: () => void;
  isStartingExercise?: boolean; // NEW: Loading state when starting exercise
  currentAttemptId?: string | null; // NEW: Current attempt ID to hide history card
  hasHistoryCard?: boolean; // NEW: Lock navigation when history card shows
  exerciseIsPassed?: boolean; // ✨ NEW: If true, unlock navigation even with history card
}

export function ImmersiveCourseView({
  courseId,
  lessonTitle,
  lessonContent,
  currentQuestionNumber,
  totalQuestions,
  overallProgress,
  lessons,
  currentLessonIndex,
  onSelectLesson,
  onNext,
  onPrevious,
  onComplete, // NEW: Callback for completing last lesson
  hasNext = false,
  hasPrevious = false,
  allExercisesCompleted = false,
  hasExercises = false, // Default to false (unlocked by default)
  // NEW: Exercise retry system props
  exerciseId,
  exerciseTitle,
  userId,
  onStartExercise,
  isStartingExercise = false, // NEW: Loading state
  currentAttemptId = null, // NEW: Current attempt ID
  hasHistoryCard = false, // NEW: Lock navigation when history card shows
  exerciseIsPassed = false, // ✨ NEW: If true, unlock navigation even with history card
  children,
}: ImmersiveCourseViewProps) {
  const router = useRouter();
  const [showTextModal, setShowTextModal] = useState(false);
  const [showLessonMenu, setShowLessonMenu] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false); // ✨ NEW: Exit confirmation modal

  // NEW: Block body scroll when menu is open
  useEffect(() => {
    if (showLessonMenu || showTextModal || showExitModal) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showLessonMenu, showTextModal, showExitModal]);

  const handleExit = () => {
    setShowExitModal(true); // ✨ NEW: Show confirmation modal instead of direct exit
  };
  
  const confirmExit = () => {
    setShowExitModal(false);
    router.push('/open-courses'); // Navigate back to course list
  };
  
  const cancelExit = () => {
    setShowExitModal(false);
  };

  const handleShowText = () => {
    setShowTextModal(true);
  };

  const handleShowMenu = () => {
    setShowLessonMenu(true);
  };
  
  const handleGoToSyllabus = () => {
    router.push(`/open-courses/${courseId}/syllabus`);
  };

  const handleSelectLesson = (index: number) => {
    const lesson = lessons[index];
    
    // Check if lesson is locked
    if (lesson.isLocked) {
      return; // Don't allow selection
    }
    
    onSelectLesson(index);
    setShowLessonMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Minimal Top Bar with Progress */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200">
        <MinimalTopBar
          currentQuestion={currentQuestionNumber}
          totalQuestions={totalQuestions}
          lessonTitle={lessonTitle}
          onShowMenu={handleShowMenu}
          onExit={handleExit}
          onShowSyllabus={handleGoToSyllabus}
        />
        
        {/* Progress Bar - Clean with percentage */}
        <div className="px-4 md:px-8 pt-2 pb-3 flex items-center gap-3 max-w-7xl mx-auto">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{
                background: overallProgress === 100 
                  ? 'linear-gradient(90deg, #16A34A 0%, #22C55E 100%)'
                  : 'linear-gradient(90deg, #E8B824 0%, #F5C518 100%)',
              }}
            />
          </div>
          <span className="text-xs md:text-sm font-bold" style={{ color: '#E8B824', minWidth: '32px', textAlign: 'right' }}>
            {overallProgress}%
          </span>
        </div>
      </div>

      {/* Main Content - Scrollable with max-width container */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Collapsible Text Section */}
          {lessonContent && (
            <CollapsibleTextSection
              title={lessonTitle}
              content={lessonContent}
              defaultExpanded={currentQuestionNumber === 1}
            />
          )}

          {/* Exercise History Card - Show only if we have exercise data AND no active attempt */}
          {exerciseId && exerciseTitle && userId && onStartExercise && !currentAttemptId && (
            <ExerciseHistoryCard
              exerciseId={exerciseId}
              exerciseTitle={exerciseTitle}
              userId={userId}
              onStartExercise={onStartExercise}
              isStarting={isStartingExercise} // ✨ NEW: Pass loading state
              className="my-6"
            />
          )}

          {/* Divider - Only show if we have both content and exercises */}
          {lessonContent && exerciseId && (
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6" />
          )}

          {/* Exercise Content */}
          <div>
            {children}
          </div>
        </div>
      </main>

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 pb-safe">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-4 flex items-center gap-3 md:gap-4">
          {hasPrevious ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onPrevious}
              disabled={((hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed))}
              className="flex-1 py-3 md:py-3.5 px-4 md:px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: ((hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed)) ? '#F9FAFB' : '#F3F4F6',
                color: ((hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed)) ? '#D1D5DB' : '#1A1A1A',
                border: '2px solid #E5E7EB',
                cursor: ((hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed)) ? 'not-allowed' : 'pointer',
                opacity: ((hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed)) ? 0.5 : 1,
              }}
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              <span className="text-sm md:text-base">Sebelumnya</span>
            </motion.button>
          ) : (
            <div className="flex-1" />
          )}

          {hasNext ? (
            <motion.button
              whileTap={((hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed)) ? {} : { scale: 0.95 }}
              onClick={((hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed)) ? undefined : onNext}
              disabled={(hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed)}
              className="flex-1 py-3 md:py-3.5 px-4 md:px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg relative hover:shadow-xl"
              style={{
                background: ((hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed))
                  ? 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)'
                  : 'linear-gradient(135deg, #E8B824 0%, #F5C518 100%)',
                color: ((hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed)) ? '#9CA3AF' : '#1A1A1A',
                cursor: ((hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed)) ? 'not-allowed' : 'pointer',
              }}
            >
              {((hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed)) && (
                <Lock className="h-4 w-4 md:h-5 md:w-5" />
              )}
              <span className="text-sm md:text-base">
                {(hasHistoryCard && !exerciseIsPassed) ? 'Mulai Latihan Dulu' : 
                 (hasExercises && !allExercisesCompleted) ? 'Selesaikan Soal' : 'Selanjutnya'}
              </span>
              {(!hasExercises || allExercisesCompleted) && (!hasHistoryCard || exerciseIsPassed) && <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />}
            </motion.button>
          ) : (
            <motion.button
              whileTap={((hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed)) ? {} : { scale: 0.95 }}
              onClick={((hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed)) ? undefined : () => {
                // Mark last lesson as completed before exiting
                if (onComplete) {
                  onComplete();
                }
                router.push('/open-courses');
              }}
              disabled={(hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed)}
              className="flex-1 py-3 md:py-3.5 px-4 md:px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg relative hover:shadow-xl"
              style={{
                background: ((hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed))
                  ? 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)'
                  : 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
                color: ((hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed)) ? '#9CA3AF' : '#FFFFFF',
                cursor: ((hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed)) ? 'not-allowed' : 'pointer',
              }}
            >
              {((hasExercises && !allExercisesCompleted) || (hasHistoryCard && !exerciseIsPassed)) && (
                <Lock className="h-4 w-4 md:h-5 md:w-5" />
              )}
              <span className="text-sm md:text-base">
                {(hasHistoryCard && !exerciseIsPassed) ? 'Mulai Latihan Dulu' :
                 (hasExercises && !allExercisesCompleted) ? 'Selesaikan Soal' : 'Selesai! 🎉'}
              </span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Lesson Menu Bottom Sheet */}
      <AnimatePresence>
        {showLessonMenu && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setShowLessonMenu(false)}
              style={{ touchAction: 'none' }}
            />

            {/* Bottom Sheet - Centered on Desktop */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 md:px-0"
              style={{ touchAction: 'pan-y' }}
            >
              <div className="w-full max-w-full md:max-w-4xl bg-white rounded-t-3xl max-h-[70vh] md:max-h-[65vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl flex-shrink-0">
                  <h3 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
                    📚 Daftar Pelajaran
                  </h3>
                  <button
                    onClick={() => setShowLessonMenu(false)}
                    className="text-2xl text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Lesson List - Scrollable */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ overscrollBehavior: 'contain' }}>
                {lessons.map((lesson, index) => {
                  const isLocked = lesson.isLocked;
                  const isCurrent = index === currentLessonIndex;
                  const isCompleted = lesson.isCompleted;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => handleSelectLesson(index)}
                      disabled={isLocked}
                      className="w-full p-4 rounded-xl text-left transition-all flex items-center justify-between hover:scale-[1.01] active:scale-[0.99]"
                      style={{
                        backgroundColor: isCurrent ? '#FFF9E6' : isLocked ? '#F9FAFB' : '#FFFFFF',
                        border: `2px solid ${isCurrent ? '#E8B824' : isLocked ? '#E5E7EB' : '#E5E7EB'}`,
                        opacity: isLocked ? 0.6 : 1,
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
                            Pelajaran {index + 1}
                          </span>
                          {isCompleted && (
                            <CheckCircle className="h-4 w-4" style={{ color: '#16A34A' }} />
                          )}
                          {isLocked && (
                            <Lock className="h-4 w-4" style={{ color: '#9CA3AF' }} />
                          )}
                        </div>
                        <p className="font-medium text-sm md:text-base" style={{ color: isLocked ? '#9CA3AF' : '#1A1A1A' }}>
                          {lesson.title}
                        </p>
                        {isLocked && (
                          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                            🔒 Selesaikan pelajaran sebelumnya dulu
                          </p>
                        )}
                      </div>
                      {isCurrent && !isLocked && (
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#E8B824' }} />
                      )}
                    </button>
                  );
                })}
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Text Modal */}
      {showTextModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end"
          onClick={() => setShowTextModal(false)}
          style={{ touchAction: 'none' }}
        >
          <div
            className="w-full bg-white rounded-t-3xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ touchAction: 'pan-y' }}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl flex-shrink-0">
              <h3 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
                📖 {lessonTitle}
              </h3>
              <button
                onClick={() => setShowTextModal(false)}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6" style={{ overscrollBehavior: 'contain' }}>
              <div
                className="prose prose-sm max-w-none"
                style={{ color: '#374151', lineHeight: '1.8' }}
                dangerouslySetInnerHTML={{ __html: lessonContent }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ✨ NEW: Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitModal && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={cancelExit}
              style={{ touchAction: 'none' }}
            />

            {/* Modal - Centered */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              style={{ touchAction: 'none' }}
            >
              <div 
                className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#FEF3C7' }}
                    >
                      <LogOut className="h-6 w-6" style={{ color: '#D97706' }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
                        Keluar dari Kursus?
                      </h3>
                      <p className="text-sm" style={{ color: '#6B7280' }}>
                        Progress kamu akan tersimpan
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                  <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }}>
                    Kamu yakin ingin keluar dari kursus ini? Semua progress yang sudah kamu kerjakan akan tersimpan dan bisa dilanjutkan kapan saja.
                  </p>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-3">
                  <button
                    onClick={cancelExit}
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      backgroundColor: '#F3F4F6',
                      color: '#1A1A1A',
                      border: '2px solid #E5E7EB',
                    }}
                  >
                    Batal
                  </button>
                  <button
                    onClick={confirmExit}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md"
                    style={{
                      background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
                      color: '#FFFFFF',
                    }}
                  >
                    Ya, Keluar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

