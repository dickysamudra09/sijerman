
export interface FeedbackValidationResult {
  isValid: boolean;
  score: number; // 0-100 quality score
  issues: ValidationIssue[];
  recommendations: string[];
  metrics: FeedbackMetrics;
}

export interface ValidationIssue {
  type: 'length' | 'structure' | 'content' | 'tone' | 'relevance';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  recoverable: boolean; // Bisa diperbaiki dengan retry?
}

export interface FeedbackMetrics {
  characterCount: number;
  sentenceCount: number;
  wordCount: number;
  averageWordLength: number;
  hasEncouragement: boolean;
  hasSpecificExamples: boolean;
  hasActionableAdvice: boolean;
  toneConfidence: number; // 0-1, how sure we are tone is right
  relevanceScore: number; // 0-1, how relevant to the question
  readabilityScore: number; // 0-1, flesch kincaid style
}

export interface RetryStrategy {
  attemptNumber: number;
  modifiedPrompt: string;
  modifications: string[];
  reason: string;
}

export const VALIDATION_CONFIG = {
  // Length constraints (characters)
  minCharacters: 200,
  maxCharacters: 2000,
  idealCharacters: 800,
  
  // Sentence constraints
  minSentences: 6,
  maxSentences: 25,
  idealSentences: 12,
  
  // Word-level metrics
  minWords: 40,
  maxWords: 300,
  idealWords: 120,
  minAverageWordLength: 3,
  maxAverageWordLength: 6,
  
  // Quality flags (harus ada minimal)
  requireEncouragement: true,
  requireExamples: true,
  requireActionableAdvice: true,
  
  // Score thresholds
  minimumPassScore: 65, // Minimum untuk dianggap valid
  recommendedScore: 80, // Threshold untuk retry
  excellentScore: 90,   // Excellent quality
};

export function countSentences(text: string): number {
  if (!text || text.length === 0) return 0;
  // Match sentences ending with . ! ? atau end of string
  const sentences = text.match(/[^.!?]*[.!?]+/g) || [];
  return sentences.filter(s => s.trim().length > 0).length;
}

export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export function getAverageWordLength(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 0;
  
  const totalChars = words.reduce((sum, word) => {
    const cleanWord = word.replace(/[.,!?;:"'-]/g, '');
    return sum + cleanWord.length;
  }, 0);
  
  return Math.round((totalChars / words.length) * 10) / 10;
}

interface ContentQualityFlags {
  hasEncouragement: boolean;
  hasSpecificExamples: boolean;
  hasActionableAdvice: boolean;
  hasGrammarExplanation: boolean;
  hasVocabularyInsight: boolean;
  hasPronunciationNote: boolean;
  usesStudentAnswer: boolean;
  usesCorrectAnswer: boolean;
}

export function detectContentQuality(text: string, studentAnswer: string, correctAnswer: string): ContentQualityFlags {
  const lowerText = text.toLowerCase();
  
  return {
    // Encouragement indicators
    hasEncouragement: /\b(bagus|sempurna|hebat|excellent|great|well done|mantap|nice|good|impressive|awesome|amazing)\b/i.test(text) ||
                      /[😀😊✨💪🎯👏]/g.test(text),
    
    // Specific examples (mentions actual words/patterns)
    hasSpecificExamples: /\b(contoh|example|pattern|structure|seperti|like|e\.g\.|misalnya)\b/i.test(text) ||
                         /["`'].*?["`']/g.test(text), // Has quotes
    
    // Actionable advice (learning strategies, next steps)
    hasActionableAdvice: /\b(tips|saran|tips|practice|latihan|focus|fokus|remember|ingat|try|coba|strategy|strategi|next time|next step|improvement|perbaikan)\b/i.test(text),
    
    // Explains grammar rules
    hasGrammarExplanation: /\b(grammar|tata bahasa|conjugation|konjugasi|case|kasus|nominative|nominatif|accusative|accusatif|word order|urutan kata|artikel|gender)\b/i.test(text),
    
    // Vocabulary insights
    hasVocabularyInsight: /\b(vocabulary|kosakata|meaning|makna|natural|word choice|pilihan kata|usage|penggunaan|synonym|sinonim)\b/i.test(text),
    
    // Pronunciation notes
    hasPronunciationNote: /\b(pronunciation|pronounsi|sound|suara|accent|aksen|intonation|stress|emphasis)\b/i.test(text),
    
    // References student's actual answer
    usesStudentAnswer: studentAnswer && studentAnswer.length > 0 && 
                       text.includes(studentAnswer) || 
                       text.toLowerCase().includes(studentAnswer.toLowerCase().substring(0, 15)),
    
    // References correct answer
    usesCorrectAnswer: correctAnswer && correctAnswer.length > 0 && 
                       text.includes(correctAnswer) || 
                       text.toLowerCase().includes(correctAnswer.toLowerCase().substring(0, 15)),
  };
}

export function calculateToneConfidence(text: string, isCorrect: boolean): number {
  const lowerText = text.toLowerCase();
  
  // Positive tone indicators
  const positiveIndicators = [
    /\b(bagus|sempurna|hebat|excellent|great|mantap|nice|good|impressive)\b/i,
    /[😊✨💪👏]/g,
    /\b(kamu|you)\s+(udah|sudah|have|can|bisa|mampu)/i,
  ];
  
  // Negative tone indicators (hanya valid untuk incorrect answers)
  const negativeIndicators = [
    /\b(salah|wrong|incorrect|buruk|bad|gagal|failed)\b/i,
    /\b(perlu|must|should|harus|wajib)\b/,
  ];
  
  let score = 0;
  
  if (isCorrect) {
    // For correct answers, tone harus positive & encouraging
    const positiveCount = positiveIndicators.filter(indicator => indicator.test(text)).length;
    const negativeCount = negativeIndicators.filter(indicator => indicator.test(text)).length;
    
    score = Math.max(0, 0.5 + (positiveCount * 0.15) - (negativeCount * 0.2));
  } else {
    // For incorrect answers, tone harus gentle & constructive
    const hasGentleness = /\b(tidak apa|no worries|gentle|tidak masalah|tenang|bagus dicoba)\b/i.test(text);
    const hasActionable = /\b(tips|saran|improvement|perbaikan|next time|lanjut|coba|try)\b/i.test(text);
    const hasConstructive = /\b(lebih baik|better|specifically|spesifik|fokus|focus)\b/i.test(text);
    
    score = (hasGentleness ? 0.3 : 0) + (hasActionable ? 0.4 : 0) + (hasConstructive ? 0.3 : 0);
  }
  
  return Math.min(Math.max(score, 0), 1);
}

export function calculateRelevanceScore(text: string, questionText: string, studentAnswer: string): number {
  if (!questionText || !studentAnswer) return 0.5;
  
  // Extract keywords dari question
  const questionKeywords = questionText
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  // Extract keywords dari student answer
  const answerKeywords = studentAnswer
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  // Check overlap di feedback
  const textLower = text.toLowerCase();
  const keywordMatches = [...questionKeywords, ...answerKeywords]
    .filter(keyword => textLower.includes(keyword)).length;
  
  const totalKeywords = new Set([...questionKeywords, ...answerKeywords]).size;
  
  if (totalKeywords === 0) return 0.5;
  
  return Math.min(keywordMatches / (totalKeywords * 0.7), 1.0);
}

export function calculateReadabilityScore(text: string): number {
  if (!text) return 0;
  
  const sentences = countSentences(text);
  const words = countWords(text);
  const characters = text.length;
  
  // Simple readability heuristic
  let score = 0.5;
  
  // Reward appropriate length
  if (words >= 60 && words <= 200) score += 0.2;
  else if (words >= 40 && words <= 300) score += 0.1;
  
  // Reward appropriate sentence complexity
  if (sentences >= 6 && sentences <= 20) score += 0.2;
  else if (sentences >= 4 && sentences <= 25) score += 0.1;
  
  // Average word length (should be 4-5 characters untuk readability)
  const avgWordLen = getAverageWordLength(text);
  if (avgWordLen >= 4 && avgWordLen <= 5.5) score += 0.1;
  
  return Math.min(score, 1.0);
}

export function validateFeedback(
  feedbackText: string,
  studentAnswer: string,
  correctAnswer: string,
  questionText: string,
  isCorrect: boolean
): FeedbackValidationResult {
  const issues: ValidationIssue[] = [];
  const metrics = calculateMetrics(feedbackText, studentAnswer, correctAnswer, questionText, isCorrect);
  
  // ===== LENGTH VALIDATION =====
  if (metrics.characterCount < VALIDATION_CONFIG.minCharacters) {
    issues.push({
      type: 'length',
      severity: 'critical',
      message: `Feedback terlalu singkat (${metrics.characterCount} chars, min: ${VALIDATION_CONFIG.minCharacters})`,
      recoverable: true
    });
  }
  
  if (metrics.characterCount > VALIDATION_CONFIG.maxCharacters) {
    issues.push({
      type: 'length',
      severity: 'warning',
      message: `Feedback terlalu panjang (${metrics.characterCount} chars, max: ${VALIDATION_CONFIG.maxCharacters})`,
      recoverable: true
    });
  }
  
  // ===== SENTENCE VALIDATION =====
  if (metrics.sentenceCount < VALIDATION_CONFIG.minSentences) {
    issues.push({
      type: 'structure',
      severity: 'warning',
      message: `Kurang kalimat (${metrics.sentenceCount}, min: ${VALIDATION_CONFIG.minSentences})`,
      recoverable: true
    });
  }
  
  // ===== CONTENT QUALITY VALIDATION =====
  if (VALIDATION_CONFIG.requireEncouragement && !metrics.hasEncouragement) {
    issues.push({
      type: 'content',
      severity: 'warning',
      message: 'Tidak ada elemen encouragement di feedback',
      recoverable: true
    });
  }
  
  if (VALIDATION_CONFIG.requireExamples && !metrics.hasSpecificExamples) {
    issues.push({
      type: 'content',
      severity: 'info',
      message: 'Kurang specific examples atau concrete illustrations',
      recoverable: true
    });
  }
  
  if (VALIDATION_CONFIG.requireActionableAdvice && !metrics.hasActionableAdvice) {
    issues.push({
      type: 'content',
      severity: 'warning',
      message: 'Tidak ada actionable advice atau tips untuk improvement',
      recoverable: true
    });
  }
  
  // ===== TONE VALIDATION =====
  if (metrics.toneConfidence < 0.5) {
    issues.push({
      type: 'tone',
      severity: 'warning',
      message: `Tone tidak sesuai (confidence: ${(metrics.toneConfidence * 100).toFixed(0)}%)`,
      recoverable: true
    });
  }
  
  // ===== RELEVANCE VALIDATION =====
  if (metrics.relevanceScore < 0.4) {
    issues.push({
      type: 'relevance',
      severity: 'warning',
      message: `Feedback tidak cukup relevant ke pertanyaan (score: ${(metrics.relevanceScore * 100).toFixed(0)}%)`,
      recoverable: true
    });
  }
  
  // Calculate overall quality score
  const score = calculateQualityScore(metrics, issues);
  
  // Generate recommendations
  const recommendations = generateRecommendations(issues, metrics, isCorrect);
  
  const isValid = score >= VALIDATION_CONFIG.minimumPassScore && 
                  issues.filter(i => i.severity === 'critical').length === 0;
  
  return {
    isValid,
    score,
    issues,
    recommendations,
    metrics
  };
}

function calculateMetrics(
  feedbackText: string,
  studentAnswer: string,
  correctAnswer: string,
  questionText: string,
  isCorrect: boolean
): FeedbackMetrics {
  const characterCount = feedbackText.length;
  const sentenceCount = countSentences(feedbackText);
  const wordCount = countWords(feedbackText);
  const averageWordLength = getAverageWordLength(feedbackText);
  
  const qualityFlags = detectContentQuality(feedbackText, studentAnswer, correctAnswer);
  const toneConfidence = calculateToneConfidence(feedbackText, isCorrect);
  const relevanceScore = calculateRelevanceScore(feedbackText, questionText, studentAnswer);
  const readabilityScore = calculateReadabilityScore(feedbackText);
  
  return {
    characterCount,
    sentenceCount,
    wordCount,
    averageWordLength,
    hasEncouragement: qualityFlags.hasEncouragement,
    hasSpecificExamples: qualityFlags.hasSpecificExamples,
    hasActionableAdvice: qualityFlags.hasActionableAdvice,
    toneConfidence,
    relevanceScore,
    readabilityScore
  };
}

function calculateQualityScore(metrics: FeedbackMetrics, issues: ValidationIssue[]): number {
  let score = 100;
  
  // Deduct for issues
  issues.forEach(issue => {
    const deduction = issue.severity === 'critical' ? 15 : issue.severity === 'warning' ? 8 : 3;
    score -= deduction;
  });
  
  // Adjust based on metrics
  const contentScore = (
    (metrics.hasEncouragement ? 10 : 0) +
    (metrics.hasSpecificExamples ? 10 : 0) +
    (metrics.hasActionableAdvice ? 10 : 0)
  ) / 30 * 20;
  
  const lengthScore = Math.max(0, 100 - Math.abs(metrics.characterCount - VALIDATION_CONFIG.idealCharacters) / 50);
  
  const balanceScore = (metrics.toneConfidence * 20) + (metrics.relevanceScore * 20) + (metrics.readabilityScore * 20);
  
  score = Math.max(0, score + (contentScore + lengthScore + balanceScore) / 3 - 100);
  
  return Math.round(Math.min(Math.max(score, 0), 100));
}

function generateRecommendations(issues: ValidationIssue[], metrics: FeedbackMetrics, isCorrect: boolean): string[] {
  const recommendations: string[] = [];
  
  issues.forEach(issue => {
    if (!issue.recoverable) return;
    
    switch (issue.type) {
      case 'length':
        if (metrics.characterCount < VALIDATION_CONFIG.minCharacters) {
          recommendations.push('Add more detail & comprehensive analysis dalam feedback');
        } else {
          recommendations.push('Shorten feedback untuk lebih focused & concise');
        }
        break;
      
      case 'structure':
        if (metrics.sentenceCount < VALIDATION_CONFIG.minSentences) {
          recommendations.push('Break down complex ideas menjadi separate sentences');
        }
        break;
      
      case 'content':
        if (!metrics.hasEncouragement) {
          recommendations.push('Add encouraging words atau emojis untuk motivasi student');
        }
        if (!metrics.hasSpecificExamples) {
          recommendations.push('Include specific examples dari student answer atau grammar patterns');
        }
        if (!metrics.hasActionableAdvice) {
          recommendations.push('Add tips, strategies, atau next steps untuk improvement');
        }
        break;
      
      case 'tone':
        recommendations.push(isCorrect ? 
          'Make feedback more celebratory & congratulatory' :
          'Make feedback more gentle, supportive, & constructive');
        break;
      
      case 'relevance':
        recommendations.push('Connect feedback lebih directly ke pertanyaan yang diajukan');
        break;
    }
  });
  
  return [...new Set(recommendations)]; // Remove duplicates
}

export function generateRetryStrategy(
  validationResult: FeedbackValidationResult,
  originalPrompt: string,
  attemptNumber: number = 1
): RetryStrategy {
  const modifications: string[] = [];
  let reason = '';
  
  if (validationResult.score < VALIDATION_CONFIG.recommendedScore) {
    reason = `Quality score terlalu rendah (${validationResult.score}/100)`;
  } else if (validationResult.issues.length > 0) {
    reason = `Found ${validationResult.issues.length} quality issues`;
  }
  
  // Generate modifications based on issues
  validationResult.issues.forEach(issue => {
    if (!issue.recoverable) return;
    
    switch (issue.type) {
      case 'length':
        if (validationResult.metrics.characterCount < VALIDATION_CONFIG.minCharacters) {
          modifications.push('ADD: "Jelaskan dengan DETAIL & COMPREHENSIVE"');
          modifications.push('ADD: "Include SPECIFIC EXAMPLES dari student answer"');
        }
        break;
      
      case 'structure':
        modifications.push('ADD: "Gunakan 3-4 paragraf untuk organize ideas dengan jelas"');
        break;
      
      case 'content':
        if (!validationResult.metrics.hasEncouragement) {
          modifications.push('ADD: "Start dengan PUJIAN atau ENCOURAGING statement"');
        }
        if (!validationResult.metrics.hasActionableAdvice) {
          modifications.push('ADD: "Akhir dengan ACTIONABLE TIPS atau NEXT STEPS"');
        }
        break;
      
      case 'tone':
        modifications.push(validationResult.metrics.toneConfidence < 0.4 ?
          'MODIFY: "Make tone lebih ENCOURAGING dan SUPPORTIVE"' :
          'MODIFY: "Ensure tone CONSISTENT throughout"');
        break;
      
      case 'relevance':
        modifications.push('MODIFY: "Fokus pada DETAIL spesifik dari pertanyaan & jawaban student"');
        break;
    }
  });
  
  // Build modified prompt
  let modifiedPrompt = originalPrompt;
  
  // Inject modifications ke prompt
  if (modifications.length > 0 && !originalPrompt.includes('QUALITY REQUIREMENTS:')) {
    modifiedPrompt += `\n\nQUALITY REQUIREMENTS FOR RETRY #${attemptNumber}:\n`;
    modifications.forEach(mod => {
      modifiedPrompt += `• ${mod}\n`;
    });
  }
  
  return {
    attemptNumber,
    modifiedPrompt,
    modifications,
    reason
  };
}

export function shouldRetry(
  validationResult: FeedbackValidationResult,
  maxAttempts: number = 3,
  currentAttempt: number = 1
): { shouldRetry: boolean; reason: string } {
  if (currentAttempt >= maxAttempts) {
    return {
      shouldRetry: false,
      reason: `Max retry attempts reached (${maxAttempts})`
    };
  }
  
  if (validationResult.isValid) {
    return {
      shouldRetry: false,
      reason: 'Validation passed'
    };
  }
  
  const criticalIssues = validationResult.issues.filter(i => i.severity === 'critical');
  if (criticalIssues.length > 0) {
    return {
      shouldRetry: true,
      reason: `Critical issues found: ${criticalIssues.map(i => i.message).join('; ')}`
    };
  }
  
  const recoverableIssues = validationResult.issues.filter(i => i.recoverable);
  if (recoverableIssues.length > 2) {
    return {
      shouldRetry: true,
      reason: `Multiple recoverable issues (${recoverableIssues.length})`
    };
  }
  
  if (validationResult.score < VALIDATION_CONFIG.recommendedScore) {
    const scoreGap = VALIDATION_CONFIG.recommendedScore - validationResult.score;
    if (scoreGap > 10 && currentAttempt < maxAttempts - 1) {
      return {
        shouldRetry: true,
        reason: `Quality gap too large (${scoreGap} points below recommended)`
      };
    }
  }
  
  return {
    shouldRetry: false,
    reason: 'Quality acceptable'
  };
}
