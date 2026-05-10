import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Lazy initialization to avoid build-time errors
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/exercise-attempts/summary?exerciseId=xxx&userId=xxx - Get exercise summary for history card
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

    // Get attempts summary
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from('course_exercise_attempts')
      .select('*')
      .eq('course_exercise_id', exerciseId)
      .eq('user_id', userId)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false });

    if (attemptsError) {
      console.error('Error fetching attempts:', attemptsError);
      return Response.json(
        { error: 'Failed to fetch exercise summary' },
        { status: 500 }
      );
    }

    if (!attempts || attempts.length === 0) {
      // No attempts yet
      return Response.json({
        success: true,
        data: {
          has_attempts: false,
          is_passed: false,
          best_score: 0,
          total_attempts: 0,
          can_retry: true
        }
      });
    }

    const bestAttempt = attempts.find(attempt => attempt.is_best_attempt);
    const hasPassedOnce = attempts.some(attempt => attempt.is_passed);
    const lastAttempt = attempts[0]; // Most recent

    const summary = {
      has_attempts: true,
      is_passed: hasPassedOnce,
      best_score: bestAttempt?.percentage || 0,
      total_attempts: attempts.length,
      last_attempt_date: lastAttempt?.completed_at,
      can_retry: true // unlimited retries
    };

    return Response.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('GET /api/exercise-attempts/summary error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}