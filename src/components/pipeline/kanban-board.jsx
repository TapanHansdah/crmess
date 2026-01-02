"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { IndianRupee, Calendar, TrendingUp } from 'lucide-react';
import { Badge } from '../ui/badge';

function LeadCard({ lead, contact }) {
  const getInitials = (contact) => {
    if (!contact) return '?';
    const firstName = contact.first_name || '';
    const lastName = contact.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getContactName = (contact) => {
    if (!contact) return 'Unknown';
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
  };

  return (
    <Card className="mb-4 bg-card hover:shadow-md transition-shadow duration-200 cursor-pointer">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold line-clamp-2">{lead.title}</CardTitle>
          {lead.priority && (
            <Badge variant={lead.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
              {lead.priority}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 py-2">
        <div className="space-y-2">
          {contact && (
            <div className="flex items-center gap-2 text-sm">
              <Avatar className="h-6 w-6">
                <AvatarImage src={contact.profile_picture_url} />
                <AvatarFallback>{getInitials(contact)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-xs">{getContactName(contact)}</p>
                <p className="text-xs text-muted-foreground">{contact.job_title || 'N/A'}</p>
              </div>
            </div>
          )}
          {lead.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{lead.description}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 p-4 pt-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1 font-semibold text-foreground">
            <IndianRupee className="h-3 w-3" />
            {lead.value ? lead.value.toLocaleString() : '0'}
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {lead.probability_percentage || 0}%
          </div>
        </div>
        {lead.expected_close_date && (
          <div className="flex items-center gap-1 w-full">
            <Calendar className="h-3 w-3" />
            {format(new Date(lead.expected_close_date), 'MMM d, yyyy')}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export default function KanbanBoard({
  leads,
  stages,
  contacts,
}) {
  const contactsMap = new Map(contacts.map((c) => [c.id, c]));

  return (
    <div className="w-full">
      <ScrollArea className="w-full">
        <div className="flex gap-6 pb-4 px-4">
          {stages.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage.id);
            const stageValue = stageLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
            
            return (
              <div key={stage.id} className="w-80 flex-shrink-0">
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg">{stage.label}</h2>
                    <span className="text-sm font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                      {stageLeads.length}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ₹{stageValue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3 h-[60vh] overflow-y-auto space-y-3">
                  {stageLeads.length > 0 ? (
                    stageLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        contact={contactsMap.get(lead.contact_id)}
                      />
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <p className="text-sm">No leads in this stage</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
