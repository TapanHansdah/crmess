import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');

    return Response.json(
      { message: 'Logout successful' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json(
      { message: 'Logout failed', error: error.message },
      { status: 500 }
    );
  }
}
