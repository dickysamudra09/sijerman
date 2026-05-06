/**
 * useTreeActions Hook
 * Tree node action handlers - wired to modal context and mutations
 * 
 * STEP 6 Part 3: Implemented reorder mutations with temp offset strategy
 */

'use client';

import { useModal, type ModalType } from '@/contexts/ModalContext';
import { supabase } from '@/lib/supabase';

export interface TreeActions {
  // Module actions
  onAddModule: () => void;
  onEditModule: (moduleId: string) => void;
  onDeleteModule: (moduleId: string) => void;
  onModuleSettings: (moduleId: string) => void;

  // Lesson actions
  onAddLesson: (moduleId: string) => void;
  onEditLesson: (lessonId: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onRenameLesson: (lessonId: string, newTitle: string) => void;

  // Exercise actions
  onAddExercise: (lessonId: string) => void;
  onEditExercise: (exerciseId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;

  // Material actions
  onAddMaterial: (moduleId: string) => void;
  onEditMaterial: (materialId: string) => void;
  onDeleteMaterial: (materialId: string) => void;

  // Reorder actions
  onReorderLessons: (moduleId: string, newOrder: string[]) => void;
  onReorderExercises: (lessonId: string, newOrder: string[]) => void;
  onReorderMaterials: (moduleId: string, newOrder: string[]) => void;
  onReorderModules: (courseId: string, newOrder: string[]) => void;
}

export function useTreeActions(courseId: string): TreeActions {
  const modal = useModal();

  const logAction = (action: string, ...args: any[]) => {
    console.log(`[TREE ACTION] ${action}`, ...args);
  };

  // STEP 6: Delete lesson with confirmation
  const deleteLesson = async (lessonId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pelajaran ini? Data tidak dapat dipulihkan.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("module_lessons")
        .delete()
        .eq("id", lessonId);

      if (error) throw error;
      console.log("Pelajaran berhasil dihapus");
      window.location.reload(); // Refresh to update list
    } catch (err: any) {
      console.error("Gagal menghapus pelajaran:", err.message);
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  // STEP 6: Delete exercise with confirmation
  const deleteExercise = async (exerciseId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus latihan ini? Data tidak dapat dipulihkan.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("exercise_sets")
        .delete()
        .eq("id", exerciseId);

      if (error) throw error;
      console.log("Latihan berhasil dihapus");
      window.location.reload(); // Refresh to update list
    } catch (err: any) {
      console.error("Gagal menghapus latihan:", err.message);
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  // STEP 6 Part 3: Reorder lessons with DB persistence
  const reorderLessons = async (lessonIds: string[]) => {
    try {
      const updates = lessonIds.map((id, idx) => ({
        id,
        order_index: idx,
      }));

      // Use temporary offset to avoid unique constraint violations
      const TEMP_OFFSET = 10000;

      // Step 1: Update all to temporary values
      for (const update of updates) {
        const { error } = await supabase
          .from("module_lessons")
          .update({ order_index: TEMP_OFFSET + update.order_index })
          .eq("id", update.id);

        if (error) throw error;
      }

      // Step 2: Update all to final values
      for (const update of updates) {
        const { error } = await supabase
          .from("module_lessons")
          .update({ order_index: update.order_index })
          .eq("id", update.id);

        if (error) throw error;
      }

      console.log("Urutan pelajaran berhasil diperbarui");
    } catch (err: any) {
      console.error("Gagal memperbarui urutan pelajaran:", err.message);
      alert(`Gagal memperbarui urutan: ${err.message}`);
    }
  };

  // STEP 6 Part 3: Reorder exercises with DB persistence
  const reorderExercises = async (exerciseIds: string[]) => {
    try {
      const updates = exerciseIds.map((id, idx) => ({
        id,
        order_index: idx,
      }));

      // Use temporary offset
      const TEMP_OFFSET = 10000;

      // Step 1: Update all to temporary values
      for (const update of updates) {
        const { error } = await supabase
          .from("exercise_sets")
          .update({ order_index: TEMP_OFFSET + update.order_index })
          .eq("id", update.id);

        if (error) throw error;
      }

      // Step 2: Update all to final values
      for (const update of updates) {
        const { error } = await supabase
          .from("exercise_sets")
          .update({ order_index: update.order_index })
          .eq("id", update.id);

        if (error) throw error;
      }

      console.log("Urutan latihan berhasil diperbarui");
    } catch (err: any) {
      console.error("Gagal memperbarui urutan latihan:", err.message);
      alert(`Gagal memperbarui urutan: ${err.message}`);
    }
  };

  // STEP 6 Part 3: Reorder materials with DB persistence
  const reorderMaterials = async (materialIds: string[]) => {
    try {
      const updates = materialIds.map((id, idx) => ({
        id,
        order_index: idx,
      }));

      // Use temporary offset
      const TEMP_OFFSET = 10000;

      // Step 1: Update all to temporary values
      for (const update of updates) {
        const { error } = await supabase
          .from("module_materials")
          .update({ order_index: TEMP_OFFSET + update.order_index })
          .eq("id", update.id);

        if (error) throw error;
      }

      // Step 2: Update all to final values
      for (const update of updates) {
        const { error } = await supabase
          .from("module_materials")
          .update({ order_index: update.order_index })
          .eq("id", update.id);

        if (error) throw error;
      }

      console.log("Urutan bahan berhasil diperbarui");
    } catch (err: any) {
      console.error("Gagal memperbarui urutan bahan:", err.message);
      alert(`Gagal memperbarui urutan: ${err.message}`);
    }
  };

  // STEP 6 Part 3: Reorder modules with DB persistence
  const reorderModules = async (moduleIds: string[]) => {
    try {
      const updates = moduleIds.map((id, idx) => ({
        id,
        order_index: idx,
      }));

      // Use temporary offset
      const TEMP_OFFSET = 10000;

      // Step 1: Update all to temporary values
      for (const update of updates) {
        const { error } = await supabase
          .from("course_modules")
          .update({ order_index: TEMP_OFFSET + update.order_index })
          .eq("id", update.id);

        if (error) throw error;
      }

      // Step 2: Update all to final values
      for (const update of updates) {
        const { error } = await supabase
          .from("course_modules")
          .update({ order_index: update.order_index })
          .eq("id", update.id);

        if (error) throw error;
      }

      console.log("Urutan modul berhasil diperbarui");
    } catch (err: any) {
      console.error("Gagal memperbarui urutan modul:", err.message);
      alert(`Gagal memperbarui urutan: ${err.message}`);
    }
  };

  return {
    // Module actions
    onAddModule: () => {
      logAction('ADD_MODULE');
      modal.openModal('module', 'create');
    },

    onEditModule: (moduleId: string) => {
      logAction('EDIT_MODULE', moduleId);
      modal.openModal('module', 'edit', { id: moduleId });
    },

    onDeleteModule: (moduleId: string) => {
      logAction('DELETE_MODULE', moduleId);
      // TODO: Show confirmation, then delete
    },

    onModuleSettings: (moduleId: string) => {
      logAction('MODULE_SETTINGS', moduleId);
      // TODO: Show module settings modal
    },

    // Lesson actions
    onAddLesson: (moduleId: string) => {
      logAction('ADD_LESSON', moduleId);
      modal.openModal('lesson', 'create', { moduleId });
    },

    onEditLesson: (lessonId: string) => {
      logAction('EDIT_LESSON', lessonId);
      modal.openModal('lesson', 'edit', { id: lessonId });
    },

    onDeleteLesson: (lessonId: string) => {
      logAction('DELETE_LESSON', lessonId);
      deleteLesson(lessonId);
    },

    onRenameLesson: (lessonId: string, newTitle: string) => {
      logAction('RENAME_LESSON', lessonId, newTitle);
      // TODO: Quick inline update to DB
    },

    // Exercise actions
    onAddExercise: (lessonId: string) => {
      logAction('ADD_EXERCISE', lessonId);
      modal.openModal('exercise', 'create', { lessonId });
    },

    onEditExercise: (exerciseId: string) => {
      logAction('EDIT_EXERCISE', exerciseId);
      modal.openModal('exercise', 'edit', { id: exerciseId });
    },

    onDeleteExercise: (exerciseId: string) => {
      logAction('DELETE_EXERCISE', exerciseId);
      deleteExercise(exerciseId);
    },

    // Material actions
    onAddMaterial: (moduleId: string) => {
      logAction('ADD_MATERIAL', moduleId);
      modal.openModal('material', 'create', { moduleId });
    },

    onEditMaterial: (materialId: string) => {
      logAction('EDIT_MATERIAL', materialId);
      modal.openModal('material', 'edit', { id: materialId });
    },

    onDeleteMaterial: (materialId: string) => {
      logAction('DELETE_MATERIAL', materialId);
      // TODO: Show confirmation, then delete
    },

    // Reorder actions
    onReorderLessons: (moduleId: string, newOrder: string[]) => {
      logAction('REORDER_LESSONS', moduleId, newOrder);
      reorderLessons(newOrder);
    },

    onReorderExercises: (lessonId: string, newOrder: string[]) => {
      logAction('REORDER_EXERCISES', lessonId, newOrder);
      reorderExercises(newOrder);
    },

    onReorderMaterials: (moduleId: string, newOrder: string[]) => {
      logAction('REORDER_MATERIALS', moduleId, newOrder);
      reorderMaterials(newOrder);
    },

    onReorderModules: (courseId: string, newOrder: string[]) => {
      logAction('REORDER_MODULES', courseId, newOrder);
      reorderModules(newOrder);
    },
  };
}
