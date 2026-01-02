import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow login page and public routes
  if (pathname === '/login' || pathname === '/') {
    return NextResponse.next();
  }

  // Protect dashboard and app routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/app')) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify token directly using Supabase (don't use fetch in middleware)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        // If env vars are missing, allow through but log warning
        console.warn('Supabase env vars missing in middleware');
        return NextResponse.next();
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Check session validity
      const { data: session, error: sessionError } = await supabase
        .from('user_sessions')
        .select('expires_at')
        .eq('token', token)
        .single();

      if (sessionError || !session) {
        const newResponse = NextResponse.redirect(new URL('/login', request.url));
        newResponse.cookies.delete('auth_token');
        return newResponse;
      }

      // Check if session is expired
      if (new Date(session.expires_at) < new Date()) {
        const newResponse = NextResponse.redirect(new URL('/login', request.url));
        newResponse.cookies.delete('auth_token');
        return newResponse;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      // On error, allow through to avoid blocking legitimate requests
      // The API routes will handle authentication properly
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
