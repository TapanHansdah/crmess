'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Play, Copy, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DatabaseManagementPage() {
  const { toast } = useToast();
  const [sql, setSql] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeSql = async () => {
    if (!sql.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a SQL query',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResults(null);

      const response = await fetch('/api/database/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sql.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to execute query');
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      setResults(result);
      toast({
        title: 'Success',
        description: `Query executed successfully. ${result.rowCount} rows affected.`,
      });
    } catch (err) {
      const errorMsg = err.message || 'Failed to execute SQL';
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSql = () => {
    setSql('');
    setResults(null);
    setError(null);
  };

  const copySql = () => {
    navigator.clipboard.writeText(sql);
    toast({
      title: 'Copied',
      description: 'SQL copied to clipboard',
    });
  };

  // Example queries
  const examples = {
    // Leads
    viewLeads: `SELECT id, title, stage, priority, value, currency, created_at
FROM leads
ORDER BY created_at DESC
LIMIT 20;`,

    createLead: `INSERT INTO leads (title, description, stage, priority, value, currency, source, created_at)
VALUES ('Tech Company Deal', 'Enterprise software opportunity', 'prospect', 'high', 50000, 'USD', 'inbound', NOW());`,

    // Contacts
    viewContacts: `SELECT id, first_name, last_name, email, phone, job_title, organization_id, is_decision_maker, created_at
FROM contacts
LIMIT 20;`,

    createContact: `INSERT INTO contacts (first_name, last_name, email, phone, job_title, is_decision_maker, is_active, created_at)
VALUES ('Sarah', 'Johnson', 'sarah@techcorp.com', '+1-555-0123', 'VP Sales', true, true, NOW());`,

    // Organizations
    viewOrganizations: `SELECT id, name, email, phone, website, industry, company_size, city, country, created_at
FROM organizations
LIMIT 20;`,

    createOrganization: `INSERT INTO organizations (name, email, phone, website, industry, company_size, city, country, is_active, created_at)
VALUES ('Tech Solutions Inc', 'contact@techsol.com', '+1-555-9999', 'www.techsol.com', 'Technology', 'Enterprise', 'San Francisco', 'USA', true, NOW());`,

    // Deals
    viewDeals: `SELECT id, title, description, amount, stage, probability, contact_id, expected_close_date, created_at
FROM deals
ORDER BY created_at DESC
LIMIT 20;`,

    createDeal: `INSERT INTO deals (title, description, amount, stage, probability, contact_id, expected_close_date, created_at)
VALUES ('Enterprise License Deal', 'Annual enterprise software license', 100000, 'proposal', 0.7, 1, CURRENT_DATE + INTERVAL '30 days', NOW());`,

    // Invoices
    viewInvoices: `SELECT id, invoice_number, contact_id, organization_id, amount, currency, status, due_date, issued_date, created_at
FROM invoices
ORDER BY created_at DESC
LIMIT 20;`,

    createInvoice: `INSERT INTO invoices (invoice_number, contact_id, organization_id, amount, currency, status, due_date, issued_date, created_at)
VALUES ('INV-2024-001', 1, 1, 5000, 'USD', 'draft', CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE, NOW());`,

    // Products
    viewProducts: `SELECT id, name, sku, category_id, price, cost, currency, in_stock, is_active, created_at
FROM products
LIMIT 20;`,

    createProduct: `INSERT INTO products (name, description, sku, price, cost, currency, in_stock, is_active, created_at)
VALUES ('Enterprise License', 'Annual software license', 'ENT-LIC-001', 50000, 10000, 'USD', 10, true, NOW());`,

    // Tasks
    viewTasks: `SELECT id, title, description, status, priority, due_date, assigned_to, lead_id, contact_id, created_at
FROM tasks
ORDER BY due_date ASC
LIMIT 20;`,

    createTask: `INSERT INTO tasks (title, description, status, priority, due_date, created_at)
VALUES ('Follow up with prospect', 'Call prospect to discuss proposal', 'open', 'high', CURRENT_DATE + INTERVAL '3 days', NOW());`,

    // Workflows
    viewWorkflows: `SELECT id, name, description, trigger, action, enabled, created_at
FROM workflows
ORDER BY created_at DESC
LIMIT 20;`,

    createWorkflow: `INSERT INTO workflows (name, description, trigger, action, enabled, created_at)
VALUES ('Auto Welcome Email', 'Send welcome email to new leads', 'lead_created', 'send_email', true, NOW());`,

    // Support Tickets
    viewSupportTickets: `SELECT id, ticket_number, contact_id, organization_id, subject, priority, status, assigned_to, created_at
FROM support_tickets
ORDER BY created_at DESC
LIMIT 20;`,

    createSupportTicket: `INSERT INTO support_tickets (ticket_number, contact_id, organization_id, subject, description, priority, status, created_at)
VALUES ('TKT-2024-001', 1, 1, 'License activation issue', 'Customer cannot activate new license', 'high', 'open', NOW());`,

    // Quotes
    viewQuotes: `SELECT id, quote_number, lead_id, contact_id, organization_id, total, currency, status, valid_until, created_at
FROM quotes
ORDER BY created_at DESC
LIMIT 20;`,

    createQuote: `INSERT INTO quotes (quote_number, lead_id, contact_id, organization_id, total, currency, status, valid_until, created_at)
VALUES ('QUOTE-2024-001', 1, 1, 1, 50000, 'USD', 'draft', CURRENT_DATE + INTERVAL '30 days', NOW());`,

    // Activities
    viewActivities: `SELECT id, title, type, contact_id, lead_id, scheduled_at, duration_minutes, is_done, priority, created_at
FROM activities
ORDER BY scheduled_at DESC
LIMIT 20;`,

    createActivity: `INSERT INTO activities (title, description, type, contact_id, scheduled_at, duration_minutes, priority, created_at)
VALUES ('Sales Call', 'Quarterly business review call', 'call', 1, NOW() + INTERVAL '2 days', 60, 'high', NOW());`,

    // Emails
    viewEmails: `SELECT id, from_email, to_email, subject, contact_id, lead_id, is_read, folder, created_at
FROM emails
ORDER BY created_at DESC
LIMIT 20;`,

    // Audit Logs
    viewAuditLogs: `SELECT id, table_name, action, entity_type, entity_name, details, created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;`,

    // Notes
    viewNotes: `SELECT id, title, content, contact_id, lead_id, is_pinned, created_at
FROM notes
ORDER BY created_at DESC
LIMIT 20;`,

    createNote: `INSERT INTO notes (title, content, contact_id, is_pinned, created_at)
VALUES ('Important Update', 'Customer is interested in enterprise upgrade', 1, false, NOW());`,

    // Users
    viewUsers: `SELECT id, email, first_name, last_name, role, department, is_active, last_login, created_at
FROM users
LIMIT 20;`,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Database className="h-8 w-8" />
          Database Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Execute SQL queries directly on your database. Use for creating leads, workflows, and more.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SQL Editor */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SQL Query Editor</CardTitle>
              <CardDescription>
                Write SELECT, INSERT, UPDATE, or DELETE queries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                placeholder="SELECT * FROM leads LIMIT 10;"
                className="w-full h-64 p-4 border rounded-lg font-mono text-sm bg-black text-green-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                suppressHydrationWarning
              />

              <div className="flex gap-2">
                <Button
                  onClick={executeSql}
                  disabled={loading}
                  className="gap-2"
                  size="lg"
                  suppressHydrationWarning
                >
                  <Play className="h-4 w-4" />
                  {loading ? 'Executing...' : 'Execute Query'}
                </Button>
                <Button
                  onClick={copySql}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  suppressHydrationWarning
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
                <Button
                  onClick={clearSql}
                  variant="destructive"
                  size="lg"
                  className="gap-2"
                  suppressHydrationWarning
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-900">Results</CardTitle>
                <CardDescription className="text-green-800">
                  {results.rowCount} row{results.rowCount !== 1 ? 's' : ''} returned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.data && results.data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b-2 border-green-300">
                          {Object.keys(results.data[0]).map((key) => (
                            <th key={key} className="text-left p-2 font-bold text-green-900">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.data.map((row, idx) => (
                          <tr key={idx} className="border-b border-green-200 hover:bg-green-100">
                            {Object.values(row).map((val, i) => (
                              <td key={i} className="p-2 text-green-900">
                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-green-900">Query executed successfully with no rows returned.</p>
                )}
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-900">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-800 font-mono text-sm">{error}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Example Queries */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Examples</CardTitle>
              <CardDescription>Click to insert example queries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 h-64 overflow-y-auto pr-2">
              {Object.entries(examples).map(([key, query]) => (
                <Button
                  key={key}
                  onClick={() => setSql(query)}
                  variant="outline"
                  className="w-full justify-start text-left h-auto"
                  suppressHydrationWarning
                >
                  <span className="text-xs">
                    {key === 'createLead' && '➕ Create Lead'}
                    {key === 'viewLeads' && '👀 View Leads'}
                    {key === 'createContact' && '➕ Create Contact'}
                    {key === 'viewContacts' && '👥 View Contacts'}
                    {key === 'createOrganization' && '🏢 Create Org'}
                    {key === 'viewOrganizations' && '🏢 View Orgs'}
                    {key === 'createDeal' && '💼 Create Deal'}
                    {key === 'viewDeals' && '💼 View Deals'}
                    {key === 'createInvoice' && '📄 Create Invoice'}
                    {key === 'viewInvoices' && '📄 View Invoices'}
                    {key === 'createProduct' && '📦 Create Product'}
                    {key === 'viewProducts' && '📦 View Products'}
                    {key === 'createTask' && '✓ Create Task'}
                    {key === 'viewTasks' && '✓ View Tasks'}
                    {key === 'createWorkflow' && '⚙️ Create Workflow'}
                    {key === 'viewWorkflows' && '⚙️ View Workflows'}
                    {key === 'createSupportTicket' && '🎫 Create Ticket'}
                    {key === 'viewSupportTickets' && '🎫 View Tickets'}
                    {key === 'createQuote' && '💵 Create Quote'}
                    {key === 'viewQuotes' && '💵 View Quotes'}
                    {key === 'createActivity' && '📞 Create Activity'}
                    {key === 'viewActivities' && '📞 View Activities'}
                    {key === 'viewEmails' && '📧 View Emails'}
                    {key === 'viewAuditLogs' && '📋 View Audit Logs'}
                    {key === 'createNote' && '📝 Create Note'}
                    {key === 'viewNotes' && '📝 View Notes'}
                    {key === 'viewUsers' && '👤 View Users'}
                  </span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Tables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              <div>
                <Badge>leads</Badge>
                <p className="text-xs text-muted-foreground mt-1">Sales opportunities and prospects</p>
              </div>
              <div>
                <Badge>contacts</Badge>
                <p className="text-xs text-muted-foreground mt-1">People and decision makers</p>
              </div>
              <div>
                <Badge>organizations</Badge>
                <p className="text-xs text-muted-foreground mt-1">Companies and accounts</p>
              </div>
              <div>
                <Badge>deals</Badge>
                <p className="text-xs text-muted-foreground mt-1">Sales deals and agreements</p>
              </div>
              <div>
                <Badge>invoices</Badge>
                <p className="text-xs text-muted-foreground mt-1">Billing and invoices</p>
              </div>
              <div>
                <Badge>products</Badge>
                <p className="text-xs text-muted-foreground mt-1">Inventory and SKUs</p>
              </div>
              <div>
                <Badge>tasks</Badge>
                <p className="text-xs text-muted-foreground mt-1">To-do items and reminders</p>
              </div>
              <div>
                <Badge>workflows</Badge>
                <p className="text-xs text-muted-foreground mt-1">Automation workflows</p>
              </div>
              <div>
                <Badge>support_tickets</Badge>
                <p className="text-xs text-muted-foreground mt-1">Customer support cases</p>
              </div>
              <div>
                <Badge>quotes</Badge>
                <p className="text-xs text-muted-foreground mt-1">Sales quotes and proposals</p>
              </div>
              <div>
                <Badge>activities</Badge>
                <p className="text-xs text-muted-foreground mt-1">Calls, meetings, events</p>
              </div>
              <div>
                <Badge>emails</Badge>
                <p className="text-xs text-muted-foreground mt-1">Email messages and threads</p>
              </div>
              <div>
                <Badge>notes</Badge>
                <p className="text-xs text-muted-foreground mt-1">Internal notes and comments</p>
              </div>
              <div>
                <Badge>audit_logs</Badge>
                <p className="text-xs text-muted-foreground mt-1">System activity and changes</p>
              </div>
              <div>
                <Badge>users</Badge>
                <p className="text-xs text-muted-foreground mt-1">Team members and accounts</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm text-blue-900">💡 Tip</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-blue-900">
              <p>Click "Create Lead" example to instantly create a test lead with email workflow!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
