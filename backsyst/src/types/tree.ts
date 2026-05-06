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
