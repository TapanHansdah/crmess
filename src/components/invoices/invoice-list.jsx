'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit2, FileText } from 'lucide-react';

export default function InvoiceList({ invoices = [], onDelete = () => {}, onEdit = () => {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice =>
      (invoice.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  const getStatusColor = (status) => {
    const statusMap = {
      'paid': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800',
      'draft': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-slate-100 text-slate-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalPaid = filteredInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No invoices found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Total:</span>
            <span className="ml-2 font-bold">
              ₹{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Paid:</span>
            <span className="ml-2 font-bold text-green-600">
              ₹{totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issued Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{invoice.invoice_number || '-'}</span>
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  ₹{(invoice.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(invoice.status)}>
                    {invoice.status || 'draft'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {invoice.issued_date
                    ? new Date(invoice.issued_date).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell className="text-sm">
                  {invoice.due_date
                    ? new Date(invoice.due_date).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu 
                    open={openDropdownId === invoice.id} 
                    onOpenChange={(open) => {
                      setOpenDropdownId(open ? invoice.id : null);
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                      <DropdownMenuItem onClick={(e) => { 
                        e.stopPropagation(); 
                        setOpenDropdownId(null);
                        onEdit(invoice); 
                      }}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setOpenDropdownId(null);
                          onDelete(invoice.id); 
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="text-sm text-muted-foreground">
        Showing {filteredInvoices.length} of {invoices.length} invoices
      </div>
    </div>
  );
}
