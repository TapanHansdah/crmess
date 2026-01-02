'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import SalesChart from '@/components/dashboard/sales-chart';
import DealStageChart from '@/components/dashboard/deal-stage-chart';
import SalesHelper from '@/components/dashboard/ai-assistant';
import LeadScoring from '@/components/dashboard/lead-scoring';
import AuditLogs from '@/components/dashboard/audit-logs';
import WorkflowAutomation from '@/components/dashboard/workflow-automation';
import EmailTemplates from '@/components/dashboard/email-templates';
import SupportTicketing from '@/components/dashboard/support-ticketing';
import { DollarSign, Users, Activity, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { ChartContainer } from '@/components/ui/chart';
import { useEffect, useState } from 'react';
import { getDashboardMetrics, getSalesChartData, getDealStageData } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    activeDeals: 0,
    dealsWon: 0,
    totalDeals: 0,
    winRate: 0,
    totalInvoices: 0,
    totalContacts: 0
  });
  const [salesData, setSalesData] = useState([]);
  const [dealStageData, setDealStageData] = useState([]);
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [metricsData, salesChartData, dealStageChartData, leadsData, contactsData] = await Promise.all([
          getDashboardMetrics(),
          getSalesChartData(),
          getDealStageData(),
          supabase.from('leads').select('*, contacts(*)').limit(100),
          supabase.from('contacts').select('*').limit(100)
        ]);
        
        // Enrich leads with engagement metrics and contact info
        let enrichedLeads = leadsData.data || [];
        
        enrichedLeads = await Promise.all(enrichedLeads.map(async (lead) => {
          // Count emails for this lead
          const { data: emails } = await supabase
            .from('emails')
            .select('id', { count: 'exact' })
            .eq('lead_id', lead.id);
          
          // Count activities for this lead
          const { data: activities } = await supabase
            .from('activities')
            .select('id, created_at', { count: 'exact' })
            .eq('lead_id', lead.id);
          
          // Count interactions for this lead
          const { data: interactions } = await supabase
            .from('interactions')
            .select('id, created_at', { count: 'exact' })
            .eq('lead_id', lead.id);
          
          // Get most recent interaction date
          let lastInteractionDate = null;
          if (activities && activities.length > 0) {
            lastInteractionDate = new Date(
              Math.max(...activities.map(a => new Date(a.created_at).getTime()))
            );
          }
          if (interactions && interactions.length > 0) {
            const maxInteractionDate = new Date(
              Math.max(...interactions.map(i => new Date(i.created_at).getTime()))
            );
            if (!lastInteractionDate || maxInteractionDate > lastInteractionDate) {
              lastInteractionDate = maxInteractionDate;
            }
          }
          
          // Get contact data if exists
          const contact = lead.contacts ? (Array.isArray(lead.contacts) ? lead.contacts[0] : lead.contacts) : null;
          
          return {
            ...lead,
            // Add contact fields for lead scoring display
            first_name: contact?.first_name || '',
            last_name: contact?.last_name || '',
            email: contact?.email || lead.email,
            job_title: contact?.job_title,
            email_count: emails?.length || 0,
            activity_count: activities?.length || 0,
            interaction_count: interactions?.length || 0,
            last_interaction: lastInteractionDate,
          };
        }));
        
        // Enrich contacts with engagement metrics
        let enrichedContacts = contactsData.data || [];
        
        enrichedContacts = await Promise.all(enrichedContacts.map(async (contact) => {
          // Count emails
          const { data: emails } = await supabase
            .from('emails')
            .select('id', { count: 'exact' })
            .eq('contact_id', contact.id);
          
          // Count activities (calls, meetings, etc.)
          const { data: activities } = await supabase
            .from('activities')
            .select('id, created_at', { count: 'exact' })
            .eq('contact_id', contact.id);
          
          // Count interactions
          const { data: interactions } = await supabase
            .from('interactions')
            .select('id, created_at', { count: 'exact' })
            .eq('contact_id', contact.id);
          
          // Get most recent interaction date
          let lastInteractionDate = null;
          if (activities && activities.length > 0) {
            lastInteractionDate = new Date(
              Math.max(...activities.map(a => new Date(a.created_at).getTime()))
            );
          }
          if (interactions && interactions.length > 0) {
            const maxInteractionDate = new Date(
              Math.max(...interactions.map(i => new Date(i.created_at).getTime()))
            );
            if (!lastInteractionDate || maxInteractionDate > lastInteractionDate) {
              lastInteractionDate = maxInteractionDate;
            }
          }
          
          return {
            ...contact,
            email_count: emails?.length || 0,
            activity_count: activities?.length || 0,
            interaction_count: interactions?.length || 0,
            last_interaction: lastInteractionDate,
          };
        }));
        
        setMetrics(metricsData);
        setSalesData(salesChartData);
        setDealStageData(dealStageChartData);
        setLeads(enrichedLeads);
        setContacts(enrichedContacts);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back! Here's your sales overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{metrics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Opportunities</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeDeals}</div>
            <p className="text-xs text-muted-foreground">In pipeline</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.dealsWon}</div>
            <p className="text-xs text-muted-foreground">This quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.winRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalDeals} total deals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales Performance</CardTitle>
            <CardDescription>
              Monthly revenue and deal trends.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <SalesChart data={salesData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by Stage</CardTitle>
            <CardDescription>
              Deals breakdown by sales stage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DealStageChart data={dealStageData} />
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant & Lead Scoring */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SalesHelper />
        <LeadScoring leads={leads} />
      </div>

      {/* Main Tabs Section */}
      <Tabs defaultValue="operations" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6 mt-6">
          <div>
            <WorkflowAutomation />
          </div>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="mt-6">
          <SupportTicketing />
        </TabsContent>

        {/* Marketing Tab */}
        <TabsContent value="marketing" className="mt-6">
          <EmailTemplates />
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="mt-6">
          <AuditLogs logs={[]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
