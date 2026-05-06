import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      hasGroqKey: !!process.env.GROQ_API_KEY,
      groqKeyLength: process.env.GROQ_API_KEY?.length || 0,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV,
    },
    status: 'ok'
  };

  // Check if critical env vars are missing
  const missingVars = [];
  if (!process.env.GROQ_API_KEY) missingVars.push('GROQ_API_KEY');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missingVars.length > 0) {
    return NextResponse.json({
      ...diagnostics,
      status: 'error',
      error: 'Missing environment variables',
      missingVars
    }, { status: 500 });
  }

  return NextResponse.json(diagnostics);
}
