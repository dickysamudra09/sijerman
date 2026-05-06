
export interface PromptConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  systemMessage: string;
  userPrompt: string;
}

const SYSTEM_PROMPT_EXPERT_TUTOR = `Kamu tutor bahasa Jerman yang ramah dan supportive untuk siswa A1-A2 yang sedang belajar membaca teks Jerman (Leseverstehen).

Aturan output:
- Kembalikan feedback dalam format text biasa (BUKAN JSON)
- Jangan tampilkan instruksi, placeholder, atau meta-text
- Jangan gunakan tanda kurung siku [...] dalam output
- WAJIB pisahkan bagian dengan label dan \\n\\n (double line break)
- WAJIB gunakan label ini: "Hasil:", "Kenapa salah? 🤔", "Tips untuk kamu ✨"
- Setiap label harus di baris baru dan diikuti konten di baris berikutnya
- Bahasa Indonesia yang hangat, ramah, dan memotivasi
- Maksimal 200 kata

Format struktur yang WAJIB diikuti:
Hasil:
[Kalimat pembuka yang memotivasi]

Kenapa salah? 🤔
[Penjelasan dengan kutipan teks lengkap]

Tips untuk kamu ✨
• [Tip 1]
• [Tip 2]
• [Tip 3]

Aturan konten - Leseverstehen:
- Selalu kutip kalimat lengkap dari teks bacaan sebagai bukti
- Format kutipan: "Di teks tertulis: '[kalimat lengkap dari teks]'"
- Jelaskan dengan lembut hubungan antara kutipan dengan jawaban
- Hanya gunakan informasi dari teks bacaan yang diberikan
- Gunakan kata kunci yang sama antara soal dan teks
- Tunjukkan letak informasi spesifik di teks dengan cara yang membantu

Contoh bukti yang baik:
✓ "Di teks tertulis: 'Rania kommt aus Jakarta und wohnt jetzt in Malang.' Dari kalimat ini kita bisa lihat bahwa Rania memang berasal dari Jakarta dan sekarang tinggal di Malang."
✗ "Berdasarkan teks, Rania dari Jakarta." (terlalu singkat, tidak ada kutipan lengkap)

Nada bicara:
- Gunakan kata-kata yang memotivasi seperti "Ayo kita lihat...", "Coba perhatikan...", "Kamu hampir benar..."
- Hindari kata-kata yang terkesan menyalahkan atau menakuti
- Fokus pada pembelajaran, bukan kesalahan

Referensi grammatik akurat:
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
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    maxTokens: 600,
    topP: 0.9,
    systemMessage: SYSTEM_PROMPT_EXPERT_TUTOR,
    userPrompt
  };
}

export function buildTrueFalsePrompt(
  instruction: string,
  statement: string,
  studentAnswer: string,
  correctAnswer: string,
  isCorrect: boolean,
  lessonContent?: string
): PromptConfig {
  const cleanLesson = lessonContent
    ? lessonContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 2000)
    : '';

  const lessonSection = cleanLesson
    ? `\nTeks bacaan:\n${cleanLesson}\n\n`
    : '';

  const fullQuestion = instruction 
    ? `${instruction}\n${statement}` 
    : statement;

  const userPrompt = isCorrect 
    ? `${lessonSection}Instruksi: "${instruction}"
Pernyataan: "${statement}"
Jawaban siswa: ${studentAnswer}
Jawaban benar: ${correctAnswer}

WAJIB gunakan format ini (dengan label dan line break):

Hasil:
Tepat sekali! Kamu berhasil memahami teks dengan baik. Pernyataan ini memang ${correctAnswer === 'Richtig (R)' ? 'benar' : 'salah'}.

Kenapa ${correctAnswer === 'Richtig (R)' ? 'benar' : 'salah'}? 🤔
Ayo kita lihat buktinya di teks. Di teks tertulis: "[kutip kalimat lengkap dari teks yang relevan]". Dari kalimat ini kita bisa melihat bahwa [jelaskan dengan ramah mengapa pernyataan ${correctAnswer === 'Richtig (R)' ? 'benar' : 'salah'}].

Tips untuk kamu ✨
• Coba perhatikan kata kunci penting dalam pernyataan
• Bandingkan dengan informasi yang ada di teks bacaan

PENTING: Tulis dengan format di atas, jangan gabung jadi satu paragraf!
`
    : `${lessonSection}Instruksi: "${instruction}"
Pernyataan: "${statement}"
Jawaban siswa: ${studentAnswer}
Jawaban benar: ${correctAnswer}

WAJIB gunakan format ini (dengan label dan line break):

Hasil:
Hampir benar! Jangan khawatir, ini kesempatan bagus untuk belajar. Jawaban yang tepat adalah ${correctAnswer}.

Kenapa salah? 🤔
Ayo kita lihat buktinya di teks bersama-sama. Di teks tertulis: "[kutip kalimat lengkap dari teks yang relevan]". Dari kalimat ini kita bisa melihat bahwa pernyataan "${statement}" sebenarnya ${correctAnswer === 'Richtig (R)' ? 'benar' : 'salah'} karena [jelaskan dengan lembut dan detail].

Tips untuk kamu ✨
• Coba baca teks dengan lebih teliti dan cari bukti konkret
• Perhatikan kata-kata kunci dalam pernyataan dan bandingkan dengan teks
• Ingat, membaca pemahaman butuh latihan - kamu pasti bisa!

PENTING: Tulis dengan format di atas, jangan gabung jadi satu paragraf!
`

  return {
    model: 'llama-3.3-70b-versatile',
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
    ? `\nTeks bacaan:\n${cleanLesson}\n\n`
    : '';

  const userPrompt = isCorrect 
    ? `${lessonSection}Soal: "${question}"
Jawaban siswa: "${studentAnswer}"
Jawaban benar: "${correctAnswer}"

WAJIB gunakan format ini (dengan label dan line break):

Hasil:
Bagus sekali! Jawabanmu tepat. Kamu berhasil memahami teks dengan baik.

Kenapa benar? 🤔
Ayo kita lihat buktinya di teks. Di teks tertulis: "[kutip kalimat lengkap dari teks yang mendukung jawaban]". Dari kalimat ini kita bisa melihat bahwa jawaban "${correctAnswer}" memang sesuai dengan informasi di teks.

Tips untuk kamu ✨
• Terus latih kemampuan membaca dengan mencari bukti konkret di teks
• Perhatikan kata kunci yang menghubungkan soal dengan teks

PENTING: Tulis dengan format di atas, jangan gabung jadi satu paragraf!
`
    : `${lessonSection}Soal: "${question}"
Jawaban siswa: "${studentAnswer}"
Jawaban benar: "${correctAnswer}"

WAJIB gunakan format ini (dengan label dan line break):

Hasil:
Hampir benar! Jangan berkecil hati, ini bagian dari proses belajar. Jawaban yang tepat adalah "${correctAnswer}".

Kenapa salah? 🤔
Ayo kita lihat buktinya di teks bersama-sama. Di teks tertulis: "[kutip kalimat lengkap dari teks yang relevan]". Dari kalimat ini kita bisa melihat bahwa jawaban yang tepat adalah "${correctAnswer}", bukan "${studentAnswer}", karena [jelaskan dengan lembut dan detail perbedaannya].

Tips untuk kamu ✨
• Coba baca teks dengan lebih teliti dan cari bukti konkret
• Bandingkan setiap pilihan jawaban dengan informasi yang ada di teks
• Ingat, setiap latihan membuat kamu semakin mahir!

PENTING: Tulis dengan format di atas, jangan gabung jadi satu paragraf!
`

  return {
    model: 'llama-3.3-70b-versatile',
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
    model: 'llama-3.3-70b-versatile',
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
  lessonContent?: string,
  instruction?: string,
  statement?: string
): PromptConfig {
  switch (questionType) {
    case 'sentence_arrangement':
      return buildSentenceArrangementPrompt(questionText, studentAnswer, correctAnswer, isCorrect, lessonContent);
    
    case 'essay':
      return buildEssayPrompt(questionText, studentAnswer, correctAnswer, isCorrect, lessonContent);
    
    case 'true_false':
      // Use specialized true_false prompt if instruction and statement are provided
      if (instruction && statement) {
        return buildTrueFalsePrompt(instruction, statement, studentAnswer, correctAnswer, isCorrect, lessonContent);
      }
      // Fallback to multiple choice prompt
      return buildMultipleChoicePrompt(questionText, studentAnswer, correctAnswer, isCorrect, allOptions, lessonContent);
    
    case 'multiple_choice':
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
