"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";

interface MobileExerciseViewProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  questionType: "multiple_choice" | "true_false" | "essay";
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
  selectedAnswer: string | null;
  onSelectAnswer: (answerId: string) => void;
  onSubmit: () => void;
  isSubmitted: boolean;
  isCorrect: boolean | null;
  isLoading: boolean;
  children?: React.ReactNode; // For AI Feedback
}

export function MobileExerciseView({
  questionNumber,
  totalQuestions,
  questionText,
  questionType,
  options = [],
  selectedAnswer,
  onSelectAnswer,
  onSubmit,
  isSubmitted,
  isCorrect,
  isLoading,
  children,
}: MobileExerciseViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Question Section - Flat, no card */}
      <section className="px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Question Header */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium" style={{ color: '#6B7280' }}>
              ❓ Soal {questionNumber} dari {totalQuestions}
            </span>
          </div>

          {/* Question Text */}
          <h3 
            className="text-xl font-bold mb-6" 
            style={{ color: '#1A1A1A', lineHeight: '1.6' }}
          >
            {questionText}
          </h3>

          {/* Answer Options */}
          {questionType === "true_false" && (
            <div className="space-y-3">
              <AnswerButton
                text="✓ Richtig (R)"
                value="true"
                isSelected={selectedAnswer === "true"}
                isCorrect={isSubmitted && isCorrect === true && selectedAnswer === "true"}
                isWrong={isSubmitted && isCorrect === false && selectedAnswer === "true"}
                onClick={() => onSelectAnswer("true")}
                disabled={isSubmitted}
                color="green"
              />
              <AnswerButton
                text="✗ Falsch (F)"
                value="false"
                isSelected={selectedAnswer === "false"}
                isCorrect={isSubmitted && isCorrect === true && selectedAnswer === "false"}
                isWrong={isSubmitted && isCorrect === false && selectedAnswer === "false"}
                onClick={() => onSelectAnswer("false")}
                disabled={isSubmitted}
                color="red"
              />
            </div>
          )}

          {questionType === "multiple_choice" && (
            <div className="space-y-3">
              {options.map((option, index) => {
                const letter = String.fromCharCode(65 + index); // A, B, C, D
                return (
                  <AnswerButton
                    key={option.id}
                    text={`${letter}) ${option.text}`}
                    value={option.id}
                    isSelected={selectedAnswer === option.id}
                    isCorrect={isSubmitted && option.isCorrect && selectedAnswer === option.id}
                    isWrong={isSubmitted && !option.isCorrect && selectedAnswer === option.id}
                    onClick={() => onSelectAnswer(option.id)}
                    disabled={isSubmitted}
                    color="blue"
                  />
                );
              })}
            </div>
          )}

          {/* Submit Button */}
          {!isSubmitted && selectedAnswer && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSubmit}
              disabled={isLoading}
              className="w-full mt-6 py-4 rounded-xl font-bold text-white shadow-lg transition-all"
              style={{
                background: 'linear-gradient(135deg, #E8B824 0%, #F5C518 100%)',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  >
                    ⏳
                  </motion.div>
                  Memproses...
                </span>
              ) : (
                'Submit Jawaban 🚀'
              )}
            </motion.button>
          )}
        </motion.div>
      </section>

      {/* Feedback Section - Flat, no card */}
      {isSubmitted && children && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

// Answer Button Component
interface AnswerButtonProps {
  text: string;
  value: string;
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  onClick: () => void;
  disabled: boolean;
  color: 'green' | 'red' | 'blue';
}

function AnswerButton({
  text,
  isSelected,
  isCorrect,
  isWrong,
  onClick,
  disabled,
  color,
}: AnswerButtonProps) {
  const getColors = () => {
    if (isCorrect) {
      return {
        bg: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
        border: '#16A34A',
        text: '#FFFFFF',
      };
    }
    if (isWrong) {
      return {
        bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        border: '#DC2626',
        text: '#FFFFFF',
      };
    }
    if (isSelected) {
      return {
        bg: color === 'green' 
          ? 'linear-gradient(135deg, #86EFAC 0%, #4ADE80 100%)'
          : color === 'red'
          ? 'linear-gradient(135deg, #FCA5A5 0%, #F87171 100%)'
          : 'linear-gradient(135deg, #93C5FD 0%, #60A5FA 100%)',
        border: color === 'green' ? '#22C55E' : color === 'red' ? '#EF4444' : '#3B82F6',
        text: '#1A1A1A',
      };
    }
    return {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      text: '#1A1A1A',
    };
  };

  const colors = getColors();

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      className="w-full py-4 px-6 rounded-xl font-medium text-left transition-all"
      style={{
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        color: colors.text,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <div className="flex items-center justify-between">
        <span>{text}</span>
        {isCorrect && <CheckCircle className="h-5 w-5" />}
        {isWrong && <XCircle className="h-5 w-5" />}
      </div>
    </motion.button>
  );
}
