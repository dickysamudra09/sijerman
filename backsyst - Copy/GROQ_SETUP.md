# 🚀 Groq API Setup Guide

## Perubahan dari HuggingFace ke Groq

Sistem AI feedback telah di-upgrade dari HuggingFace ke **Groq API** untuk reliability dan speed yang lebih baik.

---

## ⚙️ Setup Steps

### 1. **Dapatkan Groq API Key**

1. Kunjungi https://console.groq.com
2. Sign up atau login dengan akun Anda
3. Buat API key baru
4. Copy API key Anda

### 2. **Konfigurasi Environment Variable**

Buat atau update file `.env.local` di folder `backsyst`:

```bash
# .env.local
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxx

# Supabase (jika belum ada)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxx...
```

**PENTING:** Jangan commit `.env.local` ke Git! Sudah ada di `.gitignore`.

### 3. **Verify Setup**

```bash
# Restart dev server
npm run dev

# Atau jika menggunakan yarn
yarn dev
```

---

## 📝 File yang Berubah

| File | Perubahan |
|------|-----------|
| `src/app/api/ai-feedback/route.ts` | HuggingFace → Groq API |
| `src/app/api/ai-feedback/pre-generate/route.ts` | HuggingFace → Groq API |

### Function Changes:
- `callHuggingFaceAPI()` → `callGroqAPI()`
- `generateAIFeedbackWithHuggingFace()` → `generateAIFeedbackWithGroq()`
- Model: `mistral-7b-instruct` via Groq

---

## 🔍 Testing

### Test AI Feedback Flow:

1. **Via Dashboard:**
   - Buka soal essay
   - Submit jawaban
   - Cek AI feedback response

2. **Via API (Manual Test):**
   ```bash
   curl -X POST http://localhost:3000/api/ai-feedback \
     -H "Content-Type: application/json" \
     -d '{
       "studentAnswerId": "test-id",
       "questionId": "question-id",
       "attemptId": "attempt-id",
       "textAnswer": "Ich heiße John",
       "isCorrect": true
     }'
   ```

3. **Via Pre-generation (untuk cache):**
   ```bash
   curl -X POST http://localhost:3000/api/ai-feedback/pre-generate \
     -H "Content-Type: application/json" \
     -d '{
       "exerciseSetId": "exercise-id",
       "limit": 5
     }'
   ```

---

## ✅ Expected Output

Ketika setup berhasil, Anda akan melihat logs seperti:

```
🔄 Calling Groq API...
✅ Groq API response received successfully
✅ Feedback cached successfully
```

---

## ⚠️ Troubleshooting

### Error: "Groq API key not configured"
**Solusi:** Set `GROQ_API_KEY` di `.env.local` dan restart server

### Error: "Rate limit exceeded"
**Solusi:** Groq free tier ada rate limiting. Tunggu beberapa menit atau upgrade plan

### Error: "No response from Groq"
**Solusi:** 
- Cek internet connection
- Verify API key masih valid
- Check logs untuk error detail

### Feedback quality buruk?
**Solusi:**
- Model `mistral-7b-instruct` sudah bagus untuk bahasa Jerman
- Jika ingin lebih baik, bisa switch ke model berbayar di Groq

---

## 📊 Groq Pricing

**Free Tier:**
- ~10,000 requests/day
- Cocok untuk development & testing

**Paid Tier:**
- Mulai dari ~$0.30/1M tokens
- Jauh lebih murah dari OpenAI/Claude

[Cek pricing detail](https://console.groq.com/keys)

---

## 🔄 Fallback Mechanism

Jika Groq API fail, sistem akan:
1. ✅ Automatically fallback ke **local analysis**
2. ✅ Tetap memberikan feedback (berkualitas lebih rendah tapi tetap useful)
3. ✅ Log error untuk debugging

---

## 📚 Resources

- [Groq Console](https://console.groq.com)
- [Groq API Documentation](https://console.groq.com/docs)
- [Mistral Model Info](https://console.groq.com/docs/models)

---

**Setup selesai? Mari test feedback AI Anda!** 🚀
