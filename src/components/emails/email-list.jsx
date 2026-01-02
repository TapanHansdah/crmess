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
import { MoreHorizontal, Mail, Trash2, ExternalLink } from 'lucide-react';

export default function EmailList({ emails = [], onDelete = () => {}, onEdit = () => {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const filteredEmails = useMemo(() => {
    return emails.filter(email =>
      (email.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (email.recipient_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (email.sender_email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [emails, searchTerm]);

  const getStatusColor = (status) => {
    const statusMap = {
      'sent': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'bounced': 'bg-yellow-100 text-yellow-800',
      'draft': 'bg-gray-100 text-gray-800',
      'inbox': 'bg-purple-100 text-purple-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (!emails || emails.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No emails found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Input
          placeholder="Search emails by subject, recipient, or sender..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmails.map((email) => (
              <TableRow key={email.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium truncate max-w-xs">
                      {email.subject || 'No Subject'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {email.sender_email || '-'}
                </TableCell>
                <TableCell className="text-sm">
                  {email.recipient_email || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(email.status || email.folder)}>
                    {email.status || email.folder || 'unknown'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {email.sent_at
                    ? new Date(email.sent_at).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu 
                    open={openDropdownId === email.id} 
                    onOpenChange={(open) => {
                      setOpenDropdownId(open ? email.id : null);
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
                        onEdit(email); 
                      }}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setOpenDropdownId(null);
                          onDelete(email.id); 
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
        Showing {filteredEmails.length} of {emails.length} emails
      </div>
    </div>
  );
}
