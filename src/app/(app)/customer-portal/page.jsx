'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Ticket, FileText, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';

export default function CustomerPortalPage() {
  const orders = [
    {
      id: 'ORD-001',
      product: 'Enterprise CRM License',
      amount: '$50,000',
      date: '2024-11-15',
      status: 'Delivered',
      deliveryDate: '2024-11-20',
    },
    {
      id: 'ORD-002',
      product: 'Support Package - 12 months',
      amount: '$12,000',
      date: '2024-11-10',
      status: 'Delivered',
      deliveryDate: '2024-11-12',
    },
    {
      id: 'ORD-003',
      product: 'Custom Integration Services',
      amount: '$15,000',
      date: '2024-11-01',
      status: 'In Progress',
      deliveryDate: '2024-12-15',
    },
  ];

  const tickets = [
    {
      id: 'SUP-001',
      subject: 'Setup assistance needed',
      status: 'Resolved',
      created: '2024-11-10',
      resolved: '2024-11-12',
      priority: 'high',
    },
    {
      id: 'SUP-002',
      subject: 'API integration question',
      status: 'Open',
      created: '2024-11-20',
      priority: 'medium',
    },
    {
      id: 'SUP-003',
      subject: 'License upgrade request',
      status: 'In Progress',
      created: '2024-11-22',
      priority: 'medium',
    },
  ];

  const documents = [
    { name: 'Service Agreement', type: 'PDF', date: '2024-11-15' },
    { name: 'Invoice - November', type: 'PDF', date: '2024-11-01' },
    { name: 'Implementation Guide', type: 'PDF', date: '2024-10-20' },
    { name: 'User Manual', type: 'PDF', date: '2024-09-15' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customer Portal</h1>
        <p className="text-muted-foreground mt-2">
          Welcome! Track your orders, support tickets, and access documentation.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground mt-1">Paid in full</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Next Renewal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45 days</div>
            <p className="text-xs text-muted-foreground mt-1">Dec 31, 2024</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="tickets">Support</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Your Orders
              </CardTitle>
              <CardDescription>Track the status of your purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{order.id}</span>
                        <Badge
                          variant={order.status === 'Delivered' ? 'outline' : 'default'}
                          className={
                            order.status === 'Delivered' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{order.product}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ordered: {order.date} • {order.status === 'Delivered' ? `Delivered: ${order.deliveryDate}` : `Est. delivery: ${order.deliveryDate}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{order.amount}</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tickets Tab */}
        <TabsContent value="tickets" className="space-y-6 mt-6">
          <div className="flex justify-end mb-4">
            <Button>
              <MessageSquare className="h-4 w-4 mr-2" />
              Submit New Ticket
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Support Tickets
              </CardTitle>
              <CardDescription>View and manage your support requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-blue-600">{ticket.id}</span>
                        <Badge
                          variant={ticket.status === 'Resolved' ? 'outline' : 'default'}
                          className={
                            ticket.status === 'Resolved'
                              ? 'bg-green-50 text-green-700'
                              : ticket.status === 'In Progress'
                              ? 'bg-orange-50 text-orange-700'
                              : 'bg-blue-50 text-blue-700'
                          }
                        >
                          {ticket.status}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ticket.status === 'Resolved'
                          ? `Resolved: ${ticket.resolved}`
                          : `Created: ${ticket.created}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents & Resources
              </CardTitle>
              <CardDescription>Download your contracts, invoices, and guides</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.date}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6 mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Company Name</p>
                  <p className="font-medium">Acme Corporation</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Manager</p>
                  <p className="font-medium">Sarah Chen</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Email</p>
                  <p className="font-medium">contact@acmecorp.com</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <p className="font-medium">Enterprise Plan</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Billing Date</p>
                  <p className="font-medium">December 31, 2024</p>
                </div>
                <Button>Upgrade Plan</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
