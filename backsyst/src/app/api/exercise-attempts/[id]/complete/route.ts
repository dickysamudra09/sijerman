import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT /api/exercise-attempts/[id]/complete - Complete an attempt
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const attemptId = id;
    const body = await request.json();
    const { timeSpentSeconds } = body;

    if (!attemptId) {
      return Response.json(
        { error: 'Missing attempt ID' },
        { status: 400 }
      );
    }

    // Get current attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('course_exercise_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt) {
      console.error('Error fetching attempt:', attemptError);
      return Response.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // Calculate total score from student answers
    const { data: answers, error: answersError } = await supabaseAdmin
      .from('course_student_answers')
      .select('points_earned')
      .eq('attempt_id', attemptId);

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      return Response.json(
        { error: 'Failed to calculate score' },
        { status: 500 }
      );
    }

    const totalScore = answers?.reduce((sum, answer) => sum + (answer.points_earned || 0), 0) || 0;

    // Update attempt as completed
    const { data: updatedAttempt, error: updateError } = await supabaseAdmin
      .from('course_exercise_attempts')
      .update({
        total_score: totalScore,
        is_completed: true,
        completed_at: new Date().toISOString(),
        time_spent_seconds: timeSpentSeconds || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating attempt:', updateError);
      return Response.json(
        { error: 'Failed to complete attempt' },
        { status: 500 }
      );
    }

    // Update best attempt flag using the database function
    await supabaseAdmin.rpc('update_best_attempt_flag', {
      p_user_id: attempt.user_id,
      p_course_exercise_id: attempt.course_exercise_id
    });

    // Get updated attempt with computed fields
    const { data: finalAttempt, error: finalError } = await supabaseAdmin
      .from('course_exercise_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (finalError) {
      console.error('Error fetching final attempt:', finalError);
      return Response.json(
        { error: 'Failed to fetch updated attempt' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data: finalAttempt
    });

  } catch (error) {
    console.error('PUT /api/exercise-attempts/[id]/complete error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}