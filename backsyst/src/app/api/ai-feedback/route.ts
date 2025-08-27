import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Database referensi yang sudah diverifikasi untuk bahasa Jerman A1-A2
const GERMAN_REFERENCES = {
  grammar: [
    {
      title: "Deutsche Grammatik - Goethe Institut",
      url: "https://www.goethe.de/de/spr/ueb/gram.html",
      description: "Panduan tata bahasa Jerman resmi dari Goethe Institut",
      keywords: ["grammatik", "grammar", "tense", "artikel", "konjugation"]
    },
    {
      title: "Deutsch A1-A2 - Lingoda",
      url: "https://www.lingoda.com/en/german/course/a1",
      description: "Kursus bahasa Jerman untuk pemula tingkat A1-A2",
      keywords: ["a1", "a2", "beginner", "basics", "anfänger"]
    },
    {
      title: "Deutsche Welle - Deutsch Lernen",
      url: "https://www.dw.com/de/deutsch-lernen/s-2055",
      description: "Platform pembelajaran bahasa Jerman gratis dari Deutsche Welle",
      keywords: ["lernen", "learn", "vocabulary", "wortschatz", "pronunciation"]
    }
  ],
  vocabulary: [
    {
      title: "Leo Dictionary - Deutsch-Englisch",
      url: "https://dict.leo.org/german-english/",
      description: "Kamus online Jerman-Inggris yang komprehensif",
      keywords: ["wortschatz", "vocabulary", "dictionary", "wörterbuch", "bedeutung"]
    },
    {
      title: "Reverso Context - German",
      url: "https://context.reverso.net/translation/german-english/",
      description: "Kamus kontekstual untuk memahami penggunaan kata dalam kalimat",
      keywords: ["context", "usage", "beispiel", "example", "sentence"]
    },
    {
      title: "Memrise - German Vocabulary",
      url: "https://www.memrise.com/courses/english/german/",
      description: "Platform interaktif untuk menghafal kosakata Jerman",
      keywords: ["memorization", "flashcards", "practice", "übung", "wiederholen"]
    }
  ],
  pronunciation: [
    {
      title: "Forvo - German Pronunciation",
      url: "https://forvo.com/languages/de/",
      description: "Kamus audio untuk mendengar pelafalan kata-kata Jerman",
      keywords: ["pronunciation", "aussprache", "audio", "phonetic", "sound"]
    },
    {
      title: "IPA Phonetic Transcription",
      url: "https://easypronunciation.com/en/german-phonetic-transcription-converter",
      description: "Konverter untuk transkripsi fonetik bahasa Jerman",
      keywords: ["phonetic", "ipa", "transcription", "sound", "phonetik"]
    }
  ],
  conjugation: [
    {
      title: "Verbformen.de",
      url: "https://www.verbformen.de/",
      description: "Database konjugasi lengkap untuk semua kata kerja Jerman",
      keywords: ["konjugation", "conjugation", "verb", "verben", "tense"]
    },
    {
      title: "Canoo.net - German Grammar",
      url: "https://www.canoo.net/",
      description: "Portal tata bahasa Jerman dengan fokus pada konjugasi dan deklinasi",
      keywords: ["deklinasi", "declension", "grammar", "form", "flexion"]
    }
  ]
};

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

function selectRelevantReferences(
  questionText: string, 
  correctAnswer: string, 
  selectedAnswer: string
): Array<{title: string; url: string; description: string}> {
  const allRefs = [
    ...GERMAN_REFERENCES.grammar,
    ...GERMAN_REFERENCES.vocabulary,
    ...GERMAN_REFERENCES.pronunciation,
    ...GERMAN_REFERENCES.conjugation
  ];

  const searchTerms = `${questionText} ${correctAnswer} ${selectedAnswer}`.toLowerCase();
  
  // Score referensi berdasarkan relevansi keyword
  const scoredRefs = allRefs.map(ref => {
    const score = ref.keywords.reduce((acc, keyword) => {
      return acc + (searchTerms.includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);
    return { ...ref, score };
  });

  // Urutkan berdasarkan score dan ambil 3 teratas
  // Jika tidak ada yang cocok, ambil referensi umum
  const sortedRefs = scoredRefs.sort((a, b) => b.score - a.score);
  const selectedRefs = sortedRefs.slice(0, 3);

  // Jika semua score 0, berikan mix referensi umum
  if (selectedRefs.every(ref => ref.score === 0)) {
    return [
      GERMAN_REFERENCES.grammar[0],
      GERMAN_REFERENCES.vocabulary[0],
      GERMAN_REFERENCES.conjugation[0]
    ].map(({title, url, description}) => ({title, url, description}));
  }

  return selectedRefs.map(({title, url, description}) => ({title, url, description}));
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

    // Pilih referensi yang relevan berdasarkan konten pertanyaan
    const relevantReferences = selectRelevantReferences(
      question.question_text,
      correctAnswer?.option_text || '',
      selectedAnswer?.option_text || ''
    );

    const prompt = `
Sebagai tutor bahasa Jerman yang berpengalaman di level A1-A2, berikan feedback untuk jawaban siswa:

Pertanyaan: "${question.question_text}"
Jawaban yang dipilih siswa: "${selectedAnswer?.option_text || 'Tidak ada jawaban'}"
Jawaban yang benar: "${correctAnswer?.option_text || 'Tidak diketahui'}"
Status: ${isCorrect ? 'Benar' : 'Salah'}

${isCorrect 
  ? 'Berikan pujian singkat dan penjelasan mengapa jawaban tersebut benar.' 
  : 'Jelaskan mengapa jawaban siswa salah dan berikan pemahaman yang jelas tentang konsep yang benar.'}

PENTING: 
- Fokus pada konsep bahasa Jerman yang spesifik (grammar, vocabulary, pronunciation, dll)
- Berikan penjelasan yang mudah dipahami untuk level A1-A2
- Gunakan contoh-contoh sederhana jika memungkinkan
- JANGAN menyebutkan URL atau link dalam response

Format response dalam JSON yang VALID:
{
  "feedback_text": "feedback utama dalam bahasa Indonesia (maksimal 100 kata)",
  "explanation": "penjelasan detail konsep dalam bahasa Indonesia (maksimal 150 kata)"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are an experienced German language tutor specializing in A1-A2 levels. Always respond in valid JSON format without any markdown or additional formatting. Focus on educational content only.' 
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3, // Lebih rendah untuk konsistensi
      max_tokens: 500,
    });

    const aiContent = response.choices[0]?.message?.content;
    if (!aiContent) {
      throw new Error('No content received from OpenAI');
    }

    let parsedContent: any;
    try {
      // Bersihkan response dari markdown atau karakter yang tidak diinginkan
      const cleanContent = aiContent.replace(/```json\s*|\s*```/g, '').trim();
      parsedContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Parse error, raw content:', aiContent);
      throw new Error(`Failed to parse OpenAI response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        feedback_text: parsedContent.feedback_text || "Feedback tidak tersedia",
        explanation: parsedContent.explanation || "Penjelasan tidak tersedia",
        reference_materials: relevantReferences,
        processing_time_ms: processingTime,
        ai_model: response.model || 'unknown',
      }
    };
  } catch (error: unknown) {
    console.error('AI Feedback generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Fallback referensi jika terjadi error
    const fallbackReferences = [
      GERMAN_REFERENCES.grammar[0],
      GERMAN_REFERENCES.vocabulary[0],
      GERMAN_REFERENCES.conjugation[0]
    ].map(({title, url, description}) => ({title, url, description}));
    
    return {
      success: false,
      error: errorMessage,
      data: {
        feedback_text: "Maaf, terjadi kesalahan saat menghasilkan feedback. Silakan coba lagi nanti.",
        explanation: "Sistem feedback AI sedang mengalami gangguan.",
        reference_materials: fallbackReferences,
        processing_time_ms: Date.now() - startTime,
        ai_model: 'error'
      }
    };
  }
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

    const { data: questionData, error: questionError } = await supabaseAdmin
      .from('questions')
      .select(`
        id,
        question_text,
        options (id, option_text, is_correct)
      `)
      .eq('id', questionId)
      .single();

    if (questionError || !questionData) {
      console.error('Question fetch error:', questionError);
      return Response.json(
        { 
          error: 'Failed to fetch question data', 
          details: questionError?.message || 'Question not found',
          questionId: questionId 
        },
        { status: 404 }
      );
    }

    const typedQuestionData = questionData as Question & {
      options: Option[];
    };

    if (!typedQuestionData.options || typedQuestionData.options.length === 0) {
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

    const aiResponse = await generateAIFeedback(
      typedQuestionData,
      selectedOption,
      correctOption,
      isCorrect
    );

    // Simpan ke database
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