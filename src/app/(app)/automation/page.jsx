'use client';

import WorkflowAutomation from '@/components/dashboard/workflow-automation';
import EmailTemplates from '@/components/dashboard/email-templates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AutomationPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Automation & Marketing</h1>
        <p className="text-muted-foreground mt-2">Set up workflows, email templates, and automate your CRM operations.</p>
      </div>

      <Tabs defaultValue="workflows" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workflows">Workflow Automation</TabsTrigger>
          <TabsTrigger value="emails">Email Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="mt-6">
          <div className="space-y-6">
            <WorkflowAutomation />
          </div>
        </TabsContent>

        <TabsContent value="emails" className="mt-6">
          <EmailTemplates />
        </TabsContent>
      </Tabs>
    </div>
  );
}
