
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin-level access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Cache configuration
export interface CacheConfig {
  ttlMinutes: number; 
  maxSimilarity: number; 
  enableSimilarityMatching: boolean; 
  cacheSizeLimit: number; 
}

// Default cache configuration
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttlMinutes: 60 * 24 * 7, 
  maxSimilarity: 0.75, 
  enableSimilarityMatching: true,
  cacheSizeLimit: 1000
};

// Cache entry interface
export interface CacheEntry {
  id?: string;
  question_id: string;
  question_text: string; 
  is_correct: boolean; 
  feedback_text: string;
  explanation: string;
  reference_materials: string;
  ai_model: string;
  processing_time_ms: number;
  created_at: string;
  hit_count?: number; 
  last_hit?: string;
}

// Cache statistics interface
export interface CacheStats {
  totalQuestions: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number; 
  averageResponseTime: number; 
  averageApiTime: number; 
}

// Similarity score interface
export interface SimilarityResult {
  questionId: string;
  questionText: string;
  similarity: number; 
  cached: boolean; 
  entry?: CacheEntry;
}

function calculateTFIDFSimilarity(text1: string, text2: string): number {
  // Normalize texts
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') 
      .split(/\s+/)
      .filter(word => word.length > 2); 

  const words1 = normalize(text1);
  const words2 = normalize(text2);

  if (words1.length === 0 || words2.length === 0) return 0;

  // Calculate common words
  const set2 = new Set(words2);
  const commonWords = words1.filter(word => set2.has(word)).length;

  // Jaccard similarity: |intersection| / |union|
  const union = new Set([...words1, ...words2]).size;
  const jaccardScore = commonWords / union;

  // Calculate term frequency weight
  const avgLength = (words1.length + words2.length) / 2;
  const lengthSimilarity = 1 - Math.abs(words1.length - words2.length) / avgLength;

  // Combined score
  return jaccardScore * 0.7 + lengthSimilarity * 0.3;
}

export async function getCachedFeedback(
  questionId: string,
  isCorrect: boolean
): Promise<CacheEntry | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_feedback_cache')
      .select('*')
      .eq('question_id', questionId)
      .eq('is_correct', isCorrect)
      .maybeSingle();

    if (error) {
      console.warn('Cache lookup error:', error.message);
      return null;
    }

    if (data) {
      console.log('CACHE HIT (exact match):', questionId);

      // Update hit count
      await updateCacheHitCount(data.id);

      return {
        ...data,
        hit_count: (data.hit_count || 0) + 1,
        last_hit: new Date().toISOString()
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting cached feedback:', error);
    return null;
  }
}

export async function findSimilarCachedFeedback(
  questionText: string,
  isCorrect: boolean,
  threshold: number = DEFAULT_CACHE_CONFIG.maxSimilarity
): Promise<SimilarityResult | null> {
  try {
    // Get all cache entries for this correctness state
    const { data: allCached, error } = await supabaseAdmin
      .from('ai_feedback_cache')
      .select('id, question_id, question_text, is_correct, feedback_text, explanation, reference_materials, ai_model, processing_time_ms, created_at, hit_count')
      .eq('is_correct', isCorrect)
      .order('hit_count', { ascending: false }) // Prioritize frequently used entries
      .limit(100); // Limit search to most relevant

    if (error || !allCached) return null;

    // Calculate similarity for each cached entry
    const results: SimilarityResult[] = allCached
      .map(entry => ({
        questionId: entry.question_id,
        questionText: entry.question_text,
        similarity: calculateTFIDFSimilarity(questionText, entry.question_text),
        cached: true,
        entry: {
          id: entry.id,
          question_id: entry.question_id,
          question_text: entry.question_text,
          is_correct: entry.is_correct,
          feedback_text: entry.feedback_text,
          explanation: entry.explanation,
          reference_materials: entry.reference_materials,
          ai_model: entry.ai_model,
          processing_time_ms: entry.processing_time_ms,
          created_at: entry.created_at,
          hit_count: entry.hit_count
        }
      }))
      .sort((a, b) => b.similarity - a.similarity); // Sort by similarity descending

    // Return best match if above threshold
    const bestMatch = results[0];
    if (bestMatch && bestMatch.similarity >= threshold) {
      console.log(`CACHE HIT (fuzzy match): ${(bestMatch.similarity * 100).toFixed(1)}% similar`);

      if (bestMatch.entry?.id) {
        await updateCacheHitCount(bestMatch.entry.id);
      }

      return bestMatch;
    }

    console.log(`CACHE MISS: No questions similar enough (best: ${results[0]?.similarity.toFixed(3) || 'none'})`);
    return null;
  } catch (error) {
    console.error('Error finding similar cached feedback:', error);
    return null;
  }
}

export async function saveFeedbackToCache(
  entry: Omit<CacheEntry, 'id' | 'created_at' | 'hit_count' | 'last_hit'>
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('ai_feedback_cache')
      .upsert(
        [
          {
            question_id: entry.question_id,
            question_text: entry.question_text,
            is_correct: entry.is_correct,
            feedback_text: entry.feedback_text,
            explanation: entry.explanation,
            reference_materials: entry.reference_materials,
            ai_model: entry.ai_model,
            processing_time_ms: entry.processing_time_ms,
            created_at: new Date().toISOString(),
            hit_count: 0
          }
        ],
        {
          onConflict: 'question_id,is_correct'
        }
      );

    if (error) {
      console.warn('Cache save error:', error.message);
      return false;
    }

    console.log('Feedback cached successfully:', entry.question_id);
    return true;
  } catch (error) {
    console.error('Error saving to cache:', error);
    return false;
  }
}

export async function updateCacheHitCount(cacheId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('ai_feedback_cache')
      .update({ last_hit: new Date().toISOString() })
      .eq('id', cacheId);

    if (error) {
      console.warn('Could not update cache hit count:', error.message);
    }
  } catch (error) {
    console.error('Error updating cache hit count:', error);
  }
}

export async function getCacheStats(): Promise<CacheStats | null> {
  try {
    const { data: stats, error } = await supabaseAdmin
      .from('ai_feedback_cache')
      .select('id, hit_count', { count: 'exact' });

    if (error || !stats) {
      console.warn('Could not retrieve cache stats:', error?.message);
      return null;
    }

    const totalHits = stats.reduce((sum, entry) => sum + ((entry.hit_count as number) || 0), 0);
    const avgHits = totalHits / stats.length;

    return {
      totalQuestions: stats.length,
      cacheHits: totalHits,
      cacheMisses: 0, // Would need to track in database
      hitRate: avgHits,
      averageResponseTime: 0, // Would need additional tracking
      averageApiTime: 0
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
}

export async function clearExpiredCache(ttlMinutes: number = DEFAULT_CACHE_CONFIG.ttlMinutes): Promise<number> {
  try {
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() - ttlMinutes);

    const { data: deleted, error } = await supabaseAdmin
      .from('ai_feedback_cache')
      .delete()
      .lt('created_at', expiryDate.toISOString())
      .select();

    if (error) {
      console.warn('Error clearing expired cache:', error.message);
      return 0;
    }

    console.log(`Cleared ${deleted?.length || 0} expired cache entries`);
    return deleted?.length || 0;
  } catch (error) {
    console.error('Error clearing expired cache:', error);
    return 0;
  }
}

export async function clearQuestionCache(questionId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('ai_feedback_cache')
      .delete()
      .eq('question_id', questionId);

    if (error) {
      console.warn('Error clearing cache for question:', error.message);
      return false;
    }

    console.log('Cleared cache for question:', questionId);
    return true;
  } catch (error) {
    console.error('Error clearing question cache:', error);
    return false;
  }
}

export async function clearAllCache(): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('ai_feedback_cache')
      .delete()
      .neq('id', ''); // Delete all rows

    if (error) {
      console.warn('Error clearing all cache:', error.message);
      return false;
    }

    console.log('Cleared entire cache');
    return true;
  } catch (error) {
    console.error('Error clearing all cache:', error);
    return false;
  }
}

export async function getCacheHealth(): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  cacheSize: number;
  oldestEntry: string | null;
  newestEntry: string | null;
  avgHitCount: number;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_feedback_cache')
      .select('id, created_at, hit_count')
      .order('created_at', { ascending: true })
      .limit(1) // Oldest
      .maybeSingle();

    const { data: newest, error: newestError } = await supabaseAdmin
      .from('ai_feedback_cache')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { count, error: countError } = await supabaseAdmin
      .from('ai_feedback_cache')
      .select('*', { count: 'exact', head: true });

    const { data: allStats, error: statsError } = await supabaseAdmin
      .from('ai_feedback_cache')
      .select('hit_count');

    const avgHitCount =
      allStats && allStats.length > 0
        ? allStats.reduce((sum, entry) => sum + ((entry.hit_count as number) || 0), 0) / allStats.length
        : 0;

    const cacheSize = count || 0;
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (cacheSize > DEFAULT_CACHE_CONFIG.cacheSizeLimit * 0.9) {
      status = 'critical';
    } else if (cacheSize > DEFAULT_CACHE_CONFIG.cacheSizeLimit * 0.7) {
      status = 'warning';
    }

    return {
      status,
      cacheSize,
      oldestEntry: data?.created_at || null,
      newestEntry: newest?.created_at || null,
      avgHitCount
    };
  } catch (error) {
    console.error('Error getting cache health:', error);
    return {
      status: 'critical',
      cacheSize: 0,
      oldestEntry: null,
      newestEntry: null,
      avgHitCount: 0
    };
  }
}
