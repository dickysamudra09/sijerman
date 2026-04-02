#!/bin/bash

# 🚀 QUICK COMMAND REFERENCE - AI Feedback Demo Setup
# Copy-paste these commands untuk setup cepat!

# ========================================
# 1. CREATE CACHE TABLE
# ========================================
# Buka: https://app.supabase.com/project/YOUR-ID/sql
# Copy entire content dari: database/migrations/create_ai_feedback_cache.sql
# Paste ke SQL Editor
# Click "Run"
# Expected result: "CREATE TABLE" message (no error)

# ========================================
# 2. PRE-GENERATE CACHE
# ========================================

# Terminal command:
curl -X POST http://localhost:3000/api/ai-feedback/pre-generate \
  -H "Content-Type: application/json" \
  -d '{
    "exerciseSetId": "YOUR_EXERCISE_SET_ID_HERE",
    "limit": 15,
    "forceRefresh": false
  }'

# Expected response:
# {
#   "success": true,
#   "message": "✅ Pre-generation completed",
#   "summary": {
#     "total": 15,
#     "cached": 15,
#     "skipped": 0,
#     "failed": 0
#   }
# }

# ========================================
# 3. VERIFY CACHE CREATED
# ========================================

# Option A: Di Supabase UI
# 1. Open: https://app.supabase.com/project/YOUR-ID/editor
# 2. Click table: ai_feedback_cache
# 3. Verify: > 10 rows ada dengan feedback text

# Option B: Via SQL Query
# Buka Supabase SQL Editor, jalankan:
# 
# SELECT 
#   COUNT(*) as total,
#   COUNT(DISTINCT question_id) as unique_questions,
#   MAX(created_at) as latest_cache
# FROM ai_feedback_cache;

# ========================================
# 4. TEST LOCALLY
# ========================================

# Make sure server running:
npm run dev
# Expected: http://localhost:3000 accessible

# Open in browser:
# http://localhost:3000/home/classrooms/[CLASS-ID]/latihan/[EXERCISE-ID]

# Submit answer
# Expected: instant response with badge "📦 From Cache"

# Check DevTools:
# 1. F12 → Network tab
# 2. Filter: "ai-feedback"
# 3. Click the request
# 4. Check "Time" column: should be < 100ms

# ========================================
# 5. MONITOR CACHE HITS
# ========================================

# Run this in Supabase SQL Editor (every 5 minutes during demo):
SELECT 
  COUNT(*) as total_feedback,
  COUNT(CASE WHEN cached = true THEN 1 END) as cache_hits,
  ROUND(100.0 * COUNT(CASE WHEN cached = true THEN 1 END) / NULLIF(COUNT(*), 0), 2) as cache_hit_rate,
  AVG(processing_time_ms) as avg_response_time_ms
FROM ai_feedback
WHERE created_at > now() - interval '2 hours'
ORDER BY created_at DESC;

# Expected during demo:
# - cache_hits: > 70% of total
# - avg_response_time_ms: < 500ms (mostly cached)

# ========================================
# 6. CHECK API KEY BALANCE
# ========================================

# Check OpenAI:
curl -s -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/dashboard/billing/credit_grants | jq '.data[0] | {balance: .balance, limit: .limit}'

# Check Anthropic:
# Go to: https://console.anthropic.com/account/usage

# ========================================
# 7. CLEAR CACHE (IF NEEDED)
# ========================================

# Reset all cache (delete dan regenerate):
# Buka Supabase SQL Editor, jalankan:
#
# DELETE FROM ai_feedback_cache;
#
# Then run pre-generate command again (step 2)

# ========================================
# 8. EMERGENCY: View Logs
# ========================================

# Terminal (where npm run dev running):
# Press Ctrl+Shift+K to show logs
# Filter for:
# - "Cache HIT"
# - "Claude Feedback"
# - "Error"

# Or check server terminal output directly

# ========================================
# DEMO DAY MORNING CHECKLIST
# ========================================

# 1. Start server
npm run dev

# 2. Check cache exists
# SELECT COUNT(*) FROM ai_feedback_cache;
# Expected: > 10

# 3. Test 1 answer locally
# Submit answer → verify instant response

# 4. Check DevTools Network time
# F12 → Network → should be < 100ms

# 5. Monitor dashboard ready
# Supabase tab open, ready to check stats

# 6. Phone backup ready
# Have phone with same app for backup demo

# 7. Ready to present!
# Good luck! 🚀

# ========================================
# TROUBLESHOOTING COMMANDS
# ========================================

# If cache table error:
# SELECT table_name FROM information_schema.tables 
# WHERE table_name = 'ai_feedback_cache';
# If empty: run the SQL migration again

# If pre-generation timeout:
# Make sure server running and API key valid
# Check server logs for error message

# If still getting error 429:
# curl -s http://localhost:3000/api/ai-feedback/pre-generate \
#   -H "Content-Type: application/json" \
#   -d '{"exerciseSetId": "test"}' | jq
# Check response for error details

# If response very slow:
# Check if cache is being used:
# grep -i "cache hit" server-logs.txt
# If no cache hits, verify pre-generation completed

# ========================================
# SUCCESS SIGNALS
# ========================================

# ✅ Cache table created
# ✅ Pre-generation completed with 15+ items
# ✅ Submit answer → response < 100ms
# ✅ DevTools shows "ai-feedback" request time < 100ms
# ✅ Badge shows "📦 From Cache"
# ✅ Supabase shows > 10 rows in ai_feedback_cache

# If all above ✅, you're READY FOR DEMO! 🎉

# ========================================
# NOTES
# ========================================

# - Replace YOUR_EXERCISE_SET_ID with actual ID
# - Replace YOUR-ID with actual Supabase project ID
# - Command syntax might differ on Windows (use Git Bash or WSL)
# - Test locally before running on production
# - Keep Supabase dashboard open during demo for monitoring
