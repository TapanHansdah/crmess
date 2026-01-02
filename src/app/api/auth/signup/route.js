import { supabase, supabaseServer } from '@/lib/supabase';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const { email, password, first_name, last_name, company } = await req.json();

    // Validate input
    if (!email || !password) {
      return Response.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users_signup')
      .select('id')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is fine
      console.error('Error checking user:', checkError);
      throw checkError;
    }

    if (existingUser) {
      return Response.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error } = await supabase
      .from('users_signup')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          first_name,
          last_name,
          company,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Create session token
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { data: session } = await supabase
      .from('user_sessions')
      .insert([{ user_id: user.id, token, expires_at: expiresAt }])
      .select()
      .single();

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
        message: 'Signup successful',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          company: user.company,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return Response.json(
      { 
        message: 'Signup failed', 
        error: error.message || 'Unknown error',
        details: error.details || error.hint || null
      },
      { status: 500 }
    );
  }
}
