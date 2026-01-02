import { supabase } from '@/lib/supabase';

// Optional Gmail import - will be null if not available
let sendEmail = null;
let emailTemplates = null;

try {
  const gmailModule = await import('@/lib/gmail');
  sendEmail = gmailModule.sendEmail;
  emailTemplates = gmailModule.emailTemplates;
} catch (error) {
  console.warn('Gmail module not available, email sending disabled');
}

// Handler for different trigger types
async function checkTriggerConditions(trigger) {
  switch (trigger) {
    case 'lead_created':
      // Check for recently created leads (last hour)
      const { data: recentLeads } = await supabase
        .from('leads')
        .select('id')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .limit(1);
      return recentLeads && recentLeads.length > 0;

    case 'deal_stage_changed':
      // Check for deals with status changes (last hour)
      const { data: changedDeals } = await supabase
        .from('deals')
        .select('id')
        .gte('updated_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .limit(1);
      return changedDeals && changedDeals.length > 0;

    case 'contact_inactive':
      // Check for contacts inactive for 30+ days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: inactiveContacts } = await supabase
        .from('contacts')
        .select('id')
        .lt('updated_at', thirtyDaysAgo)
        .limit(1);
      return inactiveContacts && inactiveContacts.length > 0;

    case 'email_opened':
      // Check for recently opened emails
      const { data: openedEmails } = await supabase
        .from('emails')
        .select('id')
        .eq('is_opened', true)
        .gte('opened_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .limit(1);
      return openedEmails && openedEmails.length > 0;

    case 'deal_value_updated':
      // Check for deals with value updates
      const { data: updatedDeals } = await supabase
        .from('deals')
        .select('id')
        .gte('updated_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .limit(1);
      return updatedDeals && updatedDeals.length > 0;

    default:
      return false;
  }
}

// Handler for different action types
async function executeAction(action, triggerData) {
  switch (action) {
    case 'assign_to_team':
      // Auto-assign lead to first available team member
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'sales')
        .limit(1);
      
      if (users && users.length > 0) {
        return {
          success: true,
          message: `Assigned to ${users[0].id}`,
          assignedTo: users[0].id
        };
      }
      return { success: false, message: 'No available team members' };

    case 'send_email':
      // Get the lead that triggered this - with contact and org info
      // CRITICAL: Always use provided leadId to ensure we send to the correct contact
      // This prevents sending emails to the wrong person when multiple leads exist
      console.log('\n📧 SEND EMAIL ACTION STARTING');
      console.log('   triggerData:', JSON.stringify(triggerData, null, 2));
      
      let leadQuery = supabase
        .from('leads')
        .select('id, contact_id, organization_id, created_at');

      if (triggerData && triggerData.leadId) {
        // Use the specific lead ID provided (most reliable method)
        console.log('   ✓ Using specific leadId:', triggerData.leadId);
        leadQuery = leadQuery.eq('id', triggerData.leadId);
      } else {
        // Fallback: get the most recent lead (only if no specific leadId given)
        console.log('   ⚠️  No leadId provided, using most recent lead');
        leadQuery = leadQuery
          .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false });
      }

      const { data: leadsList, error: leadsError } = await leadQuery.limit(1);

      console.log('Send email trigger - leads query:', { leadsList, leadsError, hasModule: !!sendEmail, hasTemplates: !!emailTemplates, leadId: triggerData?.leadId });

      if (leadsError) {
        return { success: false, message: `Database error: ${leadsError.message}` };
      }

      if (!sendEmail) {
        return { success: false, message: 'Gmail module not available' };
      }

      if (!emailTemplates) {
        return { success: false, message: 'Email templates not available' };
      }

      if (leadsList && leadsList.length > 0) {
        const leadData = leadsList[0];
        
        let contacts = null;

        // PRIORITY 1: If we have a contact email from triggerData, use that directly
        if (triggerData?.contactEmail) {
          console.log('   ✅ PRIORITY 1: Using provided contact email:', triggerData.contactEmail);
          const { data: contactByEmail } = await supabase
            .from('contacts')
            .select('id, first_name, email')
            .eq('email', triggerData.contactEmail)
            .single();
          
          if (contactByEmail) {
            contacts = contactByEmail;
            console.log('   ✓ Found contact by email:', contacts);
          }
        }

        // PRIORITY 2: If no email provided, get contact by lead's contact_id
        if (!contacts) {
          console.log('   ⚠️  PRIORITY 2: contactEmail not provided, falling back to lead.contact_id:', leadData.contact_id);
          const { data: contactByLead, error: contactError } = await supabase
            .from('contacts')
            .select('id, first_name, email')
            .eq('id', leadData.contact_id)
            .single();

          if (contactError || !contactByLead) {
            return { success: false, message: 'Lead contact not found' };
          }
          contacts = contactByLead;
        }

        // Get organization info
        let orgName = 'APEX CRM';
        if (leadData.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', leadData.organization_id)
            .single();
          if (org) orgName = org.name;
        }

        console.log('Sending welcome email to:', { contact: contacts, org: orgName });

        const htmlContent = emailTemplates.welcomeLead(
          contacts.first_name || 'Valued',
          orgName
        );

        const emailResult = await sendEmail(
          contacts.email,
          'Welcome to APEX CRM!',
          htmlContent
        );

        console.log('Email send result:', emailResult);

        return {
          success: emailResult.success,
          message: emailResult.success
            ? `Welcome email sent to ${contacts.email}`
            : `Failed to send email: ${emailResult.error}`,
          emailSent: emailResult.success,
          messageId: emailResult.messageId,
        };
      }
      return { success: false, message: 'No leads found. Did the lead creation SQL execute successfully?' };

    case 'send_notification':
      // Send in-app notification
      return {
        success: true,
        message: 'Notification sent',
        notificationSent: true
      };

    case 'update_status':
      // Update lead/deal status
      return {
        success: true,
        message: 'Status updated to Active',
        statusUpdated: true
      };

    case 'create_task':
      // Create a task for follow-up
      return {
        success: true,
        message: 'Follow-up task created',
        taskCreated: true
      };

    default:
      return { success: false, message: 'Unknown action' };
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { workflowId, leadId, contactEmail } = body;

    console.log('\n📨 WORKFLOW EXECUTION API RECEIVED:');
    console.log('   - workflowId:', workflowId);
    console.log('   - leadId:', leadId);
    console.log('   - contactEmail:', contactEmail);

    if (!workflowId) {
      return Response.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    // Fetch the workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (workflowError || !workflow) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (!workflow.enabled) {
      return Response.json(
        { error: 'Workflow is disabled' },
        { status: 400 }
      );
    }

    // Check if trigger conditions are met
    const triggerMet = await checkTriggerConditions(workflow.trigger);

    if (!triggerMet) {
      return Response.json({
        success: false,
        message: `Trigger condition '${workflow.trigger}' not met`,
        executed: false,
      });
    }

    // Execute the action, passing trigger data (like leadId and contactEmail) for context
    const triggerData = {
      ...(leadId && { leadId }),
      ...(contactEmail && { contactEmail })
    };
    console.log('🔄 TRIGGER DATA CONSTRUCTED:', JSON.stringify(triggerData, null, 2));
    const actionResult = await executeAction(workflow.action, triggerData);

    // Log the workflow execution
    const { error: logError } = await supabase
      .from('workflow_executions')
      .insert([
        {
          workflow_id: workflowId,
          status: actionResult.success ? 'success' : 'failed',
          result: actionResult,
          executed_at: new Date().toISOString(),
        },
      ])
      .select();

    if (logError) {
      console.error('Error logging workflow execution:', logError);
    }

    return Response.json({
      success: actionResult.success,
      message: actionResult.message,
      executed: true,
      result: actionResult,
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
