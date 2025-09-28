import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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

interface Option {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_index?: number;
  sentence_fragment?: string;
  is_blank_position?: boolean;
}

interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'sentence_arrangement' | 'essay' | 'true_false' | string;
  options: Option[];
  sentence_arrangement_config?: {
    complete_sentence?: string;
    sentence_with_blanks?: string;
    blank_words?: string[];
    distractor_words?: string[];
  } | null;
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
  correctAnswerText: string,
  selectedAnswerText: string
): Array<{ title: string; url: string; description: string }> {
  const allRefs = [
    ...GERMAN_REFERENCES.grammar,
    ...GERMAN_REFERENCES.vocabulary,
    ...GERMAN_REFERENCES.pronunciation,
    ...GERMAN_REFERENCES.conjugation
  ];

  const searchTerms = `${questionText} ${correctAnswerText} ${selectedAnswerText}`.toLowerCase();

  const scoredRefs = allRefs.map(ref => {
    const score = ref.keywords.reduce((acc, keyword) => {
      return acc + (searchTerms.includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);
    return { ...ref, score };
  });

  const sortedRefs = scoredRefs.sort((a, b) => b.score - a.score);
  const selectedRefs = sortedRefs.slice(0, 3);

  if (selectedRefs.every(ref => ref.score === 0)) {
    return [
      GERMAN_REFERENCES.grammar[0],
      GERMAN_REFERENCES.vocabulary[0],
      GERMAN_REFERENCES.conjugation[0]
    ].map(({ title, url, description }) => ({ title, url, description }));
  }

  return selectedRefs.map(({ title, url, description }) => ({ title, url, description }));
}

async function generateAIFeedback(
  question: Question,
  studentAnswerText: string,
  correctAnswerText: string,
  isCorrect: boolean
): Promise<AIFeedbackResponse> {
  const startTime = Date.now();

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    const relevantReferences = selectRelevantReferences(
      question.question_text,
      correctAnswerText,
      studentAnswerText
    );

    let prompt = '';
    
    if (question.question_type === 'sentence_arrangement') {
      prompt = `
Sebagai tutor bahasa Jerman yang berpengalaman di level A1-A2, berikan feedback untuk jawaban siswa pada soal Isian Celah:

Pertanyaan: "${question.question_text}"
Jawaban siswa: "${studentAnswerText || 'Tidak ada jawaban'}"
Jawaban yang benar: "${correctAnswerText || 'Tidak diketahui'}"
Status: ${isCorrect ? 'Benar' : 'Salah'}

${isCorrect
        ? 'Berikan pujian singkat dan penjelasan mengapa jawaban tersebut benar.'
        : 'Jelaskan mengapa jawaban siswa salah dan berikan pemahaman yang jelas tentang konsep yang benar.'}

PENTING untuk soal Isian Celah:
- Fokus pada konsep bahasa Jerman yang spesifik (grammar, vocabulary, dll).
- Jelaskan mengapa kata/urutan yang benar penting dalam konteks kalimat tersebut.
- Berikan penjelasan yang mudah dipahami untuk level A1-A2.
- WAJIB: Di bagian explanation, sertakan kalimat lengkap yang benar dengan format: "Kalimat yang benar: **${correctAnswerText}**"
- Gunakan contoh-contoh sederhana jika memungkinkan.
- JANGAN menyebutkan URL atau link dalam response.

Format response dalam JSON yang VALID:
{
  "feedback_text": "feedback utama dalam bahasa Indonesia (maksimal 100 kata)",
  "explanation": "penjelasan detail konsep dalam bahasa Indonesia (maksimal 150 kata), WAJIB menyertakan 'Kalimat yang benar: **${correctAnswerText}**' di akhir"
}`;
    } else {
      prompt = `
Sebagai tutor bahasa Jerman yang berpengalaman di level A1-A2, berikan feedback untuk jawaban siswa:

Pertanyaan: "${question.question_text}"
Jawaban yang dipilih siswa: "${studentAnswerText || 'Tidak ada jawaban'}"
Jawaban yang benar: "${correctAnswerText || 'Tidak diketahui'}"
Status: ${isCorrect ? 'Benar' : 'Salah'}

${isCorrect
        ? 'Berikan pujian singkat dan penjelasan mengapa jawaban tersebut benar.'
        : 'Jelaskan mengapa jawaban siswa salah dan berikan pemahaman yang jelas tentang konsep yang benar. Fokus pada mengapa jawaban yang salah tidak cocok dengan struktur kalimat.'}

PENTING:
- Fokus pada konsep bahasa Jerman yang spesifik (grammar, vocabulary, dll).
- Berikan penjelasan yang mudah dipahami untuk level A1-A2.
- Gunakan contoh-contoh sederhana jika memungkinkan.
- JANGAN menyebutkan URL atau link dalam response.

Format response dalam JSON yang VALID:
{
  "feedback_text": "feedback utama dalam bahasa Indonesia (maksimal 100 kata)",
  "explanation": "penjelasan detail konsep dalam bahasa Indonesia (maksimal 150 kata)"
}`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an experienced German language tutor specializing in A1-A2 levels. Always respond in valid JSON format without any markdown or additional formatting. Focus on educational content only.'
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const aiContent = response.choices[0]?.message?.content;
    if (!aiContent) {
      throw new Error('No content received from OpenAI');
    }

    let parsedContent: any;
    try {
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

    const fallbackReferences = [
      GERMAN_REFERENCES.grammar[0],
      GERMAN_REFERENCES.vocabulary[0],
      GERMAN_REFERENCES.conjugation[0]
    ].map(({ title, url, description }) => ({ title, url, description }));

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
    .select('id, question_text, question_type, options(*)')
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
      textAnswer,
      selectedOptionsArray, 
      isCorrect
    }: {
      studentAnswerId: string;
      questionId: string;
      attemptId: string;
      selectedOptionId: string | null;
      textAnswer: string | null; 
      selectedOptionsArray: string[] | null;
      isCorrect: boolean;
    } = requestBody;

    console.log('AI Feedback API called with:', {
      studentAnswerId,
      questionId,
      attemptId,
      selectedOptionId,
      textAnswer,
      selectedOptionsArray,
      isCorrect
    });

    if (!studentAnswerId || !questionId || !attemptId) {
      console.error('Missing required fields:', { studentAnswerId, questionId, attemptId });
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: rawQuestionData, error: questionError } = await supabaseAdmin
      .from('questions')
      .select(`
        id,
        question_text,
        question_type,
        sentence_arrangement_config,
        options (id, option_text, is_correct, order_index, sentence_fragment, is_blank_position)
      `)
      .eq('id', questionId)
      .single();

    if (questionError || !rawQuestionData) {
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

    const questionData = rawQuestionData as unknown as Question;

    let studentAnswerText = '';
    let correctAnswerText = '';
    let finalIsCorrect = isCorrect;

    if (questionData.question_type === 'multiple_choice' || questionData.question_type === 'true_false') {
      const selectedOption = questionData.options.find(opt => opt.id === selectedOptionId);
      const correctOption = questionData.options.find(opt => opt.is_correct);
      studentAnswerText = selectedOption?.option_text || 'Tidak ada jawaban';
      correctAnswerText = correctOption?.option_text || 'Tidak diketahui';
    } else if (questionData.question_type === 'sentence_arrangement') {
      
      studentAnswerText = textAnswer || 'Tidak ada jawaban';

      let correctSentence: string = '';
      
      if (questionData.sentence_arrangement_config?.complete_sentence) {
        correctSentence = questionData.sentence_arrangement_config.complete_sentence;
      } else {
        let sentenceWithBlanks = questionData.sentence_arrangement_config?.sentence_with_blanks || "";
        const correctWords = questionData.sentence_arrangement_config?.blank_words || [];
        
        correctSentence = sentenceWithBlanks;
        correctWords.forEach(word => {
          correctSentence = correctSentence.replace('___', word);
        });
      }
      
      correctAnswerText = correctSentence.trim() || 'Tidak diketahui (Konfigurasi tidak lengkap)';
      
      console.log('Sentence arrangement processing:', {
        studentAnswerText,
        correctAnswerText,
        isCorrect: finalIsCorrect
      });
      
    } else if (questionData.question_type === 'essay') {
      studentAnswerText = textAnswer || 'Tidak ada jawaban';
      correctAnswerText = 'Jawaban ideal bervariasi (Essay)';
    } else {
      console.error('Unsupported question type:', questionData.question_type);
      return Response.json(
        { error: 'Unsupported question type' },
        { status: 400 }
      );
    }

    console.log('Generating AI feedback with:', {
      questionType: questionData.question_type,
      studentAnswerText,
      correctAnswerText,
      finalIsCorrect
    });

    const aiResponse = await generateAIFeedback(
      questionData,
      studentAnswerText,
      correctAnswerText,
      finalIsCorrect
    );

    // Simpan ke database
    const { data: feedback, error: saveError } = await supabaseAdmin
      .from('ai_feedback')
      .insert([{
        student_answer_id: studentAnswerId,
        question_id: questionId,
        attempt_id: attemptId,
        feedback_type: finalIsCorrect ? 'correct' : 'incorrect',
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