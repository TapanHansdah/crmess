import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = query.trim();
    const pattern = `%${searchTerm}%`;

    // Search contacts
    const { data: contacts, error: contactsError } = await supabaseServer
      .from('contacts')
      .select('id, first_name, last_name, email, phone, job_title')
      .or(`first_name.ilike."${pattern}",last_name.ilike."${pattern}",email.ilike."${pattern}",phone.ilike."${pattern}"`)
      .limit(limit);

    // Search leads
    const { data: leads, error: leadsError } = await supabaseServer
      .from('leads')
      .select('id, title, stage, value, contact_id, contacts(first_name, last_name, email)')
      .or(`title.ilike."${pattern}",stage.ilike."${pattern}"`)
      .limit(limit);

    // Search documents
    const { data: documents, error: documentsError } = await supabaseServer
      .from('documents')
      .select('id, name, file_type, description')
      .or(`name.ilike."${pattern}",description.ilike."${pattern}",file_type.ilike."${pattern}"`)
      .limit(limit);

    // Search invoices
    const { data: invoices, error: invoicesError } = await supabaseServer
      .from('invoices')
      .select('id, invoice_number, status, total_amount, contact_id, contacts(first_name, last_name, email)')
      .or(`invoice_number.ilike."${pattern}",status.ilike."${pattern}"`)
      .limit(limit);

    const results = {
      contacts: contacts || [],
      leads: leads || [],
      documents: documents || [],
      invoices: invoices || [],
    };

    // Check for errors
    const errors = [contactsError, leadsError, documentsError, invoicesError].filter(Boolean);
    if (errors.length > 0) {
      console.error('Search errors:', errors);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}

