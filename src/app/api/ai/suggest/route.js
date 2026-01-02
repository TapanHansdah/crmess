import { getSuggestNextBestAction } from '@/lib/gemini';
import { supabaseServer } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export async function POST(request) {
  try {
    const { leadName, companyName, dealStage, lastInteraction } = await request.json();

    // Validate required fields
    if (!leadName || !companyName || !dealStage || !lastInteraction) {
      return Response.json(
        { error: 'Missing required fields: leadName, companyName, dealStage, lastInteraction' },
        { status: 400 }
      );
    }

    // Fetch comprehensive data from database for this lead
    let databaseContext = {};
    
    if (supabaseServer && leadName) {
      try {
        // Find contact by name
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
          const contact = contacts[0];
          databaseContext.contact = contact;

          // Get all leads for this contact
          const { data: leads } = await supabaseServer
            .from('leads')
            .select('*')
            .eq('contact_id', contact.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (leads) databaseContext.leads = leads;

          // Get tasks
          const { data: tasks } = await supabaseServer
            .from('tasks')
            .select('*')
            .eq('contact_id', contact.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (tasks) databaseContext.tasks = tasks;

          // Get emails
          const { data: emails } = await supabaseServer
            .from('emails')
            .select('*')
            .eq('contact_id', contact.id)
            .order('sent_at', { ascending: false })
            .limit(10);

          if (emails) databaseContext.emails = emails;

          // Get organization info
          if (contact.organization_id) {
            const { data: org } = await supabaseServer
              .from('organizations')
              .select('*')
              .eq('id', contact.organization_id)
              .single();

            if (org) databaseContext.organization = org;
          }
        }
      } catch (dbError) {
        console.error('Error fetching database context:', dbError);
        // Continue without database context
      }
    }

    // Use Gemini with database context for better suggestions
    if (genAI && Object.keys(databaseContext).length > 0) {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const enhancedPrompt = `You are a CRM sales expert. The user has asked a question or requested analysis. Provide a comprehensive, detailed response based on the information provided.

Lead Name: ${leadName}
Company: ${companyName}
Deal Stage: ${dealStage}
User Query/Question: ${lastInteraction}

Additional Database Context:
${JSON.stringify(databaseContext, null, 2)}

Analyze the complete context including:
- Lead's history and interactions
- Previous deals and their outcomes
- Pending tasks
- Email communication history
- Organization details
- Any relevant data from the database

Provide a comprehensive, detailed answer that:
- Fully addresses the user's query or question
- Uses all relevant data from the database context
- Provides actionable insights and recommendations
- Includes specific details, numbers, and facts when available
- Analyzes patterns and trends from the data
- Gives a complete, thorough response without being unnecessarily brief
- Can include multiple paragraphs if needed to fully answer the question`;

      const result = await model.generateContent(enhancedPrompt);
      const response = result.response;
      
      return Response.json({
        success: true,
        text: response.text(),
        timestamp: new Date().toLocaleTimeString(),
        hasDatabaseContext: true,
      });
    } else {
      // Fallback to original method if no database context
      const suggestion = await getSuggestNextBestAction(
        leadName,
        companyName,
        dealStage,
        lastInteraction
      );

      return Response.json({
        success: true,
        text: suggestion,
        timestamp: new Date().toLocaleTimeString(),
        hasDatabaseContext: false,
      });
    }
  } catch (error) {
    console.error('AI Suggestion Error:', error.message, error);
    return Response.json(
      { error: `Failed to generate suggestion: ${error.message}` },
      { status: 500 }
    );
  }
}
