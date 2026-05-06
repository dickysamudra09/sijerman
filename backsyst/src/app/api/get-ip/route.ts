/**
 * API Route: Get User IP Address
 * Extracts user's IP from request headers
 * Used for session logging and security auditing
 */

import { NextRequest, NextResponse } from 'next/server';

export const GET = async (request: NextRequest) => {
  try {
    // Get IP from headers (in order of preference)
    // Note: request.ip is not available in Next.js 15, use headers instead
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') || // Cloudflare
      'unknown';

    return NextResponse.json(
      { ip, success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting IP:', error);
    return NextResponse.json(
      { error: 'Failed to get IP', success: false },
      { status: 500 }
    );
  }
};
