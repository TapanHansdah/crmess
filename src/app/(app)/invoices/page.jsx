'use client';

import { useEffect, useState, useCallback } from 'react';
import InvoiceList from '@/components/invoices/invoice-list';
import { fetchInvoices, deleteInvoice, addInvoice, updateInvoice } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    invoice_number: '',
    amount: '',
    status: 'draft',
    issued_date: '',
    due_date: '',
    contact_id: ''
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setError(null);
      const data = await fetchInvoices();
      setInvoices(data || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = useCallback(() => {
    setShowDialog(false);
    setEditingId(null);
    setFormData({
      invoice_number: '',
      amount: '',
      status: 'draft',
      issued_date: '',
      due_date: '',
      contact_id: ''
    });
  }, []);

  const handleOpenDialog = useCallback((invoice = null) => {
    if (invoice) {
      setEditingId(invoice.id);
      setFormData({
        invoice_number: invoice.invoice_number || '',
        amount: invoice.amount || '',
        status: invoice.status || 'draft',
        issued_date: invoice.issued_date || '',
        due_date: invoice.due_date || '',
        contact_id: invoice.contact_id || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        invoice_number: '',
        amount: '',
        status: 'draft',
        issued_date: new Date().toISOString().split('T')[0],
        due_date: '',
        contact_id: ''
      });
    }
    setShowDialog(true);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const invoiceData = {
        invoice_number: formData.invoice_number,
        amount: parseFloat(formData.amount) || 0,
        status: formData.status,
        issued_date: formData.issued_date,
        due_date: formData.due_date,
        contact_id: parseInt(formData.contact_id) || 1,
        currency: 'USD'
      };

      let result;
      if (editingId) {
        result = await updateInvoice(editingId, invoiceData);
      } else {
        result = await addInvoice(invoiceData);
      }

      if (result) {
        setShowDialog(false);
        setEditingId(null);
        setFormData({
          invoice_number: '',
          amount: '',
          status: 'draft',
          issued_date: new Date().toISOString().split('T')[0],
          due_date: '',
          contact_id: ''
        });
        // Wait for dialog to fully close before refetching
        setTimeout(() => loadInvoices(), 100);
      } else {
        setError('Failed to save invoice');
      }
    } catch (err) {
      console.error('Save failed:', err);
      setError('Failed to save invoice');
    }
  }, [editingId, formData]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const success = await deleteInvoice(id);
      if (success) {
        // Wait for any pending state updates before refetching
        setTimeout(() => loadInvoices(), 100);
      } else {
        setError('Failed to delete invoice');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete invoice');
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-8" suppressHydrationWarning>
        <div className="flex items-center justify-between" suppressHydrationWarning>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground mt-2">Track and manage customer invoices</p>
          </div>
          <Button onClick={() => handleOpenDialog()} suppressHydrationWarning>
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
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
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-2">Track and manage customer invoices</p>
        </div>
        <Button onClick={() => handleOpenDialog()} suppressHydrationWarning>
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <InvoiceList invoices={invoices} onDelete={handleDelete} onEdit={handleOpenDialog} />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Invoice' : 'Create New Invoice'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="invoice_number">Invoice Number *</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="INV-2025-001"
              />
            </div>

            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issued_date">Issued Date *</Label>
                <Input
                  id="issued_date"
                  type="date"
                  value={formData.issued_date}
                  onChange={(e) => setFormData({ ...formData, issued_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contact_id">Contact ID *</Label>
              <Input
                id="contact_id"
                type="number"
                value={formData.contact_id}
                onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                placeholder="1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? 'Update' : 'Create'} Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
