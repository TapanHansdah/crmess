'use client';

import KanbanBoard from '@/components/pipeline/kanban-board';
import { useEffect, useState } from 'react';
import { fetchLeads, fetchContacts } from '@/lib/supabase';

const leadStages = [
  { id: 'New Lead', label: 'New Lead' },
  { id: 'Contacted', label: 'Contacted' },
  { id: 'Proposal Sent', label: 'Proposal Sent' },
  { id: 'Negotiation', label: 'Negotiation' },
  { id: 'Won', label: 'Won' },
  { id: 'Lost', label: 'Lost' }
];

export default function PipelinePage() {
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [leadsData, contactsData] = await Promise.all([
          fetchLeads(),
          fetchContacts()
        ]);
        setLeads(leadsData || []);
        setContacts(contactsData || []);
      } catch (err) {
        console.error('Failed to load pipeline data:', err);
        setError('Failed to load pipeline data. Please try again.');
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
          <p>Loading sales pipeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return <KanbanBoard leads={leads} stages={leadStages} contacts={contacts} />;
}
