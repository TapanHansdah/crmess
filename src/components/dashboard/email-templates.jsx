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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Plus, Eye, Send, Trash2 } from 'lucide-react';
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

export default function EmailTemplates() {
  const [isClient, setIsClient] = useState(false);
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'Initial Outreach',
      category: 'outreach',
      subject: 'Excited to connect with you at {{company}}',
      preview: 'Hi {{firstName}}, I wanted to reach out...',
      body: 'Hi {{firstName}},\n\nI wanted to reach out and discuss how we can help {{company}} achieve their goals. I believe our solutions could be a great fit for your needs.\n\nWould you be available for a quick call this week?\n\nBest regards',
      createdAt: null,
      usageCount: 12,
    },
    {
      id: 2,
      name: 'Follow-up Email',
      category: 'follow_up',
      subject: 'Following up on our conversation',
      preview: 'Hi {{firstName}}, I wanted to follow up...',
      body: 'Hi {{firstName}},\n\nJust wanted to check in and see if you had a chance to review the proposal I sent. I\'m happy to answer any questions you might have.\n\nLooking forward to hearing from you.\n\nBest regards',
      createdAt: null,
      usageCount: 8,
    },
    {
      id: 3,
      name: 'Proposal Sent',
      category: 'proposal',
      subject: 'Your custom proposal for {{company}}',
      preview: 'Hi {{firstName}}, I have prepared...',
      body: 'Hi {{firstName}},\n\nI have prepared a custom proposal for {{company}} based on our discussion. The proposal includes all the details we discussed and outlines how we can help you achieve your goals.\n\nPlease let me know if you have any questions or would like to schedule a follow-up call.\n\nBest regards',
      createdAt: null,
      usageCount: 5,
    },
  ]);

  useEffect(() => {
    setIsClient(true);
    // Initialize dates only on client side after hydration
    setTemplates([
      {
        id: 1,
        name: 'Initial Outreach',
        category: 'outreach',
        subject: 'Excited to connect with you at {{company}}',
        preview: 'Hi {{firstName}}, I wanted to reach out...',
        body: 'Hi {{firstName}},\n\nI wanted to reach out and discuss how we can help {{company}} achieve their goals. I believe our solutions could be a great fit for your needs.\n\nWould you be available for a quick call this week?\n\nBest regards',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        usageCount: 12,
      },
      {
        id: 2,
        name: 'Follow-up Email',
        category: 'follow_up',
        subject: 'Following up on our conversation',
        preview: 'Hi {{firstName}}, I wanted to follow up...',
        body: 'Hi {{firstName}},\n\nJust wanted to check in and see if you had a chance to review the proposal I sent. I\'m happy to answer any questions you might have.\n\nLooking forward to hearing from you.\n\nBest regards',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        usageCount: 8,
      },
      {
        id: 3,
        name: 'Proposal Sent',
        category: 'proposal',
        subject: 'Your custom proposal for {{company}}',
        preview: 'Hi {{firstName}}, I have prepared...',
        body: 'Hi {{firstName}},\n\nI have prepared a custom proposal for {{company}} based on our discussion. The proposal includes all the details we discussed and outlines how we can help you achieve your goals.\n\nPlease let me know if you have any questions or would like to schedule a follow-up call.\n\nBest regards',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        usageCount: 5,
      },
    ]);
  }, []);

  const [showDialog, setShowDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'outreach',
    subject: '',
    content: '',
  });

  const categories = [
    { value: 'outreach', label: 'Initial Outreach' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'closing', label: 'Closing' },
  ];

  const handleAddTemplate = () => {
    if (!formData.name || !formData.subject || !formData.content) {
      return;
    }

    const newTemplate = {
      id: Math.max(...templates.map((t) => t.id), 0) + 1,
      name: formData.name,
      category: formData.category,
      subject: formData.subject,
      body: formData.content,
      preview: formData.content.substring(0, 50) + '...',
      createdAt: new Date(),
      usageCount: 0,
    };
    setTemplates([...templates, newTemplate]);
    setFormData({ name: '', category: 'outreach', subject: '', content: '' });
    setShowDialog(false);
  };

  const handleSendEmail = (template) => {
    // Encode subject and body for mailto: link
    const subject = encodeURIComponent(template.subject || '');
    const body = encodeURIComponent(template.body || template.preview || '');
    
    // Create mailto: link with subject and body
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Increment usage count
    setTemplates(templates.map(t => 
      t.id === template.id 
        ? { ...t, usageCount: (t.usageCount || 0) + 1 }
        : t
    ));
  };

  const handleDelete = (id) => {
    setTemplates(templates.filter((t) => t.id !== id));
    setShowDeleteDialog(false);
  };

  const getCategoryBadge = (category) => {
    const colors = {
      outreach: 'bg-blue-100 text-blue-800',
      follow_up: 'bg-green-100 text-green-800',
      proposal: 'bg-purple-100 text-purple-800',
      closing: 'bg-orange-100 text-orange-800',
    };
    const label = categories.find((c) => c.value === category)?.label;
    return (
      <Badge variant="outline" className={colors[category]}>
        {label}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Email Templates
              </CardTitle>
              <CardDescription>Manage email templates for campaigns and outreach</CardDescription>
            </div>
            <Button onClick={() => setShowDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{template.name}</p>
                    {getCategoryBadge(template.category)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{template.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    Used {template.usageCount} times
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowPreview(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-green-600"
                    onClick={() => handleSendEmail(template)}
                    title="Open in email app"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowDeleteDialog(true);
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Create a reusable email template with merge fields for personalization
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                placeholder="e.g., Initial Outreach"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., Let's connect at {{company}}"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Email Content</Label>
              <Textarea
                id="content"
                placeholder="Use {{firstName}}, {{lastName}}, {{company}} for merge fields"
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTemplate}>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedTemplate && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTemplate.name}</DialogTitle>
            </DialogHeader>
            <div className="bg-muted p-4 rounded-lg space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Subject
                </p>
                <p className="text-sm">{selectedTemplate.subject}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Content
                </p>
                <div className="bg-white rounded p-4 text-sm whitespace-pre-wrap">
                  {selectedTemplate.body || selectedTemplate.preview || 'No content available'}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The template will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(selectedTemplate?.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
