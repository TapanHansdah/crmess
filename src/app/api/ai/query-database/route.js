import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseServer } from '@/lib/supabase';

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('Google Gemini API key not found. AI database query features may not work properly.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Query the database based on natural language query
 * Gemini analyzes the query and fetches relevant data from Supabase
 */
export async function POST(request) {
  try {
    const { query, leadName } = await request.json();

    if (!query) {
      return Response.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    if (!genAI) {
      return Response.json(
        { error: 'Gemini API not configured' },
        { status: 500 }
      );
    }

    if (!supabaseServer) {
      return Response.json(
        { error: 'Supabase server client not configured' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Step 1: Use Gemini to understand what data to fetch
    const analysisPrompt = `You are a database query analyzer. Analyze this user query and determine what data to fetch from the CRM database.

User Query: "${query}"
${leadName ? `Lead Name: "${leadName}"` : ''}

Available database tables:
- contacts (id, first_name, last_name, email, phone, job_title, department, organization_id, created_at)
- leads (id, contact_id, title, description, stage, value, expected_close_date, probability_percentage, created_at)
- deals (id, contact_id, title, stage, value, created_at)
- organizations (id, name, industry, size, created_at)
- tasks (id, contact_id, title, description, due_date, status, created_at)
- invoices (id, contact_id, amount, status, issued_date, due_date)
- emails (id, contact_id, subject, body, sent_at)
- documents (id, contact_id, name, file_url, created_at)

Determine:
1. Which table(s) to query
2. What fields to select
3. Any filters needed (especially if leadName is provided)
4. What kind of insights to provide

Respond in JSON format:
{
  "tables": ["table1", "table2"],
  "fields": ["field1", "field2"],
  "filters": {"field": "value"},
  "insightType": "summary|analysis|recommendation|data"
}`;

    const analysisResult = await model.generateContent(analysisPrompt);
    const analysisText = analysisResult.response.text();
    
    // Extract JSON from Gemini response
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in analysis');
      }
    } catch (parseError) {
      console.error('Error parsing analysis:', parseError);
      // Fallback analysis
      analysis = {
        tables: leadName ? ['contacts', 'leads'] : ['contacts', 'leads', 'deals'],
        fields: ['*'],
        filters: leadName ? { name: leadName } : {},
        insightType: 'analysis'
      };
    }

    // Step 2: Fetch data from Supabase based on analysis
    let databaseData = {};

    // If leadName is provided, find the contact first
    let contactId = null;
    if (leadName) {
      const nameParts = leadName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      let contactQuery = supabaseServer
        .from('contacts')
        .select('id, first_name, last_name, email, phone, job_title, organization_id')
        .ilike('first_name', `%${firstName}%`);

      if (lastName) {
        contactQuery = contactQuery.ilike('last_name', `%${lastName}%`);
      }

      const { data: contacts } = await contactQuery.limit(1);
      if (contacts && contacts.length > 0) {
        contactId = contacts[0].id;
        databaseData.contact = contacts[0];
      }
    }

    // Fetch data from relevant tables
    for (const table of analysis.tables || ['contacts', 'leads']) {
      try {
        let query = supabaseServer.from(table).select('*');

        // Apply filters
        if (contactId && (table === 'leads' || table === 'deals' || table === 'tasks' || table === 'invoices' || table === 'emails' || table === 'documents')) {
          query = query.eq('contact_id', contactId);
        }

        // Limit results for performance
        query = query.limit(50).order('created_at', { ascending: false });

        const { data, error } = await query;

        if (!error && data) {
          databaseData[table] = data;
        }
      } catch (tableError) {
        console.error(`Error fetching from ${table}:`, tableError);
      }
    }

    // Step 3: Use Gemini to generate insights based on the data
    const insightPrompt = `You are a CRM sales expert. Analyze the following database data and provide insights based on the user's query.

User Query: "${query}"
${leadName ? `Lead Name: "${leadName}"` : ''}

Database Data:
${JSON.stringify(databaseData, null, 2)}

Provide:
1. A comprehensive analysis of the data
2. Key insights relevant to the user's query
3. Actionable recommendations if applicable
4. Any patterns or trends you notice

Be specific, data-driven, and actionable. Format your response in a clear, professional manner.`;

    const insightResult = await model.generateContent(insightPrompt);
    const insights = insightResult.response.text();

    return Response.json({
      success: true,
      insights,
      data: databaseData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database Query Error:', error.message, error);
    return Response.json(
      { error: `Failed to query database: ${error.message}` },
      { status: 500 }
    );
  }
}

