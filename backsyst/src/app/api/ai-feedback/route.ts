import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroqAPI(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) {
    console.warn('Groq API key not configured, will use local analysis');
    return '';
  }

  try {
    console.log('Calling Groq API...');
    
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
            content: 'You are an expert German language tutor for A1-A2 level students. Provide detailed, constructive feedback in Indonesian.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 6000,
        top_p: 0.9
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', response.status, response.statusText);
      console.error('Error details:', errorData);
      
      if (response.status === 429) {
        console.error('Rate limit hit! Retry after:', response.headers.get('retry-after'));
        throw new Error('API rate limit exceeded - please try again in a moment');
      }
      
      return '';
    }

    const result = await response.json() as any;
    const content = result.choices?.[0]?.message?.content || '';
    
    if (!content) {
      console.warn('Empty response from Groq API');
      return '';
    }
    
    console.log('Groq API response received successfully');
    console.log('Response content length:', content.length, 'characters');
    

    if (content.length > 100) {
      const lastChars = content.slice(-20);
      console.log('Last 20 characters:', lastChars);
    }
    
    return content;
  } catch (error) {
    console.error('Groq API call failed:', error);
    return '';
  }
}

function countSentences(text: string): number {
  if (!text) return 0;
  const sentences = text.split(/[.!?]+(?=\s|$)/).filter(s => s.trim().length > 0);
  return sentences.length;
}

function validateFeedbackLength(text: string): { valid: boolean; count: number; message: string } {
  const count = countSentences(text);
  const MIN_SENTENCES = 60;
  const MAX_SENTENCES = 120;
  
  if (count < MIN_SENTENCES) {
    return {
      valid: false,
      count,
      message: `Feedback terlalu pendek: ${count} kalimat (minimum 60 kalimat)`
    };
  }
  
  if (count > MAX_SENTENCES) {
    return {
      valid: false,
      count,
      message: `Feedback terlalu panjang: ${count} kalimat (maksimal 120 kalimat)`
    };
  }
  
  return {
    valid: true,
    count,
    message: `Feedback memenuhi requirement: ${count} kalimat (60-120)`
  };
}

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

  if (questionType === 'essay') {
    allRefs = [...allRefs, ...GERMAN_REFERENCES.essay];
  }

  const searchTerms = `${questionText} ${correctAnswerText} ${selectedAnswerText}`.toLowerCase();

  const grammarKeywords = ['verb', 'artikel', 'grammar', 'konjugation', 'deklinasi', 'kasus', 'nominativ', 'akkusativ', 'dativ'];
  const vocabularyKeywords = ['wort', 'vocabulary', 'bedeutung', 'wörterbuch', 'kosakata'];
  const essayKeywords = ['essay', 'schreiben', 'text', 'struktur', 'aufsatz'];

  const hasGrammarIssues = grammarKeywords.some(keyword => searchTerms.includes(keyword));
  const hasVocabularyIssues = vocabularyKeywords.some(keyword => searchTerms.includes(keyword));
  const hasEssayIssues = questionType === 'essay' || essayKeywords.some(keyword => searchTerms.includes(keyword));

  let prioritizedRefs = [];

  if (hasGrammarIssues) {
    prioritizedRefs.push(...GERMAN_REFERENCES.grammar.slice(0, 1));
    prioritizedRefs.push(...GERMAN_REFERENCES.conjugation.slice(0, 1));
  }

  if (hasVocabularyIssues) {
    prioritizedRefs.push(...GERMAN_REFERENCES.vocabulary.slice(0, 1));
  }

  if (hasEssayIssues) {
    prioritizedRefs.push(...GERMAN_REFERENCES.essay.slice(0, 1));
  }

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

async function generateAIFeedbackWithGroq(
  question: Question,
  studentAnswerText: string,
  correctAnswerText: string,
  isCorrect: boolean
): Promise<AIFeedbackResponse> {
  const startTime = Date.now();

  try {

    const relevantReferences = selectRelevantReferences(
      question.question_text,
      correctAnswerText,
      studentAnswerText,
      question.question_type
    );

    const prompt = `
Kamu tutor bahasa Jerman A1-A2 yang ekspresif & genuine! Tone: natural, ada emoji, encouraging tapi tidak kaku 🎯

Pertanyaan: "${question.question_text}"
Jawaban siswa: "${studentAnswerText || 'Tidak ada jawaban'}"
Status: ${isCorrect ? 'Oke!' : 'Tidak apa apa, mari perbaiki'}

CARA FEEDBACK:
${isCorrect
      ? `JAWABAN BENAR 💯:
  - Start ekspresif: "Wah keren! 😎" atau "Tepat banget! ✨" atau "Ini jawaban yang solid! 👌"
  - Jelasin kenapa benar (konkret, singkat)
  - Komplimen: apa yang mereka kuasai
  - Saran advanced? Optional saja
  - Ending: "Terus gini! 💪" atau "Mantap!" bukan "Terus semangat"`
      : `JAWABAN PERLU PERBAIKAN 🤔:
  - Start apresiasi-expressive: "Tidak apa apa! 😊" atau "Hampir saja! 👀" atau "Bagus dicoba, tapi mari..."
  - Jelaskan GENTLE: "Yang benar sih..." bukan "Kamu salah"
  - Analisis: apa kurangnya? Contoh konkret
  - Ending: "Dengan latihan pasti click! 💡" atau "Next time kamu bisa! 🚀"`}

CHECKLIST ANALISIS:
• Grammar: Konjugasi verb? Artikel tepat? Word order German?
• Vocabulary: Kata sesuai konteks? Ada yang lebih natural?
• Flow: Kalimat logis & mudah dipahami?

FORMAT RESPONSE (JSON - NO markdown):
{
  "feedback_text": "Feedback ekspresif dengan emoji (maks 150 kata). Buat siswa smile/termotivasi!",
  "explanation": "Analisis detail dengan • bullets (maks 300 kata). Tone: natural, bukan academic kaku!"
}`;

    console.log('Calling Groq API...');

    const aiContent = await callGroqAPI(prompt);
    
    if (!aiContent) {
      throw new Error('No response from Groq, will use local analysis');
    }

    console.log('Groq response received');

    console.log('Raw Groq content:', aiContent);

    let parsedContent: any;
    try {
    
      let cleanContent = aiContent.trim();

      cleanContent = cleanContent.replace(/```(?:json)?\s*|\s*```/g, '');

      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      console.log('Cleaned content for parsing:', cleanContent);
      
      parsedContent = JSON.parse(cleanContent);

      if (!parsedContent.feedback_text || !parsedContent.explanation) {
        throw new Error('Missing required fields in Claude response');
      }
      
    } catch (parseError) {
      console.error('Parse error, attempting manual extraction. Raw content:', aiContent);

      const feedbackMatch = aiContent.match(/"feedback_text":\s*"([^"]+)"/);
      const explanationMatch = aiContent.match(/"explanation":\s*"([^"]+)"/);
      
      if (feedbackMatch && explanationMatch) {
        parsedContent = {
          feedback_text: feedbackMatch[1],
          explanation: explanationMatch[1]
        };
      } else {
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
        ai_model: 'groq-llama-3.1-8b-instant',
      }
    };
  } catch (error: unknown) {
    console.error('Groq Feedback generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.log('Falling back to local analysis due to:', errorMessage);
    console.error('Error Stack:', error instanceof Error ? error.stack : 'No stack trace');

    const fallbackReferences = [
      GERMAN_REFERENCES.essay[0],
      GERMAN_REFERENCES.grammar[0],
      GERMAN_REFERENCES.vocabulary[0]
    ].map(({ title, url, description }) => ({ title, url, description }));

    const analyzeStudentText = (text: string, questionText: string) => {
      const analysisPoints = [];
      const text_lower = text.toLowerCase();
      const question_lower = questionText.toLowerCase();

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
      
      const sentences = text.split(/[.!?]+/).filter(s => s.trim());
      if (sentences.length > 0) {

        if (text_lower.includes('ich ') && (text_lower.includes(' bin') || text_lower.includes(' habe') || text_lower.includes(' ist'))) {
          analysisPoints.push("• GRAMMAR: Periksa konjugasi - 'ich' menggunakan 'bin', 'habe', bukan 'ist'");
        }
        
        const articleMatches = text.match(/\b(der|die|das|ein|eine|einen|einem|einer)\b/gi);
        if (articleMatches && articleMatches.length > 0) {
          analysisPoints.push(`• ARTIKEL: Ditemukan ${articleMatches.length} artikel - pastikan sesuai gender kata benda (${articleMatches.slice(0, 3).join(', ')})`);
        } else if (text.length > 20) {
          analysisPoints.push("• ARTIKEL: Pertimbangkan penggunaan artikel definit/indefinit dalam kalimat");
        }

        if (sentences.length > 1) {
          analysisPoints.push("• STRUCTURE: Kalimat majemuk terdeteksi - periksa penggunaan konjungsi dan word order");
        }
        
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

    const relevantReferences = selectRelevantReferences(
      question.question_text,
      correctAnswerText,
      studentAnswerText,
      question.question_type
    );

    let prompt = '';
    
    if (question.question_type === 'sentence_arrangement') {
      prompt = `
Kamu adalah expert German teacher untuk siswa level A1-A2 yang memberikan SATU NARASI FEEDBACK LENGKAP untuk soal sentence arrangement/puzzle mengisi celah kalimat!

KONTEKS SOAL:
Pertanyaan: "${question.question_text}"
Jawaban siswa: "${studentAnswerText || 'Tidak ada jawaban'}"
Jawaban benar: "${correctAnswerText || 'Tidak diketahui'}"
Status: ${isCorrect ? 'CORRECT!' : 'INCORRECT'}

INSTRUKSI - BUAT SATU NARASI LENGKAP:

Mulai dengan REAKSI AWAL yang natural dan encouraging, kemudian jelaskan dengan DETAIL:

REAKSI (Baris pertama - singkat, encouraging):
   ${isCorrect 
     ? `Berikan pujian authentic atas jawaban yang benar` 
     : `Appreciate usaha mereka dengan gentle correction`}

ANALISIS LENGKAP yang mengalir:
   • Urutan kata (word order) dalam kalimat German - apakah V2/V-final benar?
   • Grammar: verb conjugation, case endings (Nominatif/Akkusativ/Dativ)
   • Vocabulary: apakah kata yang dipilih natural dan sesuai konteks?
   • Structure: apakah penempatan kata/frasa sudah tepat?

PENJELASAN SPESIFIK:
   ${isCorrect
     ? `Highlight part mana yang PALING TRICKY dari struktur ini
      Explain WHY ini adalah jawaban yang CORRECT
      Give 1 contoh kalimat lain dengan pattern yang sama
      Share 1 common mistake yang sering students buat`
     : `Jelaskan SPECIFICALLY MENGAPA jawaban siswa salah
      Jelaskan apa yang SEHARUSNYA dan WHY (konkret!)
      Show struktur/pattern yang benar dengan example
      Give 2 contoh lain dengan pattern yang sama
      Share tips khusus untuk soal serupa di masa depan`}

FORMAT OUTPUT (JSON):
{
  "feedback_text": "SATU NARASI LENGKAP feedback (bukan 2 bagian, tapi satu cerita utuh yang mengalir dari reaksi → analisis → contoh). Natural tone, encouraging, specific. MINIMUM 60 KALIMAT, MAKSIMAL 120 KALIMAT."
}

CRITICAL: 
- Return ONLY 1 field: "feedback_text" yang berisi SATU NARASI LENGKAP
- WAJIB: Antara 60-120 kalimat (jumlah kalimat penting!)
- NO "explanation" field, NO terpisah-pisah
- Tone: Natural, friendly, encouraging, specific examples
- Struktur: Reaksi → Analisis → Contoh → Tips (MENGALIR seperti percakapan)
- Return ONLY valid JSON!`;
    } else if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
      prompt = `
Kamu adalah expert German teacher untuk siswa level A1-A2 yang memberikan SATU NARASI FEEDBACK LENGKAP, DETAIL, EDUKATIF & MOTIVATIF untuk soal pilihan ganda!

KONTEKS SOAL LENGKAP:
Tipe soal: ${question.question_type === 'multiple_choice' ? 'Multiple Choice (Pilihan Ganda)' : 'True/False'}
Pertanyaan: "${question.question_text}"
Jawaban siswa: "${studentAnswerText || 'Tidak ada jawaban'}"
Jawaban BENAR: "${correctAnswerText || 'Tidak diketahui'}"
Status: ${isCorrect ? 'CORRECT!' : 'INCORRECT'}

INSTRUKSI - BUAT SATU NARASI LENGKAP, EDUKATIF & MOTIVATIF:

KHUSUS UNTUK JAWABAN SALAH - Feedback harus lebih DETAIL dengan:
${!isCorrect ? `
REAKSI ENCOURAGEMENT (Baris pertama):
   • Appreciate usaha mereka dengan genuine dan gentle
   • Jangan membuat mereka merasa buruk, tapi motivatif

ANALISIS DETAIL MENGAPA JAWABAN SALAH:
   • Apa KONSEP GRAMMAR/VOCAB yang di-test soal ini?
   • JAWABAN SISWA mengapa SALAH? Jelaskan dengan konkret & spesifik
   • Apa GRAMMAR/VOCAB RULE yang dilanggar atau tidak tepat?
   • JAWABAN BENAR mengapa TEPAT? Jelaskan rule/concept-nya

PENJELASAN PERBEDAAN KONKRET:
   • Bandingkan langsung: "Jawaban Anda mengatakan [X], tapi seharusnya [Y] karena..."
   • Jelaskan RULE/CONCEPT yang digunakan dalam jawaban benar
   • Beri 1-2 contoh KALIMAT LAIN yang menggunakan rule yang sama
   • Highlight common mistakes: "Banyak students buat kesalahan ini karena..."

TIPS UNTUK IMPROVE:
   • Apa yang perlu diingat untuk avoid kesalahan serupa
   • Gimme strategy atau tips untuk identify jawaban benar di soal serupa
   • Encourage mereka untuk terus berlatih

TONE KHUSUS UNTUK JAWABAN SALAH:
• Gentle & supportive (tidak critical)
• Motivating ("Ini bagian dari process belajar!")
• Clear & specific (bukan vague)
• Constructive (fokus improvement, bukan kesalahan)
` : `
REAKSI (Pujian authentic):
   • Celebrate jawaban mereka yang benar
   • Highlight konsep mana yang mereka kuasai dengan baik

PENJELASAN SINGKAT:
   • Kenapa jawaban ini CORRECT
   • Konsep grammar/vocab apa yang tepat
   • Why other options wrong (brief)

TIPS & CONTOH:
   • 1-2 contoh kalimat lain dengan pattern yang sama
   • Tips untuk confident di soal serupa
`}

FORMAT OUTPUT (JSON):
{
  "feedback_text": "SATU NARASI LENGKAP feedback yang DETAIL, EDUKATIF & MOTIVATIF. Untuk jawaban salah: analisis → perbedaan konkret → examples → tips. Untuk benar: lebih singkat tapi jelas. MINIMUM 60 KALIMAT, MAKSIMAL 120 KALIMAT."
}

CRITICAL REQUIREMENTS:
- Return ONLY "feedback_text" field
- WAJIB: Antara 60-120 kalimat (jumlah kalimat sangat penting!)
- TONE: Motivatif & encouraging bahkan untuk jawaban salah
- CONTENT: Spesifik & akurat (reference actual concepts)
- STRUCTURE: Mengalir seperti percakapan dengan guru
- DETAIL: Especially untuk jawaban SALAH - explain deeply why & how to improve
- Return ONLY valid JSON!`;
    } else if (question.question_type === 'essay') {
      prompt = `
Kamu adalah expert German teacher untuk siswa level A1-A2 yang memberikan SATU NARASI FEEDBACK LENGKAP untuk soal essay!

KONTEKS SOAL:
Pertanyaan: "${question.question_text}"
Jawaban siswa: "${studentAnswerText || 'Tidak ada jawaban'}"
Jawaban ideal: "${correctAnswerText || 'Tidak diketahui'}"
Status: ${isCorrect ? 'GOOD!' : 'PERLU PERBAIKAN'}

INSTRUKSI - BUAT SATU NARASI LENGKAP & DETAIL:

Mulai dengan REAKSI AWAL yang natural, kemudian jelaskan dengan DETAIL:

REAKSI (Baris pertama - singkat, encouraging):
   ${isCorrect 
     ? `Berikan pujian authentic atas essay yang bagus` 
     : `Appreciate usaha mereka dengan gentle constructive feedback`}

ANALISIS LENGKAP yang mengalir:
   • Apa yang BAGUS dari jawaban mereka? (spesifik!)
   • Apa yang PERLU diperbaiki? (be gentle but specific!)
   • Grammar issues (if any): verb conjugation, case, word order, sentence structure
   • Vocabulary: apakah word choices natural dan sesuai context?
   • Content/Ideas: apakah answering the question dengan lengkap?
   • Struktur: apakah ada paragraph breaks, flow yang jelas?

PENJELASAN SPESIFIK:
   ${isCorrect
     ? `Highlight apa yang impressive dari essay ini (grammar, vocabulary, ideas)
      Share 1-2 examples dari essay mereka yang bagus
      Give suggestion untuk level yang lebih advanced
      Encourage untuk terus write more!`
     : `Point out SPECIFIC grammar/vocab errors dengan gentle explanation
      Show how to correct mereka dengan contoh konkret
      Explain vocabulary/grammar rules yang violated
      Give tips untuk improve essay next time
      Share positive aspects juga untuk encourage!`}

FORMAT OUTPUT (JSON):
{
  "feedback_text": "SATU NARASI LENGKAP feedback essay yang konstruktif, encouraging, DETAIL. Highlight strengths & areas for improvement dengan spesifik. MINIMUM 60 KALIMAT, MAKSIMAL 120 KALIMAT."
}

CRITICAL: 
- Return ONLY 1 field: "feedback_text" yang berisi SATU NARASI LENGKAP
- WAJIB: Antara 60-120 kalimat`;
    } else {
      prompt = `
Kamu adalah tutor bahasa Jerman yang sangat supportive untuk siswa level A1-A2!

Pertanyaan: "${question.question_text}"
Jawaban siswa: "${studentAnswerText || 'Tidak ada jawaban'}"
Jawaban yang benar: "${correctAnswerText || 'Tidak diketahui'}"
Status: ${isCorrect ? 'Benar!' : 'Perlu perbaikan'}

INSTRUKSI - BUAT SATU NARASI FEEDBACK LENGKAP:

Tulis feedback sebagai SATU CERITA MENGALIR yang:
1. Mulai dengan REAKSI natural dan encouraging
2. Jelaskan detail analysis (grammar, vocab, structure)
3. Berikan contoh konkret
4. Akhiri dengan motivasi/tips

Tone: Friendly, supportive, NOT robotic. Buat siswa merasa:
- Didukung dan tidak dihakimi
- Bangga dengan usahanya  
- Termotivasi untuk belajar lebih

FORMAT OUTPUT (JSON):
{
  "feedback_text": "SATU NARASI LENGKAP feedback (reaksi → analisis → contoh → tips) yang mengalir seperti percakapan dengan guru. 300-400 words."
}

CRITICAL: Return ONLY "feedback_text" field dengan narasi lengkap, tidak terpisah!`;
    }

    console.log('Calling Groq...');

    const aiContent = await callGroqAPI(prompt);
    
    if (!aiContent) {
      throw new Error('No response from Groq, will use local analysis');
    }

    console.log('Response received!');

    let parsedContent: any;
    try {
      let cleanContent = aiContent.trim();
      cleanContent = cleanContent.replace(/```(?:json)?\s*|\s*```/g, '');

      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      console.log('Attempting JSON parse...');
      console.log('Cleaned content for parsing:', cleanContent.substring(0, 100) + '...');
      
      parsedContent = JSON.parse(cleanContent);

      if (!parsedContent.feedback_text) {
        throw new Error('Missing feedback_text in AI response');
      }
      
      parsedContent.feedback_text = String(parsedContent.feedback_text).trim();
      console.log('JSON parse successful. Feedback length:', parsedContent.feedback_text.length);
      
      const validation = validateFeedbackLength(parsedContent.feedback_text);
      console.log(validation.message);
      if (!validation.valid) {
        console.warn('Feedback validation warning:', validation.message);
      }
      
    } catch (parseError) {
      console.error('JSON parse failed, attempting manual extraction...');
      console.log('Response length:', aiContent.length, 'characters');
      console.log('First 200 chars:', aiContent.substring(0, 200));
      console.log('Last 200 chars:', aiContent.substring(Math.max(0, aiContent.length - 200)));

      let feedbackText = null;

      let feedbackMatch = aiContent.match(/"feedback_text"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
      if (feedbackMatch) {
        feedbackText = feedbackMatch[1].replace(/\\"/g, '"');
        console.log('Pattern 1 matched. Length:', feedbackText.length);
      }

      if (!feedbackText) {
        feedbackMatch = aiContent.match(/"feedback_text"\s*:\s*"([^"]*?)(?:"|$)/);
        if (feedbackMatch) {
          feedbackText = feedbackMatch[1].replace(/\\"/g, '"');
          console.log('Pattern 2 matched (partial). Length:', feedbackText.length);
        }
      }

      if (!feedbackText) {
        const lines = aiContent.split('\n').filter((line: string) => line.trim().length > 0);
        const allContent = lines.join(' ');
        
        if (allContent.length > 20 && !allContent.includes('error')) {
          feedbackText = allContent.replace(/^[{"]*(feedback_text[":,\s]*)*/i, '').replace(/["}\s]*$/, '');
          console.log('Pattern 3 matched (raw content). Length:', feedbackText.length);
        }
      }

      if (!feedbackText || feedbackText.length < 20) {
        console.warn('All extraction patterns failed, using fallback');
        feedbackText = isCorrect ? 
          "Sempurna! Jawaban Anda menunjukkan pemahaman yang baik terhadap struktur kalimat Jerman. Anda sudah menangkap word order yang benar, case endings yang tepat, dan pemilihan kata yang natural. Terus pertahankan kualitas ini dan jangan ragu untuk mencoba struktur yang lebih kompleks! Semakin banyak Anda berlatih, semakin mahir Anda akan menjadi. 💪" :
          "Jawaban Anda memerlukan beberapa perbaikan. Mari kita analisis apa yang perlu diperbaiki. Fokus pada beberapa aspek kunci: pertama, perhatikan word order dalam kalimat German - apakah verb berada di posisi yang benar? Kedua, periksa case endings untuk nominatif, akkusativ, dan dativ. Ketiga, pastikan pemilihan kata sesuai dengan konteks. Jangan khawatir, ini adalah bagian dari proses belajar. Terus berlatih dan Anda pasti akan semakin baik! 🤔";
      }

      parsedContent = {
        feedback_text: feedbackText.trim()
      };
      
      console.log('Final feedback extracted. Length:', parsedContent.feedback_text.length);
      
      const extractedValidation = validateFeedbackLength(parsedContent.feedback_text);
      console.log(extractedValidation.message);
      if (!extractedValidation.valid) {
        console.warn('Extracted feedback validation warning:', extractedValidation.message);
      }
    }

    const processingTime = Date.now() - startTime;
    const finalValidation = validateFeedbackLength(parsedContent.feedback_text);
    console.log('Processing time:', processingTime, 'ms');
    console.log(finalValidation.message);

    return {
      success: true,
      data: {
        feedback_text: parsedContent.feedback_text || "Feedback tidak tersedia",
        explanation: "", 
        reference_materials: relevantReferences,
        processing_time_ms: processingTime,
        ai_model: 'groq-llama-3.1-8b-instant',
      }
    };
  } catch (error: unknown) {
    console.error('Groq Feedback generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('AI Feedback generation error - Message:', errorMessage);
    console.error('AI Feedback generation error - Stack:', error instanceof Error ? error.stack : 'No stack trace');

    const fallbackReferences = [
      GERMAN_REFERENCES.grammar[0],
      GERMAN_REFERENCES.vocabulary[0],
      GERMAN_REFERENCES.conjugation[0]
    ].map(({ title, url, description }) => ({ title, url, description }));

    return {
      success: false,
      error: errorMessage,
      data: {
        feedback_text: "Maaf, terjadi kesalahan saat menghasilkan feedback AI. Sistem sedang mengalami gangguan. Silakan coba submit jawaban lagi nanti. Kami akan memperbaiki segera!",
        explanation: "",
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

    console.log('Checking cache for question:', questionId);
    const { data: cachedFeedback, error: cacheError } = await supabaseAdmin
      .from('ai_feedback_cache')
      .select('*')
      .eq('question_id', questionId)
      .eq('is_correct', isCorrect)
      .maybeSingle();

    if (!cacheError && cachedFeedback) {
      console.log('Cache HIT - Using cached feedback for question:', questionId);
      return Response.json({
        success: true,
        data: {
          feedback_text: cachedFeedback.feedback_text,
          explanation: cachedFeedback.explanation,
          reference_materials: cachedFeedback.reference_materials,
          processing_time_ms: cachedFeedback.processing_time_ms,
          ai_model: cachedFeedback.ai_model,
        },
        cached: true,
        cachedAt: cachedFeedback.created_at
      });
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
      
      aiResponse = await generateAIFeedbackWithGroq(
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

    if (aiResponse.success || aiResponse.data?.feedback_text) {
      console.log('Caching feedback for question:', questionId);
      const { error: cacheInsertError } = await supabaseAdmin
        .from('ai_feedback_cache')
        .upsert([{
          question_id: questionId,
          is_correct: finalIsCorrect,
          feedback_text: aiResponse.data.feedback_text,
          explanation: aiResponse.data.explanation,
          reference_materials: aiResponse.data.reference_materials,
          ai_model: aiResponse.data.ai_model,
          processing_time_ms: aiResponse.data.processing_time_ms,
          created_at: new Date().toISOString()
        }], {
          onConflict: 'question_id, is_correct'
        });

      if (cacheInsertError) {
        console.warn('Cache insert failed (non-critical):', cacheInsertError.message);
      } else {
        console.log('Feedback cached successfully');
      }
    }

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
    console.error('AI Feedback API error - Full error object:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('AI Feedback API error - Message:', errorMessage);
    console.error('AI Feedback API error - Stack:', error instanceof Error ? error.stack : 'No stack trace');

    return Response.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}