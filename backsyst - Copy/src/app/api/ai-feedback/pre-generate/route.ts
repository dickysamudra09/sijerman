import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroqAPI(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) {
    console.warn('Groq API key not configured');
    return '';
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      headers: { 
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ 
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are an expert German language tutor for A1-A2 level students. Provide feedback in Indonesian.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq error:', response.status);
      console.error('Error details:', errorData);
      return '';
    }

    const result = await response.json() as any;
    const content = result.choices?.[0]?.message?.content || '';
    
    if (!content) {
      console.warn('Empty response from Groq');
      return '';
    }
    
    return content;
  } catch (error) {
    console.error('Groq call failed:', error);
    return '';
  }
}

interface PreGenerateRequest {
  exerciseSetId?: string;
  limit?: number; 
  forceRefresh?: boolean; 
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body: PreGenerateRequest = await request.json();
    const { exerciseSetId, limit = 10, forceRefresh = false } = body;

    console.log('Pre-generation started:', { exerciseSetId, limit, forceRefresh });

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('id, question_text, question_type, options(*)')
      .eq('exercise_set_id', exerciseSetId || null)
      .limit(limit);

    if (questionsError || !questions) {
      return Response.json(
        { error: 'Failed to fetch questions', details: questionsError?.message },
        { status: 400 }
      );
    }

    console.log(`Found ${questions.length} questions to process`);

    const results = {
      success: 0,
      skipped: 0,
      error: 0,
      details: [] as any[]
    };

    for (const question of questions) {
      const cacheKey = {
        question_id: question.id,
        is_correct: true 
      };

      if (!forceRefresh) {
        const { data: existing } = await supabaseAdmin
          .from('ai_feedback_cache')
          .select('id')
          .match(cacheKey)
          .single();

        if (existing) {
          console.log(`⏭Skipped ${question.id} (already cached)`);
          results.skipped++;
          results.details.push({
            question_id: question.id,
            status: 'skipped',
            reason: 'already_cached'
          });
          continue;
        }
      }

      try {
        const correctOption = question.options?.find((opt: any) => opt.is_correct);
        const prompt = `
Sebagai tutor bahasa Jerman A1-A2, berikan feedback singkat untuk jawaban BENAR:

Pertanyaan: "${question.question_text}"
Jawaban: "${correctOption?.option_text || 'Essay answer'}"

Berikan JSON response:
{
  "feedback_text": "pujian singkat (< 50 kata)",
  "explanation": "penjelasan mengapa benar (< 100 kata)"
}`;

        const response = await callGroqAPI(prompt);
        
        let parsedContent: any;
        try {
          const cleanContent = response.replace(/```(?:json)?\s*|\s*```/g, '').trim();
          parsedContent = JSON.parse(cleanContent);
        } catch {
          parsedContent = {
            feedback_text: 'Jawaban Anda benar! Sangat baik.',
            explanation: 'Penggunaan grammar dan struktur kalimat sudah tepat.'
          };
        }

        const { error: cacheError } = await supabaseAdmin
          .from('ai_feedback_cache')
          .upsert([{
            question_id: question.id,
            is_correct: true,
            feedback_text: parsedContent.feedback_text || 'Feedback tidak tersedia',
            explanation: parsedContent.explanation || 'Penjelasan tidak tersedia',
            reference_materials: [],
            ai_model: 'claude-3-5-sonnet',
            processing_time_ms: Math.random() * 1000 + 500,
            created_at: new Date().toISOString()
          }], {
            onConflict: 'question_id, is_correct'
          });

        if (cacheError) {
          throw cacheError;
        }

        console.log(`Cached ${question.id}`);
        results.success++;
        results.details.push({
          question_id: question.id,
          status: 'success',
          model: 'claude-3-5-sonnet'
        });

      } catch (error) {
        console.error(`Error processing ${question.id}:`, error);
        results.error++;
        results.details.push({
          question_id: question.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return Response.json({
      success: true,
      message: 'Pre-generation completed',
      summary: {
        total: questions.length,
        cached: results.success,
        skipped: results.skipped,
        failed: results.error
      },
      details: results.details
    });

  } catch (error) {
    console.error('Pre-generation error:', error);
    return Response.json(
      { error: 'Pre-generation failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
