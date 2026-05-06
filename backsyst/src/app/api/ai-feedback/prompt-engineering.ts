
export interface PromptConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  systemMessage: string;
  userPrompt: string;
}

const SYSTEM_PROMPT_EXPERT_TUTOR = `Kamu tutor bahasa Jerman untuk siswa A1-A2.

ATURAN OUTPUT:
- Kembalikan HANYA JSON: {"feedback_text": "isi feedback"}
- JANGAN tampilkan instruksi, placeholder, atau meta-text
- JANGAN gunakan tanda kurung siku [...] dalam output
- Pisahkan bagian dengan \\n\\n (double line break)
- Gunakan label: "RESPONS:", "KENAPA SALAH:", "TIPS:"
- Bahasa Indonesia, hangat dan supportive
- Maksimal 200 kata

ATURAN KONTEN:
- Analisis HANYA berdasarkan materi lesson yang diberikan
- JANGAN mengarang informasi di luar lesson content
- Gunakan contoh dan kosakata dari lesson content
- Jika lesson content tidak ada, gunakan grammatik dasar A1-A2 yang akurat
- Validasi semua terjemahan dan konjugasi - JANGAN sampai salah!

REFERENSI GRAMMATIK AKURAT:
- sein: ich bin, du bist, er/sie/es ist, wir/sie/Sie sind
- haben: ich habe, du hast, er/sie/es hat, wir/sie/Sie haben
- Verb reguler: ich -e, du -st, er/sie/es -t, wir/sie/Sie -en`;

export function buildSentenceArrangementPrompt(
  question: string,
  studentAnswer: string,
  correctAnswer: string,
  isCorrect: boolean,
  lessonContent?: string
): PromptConfig {
  const cleanLesson = lessonContent
    ? lessonContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 2000)
    : '';

  const lessonSection = cleanLesson
    ? `\nMATERI LESSON:\n${cleanLesson}\n\n`
    : '';

  const userPrompt = isCorrect 
    ? `${lessonSection}Soal: "${question}"
Jawaban siswa: "${studentAnswer}"
Jawaban benar: "${correctAnswer}"

Tulis feedback dalam format:

RESPONS:
Bagus! Susunan kalimatmu sudah tepat.

TIPS:
- Latih pola kalimat dari materi lesson
- Perhatikan posisi verb

Tulis feedback lengkap sekarang (tanpa placeholder atau [...]):
`
    : `${lessonSection}Soal: "${question}"
Jawaban siswa: "${studentAnswer}"
Jawaban benar: "${correctAnswer}"

Tulis feedback dalam format:

KENAPA SALAH:
Susunan yang benar adalah "${correctAnswer}" karena (jelaskan berdasarkan materi lesson atau grammatik dasar).

TIPS:
- (Tip 1 berdasarkan materi lesson)
- (Tip 2 dengan contoh dari lesson)

Tulis feedback lengkap sekarang (tanpa placeholder atau [...]):
`

  return {
    model: 'llama-3.1-8b-instant',
    temperature: 0.2,
    maxTokens: 600,
    topP: 0.9,
    systemMessage: SYSTEM_PROMPT_EXPERT_TUTOR,
    userPrompt
  };
}

export function buildMultipleChoicePrompt(
  question: string,
  studentAnswer: string,
  correctAnswer: string,
  isCorrect: boolean,
  allOptions?: string[],
  lessonContent?: string
): PromptConfig {
  const cleanLesson = lessonContent
    ? lessonContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 2000)
    : '';

  const lessonSection = cleanLesson
    ? `\nTEKS BACAAN:\n${cleanLesson}\n\n`
    : '';

  const userPrompt = isCorrect 
    ? `${lessonSection}Soal: "${question}"
Jawaban siswa: "${studentAnswer}"
Jawaban benar: "${correctAnswer}"

Tulis feedback dalam format:

RESPONS:
Bagus! Kamu sudah memahami teks dengan baik.

TIPS:
- Latih kemampuan membaca dari teks lesson
- Perhatikan kata kunci penting

Tulis feedback lengkap sekarang (tanpa placeholder atau [...]):
`
    : `${lessonSection}Soal: "${question}"
Jawaban siswa: "${studentAnswer}"
Jawaban benar: "${correctAnswer}"

Tulis feedback dalam format:

KENAPA SALAH:
Jawaban yang benar adalah "${correctAnswer}" karena (jelaskan berdasarkan teks bacaan atau grammatik).

TIPS:
- (Tip 1 berdasarkan teks lesson)
- (Tip 2 dengan kata kunci dari teks)

Tulis feedback lengkap sekarang (tanpa placeholder atau [...]):
`

  return {
    model: 'llama-3.1-8b-instant',
    temperature: 0.2,
    maxTokens: 600,
    topP: 0.9,
    systemMessage: SYSTEM_PROMPT_EXPERT_TUTOR,
    userPrompt
  };
}

export function buildEssayPrompt(
  question: string,
  studentAnswer: string,
  correctAnswer: string,
  isCorrect: boolean,
  lessonContent?: string
): PromptConfig {
  const cleanLesson = lessonContent
    ? lessonContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 2000)
    : '';

  const lessonSection = cleanLesson
    ? `\nMATERI LESSON:\n${cleanLesson}\n\n`
    : '';

  const userPrompt = isCorrect 
    ? `${lessonSection}Soal: "${question}"
Jawaban siswa: "${studentAnswer}"
Jawaban ideal: "${correctAnswer}"

Tulis feedback dalam format:

RESPONS:
Bagus! Jawabanmu sudah baik dan sesuai.

TIPS:
- Latih kemampuan menulis dari materi lesson
- Perhatikan struktur kalimat

Tulis feedback lengkap sekarang (tanpa placeholder atau [...]):
`
    : `${lessonSection}Soal: "${question}"
Jawaban siswa: "${studentAnswer}"
Jawaban ideal: "${correctAnswer}"

Tulis feedback dalam format:

YANG PERLU DIPERBAIKI:
Jawabanmu perlu perbaikan di bagian (sebutkan spesifik). Contoh yang lebih baik: "${correctAnswer}".

TIPS:
- (Tip 1 berdasarkan materi lesson)
- (Tip 2 dengan contoh dari lesson)

Tulis feedback lengkap sekarang (tanpa placeholder atau [...]):
`

  return {
    model: 'llama-3.1-8b-instant',
    temperature: 0.2,
    maxTokens: 600,
    topP: 0.9,
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
  allOptions?: string[],
  lessonContent?: string
): PromptConfig {
  switch (questionType) {
    case 'sentence_arrangement':
      return buildSentenceArrangementPrompt(questionText, studentAnswer, correctAnswer, isCorrect, lessonContent);
    
    case 'essay':
      return buildEssayPrompt(questionText, studentAnswer, correctAnswer, isCorrect, lessonContent);
    
    case 'multiple_choice':
    case 'true_false':
      return buildMultipleChoicePrompt(questionText, studentAnswer, correctAnswer, isCorrect, allOptions, lessonContent);
    
    default:
      return buildMultipleChoicePrompt(questionText, studentAnswer, correctAnswer, isCorrect, undefined, lessonContent);
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
    errors.push('System message kosong');
  }

  if (!config.userPrompt || config.userPrompt.trim().length === 0) {
    errors.push('User prompt kosong');
  }

  if (config.temperature < 0 || config.temperature > 2) {
    errors.push('Temperature harus antara 0 dan 2');
  }

  if (config.maxTokens < 100 || config.maxTokens > 4000) {
    errors.push('Max tokens harus antara 100 dan 4000');
  }

  if (config.topP < 0 || config.topP > 1) {
    errors.push('Top P harus antara 0 dan 1');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
