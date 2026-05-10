import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Lazy initialization to avoid build-time errors
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/exercise-attempts?exerciseId=xxx&userId=xxx - Get exercise history
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('exerciseId');
    const userId = searchParams.get('userId');

    if (!exerciseId || !userId) {
      return Response.json(
        { error: 'Missing exerciseId or userId' },
        { status: 400 }
      );
    }

    // Get all attempts for this exercise
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from('course_exercise_attempts')
      .select('*')
      .eq('course_exercise_id', exerciseId)
      .eq('user_id', userId)
      .order('attempt_number', { ascending: false });

    if (attemptsError) {
      console.error('Error fetching attempts:', attemptsError);
      return Response.json(
        { error: 'Failed to fetch exercise history' },
        { status: 500 }
      );
    }

    // Get exercise details
    const { data: exercise, error: exerciseError } = await supabaseAdmin
      .from('course_exercises')
      .select('id, title')
      .eq('id', exerciseId)
      .single();

    if (exerciseError) {
      console.error('Error fetching exercise:', exerciseError);
      return Response.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    const bestAttempt = attempts?.find(attempt => attempt.is_best_attempt);
    const hasPassedOnce = attempts?.some(attempt => attempt.is_passed) || false;

    const history = {
      exercise_id: exerciseId,
      exercise_title: exercise.title,
      attempts: attempts || [],
      best_attempt: bestAttempt,
      total_attempts: attempts?.length || 0,
      has_passed_once: hasPassedOnce,
      can_retry: true // unlimited retries
    };

    return Response.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('GET /api/exercise-attempts error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/exercise-attempts - Start new attempt
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { userId, courseExerciseId, lessonId } = body;

    if (!userId || !courseExerciseId || !lessonId) {
      return Response.json(
        { error: 'Missing required fields: userId, courseExerciseId, lessonId' },
        { status: 400 }
      );
    }

    // Get next attempt number
    const { data: nextAttemptResult } = await supabaseAdmin
      .rpc('get_next_attempt_number', {
        p_user_id: userId,
        p_course_exercise_id: courseExerciseId
      });

    const nextAttemptNumber = nextAttemptResult || 1;

    // Get exercise details to calculate max possible score
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('course_questions')
      .select('points')
      .eq('exercise_id', courseExerciseId); // ✨ FIX: Use 'exercise_id' not 'course_exercise_id'

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return Response.json(
        { error: 'Failed to fetch exercise questions' },
        { status: 500 }
      );
    }

    const maxPossibleScore = questions?.reduce((sum, q) => sum + (q.points || 10), 0) || 0;

    // Create new attempt
    const { data: newAttempt, error: createError } = await supabaseAdmin
      .from('course_exercise_attempts')
      .insert([{
        user_id: userId,
        course_exercise_id: courseExerciseId,
        lesson_id: lessonId,
        attempt_number: nextAttemptNumber,
        max_possible_score: maxPossibleScore,
        is_completed: false,
        started_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating attempt:', createError);
      return Response.json(
        { error: 'Failed to create new attempt' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data: newAttempt
    });

  } catch (error) {
    console.error('POST /api/exercise-attempts error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}