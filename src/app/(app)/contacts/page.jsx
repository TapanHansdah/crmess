'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import ContactTable from '@/components/contacts/contact-table';
import { fetchContacts, deleteContact, addContact, updateContact, supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Database } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showSqlDialog, setShowSqlDialog] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sqlCode, setSqlCode] = useState('');
  const [sqlExecuting, setSqlExecuting] = useState(false);
  const [sqlSuccess, setSqlSuccess] = useState(false);
  const [sqlError, setSqlError] = useState(null);
  const [createdLeadId, setCreatedLeadId] = useState(null);
  const [createdContactEmail, setCreatedContactEmail] = useState(null);
  const [autoWelcomeEmailEnabled, setAutoWelcomeEmailEnabled] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    department: '',
    is_decision_maker: false,
    organization_id: ''
  });

  useEffect(() => {
    loadContacts();
    checkAutoWelcomeEmailStatus();
  }, []);

  const checkAutoWelcomeEmailStatus = async () => {
    try {
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('enabled')
        .eq('name', 'Auto Welcome Email')
        .single();
      
      if (!error && workflow) {
        setAutoWelcomeEmailEnabled(workflow.enabled || false);
      } else {
        setAutoWelcomeEmailEnabled(false);
      }
    } catch (err) {
      console.error('Error checking Auto Welcome Email status:', err);
      setAutoWelcomeEmailEnabled(false);
    }
  };

  const loadContacts = async () => {
    try {
      setError(null);
      const data = await fetchContacts();
      setContacts(data || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = useCallback(() => {
    setShowDialog(false);
    setEditingId(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      job_title: '',
      department: '',
      is_decision_maker: false,
      organization_id: ''
    });
  }, []);

  const handleOpenDialog = useCallback((contact = null) => {
    if (contact) {
      setEditingId(contact.id);
      setFormData({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        job_title: contact.job_title || '',
        department: contact.department || '',
        is_decision_maker: contact.is_decision_maker || false,
        organization_id: contact.organization_id || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        job_title: '',
        department: '',
        is_decision_maker: false,
        organization_id: ''
      });
    }
    setShowDialog(true);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const contactData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        job_title: formData.job_title,
        department: formData.department,
        is_decision_maker: formData.is_decision_maker,
        organization_id: parseInt(formData.organization_id) || 1
      };

      let result;
      if (editingId) {
        result = await updateContact(editingId, contactData, user?.id);
      } else {
        result = await addContact(contactData, user?.id);
      }

      if (result) {
        setShowDialog(false);
        setEditingId(null);
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          job_title: '',
          department: '',
          is_decision_maker: false,
          organization_id: ''
        });
        // Wait for dialog to fully close before refetching
        setTimeout(() => loadContacts(), 100);
      } else {
        setError('Failed to save contact');
      }
    } catch (err) {
      console.error('Save failed:', err);
      setError('Failed to save contact');
    }
  }, [editingId, formData]);

  const handleExecuteSql = async () => {
    if (!sqlCode.trim()) {
      setSqlError('Please enter SQL code');
      return;
    }

    setSqlExecuting(true);
    setSqlError(null);
    setSqlSuccess(false);
    setCreatedLeadId(null);
    setCreatedContactEmail(null);

    try {
      // Extract individual SQL statements (ignoring comments)
      const cleanedSql = sqlCode
        .replace(/--.*$/gm, '') // Remove -- comments
        .split('\n')
        .join(' ')
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
        .trim();

      const statements = cleanedSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.toUpperCase().startsWith('BEGIN') && !stmt.toUpperCase().startsWith('COMMIT'));

      if (statements.length === 0) {
        setSqlError('No valid SQL statements found');
        return;
      }

      console.log(`Executing ${statements.length} SQL statements sequentially...`);

      let results = [];
      
      // Execute statements sequentially to ensure data is committed before next statement
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        console.log(`\n[${i + 1}/${statements.length}] Executing:`, stmt.substring(0, 50) + '...');

        const response = await fetch('/api/database/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: stmt, userId: user?.id }),
        });

        const result = await response.json();
        console.log(`Response for statement ${i + 1}:`, result);

        if (!response.ok) {
          setSqlError(`Statement ${i + 1} failed: ${result.error || 'Unknown error'}`);
          setSqlSuccess(false);
          console.error(`Failed at statement ${i + 1}:`, result.error);
          return;
        }

        results.push(result);
      }

      setSqlSuccess(true);
      setSqlError(null);

      // Extract IDs and email from results
      // Results array structure: each result has 'results' array with the rows
      let leadId = null;
      let contactEmail = null;

      console.log('\n=== Extracting Data ===');
      console.log('Total results:', results.length);
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        console.log(`\nResult ${i}:`, JSON.stringify(result, null, 2));
        
        // Handle different response formats
        let dataArray = null;
        
        if (result.results && Array.isArray(result.results)) {
          // Format 1: { results: [...] }
          dataArray = result.results;
        } else if (result.data && Array.isArray(result.data)) {
          // Format 2: { data: [...] }
          dataArray = result.data;
        } else if (Array.isArray(result)) {
          // Format 3: direct array
          dataArray = result;
        }
        
        if (!dataArray || dataArray.length === 0) {
          console.log(`⚠️  Result ${i}: No data array or empty result`);
          continue;
        }
        
        // Extract ALL data from this result
        for (let j = 0; j < dataArray.length; j++) {
          const data = dataArray[j];
          console.log(`  └─ Row ${j}:`, JSON.stringify(data, null, 2));
          
          // Extract email from ANY result that has it
          if (data.email && !contactEmail) {
            contactEmail = data.email;
            console.log(`  ✅ EXTRACTED EMAIL (Result ${i}, Row ${j}):`, contactEmail);
          }
          
          // Extract ID from ANY result that has it (prefer later results)
          if (data.id) {
            leadId = data.id;
            console.log(`  ✅ EXTRACTED ID (Result ${i}, Row ${j}):`, leadId);
          }
        }
      }

      if (leadId) {
        setCreatedLeadId(leadId);
        console.log('Setting createdLeadId:', leadId);
      }
      if (contactEmail) {
        setCreatedContactEmail(contactEmail);
        console.log('Setting createdContactEmail:', contactEmail);
      }

      // CRITICAL: Reload contacts IMMEDIATELY after SQL execution
      console.log('Refreshing contacts after SQL execution...');
      await loadContacts();
      console.log('✓ Contacts refreshed, ready to send email');

      // Check Auto Welcome Email workflow status
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('enabled')
        .eq('name', 'Auto Welcome Email')
        .single();
      
      const isAutoWelcomeEnabled = !workflowError && workflow && workflow.enabled;
      setAutoWelcomeEmailEnabled(isAutoWelcomeEnabled || false);

      // If Auto Welcome Email is enabled, automatically send the email
      if (isAutoWelcomeEnabled && (leadId || contactEmail)) {
        console.log('Auto Welcome Email is enabled, sending email automatically...');
        // Small delay to ensure contacts are fully loaded
        setTimeout(() => {
          handleSendWelcomeEmail();
        }, 500);
      }
    } catch (err) {
      console.error('SQL execution error:', err);
      setSqlError(err.message || 'Failed to execute SQL');
      setSqlSuccess(false);
    } finally {
      setSqlExecuting(false);
    }
  };

  const handleSendWelcomeEmail = async () => {
    try {
      console.log('Starting email send process...');
      console.log('Extracted data:', { leadId: createdLeadId, email: createdContactEmail });

      let leadIdToUse = createdLeadId;

      // If we don't have a lead ID, try to get it
      if (!leadIdToUse) {
        console.log('No lead ID extracted, querying database...');
        
        // If we have the contact email, use it to find the specific lead
        if (createdContactEmail) {
          console.log('Searching for lead by contact email:', createdContactEmail);
          
          // First get the contact ID by email
          const { data: contactData } = await supabase
            .from('contacts')
            .select('id')
            .eq('email', createdContactEmail)
            .order('created_at', { ascending: false })
            .single();
          
          if (contactData?.id) {
            console.log('Found contact ID:', contactData.id);
            // Now get the lead for this contact
            const { data: leadByContact } = await supabase
              .from('leads')
              .select('id')
              .eq('contact_id', contactData.id)
              .order('created_at', { ascending: false })
              .limit(1);
            
            if (leadByContact && leadByContact.length > 0) {
              leadIdToUse = leadByContact[0].id;
              console.log('✓ Found lead by contact email:', leadIdToUse);
            }
          }
        }

        // Fallback: Get the most recent lead
        if (!leadIdToUse) {
          console.log('Falling back to most recent lead...');
          const { data: recentLeads } = await supabase
            .from('leads')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (recentLeads && recentLeads.length > 0) {
            leadIdToUse = recentLeads[0].id;
            console.log('✓ Using most recent lead ID:', leadIdToUse);
          }
        }

        if (!leadIdToUse) {
          alert('Could not find the created lead. Please refresh and try again.');
          return;
        }
      }

      // Fetch the "Auto Welcome Email" workflow to get its ID
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('id')
        .eq('name', 'Auto Welcome Email')
        .single();

      if (workflowError || !workflow) {
        alert('Workflow not found. Please create the "Auto Welcome Email" workflow first.');
        return;
      }

      console.log('✓ Found workflow, sending email to lead ID:', leadIdToUse);
      console.log('📧 WORKFLOW PARAMETERS:');
      console.log('   - leadId:', leadIdToUse);
      console.log('   - contactEmail:', createdContactEmail);
      console.log('   - workflowId:', workflow.id);

      const requestBody = { 
        workflowId: workflow.id,
        leadId: leadIdToUse,
        contactEmail: createdContactEmail
      };
      console.log('📤 SENDING TO API:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      console.log('Workflow execution result:', result);

      if (response.ok && result.success) {
        alert('✓ Welcome email sent successfully to ' + (createdContactEmail || 'contact') + '!');
        setSqlCode('');
        setSqlSuccess(false);
        setShowSqlDialog(false);
        setShowEmailConfirm(false);
        setCreatedLeadId(null);
        setCreatedContactEmail(null);
        // Reload contacts one more time to ensure everything is in sync
        await loadContacts();
      } else {
        console.error('Email send failed:', result);
        alert(`✗ Failed to send email: ${result.message || result.error}`);
      }
    } catch (err) {
      console.error('Email send error:', err);
      alert(`✗ Error: ${err.message}`);
    }
  };

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const success = await deleteContact(id, user?.id);
      if (success) {
        // Wait for any pending state updates before refetching
        setTimeout(() => loadContacts(), 100);
      } else {
        setError('Failed to delete contact');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete contact');
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-8" suppressHydrationWarning>
        <div className="flex items-center justify-between" suppressHydrationWarning>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground mt-2">Manage your customer relationships</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleOpenDialog()} suppressHydrationWarning>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
            <Button onClick={() => setShowSqlDialog(true)} suppressHydrationWarning>
              <Database className="w-4 h-4 mr-2" />
              Add Lead (SQL)
            </Button>
          </div>
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
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground mt-2">Manage your customer relationships</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenDialog()} suppressHydrationWarning>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
          <Button onClick={() => setShowSqlDialog(true)} suppressHydrationWarning>
            <Database className="w-4 h-4 mr-2" />
            Add Lead (SQL)
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <ContactTable contacts={contacts} onDelete={handleDelete} onEdit={handleOpenDialog} />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Contact' : 'Add New Contact'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="First name"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  placeholder="e.g., Manager"
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Sales"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="decision_maker">Decision Maker</Label>
                <Select value={formData.is_decision_maker ? 'true' : 'false'} onValueChange={(value) => setFormData({ ...formData, is_decision_maker: value === 'true' })}>
                  <SelectTrigger id="decision_maker">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="organization_id">Organization ID</Label>
                <Input
                  id="organization_id"
                  type="number"
                  value={formData.organization_id}
                  onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? 'Update' : 'Create'} Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SQL Lead Creation Dialog */}
      <Dialog open={showSqlDialog} onOpenChange={setShowSqlDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Lead with SQL</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="sql_code">SQL Code</Label>
              <textarea
                id="sql_code"
                value={sqlCode}
                onChange={(e) => setSqlCode(e.target.value)}
                placeholder="Enter your SQL code here..."
                className="w-full h-64 p-3 border border-input rounded-md font-mono text-sm bg-slate-50"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Write SQL to insert organization, contact, and lead with proper foreign key relationships.
                <br />
                <strong>IMPORTANT:</strong> Make sure the final SELECT query returns the lead ID in a column named "id" so we can send the welcome email to the correct contact.
              </p>
            </div>

            {sqlError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                <strong>Error:</strong> {sqlError}
              </div>
            )}

            {sqlSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
                ✓ SQL executed successfully!
                {autoWelcomeEmailEnabled && (
                  <div className="mt-2 text-xs">
                    📧 Welcome email will be sent automatically (Auto Welcome Email is enabled)
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSqlDialog(false);
                setSqlCode('');
                setSqlSuccess(false);
                setSqlError(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExecuteSql} 
              disabled={sqlExecuting}
            >
              {sqlExecuting ? 'Executing...' : 'Execute SQL'}
            </Button>
            {sqlSuccess && !autoWelcomeEmailEnabled && (
              <Button 
                onClick={() => setShowEmailConfirm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Send Welcome Email
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Confirmation Dialog */}
      <AlertDialog open={showEmailConfirm} onOpenChange={setShowEmailConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Welcome Email</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send a welcome email to the newly created lead?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendWelcomeEmail}>
              Yes, Send Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
