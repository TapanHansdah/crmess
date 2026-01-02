"use client";

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

export default function ContactTable({ contacts, onDelete = () => {}, onEdit = () => {} }) {
  const [filter, setFilter] = React.useState('');
  const [openDropdownId, setOpenDropdownId] = React.useState(null);

  // Build full name from first_name and last_name
  const getFullName = (contact) => {
    const firstName = contact.first_name || '';
    const lastName = contact.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown';
  };

  const getInitials = (contact) => {
    const fullName = getFullName(contact);
    return fullName
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const filteredContacts = contacts.filter(
    (contact) => {
      const fullName = getFullName(contact);
      const email = contact.email || '';
      const company = contact.organization_id || '';
      
      return (
        fullName.toLowerCase().includes(filter.toLowerCase()) ||
        email.toLowerCase().includes(filter.toLowerCase()) ||
        company.toString().includes(filter.toLowerCase())
      );
    }
  );

  const StatusBadge = ({ contact }) => {
    if (contact.is_decision_maker) {
      return <Badge variant="default">Decision Maker</Badge>;
    }
    if (!contact.is_active) {
      return <Badge variant="outline">Inactive</Badge>;
    }
    return <Badge variant="secondary" className="bg-blue-200 text-blue-900">
      Active
    </Badge>;
  };

  return (
    <Card>
      <CardContent>
        <div className="p-4">
          <Input
            placeholder="Filter contacts by name, email, or organization..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Title</TableHead>
                <TableHead className="hidden xl:table-cell">Department</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={contact.profile_picture_url} />
                          <AvatarFallback>{getInitials(contact)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{getFullName(contact)}</div>
                          <div className="text-xs text-muted-foreground">
                            ID: {contact.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {contact.email || 'N/A'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {contact.job_title || 'N/A'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {contact.department || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {contact.phone || contact.mobile_phone || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge contact={contact} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu 
                        open={openDropdownId === contact.id} 
                        onOpenChange={(open) => {
                          setOpenDropdownId(open ? contact.id : null);
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => { 
                            e.stopPropagation(); 
                            setOpenDropdownId(null);
                            onEdit(contact); 
                          }}>
                            Edit Contact
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { 
                            e.stopPropagation(); 
                            setOpenDropdownId(null);
                            window.open(`mailto:${contact.email}`); 
                          }}>
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { 
                            e.stopPropagation(); 
                            setOpenDropdownId(null);
                            onDelete(contact.id); 
                          }}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan="7" className="text-center py-8 text-muted-foreground">
                    No contacts found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
