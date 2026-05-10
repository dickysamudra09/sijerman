/**
 * Tree Structure Types for Course Authoring
 * Defines hierarchical node types for modules, lessons, exercises, and materials
 */

export type TreeNodeType =
  | 'module'
  | 'lesson-section'
  | 'lesson'
  | 'exercise-section'
  | 'exercise'
  | 'material-section'
  | 'material';

export interface BaseTreeNode {
  id: string;
  type: TreeNodeType;
  title: string;
  order_index?: number;
  data?: Record<string, any>;
  children?: TreeNode[];
}

export interface ModuleNode extends BaseTreeNode {
  type: 'module';
  children: (LessonSectionNode | MaterialSectionNode)[];
  data: {
    description?: string;
    is_active: boolean;
  };
}

export interface LessonSectionNode extends BaseTreeNode {
  type: 'lesson-section';
  title: 'LESSONS';
  children: LessonNode[];
  data: {
    count: number;
  };
}

export interface LessonNode extends BaseTreeNode {
  type: 'lesson';
  children: ExerciseSectionNode[];
  data: {
    description?: string;
    lesson_type: 'explanation' | 'vocabulary' | 'dialogue' | 'reading' | 'listening';
    content?: string;
  };
}

export interface ExerciseSectionNode extends BaseTreeNode {
  type: 'exercise-section';
  title: 'EXERCISES';
  children: ExerciseNode[];
  data: {
    count: number;
  };
}

export interface ExerciseNode extends BaseTreeNode {
  type: 'exercise';
  children?: never;
  data: {
    description?: string;
    question_count: number;
    exercise_type: 'mcq' | 'essay' | 'puzzle';
  };
}

export interface MaterialSectionNode extends BaseTreeNode {
  type: 'material-section';
  title: 'MATERIALS';
  children: MaterialNode[];
  data: {
    count: number;
  };
}

export interface MaterialNode extends BaseTreeNode {
  type: 'material';
  children?: never;
  data: {
    description?: string;
    material_type: 'video' | 'audio' | 'pdf' | 'image' | 'resource';
    source_type: 'upload' | 'youtube_link' | 'external_link';
    duration_seconds?: number;
    file_size_mb?: number;
  };
}

export type TreeNode =
  | ModuleNode
  | LessonSectionNode
  | LessonNode
  | ExerciseSectionNode
  | ExerciseNode
  | MaterialSectionNode
  | MaterialNode;

// Structured AI Feedback Interface (Narrative Format)
export interface StructuredAIFeedback {
  correct: boolean;
  verdict: string; // 30-40 words: motivational message
  userAnswer: string;
  correctAnswer: string;
  explanation: string | null; // 50-70 words: reason + evidence + trick in narrative (null if correct)
  tips: string; // 40-50 words: actionable advice
}

// Exercise Retry System Interfaces
export interface ExerciseAttempt {
  id: string;
  user_id: string;
  course_exercise_id: string;
  lesson_id: string;
  attempt_number: number;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  is_completed: boolean;
  is_passed: boolean;
  is_best_attempt: boolean;
  started_at: string;
  completed_at?: string;
  time_spent_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface ExerciseHistory {
  exercise_id: string;
  exercise_title: string;
  attempts: ExerciseAttempt[];
  best_attempt?: ExerciseAttempt;
  total_attempts: number;
  has_passed_once: boolean;
  can_retry: boolean; // always true for unlimited retries
}

export interface ExerciseAttemptSummary {
  has_attempts: boolean;
  is_passed: boolean;
  best_score: number;
  total_attempts: number;
  last_attempt_date?: string;
  can_retry: boolean;
}
