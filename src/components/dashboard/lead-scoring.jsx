'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Zap, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function LeadScoring({ leads = [] }) {
  const [filterScore, setFilterScore] = useState('all');

  const getScoringBadge = (score) => {
    if (score >= 80) return <Badge className="bg-green-600">Hot</Badge>;
    if (score >= 60) return <Badge className="bg-blue-600">Warm</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-600">Cold</Badge>;
    return <Badge className="bg-gray-600">Unqualified</Badge>;
  };

  const getScoreCategory = (score) => {
    if (score >= 80) return 'hot';
    if (score >= 60) return 'warm';
    if (score >= 40) return 'cold';
    return 'unqualified';
  };

  const calculateLeadScore = (lead) => {
    let score = 0;
    
    // Email engagement (0-25 points)
    if (lead.email_count) score += Math.min(25, lead.email_count * 5);
    
    // Activity engagement - calls, meetings (0-30 points)
    if (lead.activity_count) score += Math.min(30, lead.activity_count * 8);
    
    // Interactions (0-20 points)
    if (lead.interaction_count) score += Math.min(20, lead.interaction_count * 4);
    
    // Profile completeness (0-15 points)
    if (lead.first_name && lead.email) score += 10;
    if (lead.job_title) score += 5;
    
    // Recent activity bonus (0-10 points)
    if (lead.last_interaction) {
      const daysSinceInteraction = (new Date() - new Date(lead.last_interaction)) / (1000 * 60 * 60 * 24);
      if (daysSinceInteraction < 7) score += 10;
      else if (daysSinceInteraction < 30) score += 5;
    }

    return Math.min(100, Math.round(score));
  };

  let scoredLeads = leads
    .map(lead => ({
      ...lead,
      score: calculateLeadScore(lead),
    }))
    .sort((a, b) => b.score - a.score);

  // Apply filter
  if (filterScore !== 'all') {
    scoredLeads = scoredLeads.filter(lead => getScoreCategory(lead.score) === filterScore);
  }

  // Show top 10 after filtering
  scoredLeads = scoredLeads.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Lead Scoring
            </CardTitle>
            <CardDescription>Lead quality based on emails, activities, and interactions</CardDescription>
          </div>
        </div>
        <div className="mt-4">
          <Select value={filterScore} onValueChange={setFilterScore}>
            <SelectTrigger className="w-full" suppressHydrationWarning>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              <SelectItem value="hot">🟢 Hot (80+)</SelectItem>
              <SelectItem value="warm">🔵 Warm (60-79)</SelectItem>
              <SelectItem value="cold">🟡 Cold (40-59)</SelectItem>
              <SelectItem value="unqualified">⚪ Unqualified (&lt;40)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {scoredLeads.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <AlertCircle className="h-4 w-4 mr-2" />
              {filterScore === 'all' ? 'No leads available for scoring' : 'No leads in this category'}
            </div>
          ) : (
            scoredLeads.map((lead, index) => (
              <div key={lead.id || index} className="space-y-2 pb-4 last:pb-0 border-b last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {lead.first_name} {lead.last_name || ''}
                    </p>
                    <p className="text-xs text-muted-foreground">{lead.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lead.email_count} emails • {lead.activity_count} activities • {lead.interaction_count} interactions
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{lead.score}</span>
                    {getScoringBadge(lead.score)}
                  </div>
                </div>
                <Progress value={lead.score} className="h-2" />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
