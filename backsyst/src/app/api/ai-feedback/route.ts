import { createClient } from '@supabase/supabase-js';
import { 
  generateContextualFallback, 
  analyzeGermanGrammar, 
  selectBestReferences 
} from './fallback-analyzer';
import {
  buildOptimizedPrompt,
  formatPromptForAPI,
  validatePromptConfig
} from './prompt-engineering';
import {
  selectSmartReferences,
  detectErrorCategories,
  convertToReferenceMaterials
} from './semantic-references';
import {
  validateFeedback,
  generateRetryStrategy,
  shouldRetry,
  VALIDATION_CONFIG
} from './validation-retry';
import {
  getCachedFeedback,
  findSimilarCachedFeedback,
  saveFeedbackToCache,
  getCacheStats,
  clearExpiredCache,
  DEFAULT_CACHE_CONFIG,
  type CacheEntry
} from './feedback-cache';
import {
  logEvent,
  logSuccess,
  logApiError,
  logDatabaseError,
  logValidationIssue,
  logCacheOperation,
  logTimeout,
  logFallbackUsage,
  getErrorMetrics,
  getQualityMetrics,
  getPerformanceMetrics,
  checkAndCreateAlerts,
  getActiveAlerts,
  resolveAlert,
  generateRequestId,
  LogLevel,
  ErrorCategory,
  type LogEntry,
  type ErrorMetrics,
  type QualityMetrics,
  type PerformanceMetrics
} from './error-handler-logging';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqAPIConfig {
  systemMessage: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

async function callGroqAPI(config: GroqAPIConfig, retryCount = 0, maxRetries = 3): Promise<string> {
  if (!GROQ_API_KEY) {
    console.warn('Groq API key not configured, will use local analysis');
    return '';
  }

  try {
    console.log(`Calling Groq API (attempt ${retryCount + 1}/${maxRetries + 1})...`);
    
    const response = await fetch(GROQ_API_URL, {
      headers: { 
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ 
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: config.systemMessage
          },
          {
            role: 'user',
            content: config.userMessage
          }
        ],
        temperature: config.temperature || 0.75,
        max_tokens: config.maxTokens || 2000,
        top_p: config.topP || 0.9
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', response.status, response.statusText);
      console.error('Error details:', errorData);
      
      if (response.status === 429) {
        // Rate limit hit - extract retry-after time
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 15000; // Default 15 seconds
        
        console.log(`Rate limit hit! Waiting ${waitTime / 1000}s before retry...`);
        
        // If we haven't exceeded max retries, wait and retry
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
          console.log(`Retrying after ${waitTime / 1000}s delay...`);
          return callGroqAPI(config, retryCount + 1, maxRetries);
        } else {
          console.error('Max retries exceeded for rate limit');
          throw new Error('API rate limit exceeded - please try again later');
        }
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

interface ValidationAndRetryResult {
  content: string;
  validated: boolean;
  attempts: number;
  finalScore: number;
  issues: string[];
}

async function callGroqAPIWithValidationAndRetry(
  basePromptConfig: {
    systemMessage: string;
    userMessage: string;
    temperature: number;
    maxTokens: number;
    topP: number;
  },
  studentAnswer: string,
  correctAnswer: string,
  questionText: string,
  isCorrect: boolean,
  maxAttempts: number = 2
): Promise<ValidationAndRetryResult> {
  let currentAttempt = 1;
  let lastValidationScore = 0;
  let bestResponse = '';
  let allIssues: string[] = [];

  while (currentAttempt <= maxAttempts) {
    console.log(`\n=== Attempt ${currentAttempt}/${maxAttempts} ===`);

    const response = await callGroqAPI({
      systemMessage: basePromptConfig.systemMessage,
      userMessage: basePromptConfig.userMessage,
      temperature: basePromptConfig.temperature,
      maxTokens: basePromptConfig.maxTokens,
      topP: basePromptConfig.topP,
    });

    if (!response) {
      console.log(`Attempt ${currentAttempt}: No response from API`);
      currentAttempt++;
      continue;
    }

    let feedbackText = '';
    try {
      let cleanContent = response.trim();
      
      // Try to parse as JSON first
      cleanContent = cleanContent.replace(/```(?:json)?\s*|\s*```/g, '');
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        // Found JSON structure
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          feedbackText = parsed.feedback_text || '';
        } catch (jsonError) {
          // JSON parsing failed, treat entire response as feedback text
          console.log(`Attempt ${currentAttempt}: JSON parsing failed, using raw response`);
          feedbackText = cleanContent;
        }
      } else {
        // No JSON structure found, use entire response as feedback
        console.log(`Attempt ${currentAttempt}: No JSON structure found, using raw response`);
        feedbackText = cleanContent;
      }
    } catch (e) {
      console.log(`Attempt ${currentAttempt}: Error processing response, using raw text`);
      feedbackText = response.trim();
    }

    if (!feedbackText || feedbackText.length < 50) {
      console.log(`Attempt ${currentAttempt}: Feedback too short or empty (${feedbackText.length} chars)`);
      currentAttempt++;
      continue;
    }

    const validation = validateFeedback(
      feedbackText,
      studentAnswer,
      correctAnswer,
      questionText,
      isCorrect
    );

    console.log(`Attempt ${currentAttempt} - Score: ${validation.score}/100`);
    console.log(`Issues: ${validation.issues.length} (${validation.issues.filter(i => i.severity === 'critical').length} critical)`);

    lastValidationScore = validation.score;
    bestResponse = feedbackText;
    allIssues = validation.issues.map(i => i.message);

    const { shouldRetry: retryNeeded, reason } = shouldRetry(
      validation,
      maxAttempts,
      currentAttempt
    );

    if (!retryNeeded) {
      console.log(`✓ Validation passed. Score: ${validation.score}/100`);
      return {
        content: feedbackText,
        validated: validation.isValid,
        attempts: currentAttempt,
        finalScore: validation.score,
        issues: allIssues
      };
    }

    console.log(`✗ Validation failed: ${reason}`);
    console.log(`Quality score: ${validation.score}/100 (target: ${VALIDATION_CONFIG.recommendedScore})`);

    if (currentAttempt < maxAttempts) {
      const retryStrategy = generateRetryStrategy(
        validation,
        basePromptConfig.userMessage,
        currentAttempt + 1
      );

      console.log(`Retry strategy: ${retryStrategy.reason}`);
      console.log(`Modifications: ${retryStrategy.modifications.join('; ')}`);

      basePromptConfig.userMessage = retryStrategy.modifiedPrompt;
    }

    currentAttempt++;
  }

  console.log(`\nFinal result after ${currentAttempt - 1} attempts:`);
  console.log(`Score: ${lastValidationScore}/100`);
  console.log(`Issues found: ${allIssues.length}`);

  return {
    content: bestResponse,
    validated: lastValidationScore >= VALIDATION_CONFIG.minimumPassScore,
    attempts: currentAttempt - 1,
    finalScore: lastValidationScore,
    issues: allIssues
  };
}

function countSentences(text: string): number {
  if (!text) return 0;
  const sentences = text.split(/[.!?]+(?=\s|$)/).filter(s => s.trim().length > 0);
  return sentences.length;
}



function validateFeedbackLength(text: string): { valid: boolean; count: number; message: string } {
  const count = countSentences(text);
  const MIN_SENTENCES = 12;  
  const MAX_SENTENCES = 100; 
  
  if (count < MIN_SENTENCES) {
    return {
      valid: false,
      count,
      message: `Feedback terlalu pendek: ${count} kalimat (minimum 12 kalimat)`
    };
  }
  
  if (count > MAX_SENTENCES) {
    return {
      valid: false,
      count,
      message: `Feedback terlalu panjang: ${count} kalimat (maksimal 100 kalimat)`
    };
  }
  
  return {
    valid: true,
    count,
    message: `Feedback memenuhi requirement: ${count} kalimat (12-100)`
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
  explanation?: string;
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
  isCorrect: boolean,
  lessonContent?: string
): Promise<AIFeedbackResponse> {
  const startTime = Date.now();

  try {

    const referenceMatches = selectSmartReferences(
      studentAnswerText,
      correctAnswerText,
      question.question_text,
      3 
    );
    const relevantReferences = convertToReferenceMaterials(referenceMatches);

    const promptConfig = buildOptimizedPrompt(
      question.question_type,
      question.question_text,
      studentAnswerText,
      correctAnswerText,
      isCorrect,
      undefined,
      lessonContent
    );

    const validation = validatePromptConfig(promptConfig);
    if (!validation.valid) {
      console.warn('Prompt validation warnings:', validation.errors);
    }

    console.log(`Building structured prompt for ${question.question_type} question...`);
    console.log('Prompt config:', {
      model: promptConfig.model,
      temperature: promptConfig.temperature,
      maxTokens: promptConfig.maxTokens,
      topP: promptConfig.topP
    });

    const validationResult = await callGroqAPIWithValidationAndRetry(
      {
        systemMessage: promptConfig.systemMessage,
        userMessage: promptConfig.userPrompt,
        temperature: promptConfig.temperature,
        maxTokens: promptConfig.maxTokens,
        topP: promptConfig.topP
      },
      studentAnswerText,
      correctAnswerText,
      question.question_text,
      isCorrect,
      2 
    );

    if (!validationResult.content) {
      throw new Error('No valid response from Groq after validation retry');
    }

    console.log(`✓ Groq response validated - Score: ${validationResult.finalScore}/100 (${validationResult.attempts} attempt(s))`);

    let parsedContent: any;
    try {
      parsedContent = {
        feedback_text: validationResult.content
      };

      if (!parsedContent.feedback_text) {
        throw new Error('Missing feedback_text field in response');
      }
      
    } catch (parseError) {
      console.error('Parse error. Using fallback analyzer.');

      const feedbackMatch = validationResult.content.match(/"feedback_text":\s*"([^"]+)"/);
      
      if (feedbackMatch) {
        parsedContent = {
          feedback_text: feedbackMatch[1]
        };
      } else {
        console.log('Using fallback analyzer due to parsing failure');
        const fallbackFeedback = generateContextualFallback(
          studentAnswerText,
          correctAnswerText,
          question.question_text,
          question.question_type,
          isCorrect
        );
        parsedContent = {
          feedback_text: fallbackFeedback
        };
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        feedback_text: parsedContent.feedback_text || "Feedback tidak tersedia",
        reference_materials: relevantReferences,
        processing_time_ms: processingTime,
        ai_model: 'groq-llama-3.3-70b-versatile',
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
      `Jawaban Anda menunjukkan upaya yang baik untuk menjawab pertanyaan tentang "${question.question_text}". Secara keseluruhan struktur bahasa Jerman sudah cukup baik, namun beberapa aspek dapat diperbaiki untuk mencapai tingkat yang lebih optimal.${detectedIssues.length > 0 ? '\n\n' + detectedIssues.join('\n') : ''}` :
      `Jawaban Anda untuk pertanyaan "${question.question_text}" memerlukan perbaikan dalam beberapa aspek. Mari kita analisis bagian-bagian yang perlu diperhatikan dalam bahasa Jerman.\n\n${detectedIssues.length > 0 ? detectedIssues.join('\n') : '• Fokus pada relevansi jawaban dengan pertanyaan dan perbaiki tata bahasa dasar'}`;

    return {
      success: false,
      error: errorMessage,
      data: {
        feedback_text: fallbackFeedback,
        reference_materials: fallbackReferences,
        processing_time_ms: Date.now() - startTime,
        ai_model: 'fallback-analyzer'
      }
    };
  }
}

async function generateAIFeedback(
  question: Question,
  studentAnswerText: string,
  correctAnswerText: string,
  isCorrect: boolean,
  lessonContent?: string
): Promise<AIFeedbackResponse> {
  const startTime = Date.now();

  try {
    
    const referenceMatches = selectSmartReferences(
      studentAnswerText,
      correctAnswerText,
      question.question_text,
      3
    );
    const relevantReferences = convertToReferenceMaterials(referenceMatches);

    const promptConfig = buildOptimizedPrompt(
      question.question_type,
      question.question_text,
      studentAnswerText,
      correctAnswerText,
      isCorrect,
      undefined,
      lessonContent
    );

    console.log('Using structured prompt for:', question.question_type);

    const validationResult = await callGroqAPIWithValidationAndRetry(
      {
        systemMessage: promptConfig.systemMessage,
        userMessage: promptConfig.userPrompt,
        temperature: promptConfig.temperature,
        maxTokens: promptConfig.maxTokens,
        topP: promptConfig.topP
      },
      studentAnswerText,
      correctAnswerText,
      question.question_text,
      isCorrect,
      2 
    );

    if (!validationResult.content) {
      throw new Error('No valid response from Groq after validation retry');
    }

    console.log(`✓ Response validated - Score: ${validationResult.finalScore}/100 (${validationResult.attempts} attempt(s))`);

    let parsedContent: any;
    try {
      parsedContent = {
        feedback_text: validationResult.content
      };

      if (!parsedContent.feedback_text) {
        throw new Error('Missing feedback_text in AI response');
      }
      
      parsedContent.feedback_text = String(parsedContent.feedback_text).trim();
      console.log('Feedback length:', parsedContent.feedback_text.length);
      
      const validation = validateFeedbackLength(parsedContent.feedback_text);
      console.log(validation.message);
      if (!validation.valid) {
        console.warn('Feedback validation warning:', validation.message);
      }
      
    } catch (parseError) {
      console.error('JSON parse failed. Using fallback analyzer...');

      const fallbackFeedback = generateContextualFallback(
        studentAnswerText,
        correctAnswerText,
        question.question_text,
        question.question_type,
        isCorrect
      );
      
      parsedContent = {
        feedback_text: fallbackFeedback
      };
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        feedback_text: parsedContent.feedback_text || "Feedback tidak tersedia",
        reference_materials: relevantReferences,
        processing_time_ms: processingTime,
        ai_model: `groq-llama-3.3-70b-versatile (validated: ${validationResult.validated}, score: ${validationResult.finalScore})`,
      }
    };
  } catch (error: unknown) {
    console.error('Groq Feedback generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error Stack:', error instanceof Error ? error.stack : 'No stack trace');

    const fallbackFeedback = generateContextualFallback(
      studentAnswerText,
      correctAnswerText,
      question.question_text,
      question.question_type,
      isCorrect
    );

    let fallbackReferences = [
      GERMAN_REFERENCES.grammar[0],
      GERMAN_REFERENCES.vocabulary[0],
      GERMAN_REFERENCES.conjugation[0]
    ].map(({ title, url, description }) => ({ title, url, description }));

    if (question.question_type === 'essay' || question.question_type === 'sentence_arrangement') {
      if (!isCorrect) {
        const analysis = analyzeGermanGrammar(studentAnswerText, question.question_text);
        fallbackReferences = selectBestReferences(analysis, GERMAN_REFERENCES);
      }
    }

    return {
      success: false,
      error: errorMessage,
      data: {
        feedback_text: fallbackFeedback,
        reference_materials: fallbackReferences,
        processing_time_ms: Date.now() - startTime,
        ai_model: 'fallback-enhanced'
      }
    };
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const questionId = url.searchParams.get('questionId');
  const hoursBack = parseInt(url.searchParams.get('hoursBack') || '24');

  if (action === 'error-metrics') {
    const metrics = await getErrorMetrics(hoursBack);
    return Response.json({
      success: true,
      data: metrics,
      timeRange: `Last ${hoursBack} hours`
    });
  }

  if (action === 'quality-metrics') {
    const metrics = await getQualityMetrics(hoursBack);
    return Response.json({
      success: true,
      data: metrics,
      timeRange: `Last ${hoursBack} hours`
    });
  }

  if (action === 'performance-metrics') {
    const metrics = await getPerformanceMetrics(hoursBack);
    return Response.json({
      success: true,
      data: metrics,
      timeRange: `Last ${hoursBack} hours`
    });
  }

  if (action === 'alerts') {
    const alerts = await getActiveAlerts();
    return Response.json({
      success: true,
      data: {
        alerts,
        activeCount: alerts.filter(a => !a.resolved).length,
        resolvedCount: alerts.filter(a => a.resolved).length
      }
    });
  }

  if (action === 'dashboard') {
    const errorMetrics = await getErrorMetrics(1); // Last 1 hour
    const qualityMetrics = await getQualityMetrics(1);
    const performanceMetrics = await getPerformanceMetrics(1);
    const alerts = await getActiveAlerts();

    return Response.json({
      success: true,
      data: {
        summary: {
          health: 'good',
          lastUpdated: new Date().toISOString()
        },
        metrics: {
          error: errorMetrics,
          quality: qualityMetrics,
          performance: performanceMetrics
        },
        alerts: {
          active: alerts.filter(a => !a.resolved),
          count: alerts.filter(a => !a.resolved).length
        }
      }
    });
  }

  if (action === 'stats') {
    const stats = await getCacheStats();
    return Response.json({
      success: true,
      data: {
        cache: stats,
        config: DEFAULT_CACHE_CONFIG
      }
    });
  }

  if (questionId) {
    try {
      const { data: questionData, error } = await supabaseAdmin
        .from('questions')
        .select('id, question_text, question_type, options(*)')
        .eq('id', questionId)
        .single();

      if (error || !questionData) {
        return Response.json(
          { error: 'Question not found', questionId },
          { status: 404 }
        );
      }

      const cachedCorrect = await getCachedFeedback(questionId, true);
      const cachedIncorrect = await getCachedFeedback(questionId, false);

      return Response.json({
        success: true,
        data: {
          question: questionData,
          cache: {
            correct: cachedCorrect ? true : false,
            incorrect: cachedIncorrect ? true : false
          }
        }
      });
    } catch (error) {
      console.error('GET handler error:', error);
      return Response.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  return Response.json({ error: 'Missing action parameter' }, { status: 400 });
}

export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();
  const requestId = generateRequestId();
  let questionId = '';
  let studentAnswerId = '';

  try {
    const requestBody = await request.json();
    const {
      studentAnswerId: studentIdFromBody,
      questionId: questionIdFromBody,
      attemptId,
      selectedOptionId,
      textAnswer,
      selectedOptionsArray,
      isCorrect,
      lessonContent,
      questionType,
      pointsEarned
    }: {
      studentAnswerId: string;
      questionId: string;
      attemptId: string;
      selectedOptionId: string | null;
      textAnswer: string | null;
      selectedOptionsArray: string[] | null;
      isCorrect: boolean;
      lessonContent?: string;
      questionType?: string;
      pointsEarned?: number;
    } = requestBody;

    questionId = questionIdFromBody;
    studentAnswerId = studentIdFromBody;

    await logEvent({
      level: LogLevel.INFO,
      message: `Request received with lesson content`,
      request_id: requestId,
      question_id: questionId,
      context: {
        studentAnswerId,
        isCorrect,
        hasTextAnswer: !!textAnswer,
        hasLessonContent: !!lessonContent,
        questionType,
        pointsEarned
      }
    });

    if (!studentAnswerId || !questionId || !attemptId) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await logCacheOperation(requestId, 'hit', questionId, { type: 'exact_match_check' });
    const exactCache = await getCachedFeedback(questionId, isCorrect);

    if (exactCache) {
      await logEvent({
        level: LogLevel.DEBUG,
        message: `CACHE HIT (exact): Using cached feedback`,
        request_id: requestId,
        question_id: questionId,
        processing_time_ms: Date.now() - startTime,
        context: {
          cacheType: 'exact',
          originalProcessingTime: exactCache.processing_time_ms,
          timeSaved: exactCache.processing_time_ms - (Date.now() - startTime)
        }
      });

      return Response.json({
        success: true,
        data: {
          feedback_text: exactCache.feedback_text,
          explanation: exactCache.explanation,
          reference_materials: JSON.parse(exactCache.reference_materials),
          processing_time_ms: Date.now() - startTime, 
          ai_model: exactCache.ai_model
        },
        cache: {
          hit: true,
          type: 'exact',
          originalProcessingTime: exactCache.processing_time_ms
        }
      });
    }

    if (DEFAULT_CACHE_CONFIG.enableSimilarityMatching) {
      await logCacheOperation(requestId, 'hit', questionId, { type: 'fuzzy_match_check' });
      const similarCache = await findSimilarCachedFeedback(
        'Select question text from database', // Would get this from question fetch
        isCorrect,
        0.70 
      );

      if (similarCache) {
        await logEvent({
          level: LogLevel.DEBUG,
          message: `CACHE HIT (fuzzy): ${(similarCache.similarity * 100).toFixed(1)}% match`,
          request_id: requestId,
          question_id: questionId,
          processing_time_ms: Date.now() - startTime,
          context: {
            cacheType: 'fuzzy',
            similarity: similarCache.similarity,
            originalQuestionId: similarCache.questionId
          }
        });
        return Response.json({
          success: true,
          data: {
            feedback_text: similarCache.entry?.feedback_text || '',
            explanation: similarCache.entry?.explanation || '',
            reference_materials: similarCache.entry?.reference_materials
              ? JSON.parse(similarCache.entry.reference_materials)
              : [],
            processing_time_ms: Date.now() - startTime,
            ai_model: similarCache.entry?.ai_model || 'unknown'
          },
          cache: {
            hit: true,
            type: 'fuzzy',
            similarity: similarCache.similarity,
            originalQuestionId: similarCache.questionId,
            originalProcessingTime: similarCache.entry?.processing_time_ms
          }
        });
      }
    }

    console.log('[CACHE MISS] Generating new feedback...');

    let rawQuestionData, questionError;
    
    const courseQuestionResult = await supabaseAdmin
      .from('course_questions')
      .select(`
        id,
        question_text:pertanyaan,
        question_type,
        points,
        instruction:perintah,
        answer_statement:jawaban,
        correct_answer:jawaban_benar,
        course_options (id, option_text:jawaban, is_correct, order_index)
      `)
      .eq('id', questionId)
      .single();
    
    if (courseQuestionResult.data && !courseQuestionResult.error) {
      rawQuestionData = courseQuestionResult.data;
      questionError = null;
      
      // For true_false: use jawaban (answer statement) as question_text
      if ((rawQuestionData as any).question_type === 'true_false') {
        if ((rawQuestionData as any).answer_statement) {
          (rawQuestionData as any).question_text = (rawQuestionData as any).answer_statement;
        } else if (!(rawQuestionData as any).question_text && (rawQuestionData as any).instruction) {
          (rawQuestionData as any).question_text = (rawQuestionData as any).instruction;
        }
      }
    } else {
      const regularQuestionResult = await supabaseAdmin
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
      
      rawQuestionData = regularQuestionResult.data;
      questionError = regularQuestionResult.error;
    }

    if (questionError || !rawQuestionData) {
      return Response.json(
        {
          error: 'Failed to fetch question data',
          details: questionError?.message || 'Question not found',
          questionId
        },
        { status: 404 }
      );
    }

    const questionData = rawQuestionData as unknown as Question;

    let studentAnswerText = '';
    let correctAnswerText = '';
    let finalIsCorrect = isCorrect;
    let aiResponse: AIFeedbackResponse;

    if (
      questionData.question_type === 'multiple_choice' ||
      questionData.question_type === 'true_false'
    ) {
      const options = (questionData as any).course_options || questionData.options || [];
      const selectedOption = options.find((opt: any) => opt.id === selectedOptionId);
      const correctOption = options.find((opt: any) => opt.is_correct);
      
      if (questionData.question_type === 'true_false') {
        // For true_false: use jawaban_benar field to determine correct answer
        const correctAnswerBoolean = (questionData as any).correct_answer;
        const instruction = (questionData as any).instruction || '';
        const answerStatement = (questionData as any).answer_statement || questionData.question_text;
        
        // Student answer
        if (!selectedOption && textAnswer) {
          studentAnswerText = textAnswer === 'true' ? 'Richtig (R)' : 'Falsch (F)';
        } else {
          studentAnswerText = selectedOption?.option_text || 'Tidak ada jawaban';
        }
        
        // Correct answer based on jawaban_benar boolean
        correctAnswerText = correctAnswerBoolean ? 'Richtig (R)' : 'Falsch (F)';
        
        // Build complete question text with instruction and statement
        const fullQuestionText = instruction 
          ? `${instruction}\n\n${answerStatement}` 
          : answerStatement;
        
        console.log('[AI-FEEDBACK] True/False Question:', {
          instruction,
          answerStatement,
          correctAnswerBoolean,
          studentAnswer: studentAnswerText,
          correctAnswer: correctAnswerText
        });
        
        // Create modified question data with full context
        const modifiedQuestionData = {
          ...questionData,
          question_text: fullQuestionText
        };
        
        // Call AI with instruction and statement separately for better context
        const promptConfig = buildOptimizedPrompt(
          'true_false',
          fullQuestionText,
          studentAnswerText,
          correctAnswerText,
          finalIsCorrect,
          undefined,
          lessonContent,
          instruction,
          answerStatement
        );
        
        const validationResult = await callGroqAPIWithValidationAndRetry(
          {
            systemMessage: promptConfig.systemMessage,
            userMessage: promptConfig.userPrompt,
            temperature: promptConfig.temperature,
            maxTokens: promptConfig.maxTokens,
            topP: promptConfig.topP
          },
          studentAnswerText,
          correctAnswerText,
          fullQuestionText,
          finalIsCorrect,
          2
        );
        
        if (!validationResult.content) {
          throw new Error('No valid response from Groq after validation retry');
        }
        
        const referenceMatches = selectSmartReferences(
          studentAnswerText,
          correctAnswerText,
          fullQuestionText,
          3
        );
        const relevantReferences = convertToReferenceMaterials(referenceMatches);
        
        aiResponse = {
          success: true,
          data: {
            feedback_text: validationResult.content,
            reference_materials: relevantReferences,
            processing_time_ms: Date.now() - startTime,
            ai_model: `groq-llama-4-scout-17b (validated: ${validationResult.validated}, score: ${validationResult.finalScore})`
          }
        };
      } else {
        // Multiple choice logic (unchanged)
        studentAnswerText = selectedOption?.option_text || 'Tidak ada jawaban';
        correctAnswerText = correctOption?.option_text || 'Tidak diketahui';
        
        console.log('[AI-FEEDBACK] Lesson content:', lessonContent ? `${lessonContent.length} chars` : 'None');
        console.log('[AI-FEEDBACK] Question type:', questionType);

        aiResponse = await generateAIFeedback(
          questionData,
          studentAnswerText,
          correctAnswerText,
          finalIsCorrect,
          lessonContent
        );
      }
    } else if (questionData.question_type === 'sentence_arrangement') {
      studentAnswerText = textAnswer || 'Tidak ada jawaban';

      let correctSentence: string = '';

      if (questionData.sentence_arrangement_config?.complete_sentence) {
        correctSentence = questionData.sentence_arrangement_config.complete_sentence;
      } else {
        let sentenceWithBlanks = questionData.sentence_arrangement_config?.sentence_with_blanks || '';
        const correctWords = questionData.sentence_arrangement_config?.blank_words || [];

        correctSentence = sentenceWithBlanks;
        correctWords.forEach(word => {
          correctSentence = correctSentence.replace('___', word);
        });
      }

      correctAnswerText = correctSentence.trim() || 'Tidak diketahui (Konfigurasi tidak lengkap)';

      aiResponse = await generateAIFeedback(
        questionData,
        studentAnswerText,
        correctAnswerText,
        finalIsCorrect,
        lessonContent
      );
    } else if (questionData.question_type === 'essay') {
      studentAnswerText = textAnswer || 'Tidak ada jawaban';
      correctAnswerText = 'Jawaban ideal bervariasi (Essay)';

      aiResponse = await generateAIFeedbackWithGroq(
        questionData,
        studentAnswerText,
        correctAnswerText,
        finalIsCorrect,
        lessonContent
      );
    } else {
      return Response.json({ error: 'Unsupported question type' }, { status: 400 });
    }

    let feedback: any = null;
    try {
      const { data: attemptExists } = await supabaseAdmin
        .from('exercise_attempts')
        .select('id')
        .eq('id', attemptId)
        .maybeSingle();

      if (attemptExists) {
        const { data: savedFeedback, error: saveError } = await supabaseAdmin
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
          console.error('Error saving feedback to ai_feedback:', saveError);
        } else {
          feedback = savedFeedback;
        }
      } else {
        console.log('[OPEN-COURSE] Skipping ai_feedback insert — attemptId is not a valid exercise_attempts row.');
      }
    } catch (dbErr) {
      console.error('Error checking attempt existence:', dbErr);
    }

    const referenceString =
      typeof aiResponse.data.reference_materials === 'string'
        ? aiResponse.data.reference_materials
        : JSON.stringify(aiResponse.data.reference_materials || []);

    const cacheSuccess = await saveFeedbackToCache({
      question_id: questionId,
      question_text: questionData.question_text,
      is_correct: isCorrect,
      feedback_text: aiResponse.data.feedback_text,
      explanation: aiResponse.data.explanation || '',
      reference_materials: referenceString,
      ai_model: aiResponse.data.ai_model,
      processing_time_ms: aiResponse.data.processing_time_ms
    });

    const totalTime = Date.now() - startTime;

    await logSuccess(requestId, questionId, totalTime, {
      cacheStatus: 'miss_generated',
      cacheSaved: cacheSuccess,
      processingTime: aiResponse.data.processing_time_ms,
      totalResponseTime: totalTime
    });

    return Response.json({
      success: true,
      data: {
        ...aiResponse.data,
        id: feedback?.id
      },
      cache: {
        hit: false,
        saved: cacheSuccess,
        processingTime: aiResponse.data.processing_time_ms
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;

    await logApiError(
      requestId,
      error,
      questionId,
      'Fallback system engaged'
    );

    let errorCategory = ErrorCategory.UNKNOWN_ERROR;
    if (errorMessage.includes('rate limit')) {
      errorCategory = ErrorCategory.API_ERROR;
    } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      errorCategory = ErrorCategory.TIMEOUT_ERROR;
    } else if (errorMessage.includes('parse') || errorMessage.includes('JSON')) {
      errorCategory = ErrorCategory.PARSING_ERROR;
    }

    if (errorMessage.includes('critical') || errorMessage.includes('fatal')) {
      await checkAndCreateAlerts();
    }

    return Response.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}