'use client';

import { useEffect, useState, useCallback } from 'react';
import TaskList from '@/components/tasks/task-list';
import { fetchTasks, fetchContacts, deleteTask, addTask, updateTask } from '@/lib/supabase';
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

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    contact_id: ''
  });

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [tasksData, contactsData] = await Promise.all([
        fetchTasks(),
        fetchContacts()
      ]);
      setTasks(tasksData || []);
      setContacts(contactsData || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const closeDialog = useCallback(() => {
    setShowDialog(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      due_date: '',
      contact_id: ''
    });
  }, []);

  const handleOpenDialog = useCallback((task = null) => {
    if (task) {
      setEditingId(task.id);
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        due_date: task.due_date || '',
        contact_id: task.contact_id || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
        contact_id: ''
      });
    }
    setShowDialog(true);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date,
        contact_id: parseInt(formData.contact_id) || null
      };

      let result;
      if (editingId) {
        result = await updateTask(editingId, taskData);
      } else {
        result = await addTask(taskData);
      }

      if (result) {
        setShowDialog(false);
        setEditingId(null);
        setFormData({
          title: '',
          description: '',
          status: 'pending',
          priority: 'medium',
          due_date: '',
          contact_id: ''
        });
        // Wait for dialog to fully close before refetching
        setTimeout(() => loadData(), 100);
      } else {
        setError('Failed to save task');
      }
    } catch (err) {
      console.error('Save failed:', err);
      setError('Failed to save task');
    }
  }, [editingId, formData, loadData]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const success = await deleteTask(id);
      if (success) {
        // Wait for any pending state updates before refetching
        setTimeout(() => loadData(), 100);
      } else {
        setError('Failed to delete task');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete task');
    }
  }, [loadData]);

  const handleStatusChange = useCallback(async (id, newStatus) => {
    try {
      const result = await updateTask(id, { status: newStatus });
      if (result) {
        // Update local state immediately for better UX
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === id ? { ...task, status: newStatus } : task
          )
        );
      } else {
        setError('Failed to update task status');
        // Reload data to sync with server
        loadData();
      }
    } catch (err) {
      console.error('Status update failed:', err);
      setError('Failed to update task status');
      // Reload data to sync with server
      loadData();
    }
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6 p-8" suppressHydrationWarning>
        <div className="flex items-center justify-between" suppressHydrationWarning>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground mt-2">Manage your task list</p>
          </div>
          <Button onClick={() => handleOpenDialog()} suppressHydrationWarning>
            <Plus className="w-4 h-4 mr-2" />
            Create Task
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
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-2">Manage your task list</p>
        </div>
        <Button onClick={() => handleOpenDialog()} suppressHydrationWarning>
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <TaskList 
        tasks={tasks} 
        contacts={contacts} 
        onDelete={handleDelete} 
        onEdit={handleOpenDialog}
        onStatusChange={handleStatusChange}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Task' : 'Create New Task'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="contact_id">Contact</Label>
                <Select value={String(formData.contact_id)} onValueChange={(value) => setFormData({ ...formData, contact_id: value === 'none' ? '' : value })}>
                  <SelectTrigger id="contact_id">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {contacts.map(contact => (
                      <SelectItem key={contact.id} value={String(contact.id)}>
                        {contact.first_name} {contact.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? 'Update' : 'Create'} Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
