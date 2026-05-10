import { createClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // During build time, environment variables might not be available
    // Return a mock client that will be replaced at runtime
    if (!supabaseUrl || !supabaseAnonKey) {
      if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
        // Build time - return a mock that won't be used
        return createClient('https://placeholder.supabase.co', 'placeholder-key');
      }
      throw new Error('Supabase environment variables are not set');
    }
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

// For backward compatibility - export as object that calls getSupabase() when accessed
// This ensures no initialization happens at module load time
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const client = getSupabase();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});
