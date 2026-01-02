"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lightbulb, Sparkles, Loader2, X } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const formSchema = z.object({
  leadName: z.string().min(1, 'Lead name is required.'),
  companyName: z.string().min(1, 'Company name is required.'),
  dealStage: z.string().min(1, 'Deal stage is required.'),
  lastInteraction: z
    .string()
    .min(1, 'Please enter your query.'),
});


export default function SalesHelper() {
  const [suggestion, setSuggestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leadName: '',
      companyName: '',
      dealStage: '',
      lastInteraction: '',
    },
  });

  // Watch for lead name changes and auto-fill other fields
  const leadName = form.watch('leadName');

  useEffect(() => {
    const fetchLeadData = async () => {
      if (!leadName || leadName.trim().length < 2) {
        // Clear fields if name is too short
        form.setValue('companyName', '');
        form.setValue('dealStage', '');
        return;
      }

      setIsSearching(true);
      try {
        // Split full name into first and last name
        const nameParts = leadName.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Search for contact by full name (first name AND last name if provided)
        let query = supabase
          .from('contacts')
          .select('id, first_name, last_name, organization_id, organizations(name)')
          .ilike('first_name', `%${firstName}%`);

        // If last name is provided, also filter by last name
        if (lastName) {
          query = query.ilike('last_name', `%${lastName}%`);
        }

        const { data: contacts, error: contactError } = await query;

        if (contactError) {
          console.error('Error fetching contacts:', contactError);
          return;
        }

        if (contacts && contacts.length > 0) {
          // Find the best match (exact match preferred)
          const exactMatch = contacts.find(
            c => c.first_name?.toLowerCase() === firstName.toLowerCase() &&
                 (!lastName || c.last_name?.toLowerCase() === lastName.toLowerCase())
          );
          const contact = exactMatch || contacts[0];
          
          // Get company name from organization
          let companyName = '';
          if (contact.organizations && contact.organizations.name) {
            companyName = contact.organizations.name;
          } else if (contact.organization_id) {
            // Fallback: fetch organization directly
            const { data: org } = await supabase
              .from('organizations')
              .select('name')
              .eq('id', contact.organization_id)
              .single();
            if (org) companyName = org.name;
          }

          // Get latest lead for this contact (from leads table, not deals)
          const { data: leads } = await supabase
            .from('leads')
            .select('stage')
            .eq('contact_id', contact.id)
            .order('created_at', { ascending: false })
            .limit(1);

          // Update form fields
          if (companyName) {
            form.setValue('companyName', companyName);
          }
          if (leads && leads.length > 0 && leads[0].stage) {
            form.setValue('dealStage', leads[0].stage);
          }
        } else {
          // No contact found, clear fields
          form.setValue('companyName', '');
          form.setValue('dealStage', '');
        }
      } catch (error) {
        console.error('Error fetching lead data:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(fetchLeadData, 500);
    return () => clearTimeout(debounceTimer);
  }, [leadName, form]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setSuggestion(null);
    try {
      // Call API endpoint for secure server-side Gemini integration
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadName: data.leadName,
          companyName: data.companyName,
          dealStage: data.dealStage,
          lastInteraction: data.lastInteraction,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get suggestion');
      }

      const result = await response.json();
      setSuggestion({
        text: result.text,
        timestamp: result.timestamp,
        hasDatabaseContext: result.hasDatabaseContext || false,
      });
    } catch (error) {
      console.error('AI Assistant Error:', error);
      toast({
        variant: 'destructive',
        title: 'Suggestion Error',
        description: error.message || 'Could not get suggestion. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Sales Helper</CardTitle>
            <CardDescription>
              Get the next best action for your leads based on interaction analysis.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="leadName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    <span>Lead Name</span>
                    {isSearching && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., John Smith"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Acme Corporation"
                      disabled={isSearching}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dealStage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal Stage</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., proposal, negotiation, qualified"
                      disabled={isSearching}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastInteraction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Query with AI</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., What's the status of this lead? Analyze the deal progression. Show me recent interactions. What are the next steps?"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Thinking...
                </>
              ) : (
                'Get Suggestion'
              )}
            </Button>

            {isLoading && (
              <div className="w-full space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            )}

            {suggestion && !isLoading && (
              <div className="w-full">
                <div className="flex items-start gap-3 p-4 bg-secondary rounded-lg border">
                  <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <div className="w-full">
                    <h4 className="font-semibold flex items-center justify-between mb-3">
                      <span>AI Response</span>
                      <div className="flex items-center gap-2">
                        {suggestion.hasDatabaseContext && (
                          <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-1 rounded">
                            AI + Database
                          </span>
                        )}
                        <span className="text-xs font-normal text-muted-foreground">
                          {suggestion.timestamp}
                        </span>
                        <button
                          onClick={() => setSuggestion(null)}
                          className="p-1 hover:bg-background rounded-md transition-colors"
                          aria-label="Close response"
                        >
                          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                    </h4>
                    <div className="text-sm text-foreground whitespace-pre-wrap max-h-96 overflow-y-auto pr-2">
                      {suggestion.text}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
