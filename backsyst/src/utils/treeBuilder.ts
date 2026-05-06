/**
 * Tree Builder Utility
 * Transforms flat database records into hierarchical tree structure
 */

import {
  ModuleNode,
  LessonSectionNode,
  LessonNode,
  ExerciseSectionNode,
  ExerciseNode,
  MaterialSectionNode,
  MaterialNode,
} from '@/types/tree';

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  is_active: boolean;
}

interface ModuleLesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  content?: string;
  lesson_type: 'explanation' | 'vocabulary' | 'dialogue' | 'reading' | 'listening';
  order_index: number;
}

interface ModuleMaterial {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  material_type: 'video' | 'audio' | 'pdf' | 'image' | 'resource';
  source_type: 'upload' | 'youtube_link' | 'external_link';
  duration_seconds: number | null;
  file_size_mb: number | null;
  order_index: number;
}

interface Exercise {
  id: string;
  lesson_id: string;
  title?: string;
  description?: string;
  question_count: number;
  order_index: number;
}

/**
 * Builds hierarchical tree from flat database records
 * 
 * Structure:
 * Module
 * ├─ LESSONS (section header)
 * │  ├─ Lesson
 * │  │  ├─ EXERCISES (section header)
 * │  │  │  ├─ Exercise
 * │  │  │  └─ Exercise
 * │  └─ Lesson
 * └─ MATERIALS (section header)
 *    ├─ Material
 *    └─ Material
 */
export function buildCourseTree(
  modules: CourseModule[],
  lessons: Record<string, ModuleLesson[]> = {},
  materials: Record<string, ModuleMaterial[]> = {},
  exercises: Record<string, Exercise[]> = {}
): ModuleNode[] {
  return modules.map(module => {
    const moduleLessons = (lessons[module.id] || []).sort((a, b) => a.order_index - b.order_index);
    const moduleMaterials = (materials[module.id] || []).sort((a, b) => a.order_index - b.order_index);

    // Build lesson nodes with nested exercises
    const lessonNodes: LessonNode[] = moduleLessons.map(lesson => {
      const lessonExercises = (exercises[lesson.id] || []).sort((a, b) => a.order_index - b.order_index);

      const exerciseNodes: ExerciseNode[] = lessonExercises.map(exercise => ({
        id: exercise.id,
        type: 'exercise',
        title: exercise.title || `Exercise ${exercise.order_index + 1}`,
        order_index: exercise.order_index,
        data: {
          description: exercise.description,
          question_count: exercise.question_count || 0,
          exercise_type: 'mcq' as const,
        },
      }));

      return {
        id: lesson.id,
        type: 'lesson',
        title: lesson.title,
        order_index: lesson.order_index,
        data: {
          description: lesson.description,
          lesson_type: lesson.lesson_type,
          content: lesson.content,
        },
        children: [
          {
            id: `exercise-section-${lesson.id}`,
            type: 'exercise-section' as const,
            title: 'EXERCISES',
            order_index: 0,
            data: {
              count: exerciseNodes.length,
            },
            children: exerciseNodes,
          } as ExerciseSectionNode,
        ],
      };
    });

    // Build material nodes
    const materialNodes: MaterialNode[] = moduleMaterials.map(material => ({
      id: material.id,
      type: 'material',
      title: material.title,
      order_index: material.order_index,
      data: {
        description: material.description ?? undefined,
        material_type: material.material_type,
        source_type: material.source_type,
        duration_seconds: material.duration_seconds ?? undefined,
        file_size_mb: material.file_size_mb ?? undefined,
      },
    }));

    // Combine into module
    return {
      id: module.id,
      type: 'module',
      title: module.title,
      order_index: module.order_index,
      data: {
        description: module.description,
        is_active: module.is_active,
      },
      children: [
        {
          id: `lesson-section-${module.id}`,
          type: 'lesson-section' as const,
          title: 'LESSONS',
          order_index: 0,
          data: { count: lessonNodes.length },
          children: lessonNodes,
        } as LessonSectionNode,

        {
          id: `material-section-${module.id}`,
          type: 'material-section' as const,
          title: 'MATERIALS',
          order_index: 1,
          data: { count: materialNodes.length },
          children: materialNodes,
        } as MaterialSectionNode,
      ],
    };
  });
}
