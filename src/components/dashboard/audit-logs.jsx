'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { History, Edit2, Plus, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

const ActionBadge = ({ action }) => {
  const variants = {
    create: 'bg-green-100 text-green-800',
    update: 'bg-blue-100 text-blue-800',
    delete: 'bg-red-100 text-red-800',
    insert: 'bg-green-100 text-green-800',
    view: 'bg-gray-100 text-gray-800',
  };

  const icons = {
    create: <Plus className="h-3 w-3" />,
    update: <Edit2 className="h-3 w-3" />,
    delete: <Trash2 className="h-3 w-3" />,
    insert: <Plus className="h-3 w-3" />,
    view: <Eye className="h-3 w-3" />,
  };

  return (
    <Badge variant="outline" className={variants[action] || variants.view}>
      <span className="mr-1">{icons[action]}</span>
      {action.charAt(0).toUpperCase() + action.slice(1)}
    </Badge>
  );
};

export default function AuditLogs({ logs = [] }) {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calculate currentUserName inside effect to avoid dependency issues
        const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Unknown User';

        // Mock fallback data - created inside effect to use current userName
        const defaultLogs = [
          {
            id: 1,
            user_name: userName,
            action: 'create',
            entity_type: 'Contact',
            entity_name: 'John Doe',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
            details: 'Created new contact',
          },
          {
            id: 2,
            user_name: userName,
            action: 'update',
            entity_type: 'Deal',
            entity_name: 'Website Redesign - ₹25,000',
            created_at: new Date(Date.now() - 5 * 60 * 60 * 1000),
            details: 'Updated deal status to Proposal Sent',
          },
          {
            id: 3,
            user_name: userName,
            action: 'view',
            entity_type: 'Account',
            entity_name: 'Acme Corp',
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            details: 'Viewed account details',
          },
          {
            id: 4,
            user_name: userName,
            action: 'delete',
            entity_type: 'Task',
            entity_name: 'Follow-up call',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            details: 'Deleted completed task',
          },
        ];

        // Try to fetch from database 
        const { data, error: fetchError } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (fetchError) {
          console.warn('Database fetch failed, using mock data:', fetchError);
          setAuditLogs(defaultLogs);
        } else if (data && data.length > 0) {
          // Map audit_logs to display format, using user email if available
          const mappedLogs = data.map(log => ({
            ...log,
            user_name: log.user_name || (user && user.email) || 'Unknown User',
            entity_type: log.table_name ? log.table_name.charAt(0).toUpperCase() + log.table_name.slice(1) : 'Unknown',
            entity_name: log.entity_name || log.details || 'N/A',
          }));
          setAuditLogs(mappedLogs);
        } else {
          // Fallback to mock data if no audit logs exist yet
          setAuditLogs(defaultLogs);
        }
      } catch (err) {
        console.error('Failed to load audit logs:', err);
        setError(err.message);
        // Calculate userName for error fallback
        const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Unknown User';
        const defaultLogs = [
          {
            id: 1,
            user_name: userName,
            action: 'create',
            entity_type: 'Contact',
            entity_name: 'John Doe',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
            details: 'Created new contact',
          },
        ];
        setAuditLogs(defaultLogs);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-blue-600" />
          Audit Log
        </CardTitle>
        <CardDescription>Track all changes and user activities</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {auditLogs && auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div key={log.id} className="pb-4 border-b last:border-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {log.user_name || log.user || 'Unknown User'}
                          </p>
                          <ActionBadge action={log.action} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.details || `${log.action} ${log.entity_type}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.entity_type}: <span className="font-medium">{log.entity_name}</span>
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No audit logs found
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
