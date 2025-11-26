'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { summarizeReportAction } from '@/app/actions';
import { Alert, AlertDescription } from '../ui/alert';
import { FileText, Loader2, Upload } from 'lucide-react';

const initialState = {
  message: '',
  data: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Upload className="mr-2 h-4 w-4" />
      )}
      Summarize Report
    </Button>
  );
}

export default function ReportSummarizerCard() {
  const [state, formAction] = useActionState(summarizeReportAction, initialState);
  const [showResult, setShowResult] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dataUriRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.message === 'Success' && state.data) {
      setShowResult(true);
      setFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [state]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file.');
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (dataUriRef.current) {
          dataUriRef.current.value = e.target?.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Report Summarizer
        </CardTitle>
        <CardDescription>Upload a business report (PDF) for an AI-powered summary.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="reportDataUri" ref={dataUriRef} />
          <input
            type="file"
            id="report-file"
            ref={fileInputRef}
            className="hidden"
            accept="application/pdf"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground"
            onClick={() => fileInputRef.current?.click()}
          >
            {fileName || 'Select a PDF file...'}
          </Button>

          {state?.message !== 'Success' && state?.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <SubmitButton />
        </form>
      </CardContent>
      {(showResult && state.data) && (
         <CardFooter>
          <Alert>
            <AlertDescription className="prose prose-sm dark:prose-invert max-h-48 overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: state.data.replace(/\n/g, '<br />') }}/>
            </AlertDescription>
          </Alert>
        </CardFooter>
      )}
    </Card>
  );
}
