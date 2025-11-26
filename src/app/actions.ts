"use server";

import { generateBusinessInsights } from '@/ai/flows/generate-business-insights';
import { summarizeReport } from '@/ai/flows/summarize-reports';
import { z } from 'zod';

const insightSchema = z.object({
  query: z.string().min(5, 'Query must be at least 5 characters long.'),
});

export async function getInsightAction(prevState: any, formData: FormData) {
  const validatedFields = insightSchema.safeParse({
    query: formData.get('query'),
  });

  if (!validatedFields.success) {
    return {
      message:
        validatedFields.error.flatten().fieldErrors.query?.[0] ||
        'Invalid input.',
      data: null,
    };
  }
  try {
    const result = await generateBusinessInsights({
      query: validatedFields.data.query,
    });
    return {
      message: 'Success',
      data: result.insights,
    };
  } catch (e) {
    console.error(e);
    return {
      message: 'An error occurred while generating insights.',
      data: null,
    };
  }
}

const reportSchema = z.object({
  reportDataUri: z
    .string({ required_error: 'Please select a file to summarize.' })
    .startsWith('data:application/pdf;base64,', 'Only PDF files are accepted.'),
});

export async function summarizeReportAction(prevState: any, formData: FormData) {
  const validatedFields = reportSchema.safeParse({
    reportDataUri: formData.get('reportDataUri'),
  });

  if (!validatedFields.success) {
    return {
      message:
        validatedFields.error.flatten().fieldErrors.reportDataUri?.[0] ||
        'Invalid report data.',
      data: null,
    };
  }

  try {
    const result = await summarizeReport({
      reportDataUri: validatedFields.data.reportDataUri,
    });
    return {
      message: 'Success',
      data: result.summary,
    };
  } catch (e) {
    console.error(e);
    return {
      message: 'An error occurred while summarizing the report.',
      data: null,
    };
  }
}
