# Thesis Research Notes - Si Jerman Project

**Judul Thesis:**
> Pengembangan Website "Si Jerman" Berbasis AI Feedback untuk Peningkatan Problem Solving dalam Pembelajaran Bahasa Jerman

**Tanggal Dokumentasi:** 7 Februari 2026

---

## 📊 1. Analisis Tipe Penelitian

### Kesimpulan: **KUANTITATIF (PRIMARY) dengan Komponen KUALITATIF (Supporting)**

### Persentase:
- **Kuantitatif: 75-80%** ✅
- **Kualitatif: 20-25%** ⚠️

---

## 📈 2. Argumen KUANTITATIF (DOMINAN)

### Database Metrics yang Ada:

```sql
exercise_analytics
├── total_attempts (kuantitas)
├── average_score (rata-rata)
├── highest_score, lowest_score (range)
└── average_time_minutes (durasi)

exercise_attempts
├── total_score, max_possible_score
├── percentage (skala 0-100)
├── time_spent_minutes
└── status tracking

student_answers
├── is_correct (boolean/biner)
├── points_earned (numerik)
└── sentence_arrangement_answer (jsonb)

student_points
├── points_earned per question
└── total_possible_points
```

### Ukuran Keberhasilan:
- ✅ Score improvement (skor naik gak?)
- ✅ Attempt efficiency (butuh berapa attempt?)
- ✅ Time efficiency (waktu berkurang gak?)
- ✅ Question type performance (soal tipe apa yang paling sulit?)

---

## 💬 3. Argumen KUALITATIF (SUPPORTING)

Komponen kualitatif yang ada di database:

```sql
ai_feedback
├── feedback_text (kualitas penjelasan)
├── explanation (deskriptif)
└── reference_materials (contextual resources)

student_answers
├── text_answer (jawaban terbuka)
└── essay_response (konten jawaban siswa)

teacher_create
├── judul, sub_judul (descriptions)
└── konten (text content)
```

### Penggunaan Kualitatif:
- ✅ Analisis kualitas feedback AI
- ✅ Student satisfaction survey
- ✅ Interview sample students (mengapa improve/tidak)
- ✅ Validasi hasil kuantitatif

---

## 🎯 4. FOKUS PENELITIAN AWAL vs DIPERBAHARUI

### ❌ FOKUS AWAL (Tidak Bisa Dipakai):
```
Hypothesis: "Dengan AI Feedback, siswa improve lebih baik 
            dibanding tanpa AI Feedback"

Alasan TIDAK BISA:
→ Semua siswa SUDAH dapat AI Feedback sejak awal
→ Tidak ada kontrol group (tanpa AI)
→ Tidak bisa bandingkan "dengan AI" vs "tanpa AI"
```

### ✅ FOKUS BARU (Realistis & Dapat Dijalankan):
```
Focus: "Bagaimana pola pembelajaran dan peningkatan problem solving 
        siswa ketika menggunakan AI Feedback di platform Si Jerman?"

Tipe: DESCRIPTIVE QUANTITATIVE dengan QUALITATIVE VALIDATION
```

---

## 📋 5. RESEARCH QUESTIONS (Yang Bisa Dijawab)

### **Kuantitatif:**

1. **Learning Progression**
   - Apakah siswa mengalami improvement dari attempt ke-1 → ke-2 → ke-3?
   - Berapa rata-rata improvement per attempt?
   ```
   Ukur: Average percentage naik dari 40% → 55% → 70%?
   ```

2. **Time Efficiency**
   - Apakah siswa membutuhkan fewer attempts untuk mencapai score tinggi?
   - Bagaimana rata-rata time spent vs score achieved?
   ```
   Ukur: Korelasi antara time_spent dan percentage
   ```

3. **Question Type Performance**
   - Soal tipe mana (multiple choice, essay, sentence arrangement) 
     yang paling sulit dipecahkan siswa?
   - Berapa average score per question type?
   ```
   Ukur: SELECT question_type, AVG(points_earned) FROM student_answers
   ```

4. **Attempt Pattern Analysis**
   - Apakah siswa yang lebih rajin attempt (lebih banyak attempts) 
     mendapat score lebih tinggi?
   - Optimal number of attempts untuk mastery?
   ```
   Ukur: Korelasi attempt_number dengan final_score
   ```

5. **Feedback Effectiveness**
   - Apakah ada korelasi antara adanya AI feedback dan score improvement?
   - Apakah siswa yang receive feedback berkualitas tinggi improve lebih cepat?
   ```
   Ukur: Comparison antara students with good feedback vs poor feedback
   ```

### **Kualitatif (Supporting):**

1. **Feedback Quality Assessment**
   - Apakah AI feedback relevan dengan kesalahan siswa?
   - Apakah penjelasan cukup untuk membantu pemahaman?

2. **Student Experience**
   - Bagaimana persepsi siswa tentang AI feedback?
   - Apakah feedback membantu mereka solve problem?

3. **Pattern Explanation**
   - Mengapa siswa dengan attempt lebih banyak mendapat score tinggi/rendah?
   - Faktor apa yang influence learning pattern?

---

## 📊 6. METODOLOGI PENELITIAN

### **Primary Approach: QUANTITATIVE DESCRIPTIVE**

**Langkah Analisis:**

1. **Data Collection**
   ```sql
   SELECT 
     student_id,
     attempt_number,
     percentage,
     time_spent_minutes,
     question_type,
     points_earned
   FROM exercise_attempts
   JOIN student_answers ON exercise_attempts.id = student_answers.attempt_id
   ```

2. **Descriptive Statistics**
   - Mean, Median, SD untuk setiap metric
   - Distribution analysis (improvement distribution)
   - Frequency analysis (question type difficulty)

3. **Correlation Analysis**
   - Attempt count vs Final Score
   - Time spent vs Score
   - Feedback quality vs Score improvement

4. **Trend Analysis**
   - Score progression across attempts
   - Learning curve per student
   - Performance per question type

### **Secondary Approach: QUALITATIVE VALIDATION**

1. **Feedback Quality Assessment**
   - Content analysis dari AI feedback
   - Relevance scoring

2. **Student Interview (Sample)**
   - Why did they improve?
   - Was feedback helpful?
   - What obstacles they faced?

3. **Case Study**
   - Deep dive top 3 performers
   - Deep dive bottom 3 performers
   - Compare patterns

---

## 💾 7. DATA YANG SUDAH TERSEDIA DI DATABASE

### ✅ Sudah Ada:
- ✅ `exercise_attempts` - score, time, attempt number
- ✅ `student_answers` - correctness, points per question
- ✅ `ai_feedback` - feedback text, quality metrics
- ✅ `questions` - question type, difficulty (points)
- ✅ `student_points` - granular score tracking

### ⚠️ Mungkin Perlu Ditambah:
- ❓ `feedback_quality_score` - metric untuk rate kualitas feedback
- ❓ `student_satisfaction` - survey/rating feedback
- ❓ `learning_outcome_assessment` - pre-test/post-test (opsional)

---

## 🎓 8. KESIMPULAN RESEARCH DESIGN

| Aspek | Detail |
|-------|--------|
| **Research Type** | Descriptive Quantitative + Qualitative |
| **Primary Focus** | Pola pembelajaran & improvement dengan AI Feedback |
| **Data Source** | Database Si Jerman (live data) |
| **Sample** | Semua siswa yang sudah menggunakan platform |
| **Time Period** | Historical data analysis + ongoing monitoring |
| **Key Metrics** | Score, Attempts, Time, Question Type Performance |
| **Analysis Method** | Descriptive stats, correlation, trend analysis |
| **Validation** | Qualitative feedback assessment + student interviews |

---

## 📝 9. EXAMPLE RESEARCH FINDINGS (Hipotesis)

### Temuan Potensial:

1. **Hypothesis 1:** Siswa dengan 2-3 attempts memiliki learning curve optimal
   - Attempt 1: 45% avg
   - Attempt 2: 65% avg
   - Attempt 3: 78% avg
   - Attempt 4+: Marginal improvement

2. **Hypothesis 2:** Essay questions lebih sulit dipecahkan (lower avg score)
   - Multiple Choice: 75% avg
   - Sentence Arrangement: 72% avg
   - Essay: 58% avg

3. **Hypothesis 3:** Siswa dengan feedback berkualitas tinggi improve 1.5x lebih cepat
   - Detailed feedback: 2 attempts → 80%
   - Generic feedback: 4 attempts → 80%

4. **Hypothesis 4:** Problem solving ability meningkat konsisten
   - Week 1: 50% avg → Week 4: 72% avg

---

## 📚 10. REFERENSI DATABASE

**Tabel Penting untuk Analisis:**
- `exercise_attempts` (main metric table)
- `student_answers` (detailed answer tracking)
- `ai_feedback` (feedback quality)
- `questions` (question difficulty/type)
- `exercise_analytics` (aggregated metrics)
- `student_points` (points breakdown)

---

## ✅ TODO untuk Implementasi:

- [ ] Define data collection period (1 semester? 1 tahun?)
- [ ] Set baseline metrics (apa baseline score sebelum improvement?)
- [ ] Design survey untuk qualitative validation
- [ ] Plan student interview protocol
- [ ] Create visualization dashboard untuk insights
- [ ] Document feedback quality assessment criteria
- [ ] Prepare statistical analysis scripts

---

**Last Updated:** 7 Feb 2026  
**Status:** Research Design Finalized ✅
