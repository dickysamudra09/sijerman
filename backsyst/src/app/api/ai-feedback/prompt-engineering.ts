
export interface PromptConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  systemMessage: string;
  userPrompt: string;
}

const SYSTEM_PROMPT_EXPERT_TUTOR = `Kamu adalah tutor bahasa Jerman berpengalaman untuk siswa level A1-A2 yang ahli dalam memberikan feedback konstruktif, encouraging, dan detail. 

PERSONALITY TRAITS:
- Supportive dan patient, bukan judgemental
- Specific dan actionable, bukan vague
- Detail tapi tetap mudah dipahami
- Encouraging dan motivational
- Expert dalam struktur bahasa Jerman

TONE:
- Friendly dan conversational
- Professional tapi accessible
- Enthusiastic tentang pembelajaran
- Empathetic terhadap kesalahan siswa

OUTPUT REQUIREMENT:
- Return ONLY valid JSON
- MUST include "feedback_text" field
- Gunakan narasi mengalir (tidak terpisah-pisah)
- Antara 60-120 kalimat untuk detail feedback
- Indonesian bahasa, dengan contoh bahasa Jerman`;

const EXAMPLE_SENTENCE_ARRANGEMENT_CORRECT = {
  question: "Isi celah kalimat berikut dengan kata-kata yang tepat: 'Ich ___ Student und ___ Deutsch.'",
  studentAnswer: "Ich bin Student und lerne Deutsch",
  correctAnswer: "Ich bin Student und lerne Deutsch",
  isCorrect: true,
  exampleFeedback: `Sempurna! Anda berhasil menyusun kalimat dengan konjugasi verb yang tepat dan struktur yang benar. Kalimat Anda "Ich bin Student und lerne Deutsch" menunjukkan pemahaman solid tentang several important aspects.

Pertama, Anda dengan benar menggunakan "bin" sebagai konjugasi "sein" untuk subject "ich" - ini adalah fundamental structure dalam bahasa Jerman. Verb conjugation adalah salah satu aspek paling penting yang harus dikuasai.

Kedua, Anda dengan benar menempatkan verb "lerne" di posisi yang tepat dalam subordinate clause setelah konjungsi "und". Saya sangat impressed dengan attention to detail ini!

Ketiga, verb "lerne" adalah bentuk yang tepat dari "lernen" untuk subject "ich". Ini menunjukkan Anda sudah internalize verb conjugation patterns.

Kalimat Anda juga grammatically correct secara keseluruhan - artikel tidak ada error, word order sempurna, dan makna crystal clear. Ini adalah level yang excellent untuk A1-A2!

Terus maintain momentum ini. Challenge yourself dengan sentences yang lebih kompleks dengan multiple clauses. Semakin banyak Anda berlatih, semakin otomatis grammar akan menjadi. Keep up the excellent work! 💪`
};

const EXAMPLE_SENTENCE_ARRANGEMENT_INCORRECT = {
  question: "Isi celah: 'Ich ___ Schüler und ___ Deutsch.'",
  studentAnswer: "Ich habe Schüler und haben Deutsch",
  correctAnswer: "Ich bin Schüler und lerne Deutsch",
  isCorrect: false,
  exampleFeedback: `Jawaban Anda menunjukkan usaha yang baik, tapi masih ada beberapa aspek penting yang perlu diperbaiki. Mari kita analisis apa yang terjadi di sini.

ISSUE #1 - Verb Choice: Anda menggunakan "habe" (memiliki), tapi konteks membutuhkan "bin" (to be). Ini adalah fundamental concept: "Ich bin Schüler" (I am a student) - gunakan "sein" bukan "haben". "Haben" adalah untuk possessing things, bukan untuk describing your identity.

ISSUE #2 - Verb Conjugation: Anda menulis "haben Deutsch" yang tidak grammatically correct. Bahkan kalau kita ingin use "haben", bentuk yang tepat untuk "Deutsch" sebagai object adalah "Aku lerne Deutsch" bukan "haben". Verb "lerne" (learnt dari "lernen") adalah pilihan yang tepat di sini.

ISSUE #3 - Subject-Verb Agreement: Dalam second clause "und haben Deutsch", subject masih "ich" (even though it's implied), jadi verb harus "lerne" bukan "haben".

JAWABAN YANG BENAR: "Ich bin Schüler und lerne Deutsch"

KEY TAKEAWAY: Dalam bahasa Jerman, choosing the right verb adalah crucial. "Sein" (to be) untuk identity, "haben" (to have) untuk possession, "lernen" (to learn) untuk activities. Sangat penting untuk memorize these distinctions.

TIPS UNTUK IMPROVEMENT: 
1. Review verb conjugation tables untuk "sein", "haben", "lernen"
2. Practice kalimat-kalimat simple dengan verbs ini
3. Try similar exercises lagi - next time Anda akan lebih confident!

Jangan frustrasi - ini adalah proses normal dari learning. Setiap mistake adalah learning opportunity. You're on the right track! 📚`
};

const EXAMPLE_MULTIPLE_CHOICE_CORRECT = {
  question: "Was ist das Nominativ-Pronomen für die dritte Person Singular Feminine?",
  studentAnswer: "sie",
  correctAnswer: "sie",
  isCorrect: true,
  exampleFeedback: `Benar! Anda memilih jawaban yang tepat. Pronoun "sie" (she) memang adalah nominative pronoun untuk third person singular feminine dalam bahasa Jerman. 

Ini menunjukkan bahwa Anda sudah understand gender system dalam bahasa Jerman dan pronoun conjugation - ini adalah foundation yang solid untuk German grammar. 

Terus maintain pemahaman ini dan practice dengan different cases (accusative, dative, genitive) dan Anda akan menjadi expert dalam pronoun system. Excellent job! 🎯`
};

const EXAMPLE_MULTIPLE_CHOICE_INCORRECT = {
  question: "Manakah kata yang sesuai? 'Ich __ einen Apfel'",
  studentAnswer: "habe",
  correctAnswer: "esse", 
  isCorrect: false,
  exampleFeedback: `Jawaban Anda belum tepat, tapi tidak apa-apa - ini adalah kesempatan belajar yang baik!

Anda memilih "habe" yang memang adalah verb "haben" (to have). Dalam konteks ini, verb "habe" bisa bekerja dalam sentences seperti "Ich habe einen Apfel" (I have an apple), tapi konteks pertanyaan mungkin menginginkan action verb yang berbeda.

Jawaban yang benar adalah "esse" yang berarti "makan" (eat). Kalimat lengkapnya: "Ich esse einen Apfel" (I eat an apple).

PERBEDAAN UTAMA:
- "haben" = memiliki (possess)  
- "essen" = makan (consume/eat)

Dalam konteks "Ich __ einen Apfel", kita perlu verb untuk action (eating), bukan possession (having).

TIPS: Perhatikan context dari kalimat - apakah sentence itu tentang possessing atau doing an action? Ini akan membantu Anda memilih verb yang tepat.

Jangan khawatir - dengan lebih banyak practice, Anda akan semakin intuitif dalam memilih verb yang tepat. Coba latihan serupa lagi! 💪`
};


export function buildSentenceArrangementPrompt(
  question: string,
  studentAnswer: string,
  correctAnswer: string,
  isCorrect: boolean
): PromptConfig {
  const userPrompt = `SENTENCE ARRANGEMENT FEEDBACK

Question: "${question}"
Student Answer: "${studentAnswer || 'No answer'}"
Correct Answer: "${correctAnswer || 'Not available'}"
Status: ${isCorrect ? 'CORRECT' : 'INCORRECT'}

INSTRUCTION - CREATE FEEDBACK WITH 6 LABELED SECTIONS:

Write feedback as ONE continuous text with these 6 sections. DO NOT use line breaks within the content.

1. RESPONSE: [One sentence status - correct/incorrect]
2. QUESTION: The question is: "${question}"
3. YOUR ANSWER: Your answer was: "${studentAnswer || 'No answer'}"
4. CORRECT ANSWER: The correct answer is: "${correctAnswer || 'Not available'}"
${!isCorrect ? '5. ANALYSIS: [Explain specific structural errors - word order, verb conjugation, case endings - 3-4 sentences]' : ''}
6. LEARNING: [Grammar rules to study, pattern examples, practice strategy - 3-4 sentences]

CRITICAL RULES:
- Return ONLY valid JSON: {"feedback_text": "complete feedback text here"}
- Write all sections as ONE continuous paragraph (NO line breaks in content)
- Use section numbers 1, 2, 3, 4, 5, 6 to separate sections (skip 5 if correct)
- NO newlines or line breaks inside the feedback_text
- Use spaces to separate sections
- Language: Indonesian with German examples when needed
- Total: 15-50 sentences for entire feedback (concise structured format)`;

  return {
    model: 'llama-3.1-8b-instant',
    temperature: 0.4,
    maxTokens: 1500,
    topP: 0.7,
    systemMessage: SYSTEM_PROMPT_EXPERT_TUTOR,
    userPrompt
  };
}

export function buildMultipleChoicePrompt(
  question: string,
  studentAnswer: string,
  correctAnswer: string,
  isCorrect: boolean,
  allOptions?: string[]
): PromptConfig {
  const userPrompt = `MULTIPLE CHOICE FEEDBACK

Question: "${question}"
${allOptions ? `Options: ${allOptions.map((o, i) => `${i + 1}. ${o}`).join(' | ')}` : ''}
Student Answer: "${studentAnswer}"
Correct Answer: "${correctAnswer}"
Status: ${isCorrect ? 'CORRECT' : 'INCORRECT'}

INSTRUCTION - CREATE FEEDBACK WITH 6 LABELED SECTIONS:

Write feedback as ONE continuous text with these 6 sections labeled with numbers. DO NOT use line breaks within the content - write as flowing text.

1. RESPONSE: [One sentence status - correct/incorrect]
2. QUESTION: The question is: "${question}"
3. YOUR ANSWER: Your answer was: "${studentAnswer}"
4. CORRECT ANSWER: The correct answer is: "${correctAnswer}"
${!isCorrect ? '5. WHY WRONG: [Explain the specific difference and relevant concept - 2-3 sentences]' : ''}
6. LEARNING TIPS: [Give 2-3 actionable tips - 2-3 sentences]

CRITICAL RULES:
- Return ONLY valid JSON: {"feedback_text": "complete feedback text here"}
- Write all 6 sections as ONE continuous paragraph (NO line breaks in content)
- Use section numbers 1, 2, 3, 4, 5, 6 to separate sections (skip 5 if correct)
- Format: "1. RESPONSE: ..." then "2. QUESTION: ..." then "3. YOUR ANSWER: ..." 
- NO newlines, NO line breaks in the feedback_text content
- Use spaces to separate sections, not line breaks
- Language: Indonesian with German examples
- Total: 15-50 sentences for entire feedback`;

  return {
    model: 'llama-3.1-8b-instant',
    temperature: 0.4,
    maxTokens: 1000,
    topP: 0.7,
    systemMessage: SYSTEM_PROMPT_EXPERT_TUTOR,
    userPrompt
  };
}

export function buildEssayPrompt(
  question: string,
  studentAnswer: string,
  correctAnswer: string,
  isCorrect: boolean
): PromptConfig {
  const userPrompt = `ESSAY FEEDBACK

Question: "${question}"
Student Answer: "${studentAnswer || 'No answer'}"
Ideal Standard: "${correctAnswer || 'Not available'}"
Status: ${isCorrect ? 'EXCELLENT' : 'NEEDS IMPROVEMENT'}

INSTRUCTION - CREATE FEEDBACK WITH 6 LABELED SECTIONS:

Write feedback as ONE continuous text with 6 sections. DO NOT use line breaks within the content.

1. RESPONSE: [One sentence status - excellent or needs improvement]
2. QUESTION: The question is: "${question}"
3. YOUR ANSWER: [Summarize or quote important part from essay]
4. IDEAL STANDARD: [What should be in an excellent essay for this question]
${!isCorrect ? '5. AREAS TO IMPROVE: [Identify 2-3 main issues with specific explanation - 3-4 sentences]' : ''}
6. LEARNING: [${isCorrect ? 'Tips for advanced level, sentence complexity examples, motivation' : 'Grammar/vocabulary to study, essay structure tips, motivation'}]

CRITICAL RULES:
- Return ONLY valid JSON: {"feedback_text": "complete feedback text here"}
- Write all sections as ONE continuous paragraph (NO line breaks in content)
- Use section numbers 1, 2, 3, 4, 5, 6 to separate sections (skip 5 if excellent)
- NO newlines or line breaks inside the feedback_text
- Use spaces to separate sections
- Language: Indonesian
- Total: 15-50 sentences for entire feedback`;

  return {
    model: 'llama-3.1-8b-instant',
    temperature: 0.4,
    maxTokens: 1800,
    topP: 0.7,
    systemMessage: SYSTEM_PROMPT_EXPERT_TUTOR,
    userPrompt
  };
}

export function buildOptimizedPrompt(
  questionType: string,
  questionText: string,
  studentAnswer: string,
  correctAnswer: string,
  isCorrect: boolean,
  allOptions?: string[]
): PromptConfig {
  switch (questionType) {
    case 'sentence_arrangement':
      return buildSentenceArrangementPrompt(questionText, studentAnswer, correctAnswer, isCorrect);
    
    case 'essay':
      return buildEssayPrompt(questionText, studentAnswer, correctAnswer, isCorrect);
    
    case 'multiple_choice':
    case 'true_false':
      return buildMultipleChoicePrompt(questionText, studentAnswer, correctAnswer, isCorrect, allOptions);
    
    default:
      // Fallback ke multiple choice template
      return buildMultipleChoicePrompt(questionText, studentAnswer, correctAnswer, isCorrect);
  }
}

export function formatPromptForAPI(config: PromptConfig): {
  system: string;
  user: string;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
} {
  return {
    system: config.systemMessage,
    user: config.userPrompt,
    model: config.model,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    top_p: config.topP
  };
}

export function validatePromptConfig(config: PromptConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.systemMessage || config.systemMessage.trim().length === 0) {
    errors.push('System message is empty');
  }

  if (!config.userPrompt || config.userPrompt.trim().length === 0) {
    errors.push('User prompt is empty');
  }

  if (config.temperature < 0 || config.temperature > 2) {
    errors.push('Temperature should be between 0 and 2');
  }

  if (config.maxTokens < 100 || config.maxTokens > 4000) {
    errors.push('Max tokens should be between 100 and 4000');
  }

  if (config.topP < 0 || config.topP > 1) {
    errors.push('Top P should be between 0 and 1');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
