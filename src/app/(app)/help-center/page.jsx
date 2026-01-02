'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, Book, MessageCircle, FileText, ArrowRight, Phone, Mail } from 'lucide-react';

export default function HelpCenterPage() {
  const helpSections = [
    {
      icon: Book,
      title: 'Getting Started',
      description: 'Learn the basics of Apex CRM and how to get started with managing your business relationships.',
      link: 'https://www.salesforce.com/eu/learning-centre/'
    },
    {
      icon: MessageCircle,
      title: 'Contact Management',
      description: 'Discover how to efficiently manage your contacts, organizations, and customer relationships.',
      link: 'https://www.salesforce.com/eu/small-business/contact-management/'
    },
    {
      icon: FileText,
      title: 'Sales Pipeline',
      description: 'Understand how to track deals, manage leads, and optimize your sales process.',
      link: 'https://www.salesforce.com/sales/pipeline/management/'
    }
  ];

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-blue-600" />
          Help Center
        </h1>
        <p className="text-muted-foreground mt-2">
          Find answers, guides, and tutorials to help you get the most out of Apex CRM
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {helpSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base mb-4">
                  {section.description}
                </CardDescription>
                <Button variant="outline" className="w-full" onClick={() => window.open(section.link, '_blank')}>
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Need More Help?</CardTitle>
          <CardDescription>
            Can't find what you're looking for? Our support team is here to help.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Phone</div>
                <a href="tel:+91 8327867819" className="text-sm text-blue-600 hover:underline">
                +91 8327867819
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Email</div>
                <a href="mailto:support@apexcrm.com" className="text-sm text-blue-600 hover:underline">
                  support@apexcrm.com
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

