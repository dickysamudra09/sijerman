import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface Question {
  id: string;
  question_text: string;
}

interface Option {
  id: string;
  option_text: string;
  is_correct: boolean;
}

interface AIFeedbackData {
  feedback_text: string;
  explanation: string;
  reference_materials: Array<{
    title: string;
    url: string;
    description: string;
  }>;
  processing_time_ms: number;
  ai_model: string;
}

interface AIFeedbackResponse {
  success: boolean;
  data: AIFeedbackData;
  error?: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const questionId = url.searchParams.get('questionId');
  
  if (!questionId) {
    return Response.json({ error: 'questionId required' });
  }
  
  const { data, error } = await supabaseAdmin
    .from('questions')
    .select('id, question_text, options(*)')
    .eq('id', questionId)
    .single();
    
  return Response.json({ data, error, questionId });
}

async function generateAIFeedback(
  question: Question, 
  selectedAnswer: Option | undefined, 
  correctAnswer: Option | undefined, 
  isCorrect: boolean
): Promise<AIFeedbackResponse> {
  const startTime = Date.now();

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    const prompt = `
            Sebagai tutor bahasa Jerman yang berpengalaman di level A1-A2, berikan feedback untuk jawaban siswa:

            Pertanyaan: "${question.question_text}"
            Jawaban yang dipilih siswa: "${selectedAnswer?.option_text || 'Tidak ada jawaban'}"
            Jawaban yang benar: "${correctAnswer?.option_text || 'Tidak diketahui'}"
            Status: ${isCorrect ? 'Benar' : 'Salah'}

            ${isCorrect 
            ? 'Berikan pujian singkat dan penjelasan mengapa jawaban tersebut benar.' 
            : 'Jelaskan mengapa jawaban siswa salah dan berikan pemahaman yang jelas tentang konsep yang benar.'}

            Sangat penting: SELALU sertakan minimal 3 referensi berbeda tentang tata bahasa/belajar bahasa Jerman.
            Format response dalam JSON:
            {
            "feedback_text": "feedback utama dalam bahasa Indonesia",
            "explanation": "penjelasan detail konsep",
            "reference_materials": [
                {
                    "title": "judul referensi 1",
                    "url": "link atau sumber akurat terkait kata kunci dari : ${correctAnswer?.option_text || 'Tidak diketahui'} ",
                    "description": "deskripsi singkat"
                },
                {
                    "title": "judul referensi 2",
                    "url": "link atau sumber akurat terkait kata kunci dari : ${correctAnswer?.option_text || 'Tidak diketahui'} ",
                    "description": "deskripsi singkat"
                },
                {
                    "title": "judul referensi 3",
                    "url": "link atau sumber akurat terkait kata kunci dari : ${correctAnswer?.option_text || 'Tidak diketahui'} ",
                    "description": "deskripsi singkat"
                }
            ]
        }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an experienced English language tutor. Always respond in valid JSON format as specified.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    });

    const aiContent = response.choices[0]?.message?.content;
    if (!aiContent) {
      throw new Error('No content received from OpenAI');
    }

    let parsedContent: any;
    try {
      parsedContent = JSON.parse(aiContent);
    } catch (parseError) {
      throw new Error(`Failed to parse OpenAI response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        feedback_text: parsedContent.feedback_text || "Feedback tidak tersedia",
        explanation: parsedContent.explanation || "Penjelasan tidak tersedia",
        reference_materials: parsedContent.reference_materials || [],
        processing_time_ms: processingTime,
        ai_model: response.model || 'unknown',
      }
    };
  } catch (error: unknown) {
    console.error('AI Feedback generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      success: false,
      error: errorMessage,
      data: {
        feedback_text: "Maaf, terjadi kesalahan saat menghasilkan feedback. Silakan coba lagi nanti.",
        explanation: "Sistem feedback AI sedang mengalami gangguan.",
        reference_materials: [],
        processing_time_ms: Date.now() - startTime,
        ai_model: 'error'
      }
    };
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const requestBody = await request.json();
    const { 
      studentAnswerId, 
      questionId, 
      attemptId, 
      selectedOptionId,
      isCorrect 
    }: {
      studentAnswerId: string;
      questionId: string;
      attemptId: string;
      selectedOptionId: string | null;
      isCorrect: boolean;
    } = requestBody;

    console.log('AI Feedback API called with:', {
      studentAnswerId,
      questionId,
      attemptId,
      selectedOptionId,
      isCorrect
    });

    if (!studentAnswerId || !questionId || !attemptId) {
      console.error('Missing required fields:', { studentAnswerId, questionId, attemptId });
      return Response.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    console.log('Attempting to fetch question with ID:', questionId);

    const { data: questionData, error: questionError } = await supabaseAdmin
      .from('questions')
      .select(`
        id,
        question_text,
        options (id, option_text, is_correct)
      `)
      .eq('id', questionId)
      .single();

    console.log('Supabase query result:', { questionData, questionError });

    if (questionError) {
      console.error('Question fetch error:', questionError);
      return Response.json(
        { 
          error: 'Failed to fetch question data', 
          details: questionError.message,
          questionId: questionId 
        },
        { status: 404 }
      );
    }

    if (!questionData) {
      console.error('No question data found for ID:', questionId);
      return Response.json(
        { 
          error: 'Question not found', 
          details: `No question found with ID: ${questionId}` 
        },
        { status: 404 }
      );
    }

    const typedQuestionData = questionData as Question & {
      options: Option[];
    };

    if (!typedQuestionData.options || typedQuestionData.options.length === 0) {
      console.error('No options found for question:', questionId);
      return Response.json(
        { 
          error: 'Question options not found', 
          details: 'Question has no options' 
        },
        { status: 404 }
      );
    }

    const selectedOption = typedQuestionData.options.find(opt => opt.id === selectedOptionId);
    const correctOption = typedQuestionData.options.find(opt => opt.is_correct);

    console.log('Selected option:', selectedOption);
    console.log('Correct option:', correctOption);

    const aiResponse = await generateAIFeedback(
      typedQuestionData,
      selectedOption,
      correctOption,
      isCorrect
    );

    const { data: feedback, error: saveError } = await supabaseAdmin
      .from('ai_feedback')
      .insert([{
        student_answer_id: studentAnswerId,
        question_id: questionId,
        attempt_id: attemptId,
        feedback_type: isCorrect ? 'correct' : 'incorrect',
        feedback_text: aiResponse.data.feedback_text,
        explanation: aiResponse.data.explanation,
        reference_materials: aiResponse.data.reference_materials,
        ai_model: aiResponse.data.ai_model,
        processing_time_ms: aiResponse.data.processing_time_ms
      }])
      .select()
      .single();

    if (saveError) {
      console.error('Error saving AI feedback:', saveError);
      return Response.json({
        success: true,
        data: aiResponse.data,
        warning: 'Feedback generated but not saved to database'
      });
    }

    return Response.json({
      success: true,
      data: {
        ...aiResponse.data,
        id: feedback?.id
      }
    });

  } catch (error: unknown) {
    console.error('AI Feedback API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return Response.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}