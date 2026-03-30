
interface AnalysisResult {
  type: 'grammar' | 'vocabulary' | 'structure' | 'relevance' | 'multiple' | 'essay' | 'arrangement';
  issues: string[];
  suggestions: string[];
  detectedPatterns: string[];
}

export function analyzeGermanGrammar(text: string, questionText: string): AnalysisResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  const detectedPatterns: string[] = [];
  const textLower = text.toLowerCase();
  const questionLower = questionText.toLowerCase();

  // 1. ARTIKEL (DER, DIE, DAS) ANALYSIS
  const articles = text.match(/\b(der|die|das|ein|eine|einen|einem|einer|eines|einem)\b/gi);
  if (articles && articles.length > 0) {
    detectedPatterns.push(`Ditemukan ${articles.length} artikel`);
    
    if (textLower.includes('der frau') || textLower.includes('der mann')) {
      issues.push('Mungkin ada error dalam gender artikel (Nominatif vs Akkusativ)');
      suggestions.push('Pastikan artikel sesuai dengan case (Nominatif=der/die/das, Akkusativ=den/die/das)');
    }
  } else if (text.length > 10) {
    issues.push('Jawaban tidak menggunakan artikel (der, die, das, eine, dll)');
    suggestions.push('Gunakan artikel yang tepat sesuai dengan gender dan case dari kata benda');
  }

  // 2. VERB CONJUGATION ANALYSIS
  const verbPatterns = {
    'ich bin': 'konjugasi "sein" untuk "ich"',
    'ich habe': 'konjugasi "haben" untuk "ich"',
    'du bist': 'konjugasi "sein" untuk "du"',
    'du hast': 'konjugasi "haben" untuk "du"',
    'er/sie/es ist': 'konjugasi "sein" untuk "er/sie/es"',
    'er/sie/es hat': 'konjugasi "haben" untuk "er/sie/es"'
  };

  if (textLower.includes('ich ist') || textLower.includes('ich hat')) {
    issues.push('Error dalam konjugasi verb untuk "ich" - gunakan "ich bin" atau "ich habe", bukan "ist" atau "hat"');
    suggestions.push('Ingat: "ich" perlu konjugasi yang benar - "ich bin" (singular), bukan "ich ist"');
    detectedPatterns.push('Konjugasi verb error (ich)');
  }

  if (textLower.includes('du sind') || textLower.includes('du haben')) {
    issues.push('Error dalam konjugasi verb untuk "du" - gunakan "du bist" atau "du hast"');
    suggestions.push('Ingat: "du" memakai ending -st: "du bist", "du hast", "du sprichst"');
    detectedPatterns.push('Konjugasi verb error (du)');
  }

  // Check for verb placement 
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 1) {
    detectedPatterns.push(`${sentences.length} kalimat ditemukan`);
    issues.push('Multi-clause sentence - pastikan word order V2 di main clause dan V-final di dependent clause');
    suggestions.push('Dalam bahasa Jerman, posisi verb penting: main clause (V2), subordinate clause (V-final)');
  }

  // 3. CASE ENDINGS (NOMINATIF, AKKUSATIV, DATIV)
  const caseEndings = text.match(/\b\w+(en|em|er|es)\b/gi);
  if (caseEndings && caseEndings.length > 0) {
    detectedPatterns.push(`${caseEndings.length} potential case endings ditemukan`);
  }

  if ((textLower.includes('den auto') || textLower.includes('den hund') || textLower.includes('den mann')) && 
      questionLower.includes('nominativ')) {
    issues.push('Possible nominatif/akkusativ confusion - "den" adalah akkusativ masculine, bukan nominatif');
    suggestions.push('Nominatif masculine: "der". Akkusativ masculine: "den"');
  }

  if (text.includes(' nicht ') || text.includes(' kein')) {
    detectedPatterns.push('Negation word ditemukan');
    if (!testWordOrder(text)) {
      issues.push('Mungkin ada error dalam word order dengan negasi');
      suggestions.push('Negasi "nicht" biasanya ditempatkan sebelum predikat atau di akhir kalimat');
    }
  }

  // 4. VOCABULARY RELEVANCE
  const questionWords = questionLower.split(/\s+/).filter(w => w.length > 3);
  const answerWords = textLower.split(/\s+/).filter(w => w.length > 3);
  const relevantWords = questionWords.filter(w => answerWords.some(aw => aw.includes(w) || w.includes(aw)));
  
  if (relevantWords.length === 0 && text.length > 10) {
    issues.push('Jawaban tidak menggunakan vocabulary dari pertanyaan');
    suggestions.push('Gunakan kata-kata kunci dari pertanyaan untuk menunjukkan bahwa Anda memahami konteks');
  } else if (relevantWords.length > 0) {
    detectedPatterns.push(`${relevantWords.length} vocabulary relevance ditemukan`);
  }

  // RESULT
  const finalType: 'grammar' | 'vocabulary' | 'structure' | 'relevance' | 'multiple' = 
    issues.length > 1 ? 'multiple' : 
    issues.some(i => i.includes('verb') || i.includes('artikel')) ? 'grammar' :
    issues.some(i => i.includes('word order')) ? 'structure' :
    issues.some(i => i.includes('vocabulary')) ? 'vocabulary' :
    'relevance';

  return {
    type: finalType,
    issues,
    suggestions,
    detectedPatterns
  };
}

export function generateContextualFallback(
  studentAnswer: string,
  correctAnswer: string,
  questionText: string,
  questionType: string,
  isCorrect: boolean
): string {
  // For correct answers
  if (isCorrect) {
    return generateCorrectAnswerFeedback(studentAnswer, correctAnswer, questionType);
  }

  // For incorrect answers - analyze and provide contextual feedback
  if (questionType === 'essay' || questionType === 'sentence_arrangement') {
    const analysis = analyzeGermanGrammar(studentAnswer, questionText);
    return generateDetailedIncorrectFeedback(analysis, studentAnswer, correctAnswer, questionType);
  }

  // For multiple choice / true false
  return generateMCIncorrectFeedback(questionText, correctAnswer);
}

function generateCorrectAnswerFeedback(
  studentAnswer: string,
  correctAnswer: string,
  questionType: string
): string {
  const timestamps = [
    "Sempurna! ",
    "Bagus sekali! ",
    "Benar banget! ",
    "Excellent! "
  ];
  
  const opening = timestamps[Math.floor(Math.random() * timestamps.length)];
  
  let detail = '';
  
  if (questionType === 'sentence_arrangement') {
    detail = `Anda berhasil menyusun kalimat dengan urutan kata (word order) yang benar. Ini menunjukkan bahwa Anda sudah memahami struktur kalimat Jerman dengan baik. `;
    detail += `Kalimat Anda: "${studentAnswer.substring(0, 50)}..." sudah tepat secara grammar dan semantik. `;
    detail += `Terus pertahankan perhatian pada detail-detail seperti ini, karena word order yang benar adalah fondasi penting dalam bahasa Jerman. `;
  } else if (questionType === 'essay') {
    detail = `Jawaban essay Anda menunjukkan pemahaman mendalam tentang topik. Anda sudah menggunakan struktur kalimat yang kompleks dengan benar, pemilihan vocabulary yang tepat, dan grammar yang akurat. `;
    detail += `Ini adalah tingkat yang excellent untuk level A1-A2. Pertahankan momentum ini dan terus challenge yourself dengan struktur yang lebih kompleks. `;
  } else {
    detail = `Anda memilih jawaban yang benar. Ini menunjukkan pemahaman yang solid tentang konsep yang ditanyakan. `;
    detail += `Strategi Anda dalam mengidentifikasi jawaban yang tepat sudah bagus. Terus konsisten seperti ini! `;
  }
  
  const closing = `Investasi Anda dalam belajar bahasa Jerman sangat terlihat. Keep up the excellent work! 💪`;
  
  return opening + detail + closing;
}

function generateDetailedIncorrectFeedback(
  analysis: AnalysisResult,
  studentAnswer: string,
  correctAnswer: string,
  questionType: string
): string {
  let feedback = `Jawaban Anda masih memerlukan beberapa perbaikan. Mari kita analisis apa yang bisa ditingkatkan. `;
  
  // Add specific issues found
  if (analysis.issues.length > 0) {
    feedback += `\n\nYang perlu diperhatikan: `;
    analysis.issues.forEach((issue, idx) => {
      feedback += `\n${idx + 1}. ${issue}`;
    });
  }
  
  // Add suggestions
  if (analysis.suggestions.length > 0) {
    feedback += `\n\nSaran perbaikan: `;
    analysis.suggestions.forEach((suggestion, idx) => {
      feedback += `\n${idx + 1}. ${suggestion}`;
    });
  }
  
  // Add correct answer explanation
  feedback += `\n\nJawaban yang benar: "${correctAnswer}"\n`;
  feedback += `Perbedaan utama: jawaban yang benar menggunakan struktur yang lebih tepat sesuai dengan grammar bahasa Jerman. `;
  
  // Add encouragement
  feedback += `\n\nJangan khawatir, ini adalah bagian normal dari proses pembelajaran. Setiap kesalahan adalah kesempatan untuk belajar lebih dalam. `;
  feedback += `Fokus pada poin-poin yang kami sarankan, lalu coba soal serupa lagi. Anda pasti akan improve! 📚`;
  
  return feedback;
}

function generateMCIncorrectFeedback(
  questionText: string,
  correctAnswer: string
): string {
  return `Jawaban Anda belum tepat. Mari kita lihat jawaban yang benar.\n\n` +
    `Jawaban yang benar adalah: "${correctAnswer}"\n\n` +
    `Mengapa jawaban ini benar? Dalam konteks pertanyaan "${questionText}", ` +
    `pilihan ini paling sesuai dengan grammar dan makna yang tepat dalam bahasa Jerman.\n\n` +
    `Pelajaran yang bisa diambil: Perhatikan kembali review materi tentang topik ini, ` +
    `terutama aspek grammar atau vocabulary yang relevan. Coba soal serupa lagi untuk memperkuat pemahaman Anda. ` +
    `Consistency adalah kunci dalam learning bahasa baru. Anda pasti bisa! 💪`;
}

function testWordOrder(text: string): boolean {
  const patterns = [
    /\b(nicht|kein)\s+\w+\s+(bin|habe|ist|hat|sind|haben)/i, 
    /\b\w+\s+(bin|habe|ist|hat|sind|haben)\s+\w+.*\.$/
  ];
  
  return patterns.some(p => p.test(text));
}

export function selectBestReferences(
  analysis: AnalysisResult,
  GERMAN_REFERENCES: any
): any[] {
  const refs: any[] = [];
  
  if (analysis.type === 'grammar') {
    refs.push(GERMAN_REFERENCES.grammar[0]);
    refs.push(GERMAN_REFERENCES.conjugation[0]);
  } else if (analysis.type === 'structure') {
    refs.push(GERMAN_REFERENCES.grammar[0]);
  } else if (analysis.type === 'vocabulary') {
    refs.push(GERMAN_REFERENCES.vocabulary[0]);
  } else if (analysis.type === 'essay') {
    refs.push(GERMAN_REFERENCES.essay[0]);
  } else if (analysis.type === 'arrangement') {
    refs.push(GERMAN_REFERENCES.grammar[0]);
  }
  
  // Add a second reference for broader learning
  refs.push(GERMAN_REFERENCES.vocabulary[0]);
  
  return refs.slice(0, 3).map(ref => ({
    title: ref.title,
    url: ref.url,
    description: ref.description
  }));
}
