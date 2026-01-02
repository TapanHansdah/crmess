import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, tableName, action, entityName, entityId, changes, entityData } = body;

    if (!userId || !tableName || !action) {
      return Response.json(
        { error: 'Missing required fields: userId, tableName, action' },
        { status: 400 }
      );
    }

    // Log to audit_logs table
    const auditLogEntry = {
      user_id: userId,
      table_name: tableName,
      action: action,
      entity_type: tableName.charAt(0).toUpperCase() + tableName.slice(1),
      entity_name: entityName || 'Record',
      entity_id: entityId || null,
      details: JSON.stringify({
        changes: changes || {},
        fullData: entityData || {},
        timestamp: new Date().toISOString(),
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: auditError, data: auditData } = await supabase
      .from('audit_logs')
      .insert([auditLogEntry])
      .select();

    if (auditError) {
      console.warn('Failed to log audit trail:', auditError);
    } else {
      console.log('✅ Audit log created:', entityName);
    }

    // Create notification
    const notificationMessage = formatNotificationMessage(action, tableName, entityName);
    const notification = {
      user_id: userId,
      type: action,
      title: notificationMessage.title,
      message: notificationMessage.message,
      entity_type: tableName,
      entity_id: entityId || null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const { error: notifError, data: notifData } = await supabase
      .from('notifications')
      .insert([notification])
      .select();

    if (notifError) {
      console.warn('Failed to create notification:', notifError);
    } else {
      console.log('✅ Notification created:', notificationMessage.title);
    }

    return Response.json({
      success: true,
      message: 'Audit log and notification created successfully',
      auditLog: auditData?.[0] || null,
      notification: notifData?.[0] || null,
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return Response.json(
      { error: error.message || 'Failed to create audit log' },
      { status: 500 }
    );
  }
}

// Helper function to format notification messages
function formatNotificationMessage(action, tableName, entityName) {
  const actionText = {
    create: 'created',
    update: 'updated',
    delete: 'deleted',
  }[action] || action;

  const entityText = tableName.endsWith('s') ? tableName.slice(0, -1) : tableName;
  const title = `${entityText.charAt(0).toUpperCase() + entityText.slice(1)} ${actionText}`;
  const message = `${entityName} has been ${actionText} successfully`;

  return { title, message };
}
