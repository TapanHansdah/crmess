import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return Response.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token and get user
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();

    if (sessionError || !session) {
      return Response.json(
        { message: 'Invalid session' },
        { status: 401 }
      );
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      return Response.json(
        { message: 'Session expired' },
        { status: 401 }
      );
    }

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users_signup')
      .select('id, email, first_name, last_name, company')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      return Response.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return Response.json(user);
  } catch (error) {
    console.error('Auth check error:', error);
    return Response.json(
      { message: 'Auth check failed', error: error.message },
      { status: 500 }
    );
  }
}
