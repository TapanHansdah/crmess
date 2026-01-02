'use client';

import { useEffect, useState, useCallback } from 'react';
import EmailList from '@/components/emails/email-list';
import { fetchEmails, deleteEmail, addEmail, updateEmail } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function EmailsPage() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    from_email: '',
    to_email: '',
    body: '',
    status: 'draft',
    sent_date: '',
    contact_id: null,
    lead_id: null
  });

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    try {
      setError(null);
      const data = await fetchEmails();
      // Transform database fields to display fields
      const transformedEmails = (data || []).map(email => ({
        ...email,
        sender_email: email.from_email,
        recipient_email: email.to_email,
        status: email.folder || 'draft', // Map folder to status for display
        sent_at: email.created_at // Use created_at as sent_at for display
      }));
      setEmails(transformedEmails);
    } catch (err) {
      console.error('Failed to load emails:', err);
      setError('Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = useCallback(() => {
    // Open default email client with mailto: link
    window.location.href = 'mailto:';
  }, []);

  const closeDialog = useCallback(() => {
    setShowDialog(false);
    setEditingId(null);
    setFormData({
      subject: '',
      from_email: '',
      to_email: '',
      body: '',
      status: 'draft',
      sent_date: '',
      contact_id: null,
      lead_id: null
    });
  }, []);

  const handleOpenDialog = useCallback((email = null) => {
    if (!email) return; // Only allow editing existing emails
    
    setEditingId(email.id);
    // Format created_at as date string for input field
    const sentDate = email.created_at 
      ? new Date(email.created_at).toISOString().split('T')[0]
      : '';
    setFormData({
      subject: email.subject || '',
      from_email: email.from_email || email.sender_email || '',
      to_email: email.to_email || email.recipient_email || '',
      body: email.body || '',
      status: email.folder || email.status || 'draft',
      sent_date: sentDate,
      contact_id: email.contact_id || null,
      lead_id: email.lead_id || null
    });
    setShowDialog(true);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      // Map form data to database schema (from_email, to_email)
      const emailData = {
        subject: formData.subject,
        from_email: formData.from_email,
        to_email: formData.to_email,
        body: formData.body || null,
        folder: formData.status || 'draft',
        contact_id: formData.contact_id || null,
        lead_id: formData.lead_id || null
      };

      // If sent_date is provided and we're updating, we'll update created_at
      // Note: This is a workaround since the schema doesn't have sent_at
      if (editingId && formData.sent_date) {
        // Convert date string to ISO timestamp
        const sentTimestamp = new Date(formData.sent_date).toISOString();
        emailData.created_at = sentTimestamp;
      }

      let result;
      if (editingId) {
        result = await updateEmail(editingId, emailData);
      } else {
        // For new emails, use sent_date if provided
        if (formData.sent_date) {
          emailData.created_at = new Date(formData.sent_date).toISOString();
        }
        result = await addEmail(emailData);
      }

      if (result) {
        setShowDialog(false);
        setEditingId(null);
        setFormData({
          subject: '',
          from_email: '',
          to_email: '',
          body: '',
          status: 'draft',
          sent_date: '',
          contact_id: null,
          lead_id: null
        });
        // Wait for dialog to fully close before refetching
        setTimeout(() => loadEmails(), 100);
      } else {
        setError('Failed to save email');
      }
    } catch (err) {
      console.error('Save failed:', err);
      setError('Failed to save email');
    }
  }, [editingId, formData]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this email?')) return;

    try {
      const success = await deleteEmail(id);
      if (success) {
        // Wait for any pending state updates before refetching
        setTimeout(() => loadEmails(), 100);
      } else {
        setError('Failed to delete email');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete email');
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-8" suppressHydrationWarning>
        <div className="flex items-center justify-between" suppressHydrationWarning>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Emails</h1>
            <p className="text-muted-foreground mt-2">Track all customer communications</p>
          </div>
          <Button onClick={handleSendEmail} suppressHydrationWarning>
            <Mail className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8" suppressHydrationWarning>
      <div className="flex items-center justify-between" suppressHydrationWarning>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emails</h1>
          <p className="text-muted-foreground mt-2">Track all customer communications</p>
        </div>
        <Button onClick={handleSendEmail} suppressHydrationWarning>
          <Mail className="w-4 h-4 mr-2" />
          Send Email
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <EmailList emails={emails} onDelete={handleDelete} onEdit={handleOpenDialog} />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Email Record
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Email subject"
              />
            </div>

            <div>
              <Label htmlFor="from_email">From Email *</Label>
              <Input
                id="from_email"
                type="email"
                value={formData.from_email}
                onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                placeholder="sender@example.com"
              />
            </div>

            <div>
              <Label htmlFor="to_email">To Email *</Label>
              <Input
                id="to_email"
                type="email"
                value={formData.to_email}
                onChange={(e) => setFormData({ ...formData, to_email: e.target.value })}
                placeholder="recipient@example.com"
              />
            </div>

            <div>
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Email body content"
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Folder/Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="inbox">Inbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sent_date">Sent Date</Label>
                <Input
                  id="sent_date"
                  type="date"
                  value={formData.sent_date}
                  onChange={(e) => setFormData({ ...formData, sent_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Update Email Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
