'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Zap, Plus, Trash2, Edit2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';

export default function WorkflowAutomation() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [executingWorkflowId, setExecutingWorkflowId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: '',
    action: '',
    enabled: true,
  });

  const triggers = [
    { value: 'lead_created', label: 'Lead Created' },
    { value: 'deal_stage_changed', label: 'Deal Stage Changed' },
    { value: 'contact_inactive', label: 'Contact Inactive (30 days)' },
    { value: 'email_opened', label: 'Email Opened' },
    { value: 'deal_value_updated', label: 'Deal Value Updated' },
  ];

  const actions = [
    { value: 'assign_to_team', label: 'Assign to Team Member' },
    { value: 'send_email', label: 'Send Email' },
    { value: 'send_notification', label: 'Send Notification' },
    { value: 'update_status', label: 'Update Status' },
    { value: 'create_task', label: 'Create Task' },
  ];

  // Fetch workflows from API
  useEffect(() => {
    setIsClient(true);
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/workflows');
      if (!response.ok) throw new Error('Failed to fetch workflows');
      const { data } = await response.json();
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workflows',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWorkflow = async () => {
    if (!formData.name || !formData.trigger || !formData.action) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const url = editingId ? `/api/workflows/${editingId}` : '/api/workflows';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save workflow');

      toast({
        title: 'Success',
        description: editingId ? 'Workflow updated' : 'Workflow created',
      });

      setFormData({ name: '', description: '', trigger: '', action: '', enabled: true });
      setEditingId(null);
      setShowDialog(false);
      fetchWorkflows();
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to save workflow',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (workflow) => {
    setEditingId(workflow.id);
    setFormData({
      name: workflow.name,
      description: workflow.description || '',
      trigger: workflow.trigger,
      action: workflow.action,
      enabled: workflow.enabled,
    });
    setShowDialog(true);
  };

  const handleToggle = async (id) => {
    try {
      const workflow = workflows.find((w) => w.id === id);
      if (!workflow) return;

      const response = await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...workflow, enabled: !workflow.enabled }),
      });

      if (!response.ok) throw new Error('Failed to toggle workflow');

      toast({
        title: 'Success',
        description: workflow.enabled ? 'Workflow disabled' : 'Workflow enabled',
      });

      fetchWorkflows();
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle workflow',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete workflow');

      toast({
        title: 'Success',
        description: 'Workflow deleted',
      });

      setShowDeleteDialog(false);
      setEditingId(null);
      fetchWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete workflow',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteWorkflow = async (id) => {
    try {
      setExecutingWorkflowId(id);
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId: id }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Workflow executed successfully',
        });
      } else {
        toast({
          title: 'Info',
          description: result.message || 'Workflow execution conditions not met',
        });
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to execute workflow',
        variant: 'destructive',
      });
    } finally {
      setExecutingWorkflowId(null);
    }
  };

  return (
    <>
      <Card suppressHydrationWarning>
        <CardHeader suppressHydrationWarning>
          <div className="flex items-center justify-between" suppressHydrationWarning>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Workflow Automation
              </CardTitle>
              <CardDescription>Create automated workflows to streamline operations</CardDescription>
            </div>
            <Button onClick={() => setShowDialog(true)} size="sm" suppressHydrationWarning disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              New Workflow
            </Button>
          </div>
        </CardHeader>
        <CardContent suppressHydrationWarning>
          <div className="space-y-3">
            {isLoading && workflows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading workflows...
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No workflows yet. Create your first workflow to get started.
              </div>
            ) : (
              workflows.map((workflow) => {
              const triggerLabel = triggers.find((t) => t.value === workflow.trigger)?.label;
              const actionLabel = actions.find((a) => a.value === workflow.action)?.label;

              return (
                <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg" suppressHydrationWarning>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={workflow.enabled}
                        onCheckedChange={() => handleToggle(workflow.id)}
                        suppressHydrationWarning
                      />
                      <div>
                        <p className={`font-medium text-sm ${!workflow.enabled ? 'text-muted-foreground' : ''}`}>
                          {workflow.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {triggerLabel} → {actionLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {workflow.enabled && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Active
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExecuteWorkflow(workflow.id)}
                      suppressHydrationWarning
                      disabled={!workflow.enabled || executingWorkflowId === workflow.id || isLoading}
                      title="Run workflow now"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(workflow)}
                      suppressHydrationWarning
                      disabled={isLoading}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(workflow.id);
                        setShowDeleteDialog(true);
                      }}
                      className="text-red-600 hover:text-red-700"
                      suppressHydrationWarning
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent suppressHydrationWarning>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Workflow' : 'Create Workflow'}</DialogTitle>
            <DialogDescription>
              Set up an automated workflow to trigger actions based on events
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Workflow Name</Label>
              <Input
                id="name"
                placeholder="e.g., Auto-assign New Leads"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="e.g., Automatically assign leads to sales team"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="trigger">Trigger Event</Label>
              <Select value={formData.trigger} onValueChange={(value) => setFormData({ ...formData, trigger: value })}>
                <SelectTrigger id="trigger">
                  <SelectValue placeholder="Select trigger event" />
                </SelectTrigger>
                <SelectContent>
                  {triggers.map((trigger) => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="action">Action</Label>
              <Select value={formData.action} onValueChange={(value) => setFormData({ ...formData, action: value })}>
                <SelectTrigger id="action">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {actions.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} suppressHydrationWarning disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleAddWorkflow} suppressHydrationWarning disabled={isLoading}>
              {isLoading ? 'Saving...' : editingId ? 'Update' : 'Create'} Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent suppressHydrationWarning>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The workflow will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel suppressHydrationWarning disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(editingId)} suppressHydrationWarning disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
