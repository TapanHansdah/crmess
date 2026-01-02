import { supabase } from '@/lib/supabase';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return Response.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users_signup')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return Response.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return Response.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session token
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .insert([{ user_id: user.id, token, expires_at: expiresAt }])
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
    });

    return Response.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          company: user.company,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { message: 'Login failed', error: error.message },
      { status: 500 }
    );
  }
}
