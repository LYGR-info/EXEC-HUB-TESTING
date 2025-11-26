'use server';

/**
 * @fileOverview A business insight generation AI agent.
 *
 * - generateBusinessInsights - A function that handles the generation of business insights based on a query.
 * - GenerateBusinessInsightsInput - The input type for the generateBusinessInsights function.
 * - GenerateBusinessInsightsOutput - The return type for the generateBusinessInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBusinessInsightsInputSchema = z.object({
  query: z.string().describe('The query to retrieve business insights from the LYNX AI repository.'),
});
export type GenerateBusinessInsightsInput = z.infer<typeof GenerateBusinessInsightsInputSchema>;

const GenerateBusinessInsightsOutputSchema = z.object({
  insights: z.string().describe('The business insights retrieved from the LYNX AI repository based on the query.'),
});
export type GenerateBusinessInsightsOutput = z.infer<typeof GenerateBusinessInsightsOutputSchema>;

export async function generateBusinessInsights(input: GenerateBusinessInsightsInput): Promise<GenerateBusinessInsightsOutput> {
  return generateBusinessInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBusinessInsightsPrompt',
  input: {schema: GenerateBusinessInsightsInputSchema},
  output: {schema: GenerateBusinessInsightsOutputSchema},
  prompt: `You are an expert business analyst with access to the LYNX AI repository. A user is requesting some key business insights based on a query.

  Query: {{{query}}}

  Please provide the business insights retrieved from the LYNX AI repository based on the query. Incorporate data and reasoning into your response. Be concise and comprehensive.
  `,
});

const generateBusinessInsightsFlow = ai.defineFlow(
  {
    name: 'generateBusinessInsightsFlow',
    inputSchema: GenerateBusinessInsightsInputSchema,
    outputSchema: GenerateBusinessInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
