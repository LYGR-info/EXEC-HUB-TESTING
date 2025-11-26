'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { getInsightAction } from '@/app/actions';
import { BrainCircuit, Loader2, Send } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

const initialState = {
  message: '',
  data: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button size="icon" type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Send className="h-4 w-4" />
      )}
      <span className="sr-only">Get Insight</span>
    </Button>
  );
}

export default function LynxAiInsightCard() {
  const [state, formAction] = useActionState(getInsightAction, initialState);
  const [showResult, setShowResult] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message === 'Success' && state.data) {
      setShowResult(true);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Card className="flex flex-col bg-red-50 dark:bg-red-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="w-6 h-6" />
            <span>LYNX AI Insights</span>
            <span className="text-xs font-normal text-red-600 dark:text-red-400">(placeholder until AI agent developed)</span>
        </CardTitle>
        <CardDescription>
          Ask LYNX to get key business insights.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <form
          ref={formRef}
          action={formAction}
          className="flex w-full items-start space-x-2"
        >
          <div className="flex-1 grid gap-2">
            <Input
              id="query"
              name="query"
              placeholder="e.g., 'What are the Q3 growth trends in fintech?'"
              required
            />
            {state?.message !== 'Success' && state?.message && (
              <p className="text-sm text-destructive">{state.message}</p>
            )}
          </div>
          <SubmitButton />
        </form>
      </CardContent>
      {(showResult && state.data) && (
        <CardFooter>
          <Alert>
            <AlertDescription className="prose prose-sm dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: state.data.replace(/\n/g, '<br />') }}/>
            </AlertDescription>
          </Alert>
        </CardFooter>
      )}
    </Card>
  );
}
