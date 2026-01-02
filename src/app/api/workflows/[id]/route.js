import { supabase } from '@/lib/supabase';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, trigger, action, enabled } = body;

    const { data, error } = await supabase
      .from('workflows')
      .update({
        name,
        description,
        trigger,
        action,
        enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }
    return Response.json({ data: data[0] });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
