import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Response.json({ data });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description, trigger, action, enabled } = body;

    if (!name || !trigger || !action) {
      return Response.json(
        { error: 'Missing required fields: name, trigger, action' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('workflows')
      .insert([
        {
          name,
          description: description || '',
          trigger,
          action,
          enabled: enabled !== false,
        },
      ])
      .select();

    if (error) throw error;
    return Response.json({ data: data?.[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
