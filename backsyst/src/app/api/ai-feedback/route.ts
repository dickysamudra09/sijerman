import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
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
  ],
  essay: [
    {
      title: "Deutsche Essay Struktur - Goethe Institut",
      url: "https://www.goethe.de/de/spr/ueb/wri.html",
      description: "Panduan menulis essay dalam bahasa Jerman",
      keywords: ["essay", "schreiben", "writing", "struktur", "aufsatz"]
    },
    {
      title: "German Writing Practice - Deutsche Welle",
      url: "https://www.dw.com/de/deutsch-lernen/deutsch-schreiben/s-32024",
      description: "Latihan menulis bahasa Jerman dengan berbagai topik",
      keywords: ["writing", "practice", "übung", "text", "ausdruck"]
    },
    {
      title: "Textanalyse und Interpretation",
      url: "https://www.deutsch-online.com/textanalyse",
      description: "Panduan analisis teks dan interpretasi dalam bahasa Jerman",
      keywords: ["analyse", "interpretation", "textverständnis", "comprehension"]
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
  selectedAnswerText: string,
  questionType: string
): Array<{ title: string; url: string; description: string }> {
  let allRefs = [
    ...GERMAN_REFERENCES.grammar,
    ...GERMAN_REFERENCES.vocabulary,
    ...GERMAN_REFERENCES.pronunciation,
    ...GERMAN_REFERENCES.conjugation
  ];

  // Untuk essay, tambahkan referensi khusus essay
  if (questionType === 'essay') {
    allRefs = [...allRefs, ...GERMAN_REFERENCES.essay];
  }

  const searchTerms = `${questionText} ${correctAnswerText} ${selectedAnswerText}`.toLowerCase();

  // Enhanced keyword matching for better reference selection
  const grammarKeywords = ['verb', 'artikel', 'grammar', 'konjugation', 'deklinasi', 'kasus', 'nominativ', 'akkusativ', 'dativ'];
  const vocabularyKeywords = ['wort', 'vocabulary', 'bedeutung', 'wörterbuch', 'kosakata'];
  const essayKeywords = ['essay', 'schreiben', 'text', 'struktur', 'aufsatz'];

  const hasGrammarIssues = grammarKeywords.some(keyword => searchTerms.includes(keyword));
  const hasVocabularyIssues = vocabularyKeywords.some(keyword => searchTerms.includes(keyword));
  const hasEssayIssues = questionType === 'essay' || essayKeywords.some(keyword => searchTerms.includes(keyword));

  let prioritizedRefs = [];

  // Prioritize grammar references for detailed grammar feedback
  if (hasGrammarIssues) {
    prioritizedRefs.push(...GERMAN_REFERENCES.grammar.slice(0, 1));
    prioritizedRefs.push(...GERMAN_REFERENCES.conjugation.slice(0, 1));
  }

  // Add vocabulary reference if vocabulary issues detected
  if (hasVocabularyIssues) {
    prioritizedRefs.push(...GERMAN_REFERENCES.vocabulary.slice(0, 1));
  }

  // Add essay reference for essay questions
  if (hasEssayIssues) {
    prioritizedRefs.push(...GERMAN_REFERENCES.essay.slice(0, 1));
  }

  // Fill remaining slots with most relevant references
  const scoredRefs = allRefs.map(ref => {
    const score = ref.keywords.reduce((acc, keyword) => {
      return acc + (searchTerms.includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);
    return { ...ref, score };
  });

  const sortedRefs = scoredRefs.sort((a, b) => b.score - a.score);
  const remainingSlots = 3 - prioritizedRefs.length;
  
  if (remainingSlots > 0) {
    const additionalRefs = sortedRefs
      .filter(ref => !prioritizedRefs.some(pRef => pRef.title === ref.title))
      .slice(0, remainingSlots);
    prioritizedRefs.push(...additionalRefs);
  }

  // Ensure we always return exactly 3 references
  if (prioritizedRefs.length === 0) {
    if (questionType === 'essay') {
      return [
        GERMAN_REFERENCES.essay[0],
        GERMAN_REFERENCES.grammar[0],
        GERMAN_REFERENCES.vocabulary[0]
      ].map(({ title, url, description }) => ({ title, url, description }));
    }
    
    return [
      GERMAN_REFERENCES.grammar[0],
      GERMAN_REFERENCES.vocabulary[0],
      GERMAN_REFERENCES.conjugation[0]
    ].map(({ title, url, description }) => ({ title, url, description }));
  }

  return prioritizedRefs.slice(0, 3).map(({ title, url, description }) => ({ title, url, description }));
}

async function generateAIFeedbackWithClaude(
  question: Question,
  studentAnswerText: string,
  correctAnswerText: string,
  isCorrect: boolean
): Promise<AIFeedbackResponse> {
  const startTime = Date.now();

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Claude API key is not configured');
    }

    const relevantReferences = selectRelevantReferences(
      question.question_text,
      correctAnswerText,
      studentAnswerText,
      question.question_type
    );

    const prompt = `
Sebagai tutor bahasa Jerman yang berpengalaman di level A1-A2, berikan feedback yang SANGAT DETAIL untuk jawaban essay siswa:

Pertanyaan: "${question.question_text}"
Jawaban siswa: "${studentAnswerText || 'Tidak ada jawaban'}"
Status: ${isCorrect ? 'Benar' : 'Perlu perbaikan'}

ANALISIS YANG HARUS DILAKUKAN:
1. **Grammar Check (Tata Bahasa):**
   - Periksa konjugasi kata kerja (verb conjugation) - apakah sesuai dengan subjek dan tense?
   - Analisis deklinasi kata benda (noun declension) - Nominativ, Akkusativ, Dativ, Genitiv
   - Periksa posisi kata kerja dalam kalimat (V2 rule, subordinate clauses)
   - Analisis penggunaan modal verbs dan auxiliary verbs

2. **Artikel Check (der/die/das):**
   - Periksa setiap artikel definit dan indefinit
   - Analisis apakah artikel sesuai dengan gender (maskulin/feminin/netral)
   - Periksa perubahan artikel sesuai kasus (Nominativ/Akkusativ/Dativ/Genitiv)

3. **Vocabulary & Word Order:**
   - Periksa ketepatan pemilihan kosakata
   - Analisis word order (Subjek-Verb-Objek atau variasi lainnya)
   - Periksa penggunaan preposisi yang tepat

4. **Sentence Structure:**
   - Analisis struktur kalimat sederhana vs kompleks
   - Periksa penggunaan konjungsi (und, aber, oder, denn, etc.)

${isCorrect
      ? 'Meskipun jawaban benar, berikan analisis detail pada setiap aspek di atas dan saran spesifik untuk peningkatan.'
      : 'Identifikasi SETIAP kesalahan grammar, artikel, dan vocabulary secara spesifik dengan contoh perbaikan.'}

CONTOH FORMAT FEEDBACK DETAIL:
• **Grammar**: "Kata kerja 'haben' seharusnya 'hat' untuk subjek 'er/sie/es'"
• **Artikel**: "Penggunaan 'der' seharusnya 'die' karena 'Familie' adalah feminin"
• **Word Order**: "Dalam kalimat subordinate, verb harus di akhir"
• **Vocabulary**: "Kata 'groß' lebih tepat daripada 'big' untuk mendeskripsikan ukuran"

Berikan response dalam format JSON yang valid tanpa markdown formatting:

{
  "feedback_text": "feedback utama dalam bahasa Indonesia yang mencakup poin-poin grammar dan artikel utama (maksimal 150 kata)",
  "explanation": "analisis SANGAT DETAIL dengan bullet points (•) untuk SETIAP aspek: Grammar, Artikel, Vocabulary, Structure. Berikan contoh spesifik dan koreksi untuk setiap kesalahan yang ditemukan (maksimal 300 kata)"
}`;

    console.log('Sending request to Claude with prompt length:', prompt.length);

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022', // Updated to current available model
      max_tokens: 2000, // Increased for detailed contextual analysis
      temperature: 0.1, // Very low for consistent analytical approach
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    console.log('Claude response received:', response);

    const aiContent = response.content[0].type === 'text' ? response.content[0].text : '';
    if (!aiContent) {
      throw new Error('No content received from Claude');
    }

    console.log('Raw Claude content:', aiContent);

    let parsedContent: any;
    try {
      // Clean the content more thoroughly
      let cleanContent = aiContent.trim();
      
      // Remove any markdown code blocks
      cleanContent = cleanContent.replace(/```(?:json)?\s*|\s*```/g, '');
      
      // Find JSON content between braces
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      console.log('Cleaned content for parsing:', cleanContent);
      
      parsedContent = JSON.parse(cleanContent);
      
      // Validate required fields
      if (!parsedContent.feedback_text || !parsedContent.explanation) {
        throw new Error('Missing required fields in Claude response');
      }
      
    } catch (parseError) {
      console.error('Parse error, attempting manual extraction. Raw content:', aiContent);
      
      // Manual extraction as fallback
      const feedbackMatch = aiContent.match(/"feedback_text":\s*"([^"]+)"/);
      const explanationMatch = aiContent.match(/"explanation":\s*"([^"]+)"/);
      
      if (feedbackMatch && explanationMatch) {
        parsedContent = {
          feedback_text: feedbackMatch[1],
          explanation: explanationMatch[1]
        };
      } else {
        // Ultimate fallback - create structured response from raw content
        const lines = aiContent.split('\n').filter(line => line.trim());
        parsedContent = {
          feedback_text: isCorrect ? 
            "Jawaban Anda menunjukkan pemahaman yang baik terhadap bahasa Jerman. Terus berlatih untuk meningkatkan kemampuan menulis." :
            "Jawaban Anda memerlukan beberapa perbaikan dalam hal tata bahasa dan struktur kalimat bahasa Jerman.",
          explanation: lines.slice(0, 3).join(' • ') || "Silakan fokus pada penggunaan tata bahasa yang tepat dan perbanyak membaca contoh teks bahasa Jerman."
        };
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        feedback_text: parsedContent.feedback_text || "Feedback tidak tersedia",
        explanation: parsedContent.explanation || "Penjelasan tidak tersedia",
        reference_materials: relevantReferences,
        processing_time_ms: processingTime,
        ai_model: response.model || 'claude-3-5-sonnet',
      }
    };
  } catch (error: unknown) {
    console.error('Claude Feedback generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    const fallbackReferences = [
      GERMAN_REFERENCES.essay[0],
      GERMAN_REFERENCES.grammar[0],
      GERMAN_REFERENCES.vocabulary[0]
    ].map(({ title, url, description }) => ({ title, url, description }));

    // Create detailed fallback feedback based on actual content analysis
    const analyzeStudentText = (text: string, questionText: string) => {
      const analysisPoints = [];
      const text_lower = text.toLowerCase();
      const question_lower = questionText.toLowerCase();
      
      // Analyze content relevance
      const questionKeywords = question_lower.split(' ').filter(word => word.length > 3);
      const answerKeywords = text_lower.split(' ').filter(word => word.length > 3);
      const relevantKeywords = questionKeywords.filter(keyword => 
        answerKeywords.some(answerWord => answerWord.includes(keyword) || keyword.includes(answerWord))
      );
      
      if (relevantKeywords.length > 0) {
        analysisPoints.push(`• RELEVANSI: Jawaban mencoba menjawab pertanyaan dengan menyebutkan aspek: ${relevantKeywords.slice(0, 3).join(', ')}`);
      } else {
        analysisPoints.push("• RELEVANSI: Jawaban kurang spesifik menjawab pertanyaan yang diajukan");
      }
      
      // Analyze grammar patterns
      const sentences = text.split(/[.!?]+/).filter(s => s.trim());
      if (sentences.length > 0) {
        // Check for verb conjugation patterns
        if (text_lower.includes('ich ') && (text_lower.includes(' bin') || text_lower.includes(' habe') || text_lower.includes(' ist'))) {
          analysisPoints.push("• GRAMMAR: Periksa konjugasi - 'ich' menggunakan 'bin', 'habe', bukan 'ist'");
        }
        
        // Check for article usage
        const articleMatches = text.match(/\b(der|die|das|ein|eine|einen|einem|einer)\b/gi);
        if (articleMatches && articleMatches.length > 0) {
          analysisPoints.push(`• ARTIKEL: Ditemukan ${articleMatches.length} artikel - pastikan sesuai gender kata benda (${articleMatches.slice(0, 3).join(', ')})`);
        } else if (text.length > 20) {
          analysisPoints.push("• ARTIKEL: Pertimbangkan penggunaan artikel definit/indefinit dalam kalimat");
        }
        
        // Check sentence structure
        if (sentences.length > 1) {
          analysisPoints.push("• STRUCTURE: Kalimat majemuk terdeteksi - periksa penggunaan konjungsi dan word order");
        }
        
        // Analyze vocabulary complexity
        const words = text.split(/\s+/).filter(word => word.length > 0);
        if (words.length > 10) {
          analysisPoints.push("• VOCABULARY: Jawaban cukup panjang - pastikan setiap kata tepat untuk konteks pertanyaan");
        } else if (words.length < 5 && text.trim()) {
          analysisPoints.push("• VOCABULARY: Jawaban bisa diperluas dengan kosakata yang lebih spesifik");
        }
      }
      
      return analysisPoints;
    };

    const detectedIssues = analyzeStudentText(studentAnswerText, question.question_text);
    
    const fallbackFeedback = isCorrect ?
      `Jawaban Anda menunjukkan upaya yang baik untuk menjawab pertanyaan tentang "${question.question_text}". Secara keseluruhan struktur bahasa Jerman sudah cukup baik, namun beberapa aspek dapat diperbaiki untuk mencapai tingkat yang lebih optimal.` :
      `Jawaban Anda untuk pertanyaan "${question.question_text}" memerlukan perbaikan dalam beberapa aspek. Mari kita analisis bagian-bagian yang perlu diperhatikan dalam bahasa Jerman.`;

    const fallbackExplanation = detectedIssues.length > 0 ? 
      `${detectedIssues.join('\n')}\n• SARAN PERBAIKAN: ${isCorrect ? 'Tingkatkan variasi kosakata dan kompleksitas kalimat sesuai konteks pertanyaan' : 'Fokus pada relevansi jawaban dengan pertanyaan dan perbaiki tata bahasa dasar'}` :
      `• RELEVANSI: Pastikan jawaban langsung menjawab pertanyaan yang diajukan\n• GRAMMAR: Perhatikan konjugasi verb dan penggunaan artikel yang tepat\n• STRUCTURE: Susun kalimat dengan urutan kata yang benar dalam bahasa Jerman\n• SARAN PERBAIKAN: Pelajari kembali konsep dasar grammar dan perbanyak latihan menulis`;

    return {
      success: false,
      error: errorMessage,
      data: {
        feedback_text: fallbackFeedback,
        explanation: fallbackExplanation,
        reference_materials: fallbackReferences,
        processing_time_ms: Date.now() - startTime,
        ai_model: 'fallback'
      }
    };
  }
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
      studentAnswerText,
      question.question_type
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
- WAJIB: Di bagian explanation, sertakan kalimat lengkap yang benar dengan format: "**Kalimat yang benar:** <span style='font-size: 1.2em; font-weight: bold; color: #059669;'>${correctAnswerText}</span>"
- Gunakan contoh-contoh sederhana jika memungkinkan.
- JANGAN menyebutkan URL atau link dalam response.

Format response dalam JSON yang VALID:
{
  "feedback_text": "feedback utama dalam bahasa Indonesia (maksimal 100 kata)",
  "explanation": "penjelasan detail konsep dalam bahasa Indonesia (maksimal 150 kata), WAJIB menyertakan highlighted answer di akhir"
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
        ai_model: response.model || 'gpt-4o-mini',
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
    let aiResponse: AIFeedbackResponse;

    if (questionData.question_type === 'multiple_choice' || questionData.question_type === 'true_false') {
      const selectedOption = questionData.options.find(opt => opt.id === selectedOptionId);
      const correctOption = questionData.options.find(opt => opt.is_correct);
      studentAnswerText = selectedOption?.option_text || 'Tidak ada jawaban';
      correctAnswerText = correctOption?.option_text || 'Tidak diketahui';
      
      aiResponse = await generateAIFeedback(
        questionData,
        studentAnswerText,
        correctAnswerText,
        finalIsCorrect
      );
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
      
      aiResponse = await generateAIFeedback(
        questionData,
        studentAnswerText,
        correctAnswerText,
        finalIsCorrect
      );
    } else if (questionData.question_type === 'essay') {
      studentAnswerText = textAnswer || 'Tidak ada jawaban';
      correctAnswerText = 'Jawaban ideal bervariasi (Essay)';
      
      // Gunakan Claude API untuk essay
      aiResponse = await generateAIFeedbackWithClaude(
        questionData,
        studentAnswerText,
        correctAnswerText,
        finalIsCorrect
      );
    } else {
      console.error('Unsupported question type:', questionData.question_type);
      return Response.json(
        { error: 'Unsupported question type' },
        { status: 400 }
      );
    }

    console.log('Generated AI feedback with:', {
      questionType: questionData.question_type,
      studentAnswerText,
      correctAnswerText,
      finalIsCorrect,
      aiModel: aiResponse.data.ai_model,
      success: aiResponse.success
    });

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