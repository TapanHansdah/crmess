import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function GET(request) {
  try {
    // Calculate timestamp for 24 hours ago
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const oneDayAgoISO = oneDayAgo.toISOString();

    // Fetch notifications from last 24 hours only
    let notifications = [];

    try {
      const { data, error: fetchError } = await supabaseServer
        .from('notifications')
        .select('*')
        .gte('created_at', oneDayAgoISO)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!fetchError && data) {
        notifications = data;
      }
    } catch (err) {
      // Table might not exist
      console.log('Notifications table not found:', err);
    }

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { notifications: [] },
      { status: 500 }
    );
  }
}

