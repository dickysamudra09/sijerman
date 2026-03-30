
export interface ErrorCategory {
  type: 'grammar' | 'vocabulary' | 'structure' | 'pronunciation' | 'essay_writing';
  subcategory?: string;
  confidence: number;
  examples?: string[];
}

export interface SemanticReference {
  title: string;
  url: string;
  description: string;
  category: string;
  subcategories: string[];
  relevanceScore?: number;
  reasons?: string[];
}

export interface ReferenceMatch {
  reference: SemanticReference;
  score: number;
  matchedCategories: string[];
  relevanceExplanation: string;
}


export const SEMANTIC_REFERENCE_DATABASE: SemanticReference[] = [
  {
    title: 'German Articles & Cases (Der, Die, Das)',
    url: 'https://www.dw.com/en/why-german-has-three-articles/a-48622900',
    description: 'Complete guide ke articles dalam bahasa Jerman, termasuk gender, cases (nominatif, akkusatif, dativ, genitif)',
    category: 'grammar',
    subcategories: ['articles', 'nominative', 'cases', 'gender']
  },
  {
    title: 'Nominative vs Accusative Case in German',
    url: 'https://www.germanveryeasy.com/nominative-and-accusative',
    description: 'Penjelasan perbedaan nominatif (subject) vs akkusatif (direct object) dengan contoh-contoh konkret',
    category: 'grammar',
    subcategories: ['nominative', 'accusative', 'cases', 'word-order']
  },
  {
    title: 'German Dative Case Explained',
    url: 'https://www.learngermanonline.org/dative-case/',
    description: 'Dative case untuk indirect objects, dengan konjugasi artikel dan pronoun',
    category: 'grammar',
    subcategories: ['dative', 'cases', 'indirect-objects', 'prepositions']
  },

  {
    title: 'German Present Tense Verb Conjugation',
    url: 'https://www.grammatiktraining.de/en/verb-conjugation.html',
    description: 'Conjugation tables untuk regular & irregular verbs dalam present tense (ich, du, er/sie/es, wir, ihr, sie)',
    category: 'grammar',
    subcategories: ['verb-conjugation', 'present-tense', 'regular-verbs', 'irregular-verbs']
  },
  {
    title: 'Sein vs Haben - German Helper Verbs',
    url: 'https://www.goethe-institut.de/en/spr/index.html',
    description: 'Perbedaan penggunaan "sein" (to be) vs "haben" (to have) dengan konjugasi per subject pronoun',
    category: 'grammar',
    subcategories: ['sein', 'haben', 'helper-verbs', 'verb-conjugation', 'present-tense']
  },
  {
    title: 'German Modal Verbs (können, müssen, wollen, etc)',
    url: 'https://www.learningdifferences.com/German-Modal-Verbs/',
    description: 'Modal verbs conjugation dan penggunaan "können" (can), "müssen" (must), "wollen" (want), "dürfen" (may)',
    category: 'grammar',
    subcategories: ['modal-verbs', 'verb-conjugation', 'können', 'müssen', 'wollen']
  },

  {
    title: 'German Word Order - V2 Rule',
    url: 'https://www.thefreedictionary.com/German-Word-Order.html',
    description: 'V2 rule (verb in second position) untuk main clauses dengan contoh detail dan exceptions',
    category: 'grammar',
    subcategories: ['word-order', 'V2-rule', 'sentence-structure', 'verb-position']
  },
  {
    title: 'German Subordinate Clause Word Order',
    url: 'https://www.learn-german-easily.com/word-order.html',
    description: 'V-final rule untuk subordinate clauses dengan konjungsi seperti "weil", "obwohl", "damit"',
    category: 'grammar',
    subcategories: ['word-order', 'subordinate-clauses', 'V-final-rule', 'conjunctions']
  },
  {
    title: 'German Sentence Structure: Main vs Subordinate',
    url: 'https://www.deutschacademy.com/sentence-structure.html',
    description: 'Comprehensive guide struktur kalimat German, perbedaan main clause vs subordinate clause dengan diagram',
    category: 'grammar',
    subcategories: ['sentence-structure', 'word-order', 'main-clauses', 'subordinate-clauses']
  },

  {
    title: 'German Adjective Endings',
    url: 'https://www.busuu.com/en/page/german-adjective-endings',
    description: 'Adjective endings tergantung gender, case, dan article yang digunakan (der/die/das)',
    category: 'grammar',
    subcategories: ['adjectives', 'adjective-endings', 'gender', 'cases']
  },
  {
    title: 'German Prepositions & Cases',
    url: 'https://www.fluent-forever.com/german-prepositions/',
    description: 'Prepositions dan case mereka gunakan: dative (mit, bei, aus), accusative (durch, für), dua-way (in, an, auf)',
    category: 'grammar',
    subcategories: ['prepositions', 'cases', 'dative', 'accusative', 'two-way-prepositions']
  },

  {
    title: 'German A1 Vocabulary List (1000+ Common Words)',
    url: 'https://www.memrise.com/course/1157/german-a1-vocab/',
    description: 'Essential A1-level vocabulary dengan kategori: family, food, school, hobbies, daily activities',
    category: 'vocabulary',
    subcategories: ['basic-vocabulary', 'A1-level', 'daily-words']
  },
  {
    title: 'Common German Verbs & Their Patterns',
    url: 'https://www.anki.com/shared/info/1437452241',
    description: 'List 100+ common German verbs dengan conjugation patterns dan contoh penggunaan',
    category: 'vocabulary',
    subcategories: ['verbs', 'common-verbs', 'verb-patterns', 'word-lists']
  },
  {
    title: 'German Synonyms & Word Alternatives',
    url: 'https://www.duden.de/synonyme',
    description: 'Official Duden page untuk mencari synonyms dan word alternatives untuk lebih natural speech',
    category: 'vocabulary',
    subcategories: ['synonyms', 'word-choices', 'natural-speech', 'vocabulary-nuance']
  },

  {
    title: 'School & Education Vocabulary in German',
    url: 'https://www.linguee.com/german-english/search?source=german&query=schule',
    description: 'Vocabulary terkait sekolah: Klasse, Lehrer, Fach, Prüfung, Hausaufgaben, dll',
    category: 'vocabulary',
    subcategories: ['school-vocabulary', 'education', 'classroom-words']
  },
  {
    title: 'Daily Activities & Routine Words in German',
    url: 'https://www.busuu.com/en/page/daily-routines-in-german',
    description: 'Words untuk daily activities: aufwachen, essen, arbeiten, spielen, schlafen, dll',
    category: 'vocabulary',
    subcategories: ['daily-activities', 'routine', 'verbs', 'everyday-words']
  },

  {
    title: 'How to Write Simple Sentences in German',
    url: 'https://www.goethe-institut.de/en/spr/dia/spl/deindex.html',
    description: 'Panduan menulis kalimat simple: subject - verb - object dengan contoh progresif',
    category: 'structure',
    subcategories: ['sentence-writing', 'simple-sentences', 'SVO-order', 'composition']
  },
  {
    title: 'German Compound Sentences with Conjunctions',
    url: 'https://www.learn-german-easily.com/conjunctions.html',
    description: 'Cara membuat compound sentences dengan coordinating conjunctions (und, aber, oder, denn)',
    category: 'structure',
    subcategories: ['compound-sentences', 'conjunctions', 'coordination', 'sentence-combining']
  },
  {
    title: 'Paragraph Writing in German (A1-A2 Level)',
    url: 'https://www.deutschacademy.com/writing-guide.html',
    description: 'Struktur paragraf dalam German essay: introduction, body, conclusion dengan transitions',
    category: 'structure',
    subcategories: ['paragraph-writing', 'essay-structure', 'transitions', 'composition']
  },

  {
    title: 'German Essay Writing: Structure & Tips',
    url: 'https://www.bbc.co.uk/bitesize/guides/z7mhvcj/revision',
    description: 'Complete guide ke essay writing dalam German: brainstorm, draft, revise, organize ideas',
    category: 'essay_writing',
    subcategories: ['essay-structure', 'writing-process', 'organization', 'argumentation']
  },
  {
    title: 'Transitional Phrases in German',
    url: 'https://www.thoughtco.com/german-transition-words-4087398',
    description: 'Words & phrases untuk transitions: erstens, zweitens, außerdem, jedoch, daher, deshalb',
    category: 'essay_writing',
    subcategories: ['transitions', 'linking-words', 'coherence', 'flow']
  },
  {
    title: 'Using Connectors to Improve German Writing',
    url: 'https://www.lingoni-german.de/de/konjunktionen/',
    description: 'Connectors untuk link ideas: weil (because), obwohl (although), wenn (if), damit (so that)',
    category: 'essay_writing',
    subcategories: ['connectors', 'conjunctions', 'sentence-combining', 'complex-sentences']
  },

  {
    title: 'German Pronunciation Guide',
    url: 'https://www.fluent-forever.com/german-pronunciation/',
    description: 'Sound pronunciation untuk vowels, consonants, umlauts (ä, ö, ü) dengan audio examples',
    category: 'pronunciation',
    subcategories: ['sounds', 'vowels', 'consonants', 'umlauts', 'accent']
  },
  {
    title: 'German Stress & Intonation Patterns',
    url: 'https://www.dw.com/en/learn-german/course-a1/l-39996046',
    description: 'Word stress patterns dan intonation untuk natural German speech dengan practice drills',
    category: 'pronunciation',
    subcategories: ['stress', 'intonation', 'rhythm', 'accent']
  }
];

export function detectErrorCategories(
  studentAnswer: string,
  correctAnswer: string,
  questionText: string
): ErrorCategory[] {
  const errorCategories: ErrorCategory[] = [];

  const studentWords = studentAnswer.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const correctWords = correctAnswer.toLowerCase().split(/\s+/).filter(w => w.length > 0);

  const articlePattern = /\b(der|die|das|den|dem|des|ein|eine|einen|einem|eines|einer)\b/gi;
  const studentArticles = (studentAnswer.match(articlePattern) || []).map(a => a.toLowerCase());
  const correctArticles = (correctAnswer.match(articlePattern) || []).map(a => a.toLowerCase());

  const missingArticles = Math.abs(studentArticles.length - correctArticles.length);
  if (missingArticles > 0 || (studentArticles.length > 0 && !studentArticles[0])) {
    errorCategories.push({
      type: 'grammar',
      subcategory: 'articles',
      confidence: missingArticles > 0 ? 0.8 : 0.6,
      examples: studentArticles.slice(0, 2)
    });
  }

  const pronounPatterns = {
    ich: /(ich\s+\w+)/gi,
    du: /(du\s+\w+)/gi,
    'er/sie/es': /(er|sie|es)\s+(\w+)/gi,
    wir: /(wir\s+\w+)/gi,
    ihr: /(ihr\s+\w+)/gi,
  };

  let hasConjugationIssue = false;
  if (studentAnswer.match(/ich\s+(habe|bin|esse|lerne)/gi)) {
    // Common ich conjugations - Good sign
    hasConjugationIssue = false;
  } else if (studentAnswer.match(/\b(ich|du|er|sie)\s+\w+en\b/gi)) {
    // Likely infinitive form instead of conjugated
    hasConjugationIssue = true;
  }

  if (studentWords.length !== correctWords.length && studentWords.length > 0) {
    errorCategories.push({
      type: 'grammar',
      subcategory: 'verb-conjugation',
      confidence: 0.7,
      examples: studentWords.filter(w => w.length > 4).slice(0, 2)
    });
  }

  const verbPositions = {
    student: findVerbPositions(studentAnswer),
    correct: findVerbPositions(correctAnswer)
  };

  if (verbPositions.student.length > 0 && verbPositions.correct.length > 0) {
    if (Math.abs(verbPositions.student[0] - verbPositions.correct[0]) > 2) {
      errorCategories.push({
        type: 'grammar',
        subcategory: 'word-order',
        confidence: 0.75,
      });
    }
  }

  const nominativeMarkers = /\b(der\s+\w+|ein\s+\w+)\b/gi;
  const accusativeMarkers = /\b(den\s+\w+|einen\s+\w+)\b/gi;

  const studentNom = (studentAnswer.match(nominativeMarkers) || []).length;
  const correctNom = (correctAnswer.match(nominativeMarkers) || []).length;
  const studentAcc = (studentAnswer.match(accusativeMarkers) || []).length;
  const correctAcc = (correctAnswer.match(accusativeMarkers) || []).length;

  if (Math.abs(studentNom - correctNom) > 0 || Math.abs(studentAcc - correctAcc) > 0) {
    errorCategories.push({
      type: 'grammar',
      subcategory: 'cases',
      confidence: 0.65,
    });
  }

  const vocabularyOverlap = studentWords.filter(w => 
    correctWords.includes(w) && w.length > 3
  ).length;

  const vocabularySimilarity = correctWords.length > 0 
    ? vocabularyOverlap / correctWords.length 
    : 0;

  if (vocabularySimilarity < 0.4 && studentWords.length > 2) {
    errorCategories.push({
      type: 'vocabulary',
      subcategory: 'word-choice',
      confidence: 0.6,
      examples: studentWords.filter(w => w.length > 4).slice(0, 3)
    });
  }

  if (studentAnswer.includes(',') && !correctAnswer.includes(',')) {
    errorCategories.push({
      type: 'structure',
      subcategory: 'punctuation',
      confidence: 0.5,
    });
  }

  if (studentAnswer.length > 200 && correctAnswer.length > 200) {
    if (!studentAnswer.match(/\b(deshalb|daher|außerdem|zunächst|jedoch)\b/gi)) {
      errorCategories.push({
        type: 'structure',
        subcategory: 'transitions',
        confidence: 0.55,
      });
    }
  }

  // Sort by confidence score (highest first)
  return errorCategories.sort((a, b) => b.confidence - a.confidence);
}

function findVerbPositions(sentence: string): number[] {
  // Common German verbs
  const commonVerbs = [
    'bin', 'sind', 'bist', 'ist', 'seid', 'habt', 'habe', 'hat', 'haben',
    'lerne', 'lernen', 'lernt', 'gehe', 'geht', 'gehen', 'esse', 'essen', 'isst',
    'spreche', 'spricht', 'spielen', 'spiele', 'sitze', 'sitzen', 'stehe'
  ];

  const words = sentence.toLowerCase().split(/\s+/);
  const positions: number[] = [];

  words.forEach((word, index) => {
    // Remove punctuation untuk matching
    const cleanWord = word.replace(/[.,!?;:]/g, '');
    if (commonVerbs.includes(cleanWord)) {
      positions.push(index);
    }
  });

  return positions;
}

export interface ScoringWeights {
  categoryMatch: number;           // 0-1: Direct category match
  subcategoryMatch: number;         // 0-1: Subcategory match
  confidenceBoost: number;          // 0-1: Boost dari error confidence
  semanticTfidf: number;            // 0-1: TF-IDF score
}

export function calculateRelevanceScore(
  reference: SemanticReference,
  detectedErrors: ErrorCategory[],
  weights: Partial<ScoringWeights> = {}
): number {
  const defaultWeights: ScoringWeights = {
    categoryMatch: 0.4,
    subcategoryMatch: 0.35,
    confidenceBoost: 0.15,
    semanticTfidf: 0.1
  };

  const finalWeights = { ...defaultWeights, ...weights };

  let score = 0;

  // 1. Category matching
  const categoryMatches = detectedErrors.filter(
    err => err.type === reference.category
  );
  const categoryScore = categoryMatches.length > 0 ? 1.0 : 0.0;
  score += categoryScore * finalWeights.categoryMatch;

  // 2. Subcategory matching
  const subcategoryMatches = detectedErrors.filter(err =>
    err.subcategory &&
    reference.subcategories.some(sub =>
      sub.toLowerCase().includes(err.subcategory!.toLowerCase()) ||
      err.subcategory!.toLowerCase().includes(sub.toLowerCase())
    )
  );

  if (subcategoryMatches.length > 0) {
    const avgConfidence = subcategoryMatches.reduce((sum, err) => sum + err.confidence, 0) / subcategoryMatches.length;
    const subcategoryScore = Math.min(subcategoryMatches.length * 0.5, 1.0) * avgConfidence;
    score += subcategoryScore * finalWeights.subcategoryMatch;
  }

  // 3. Confidence boost (preferred references get boost if high confidence)
  const maxConfidence = Math.max(...detectedErrors.map(err => err.confidence), 0);
  const confidenceBoost = maxConfidence > 0.7 ? 0.3 : 0;
  score += confidenceBoost * finalWeights.confidenceBoost;

  // 4. Semantic TF-IDF (simple keyword matching)
  const titleKeywords = reference.title.toLowerCase().split(/\s+/);
  const descriptionKeywords = reference.description.toLowerCase().split(/\s+/).slice(0, 20);
  const allKeywords = [...titleKeywords, ...descriptionKeywords];

  const errorKeywords = detectedErrors
    .flatMap(err => [err.subcategory || '', ...(err.examples || [])])
    .filter(k => k.length > 0);

  const keywordOverlap = errorKeywords.filter(keyword =>
    allKeywords.some(k => k.includes(keyword) || keyword.includes(k))
  ).length;

  const tfidfScore = errorKeywords.length > 0 
    ? Math.min(keywordOverlap / errorKeywords.length, 1.0) 
    : 0;
  score += tfidfScore * finalWeights.semanticTfidf;

  return Math.round(score * 100) / 100; // Round to 2 decimals
}

export function selectSmartReferences(
  studentAnswer: string,
  correctAnswer: string,
  questionText: string,
  maxReferences: number = 3
): ReferenceMatch[] {
  // Step 1: Detect error categories
  const detectedErrors = detectErrorCategories(studentAnswer, correctAnswer, questionText);

  if (detectedErrors.length === 0) {
    // No errors detected - return generic useful resources
    return SEMANTIC_REFERENCE_DATABASE
      .filter(ref => ref.category === 'vocabulary' || ref.category === 'structure')
      .sort(() => Math.random() - 0.5)
      .slice(0, maxReferences)
      .map(ref => ({
        reference: ref,
        score: 0.5,
        matchedCategories: [],
        relevanceExplanation: 'Recommended for continued learning'
      }));
  }

  // Step 2: Score all references
  const scoredReferences = SEMANTIC_REFERENCE_DATABASE.map(ref => {
    const score = calculateRelevanceScore(ref, detectedErrors);
    const matchedCategories = detectedErrors
      .filter(err => 
        err.type === ref.category ||
        (err.subcategory && ref.subcategories.some(sub =>
          sub.toLowerCase().includes(err.subcategory!.toLowerCase()) ||
          err.subcategory!.toLowerCase().includes(sub.toLowerCase())
        ))
      )
      .map(err => `${err.type}${err.subcategory ? ': ' + err.subcategory : ''}`);

    // Generate explanation
    let explanation = 'Based on ';
    if (matchedCategories.length > 0) {
      explanation += matchedCategories.join(', ');
    } else {
      explanation += detectedErrors.map(e => e.subcategory || e.type).join(', ');
    }
    explanation += ' detected in your answer';

    return {
      reference: { ...ref },
      score,
      matchedCategories,
      relevanceExplanation: explanation
    };
  });

  // Step 3: Sort by score (highest first) dan return top N
  const topMatches = scoredReferences
    .sort((a, b) => b.score - a.score)
    .filter(m => m.score > 0) // Only return relevant matches (score > 0)
    .slice(0, maxReferences);

  // Fallback ke top resources jika tidak ada matches
  if (topMatches.length < maxReferences) {
    const remaining = scoredReferences
      .filter(m => !topMatches.some(t => t.reference.url === m.reference.url))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxReferences - topMatches.length);
    
    return [...topMatches, ...remaining];
  }

  return topMatches;
}

export function convertToReferenceMaterials(matches: ReferenceMatch[]): Array<{
  title: string;
  url: string;
  description: string;
}> {
  return matches.map(match => ({
    title: match.reference.title,
    url: match.reference.url,
    description: match.reference.description
  }));
}
