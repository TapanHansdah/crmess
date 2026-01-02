// This file is used to suggest the next best action to sales representatives based on interaction data.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestNextBestActionInputSchema = z.object({
  leadId: z.string().describe('The ID of the lead.'),
  interactionData: z.string().describe('The interaction data with the lead.'),
});


const SuggestNextBestActionOutputSchema = z.object({
  nextBestAction: z.string().describe('The suggested next best action for the lead.'),
  priority: z.string().describe('The priority of the lead (high, medium, low).'),
});


export async function suggestNextBestAction(input) {
  return suggestNextBestActionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNextBestActionPrompt',
  input: {schema: SuggestNextBestActionInputSchema},
  output: {schema: SuggestNextBestActionOutputSchema},
  prompt: `You are an AI Sales Assistant. Analyze the interaction data with the lead and suggest the next best action for the sales representative. Also, determine the priority of the lead.

Lead ID: {{{leadId}}}
Interaction Data: {{{interactionData}}}

Next Best Action: 
Priority (high, medium, low):`,
});

const suggestNextBestActionFlow = ai.defineFlow(
  {
    name: 'suggestNextBestActionFlow',
    inputSchema: SuggestNextBestActionInputSchema,
    outputSchema: SuggestNextBestActionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output;
  }
);
