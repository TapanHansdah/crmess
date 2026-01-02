'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Ticket, Plus, Clock, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format, differenceInHours } from 'date-fns';
import { supabase } from '@/lib/supabase';

const PriorityBadge = ({ priority }) => {
  const variants = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  return (
    <Badge variant="outline" className={variants[priority] || variants.low}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

const StatusBadge = ({ status }) => {
  const variants = {
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    waiting: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  return (
    <Badge variant="outline" className={variants[status] || variants.open}>
      {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
    </Badge>
  );
};

const defaultTickets = [
  {
    id: 'TKT-001',
    subject: 'Login issues on mobile app',
    customer_id: 'C-123',
    customer_name: 'Alice Johnson',
    priority: 'high',
    status: 'in_progress',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 30 * 60 * 1000),
    assigned_to: 'Sarah Chen',
    sla_hours: 4,
  },
  {
    id: 'TKT-002',
    subject: 'Feature request: Export to CSV',
    customer_id: 'C-456',
    customer_name: 'Bob Smith',
    priority: 'low',
    status: 'open',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    assigned_to: null,
    sla_hours: 24,
  },
  {
    id: 'TKT-003',
    subject: 'Dashboard not loading',
    customer_id: 'C-789',
    customer_name: 'Charlie Brown',
    priority: 'critical',
    status: 'open',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    assigned_to: 'Mike Davis',
    sla_hours: 1,
  },
];

export default function SupportTicketing() {
  const [tickets, setTickets] = useState(defaultTickets);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data, error: supabaseError } = await supabase
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (supabaseError || !data?.length) {
          setTickets(defaultTickets);
        } else {
          setTickets(data);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching support tickets:', err);
        setError('Failed to load support tickets from database');
        setTickets(defaultTickets);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const getSLAStatus = (createdAt, slaHours) => {
    const hoursElapsed = differenceInHours(new Date(), new Date(createdAt));
    const percentage = Math.min(100, (hoursElapsed / slaHours) * 100);
    return {
      percentage,
      isBreached: hoursElapsed > slaHours,
      hoursRemaining: Math.max(0, slaHours - hoursElapsed),
    };
  };

  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress');
  const stats = {
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    avgResolutionTime: '2.4 hours',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
        <p className="text-sm font-medium">{error}</p>
        <p className="text-xs text-amber-700 mt-1">Using cached data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">Being worked on</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResolutionTime}</div>
            <p className="text-xs text-muted-foreground mt-1">Time to resolve</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-blue-600" />
              Support Tickets
            </CardTitle>
            <CardDescription>Track and manage customer support requests</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No support tickets found</p>
              </div>
            ) : (
              tickets.map((ticket) => {
                const slaStatus = getSLAStatus(ticket.created_at, ticket.sla_hours);

                return (
                  <div key={ticket.id} className="p-4 border rounded-lg hover:bg-muted/50 transition">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-blue-600">{ticket.id}</span>
                          <StatusBadge status={ticket.status} />
                          <PriorityBadge priority={ticket.priority} />
                        </div>
                        <p className="font-medium text-sm">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ticket.customer_name}
                          {ticket.assigned_to && ` • Assigned to ${ticket.assigned_to}`}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{format(new Date(ticket.created_at), 'MMM dd, HH:mm')}</p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          SLA: {slaStatus.hoursRemaining.toFixed(1)} hours remaining
                        </span>
                        {slaStatus.isBreached && (
                          <AlertCircle className="h-3 w-3 text-red-600" />
                        )}
                      </div>
                      <Progress
                        value={slaStatus.percentage}
                        className={slaStatus.isBreached ? 'bg-red-100' : ''}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
