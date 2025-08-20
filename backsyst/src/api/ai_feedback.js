// /app/api/ai-feedback/route.js (for App Router)
// atau /pages/api/ai-feedback.js (for Pages Router)

import { supabase } from '@/lib/supabase';

// Simulasi AI response - ganti dengan API AI yang sebenarnya (OpenAI, Claude, etc.)
async function generateAIFeedback(question, selectedAnswer, correctAnswer, isCorrect) {
  const startTime = Date.now();
  
  try {
    // Contoh prompt untuk AI
    const prompt = `
Sebagai tutor bahasa Inggris yang berpengalaman, berikan feedback untuk jawaban siswa:

Pertanyaan: "${question.question_text}"
Jawaban yang dipilih siswa: "${selectedAnswer?.option_text || 'Tidak ada jawaban'}"
Jawaban yang benar: "${correctAnswer?.option_text}"
Status: ${isCorrect ? 'Benar' : 'Salah'}

${isCorrect ? 
  'Berikan pujian singkat dan penjelasan mengapa jawaban tersebut benar.' : 
  'Jelaskan mengapa jawaban siswa salah dan berikan pemahaman yang jelas tentang konsep yang benar.'
}

Format response dalam JSON:
{
  "feedback_text": "feedback utama dalam bahasa Indonesia",
  "explanation": "penjelasan detail konsep",
  "reference_materials": [
    {
      "title": "judul referensi 1",
      "url": "link atau sumber",
      "description": "deskripsi singkat"
    },
    // minimal 3 referensi
  ]
}
`;

    // Simulasi response AI - ganti dengan API call yang sebenarnya
    // const response = await openai.chat.completions.create({
    //   model: "gpt-4",
    //   messages: [{ role: "user", content: prompt }],
    //   temperature: 0.7
    // });

    // Simulasi response untuk demo
    const mockResponse = {
      feedback_text: isCorrect 
        ? "Bagus sekali! Jawaban Anda tepat dan menunjukkan pemahaman yang baik terhadap materi."
        : "Jawaban Anda kurang tepat. Mari kita pelajari konsep ini lebih dalam agar Anda bisa memahami dengan lebih baik.",
      explanation: isCorrect
        ? `Jawaban "${correctAnswer?.option_text}" benar karena sesuai dengan kaidah tata bahasa yang berlaku dalam konteks kalimat ini.`
        : `Jawaban yang benar adalah "${correctAnswer?.option_text}". Hal ini karena dalam konteks kalimat tersebut, diperlukan pemahaman tentang struktur grammar yang tepat.`,
      reference_materials: [
        {
          title: "English Grammar Basics",
          url: "https://www.grammarly.com/blog/basic-grammar/",
          description: "Panduan dasar tata bahasa Inggris yang komprehensif"
        },
        {
          title: "Cambridge English Grammar",
          url: "https://dictionary.cambridge.org/grammar/",
          description: "Referensi grammar dari Cambridge University"
        },
        {
          title: "BBC Learning English",
          url: "https://www.bbc.co.uk/learningenglish/",
          description: "Sumber belajar bahasa Inggris dari BBC"
        }
      ]
    };

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        ...mockResponse,
        processing_time_ms: processingTime,
        ai_model: 'simulation'
      }
    };

  } catch (error) {
    console.error('AI Feedback generation error:', error);
    return {
      success: false,
      error: error.message,
      data: {
        feedback_text: "Maaf, terjadi kesalahan saat menghasilkan feedback. Silakan coba lagi nanti.",
        explanation: "Sistem feedback AI sedang mengalami gangguan.",
        reference_materials: [],
        processing_time_ms: Date.now() - startTime,
        ai_model: 'error'
      }
    };
  }
}

export async function POST(request) {
  try {
    const { 
      studentAnswerId, 
      questionId, 
      attemptId, 
      selectedOptionId,
      isCorrect 
    } = await request.json();

    // Validasi input
    if (!studentAnswerId || !questionId || !attemptId) {
      return Response.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Ambil data pertanyaan dan opsi
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .select(`
        id,
        question_text,
        options (id, option_text, is_correct)
      `)
      .eq('id', questionId)
      .single();

    if (questionError) {
      throw new Error(`Failed to fetch question: ${questionError.message}`);
    }

    const selectedOption = questionData.options.find(opt => opt.id === selectedOptionId);
    const correctOption = questionData.options.find(opt => opt.is_correct);

    // Generate AI feedback
    const aiResponse = await generateAIFeedback(
      questionData,
      selectedOption,
      correctOption,
      isCorrect
    );

    // Simpan feedback ke database
    const { data: feedback, error: saveError } = await supabase
      .from('ai_feedback')
      .insert([{
        student_answer_id: studentAnswerId,
        question_id: questionId,
        attempt_id: attemptId,
        feedback_type: isCorrect ? 'correct' : 'incorrect',
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
      // Tetap return feedback meski gagal save
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
        id: feedback.id
      }
    });

  } catch (error) {
    console.error('AI Feedback API error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Untuk Pages Router, gunakan format ini:
/*
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ... sama seperti kode di atas tapi dengan req.body dan res.json()
}
*/