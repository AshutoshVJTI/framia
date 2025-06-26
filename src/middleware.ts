import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY && request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      {
        error: 'OpenAI API key is not configured. Please add your OPENAI_API_KEY to the .env.local file.',
      },
      { status: 500 }
    );
  }

  return NextResponse.next();
}

// Only run middleware on API routes
export const config = {
  matcher: '/api/:path*',
}; 