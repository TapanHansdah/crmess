'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AlertCircle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    status: 'open',
    priority: 'medium',
    customer_name: '',
    assigned_to: '',
    sla_hours: 24,
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setError(null);
      const { data, error: err } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (err) throw err;
      setTickets(data || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setError('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = useCallback(() => {
    setShowDialog(false);
    setEditingId(null);
    setFormData({
      subject: '',
      description: '',
      status: 'open',
      priority: 'medium',
      customer_name: '',
      assigned_to: '',
      sla_hours: 24,
    });
  }, []);

  const handleOpenDialog = useCallback((ticket = null) => {
    if (ticket) {
      setEditingId(ticket.id);
      setFormData({
        subject: ticket.subject || '',
        description: ticket.description || '',
        status: ticket.status || 'open',
        priority: ticket.priority || 'medium',
        customer_name: ticket.customer_name || '',
        assigned_to: ticket.assigned_to || '',
        sla_hours: ticket.sla_hours || 24,
      });
    } else {
      setEditingId(null);
      setFormData({
        subject: '',
        description: '',
        status: 'open',
        priority: 'medium',
        customer_name: '',
        assigned_to: '',
        sla_hours: 24,
      });
    }
    setShowDialog(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.subject.trim() || !formData.customer_name.trim()) {
      setError('Subject and customer name are required');
      return;
    }

    try {
      setError(null);
      if (editingId) {
        const { error: err } = await supabase
          .from('support_tickets')
          .update(formData)
          .eq('id', editingId);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('support_tickets')
          .insert([formData]);
        if (err) throw err;
      }
      closeDialog();
      loadTickets();
    } catch (err) {
      console.error('Failed to save ticket:', err);
      setError('Failed to save support ticket');
    }
  }, [formData, editingId, closeDialog]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    
    try {
      setError(null);
      const { error: err } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', id);
      if (err) throw err;
      loadTickets();
    } catch (err) {
      console.error('Failed to delete ticket:', err);
      setError('Failed to delete support ticket');
    }
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground mt-2">Manage customer support requests</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No support tickets found</p>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-blue-600">{ticket.id}</span>
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {ticket.customer_name}
                      {ticket.assigned_to && ` • Assigned to ${ticket.assigned_to}`}
                    </p>
                    {ticket.description && (
                      <p className="text-sm mt-2 text-muted-foreground">{ticket.description}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{format(new Date(ticket.created_at), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDialog(ticket)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(ticket.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Support Ticket' : 'Create New Support Ticket'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Ticket subject"
              />
            </div>

            <div>
              <Label htmlFor="customer_name">Customer Name</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Customer name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ticket description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Input
                id="assigned_to"
                value={formData.assigned_to}
                onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                placeholder="Assignee name"
              />
            </div>

            <div>
              <Label htmlFor="sla_hours">SLA Hours</Label>
              <Input
                id="sla_hours"
                type="number"
                value={formData.sla_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, sla_hours: parseInt(e.target.value) || 24 }))}
                placeholder="24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? 'Update' : 'Create'} Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
