'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, Target, Download, Loader2 } from 'lucide-react';
import SalesChart from '@/components/dashboard/sales-chart';
import DealStageChart from '@/components/dashboard/deal-stage-chart';
import { supabase } from '@/lib/supabase';
import { format, startOfDay, endOfDay } from 'date-fns';

export default function ReportsPage() {
  const today = new Date();
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [fromDate, setFromDate] = useState(ninetyDaysAgo);
  const [toDate, setToDate] = useState(today);
  const [deals, setDeals] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);

      // Use selected date range
      const startDate = startOfDay(fromDate);
      const endDate = endOfDay(toDate);

      // Fetch all deals
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select('*');

      console.log('Deals fetched:', dealsData?.length || 0, 'deals');

      if (dealsError) {
        console.error('Deals fetch error:', dealsError);
        setError(`Failed to load deals: ${dealsError.message}`);
        setDeals([]);
      } else {
        // Filter deals by date range on the frontend
        const filteredDeals = (dealsData || []).filter(deal => {
          if (!deal.created_at) return false;
          const dealDate = new Date(deal.created_at);
          return dealDate >= startDate && dealDate <= endDate;
        });
        
        console.log(`Filtered to ${filteredDeals.length} deals within date range`);
        setDeals(filteredDeals);
      }

      // Fetch users/sales team
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'sales');

      console.log('Users fetched:', usersData?.length || 0, 'users');

      if (usersError) {
        console.error('Users fetch error:', usersError);
        setError(`Failed to load users: ${usersError.message}`);
        setUsers([]);
      } else {
        setUsers(usersData || []);
      }
    } catch (err) {
      console.error('Failed to load reports data:', err);
      setError('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics from real data
  const metrics = useMemo(() => {
    if (deals.length === 0) {
      return [
        { label: 'Total Revenue', value: '₹0', change: '+0%', icon: TrendingUp, color: 'text-green-600' },
        { label: 'Active Deals', value: '0', change: '+0', icon: Target, color: 'text-blue-600' },
        { label: 'Sales Team Members', value: users.length.toString(), change: '+0', icon: Users, color: 'text-purple-600' },
        { label: 'Avg Deal Size', value: '₹0', change: '+0%', icon: BarChart3, color: 'text-orange-600' },
      ];
    }

    const totalRevenue = deals.reduce((sum, deal) => sum + (parseFloat(deal.amount) || 0), 0);
    const activeDealCount = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').length;
    const wonDeals = deals.filter(d => d.stage === 'won');
    const avgDealSize = deals.length > 0 ? totalRevenue / deals.length : 0;
    const winRate = deals.length > 0 ? ((wonDeals.length / deals.length) * 100).toFixed(1) : 0;

    return [
      {
        label: 'Total Revenue',
        value: `₹${(totalRevenue / 1000).toFixed(0)}K`,
        change: `${winRate}% win rate`,
        icon: TrendingUp,
        color: 'text-green-600',
      },
      {
        label: 'Active Deals',
        value: activeDealCount.toString(),
        change: `+${activeDealCount}`,
        icon: Target,
        color: 'text-blue-600',
      },
      {
        label: 'Sales Team Members',
        value: users.length.toString(),
        change: `+${users.length}`,
        icon: Users,
        color: 'text-purple-600',
      },
      {
        label: 'Avg Deal Size',
        value: `₹${(avgDealSize / 1000).toFixed(0)}K`,
        change: `${deals.length} deals`,
        icon: BarChart3,
        color: 'text-orange-600',
      },
    ];
  }, [deals, users]);

  // Calculate sales rep performance
  const salesReps = useMemo(() => {
    if (users.length === 0) return [];

    const reps = users.map(user => {
      const userDeals = deals.filter(d => d.created_by === user.email);
      const wonDeals = userDeals.filter(d => d.stage === 'won');
      const totalRevenue = userDeals.reduce((sum, deal) => sum + (parseFloat(deal.amount) || 0), 0);
      const winRate = userDeals.length > 0 ? ((wonDeals.length / userDeals.length) * 100).toFixed(0) : 0;

      return {
        name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email,
        email: user.email,
        deals: userDeals.length,
        revenue: `₹${(totalRevenue / 1000).toFixed(0)}K`,
        winRate: `${winRate}%`,
      };
    }).sort((a, b) => b.deals - a.deals);

    return reps;
  }, [deals, users]);

  // Calculate pipeline by stage
  const pipelineByStage = useMemo(() => {
    if (deals.length === 0) return [];

    const stages = ['prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
    const stageNames = {
      prospect: 'Prospect',
      qualified: 'Qualified',
      proposal: 'Proposal',
      negotiation: 'Negotiation',
      won: 'Won',
      lost: 'Lost',
    };

    return stages.map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      const stageValue = stageDeals.reduce((sum, deal) => sum + (parseFloat(deal.amount) || 0), 0);
      return {
        name: stageNames[stage],
        value: stageDeals.length,
        amount: stageValue,
        formatted: `₹${(stageValue / 1000).toFixed(0)}K`,
      };
    }).filter(d => d.value > 0);
  }, [deals]);

  // Transform pipeline data for SalesChart (bar chart needs month and sales)
  const salesChartData = useMemo(() => {
    if (pipelineByStage.length === 0) return [];
    return pipelineByStage.map(item => ({
      month: item.name,
      sales: item.amount,
    }));
  }, [pipelineByStage]);

  // Calculate sales forecast
  const forecast = useMemo(() => {
    if (deals.length === 0) return { conservative: '₹0', likely: '₹0', optimistic: '₹0' };

    const proposalStageDeals = deals.filter(d => d.stage === 'proposal' || d.stage === 'negotiation');
    const proposalValue = proposalStageDeals.reduce((sum, deal) => sum + (parseFloat(deal.amount) || 0), 0);
    const wonValue = deals.filter(d => d.stage === 'won').reduce((sum, deal) => sum + (parseFloat(deal.amount) || 0), 0);

    return {
      conservative: `₹${((wonValue + proposalValue * 0.3) / 1000).toFixed(0)}K`,
      likely: `₹${((wonValue + proposalValue * 0.6) / 1000).toFixed(0)}K`,
      optimistic: `₹${((wonValue + proposalValue * 0.9) / 1000).toFixed(0)}K`,
    };
  }, [deals]);

  // Export data as CSV
  const handleExport = () => {
    if (deals.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Title', 'Amount', 'Stage', 'Probability', 'Created By', 'Created At', 'Expected Close Date'];
    const rows = deals.map(deal => [
      deal.title,
      deal.amount,
      deal.stage,
      deal.probability,
      deal.created_by,
      new Date(deal.created_at).toLocaleDateString(),
      deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reports_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">Comprehensive insights into your sales performance.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" suppressHydrationWarning onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="flex gap-4 items-end flex-wrap">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">From Date</label>
          <Input
            type="date"
            value={format(fromDate, 'yyyy-MM-dd')}
            onChange={(e) => setFromDate(new Date(e.target.value))}
            className="w-48"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">To Date</label>
          <Input
            type="date"
            value={format(toDate, 'yyyy-MM-dd')}
            onChange={(e) => setToDate(new Date(e.target.value))}
            className="w-48"
          />
        </div>

        <Button
          size="sm"
          onClick={loadData}
          suppressHydrationWarning
        >
          Go
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const today = new Date();
            const ninetyDaysAgo = new Date(today);
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            setFromDate(ninetyDaysAgo);
            setToDate(today);
          }}
        >
          Reset
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className={`text-xs mt-1 ${metric.color}`}>
                  {metric.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="sales-team">Sales Team</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline Analysis</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Deal values by stage</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <SalesChart data={salesChartData} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Composition</CardTitle>
                <CardDescription>Distribution by deal stage</CardDescription>
              </CardHeader>
              <CardContent>
                <DealStageChart data={pipelineByStage} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Team Tab */}
        <TabsContent value="sales-team" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Representative Performance</CardTitle>
              <CardDescription>Individual sales metrics and rankings</CardDescription>
            </CardHeader>
            <CardContent>
              {salesReps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No sales team members found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {salesReps.map((rep, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{rep.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {rep.deals} deals closed • Win rate: {rep.winRate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{rep.revenue}</p>
                        <Badge className="mt-1">{rep.winRate}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline Analysis Tab */}
        <TabsContent value="pipeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline by Stage</CardTitle>
              <CardDescription>Deals and values at each stage</CardDescription>
            </CardHeader>
            <CardContent>
              {pipelineByStage.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No deals found for this period</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pipelineByStage.map((deal, idx) => {
                    const maxValue = Math.max(...pipelineByStage.map(d => d.amount));
                    const width = (deal.amount / maxValue) * 100;

                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{deal.name}</p>
                            <p className="text-xs text-muted-foreground">{deal.value} deals</p>
                          </div>
                          <p className="font-semibold">{deal.formatted}</p>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${width}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Forecast</CardTitle>
          <CardDescription>Projected revenue based on current pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Conservative</p>
              <p className="text-2xl font-bold">{forecast.conservative}</p>
              <p className="text-xs text-muted-foreground mt-1">30% proposal conversion</p>
            </div>
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <p className="text-sm text-muted-foreground mb-1">Likely</p>
              <p className="text-2xl font-bold text-blue-600">{forecast.likely}</p>
              <p className="text-xs text-muted-foreground mt-1">60% proposal conversion</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Optimistic</p>
              <p className="text-2xl font-bold">{forecast.optimistic}</p>
              <p className="text-xs text-muted-foreground mt-1">90% proposal conversion</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
