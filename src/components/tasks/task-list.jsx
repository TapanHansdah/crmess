"use client";

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit2 } from 'lucide-react';

export default function TaskList({
  tasks,
  contacts,
  onDelete = () => {},
  onEdit = () => {},
  onStatusChange = () => {}
}) {
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const contactsMap = new Map(contacts.map((c) => [c.id, c]));

  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.due_date || new Date()).getTime() - new Date(b.due_date || new Date()).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Done</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Assigned To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.map((task) => {
              // Use contact_id instead of assigned_to to match the database schema
              const assignedToContact = contactsMap.get(task.contact_id);
              const isOverdue =
                task.due_date && isPast(new Date(task.due_date)) && task.status !== 'completed';
              return (
                <TableRow
                  key={task.id}
                  className={cn(
                    task.status === 'completed' && 'text-muted-foreground line-through'
                  )}
                >
                  <TableCell>
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={(checked) => {
                        const newStatus = checked ? 'completed' : 'pending';
                        onStatusChange(task.id, newStatus);
                      }}
                      aria-label="Mark task as done"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    {task.due_date && (
                      <Badge variant={isOverdue ? 'destructive' : 'outline'}>
                        {format(new Date(task.due_date), 'MMM d, yyyy')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {assignedToContact ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={assignedToContact.avatarUrl} />
                          <AvatarFallback>
                            {assignedToContact.first_name ? assignedToContact.first_name.charAt(0) : 
                             assignedToContact.last_name ? assignedToContact.last_name.charAt(0) : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span>{assignedToContact.first_name && assignedToContact.last_name 
                          ? `${assignedToContact.first_name} ${assignedToContact.last_name}`
                          : assignedToContact.first_name || assignedToContact.last_name || assignedToContact.email || 'Unassigned'}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu 
                      open={openDropdownId === task.id} 
                      onOpenChange={(open) => {
                        setOpenDropdownId(open ? task.id : null);
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
                          onEdit(task); 
                        }}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { 
                          e.stopPropagation(); 
                          setOpenDropdownId(null);
                          onDelete(task.id); 
                        }} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
