'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { type Account } from '@/lib/data';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function TotalPipelineValueCard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [formattedOpportunityValue, setFormattedOpportunityValue] = useState<string | null>(null);
  const [formattedPipelineValue, setFormattedPipelineValue] = useState<string | null>(null);

  const accountsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/accounts`);
  }, [user, firestore]);

  const { data: accounts, isLoading } = useCollection<Account>(accountsCollection);

  const { totalOpportunityValue, totalPipelineValue } = useMemo(() => {
    if (!accounts) return { totalOpportunityValue: 0, totalPipelineValue: 0 };

    return accounts.reduce(
      (acc, account) => {
        let accountOpportunityValue = 0;
        let accountPipelineValue = 0;

        // Handle new revenueStreams structure
        if (account.revenueStreams && account.revenueStreams.length > 0) {
          account.revenueStreams.forEach(stream => {
            let streamBaseValue = 0;
            if (stream.type === 'Sale-side') {
              streamBaseValue = stream.opportunityValue || 0;
            } else if (stream.type === 'Monthly Fee') {
              streamBaseValue = (stream.monthlyFee || 0) * (stream.contractTerm || 0);
            } else if (stream.type === 'Equity') {
              streamBaseValue = (stream.companyValuation || 0) * ((stream.equityPercentage || 0) / 100);
            }

            let streamPipelineValue = streamBaseValue * (stream.confidenceRate / 100);

            if (stream.type === 'Sale-side' && stream.isCommissionApplied) {
              streamPipelineValue = streamPipelineValue * ((stream.commission || 0) / 100);
            }

            accountOpportunityValue += streamBaseValue;
            accountPipelineValue += streamPipelineValue;
          });
        }
        // Fallback for legacy data structure (if any)
        else {
          let baseValue = 0;
          if (account.calculationType === 'Sale-side') {
            baseValue = account.opportunityValue || 0;
          } else if (account.calculationType === 'Monthly Fee') {
            baseValue = (account.monthlyFee || 0) * (account.contractTerm || 0);
          } else if (account.calculationType === 'Equity') {
            baseValue = (account.companyValuation || 0) * ((account.equityPercentage || 0) / 100);
          }

          let pipelineValue = baseValue * ((account.confidenceRate || 0) / 100);

          if (account.calculationType === 'Sale-side' && (account.commission || 0) > 0) {
            pipelineValue = pipelineValue * ((account.commission || 0) / 100);
          }

          accountOpportunityValue += baseValue;
          accountPipelineValue += pipelineValue;
        }

        return {
          totalOpportunityValue: acc.totalOpportunityValue + accountOpportunityValue,
          totalPipelineValue: acc.totalPipelineValue + accountPipelineValue,
        };
      },
      { totalOpportunityValue: 0, totalPipelineValue: 0 }
    );
  }, [accounts]);

  useEffect(() => {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    };

    setFormattedOpportunityValue(formatCurrency(totalOpportunityValue));
    setFormattedPipelineValue(formatCurrency(totalPipelineValue));
  }, [totalOpportunityValue, totalPipelineValue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          Total Pipeline Value
        </CardTitle>
        <CardDescription>
          The total value of all active opportunities.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Opportunity Value</p>
          {!isLoading && formattedOpportunityValue ? (
            <p className="text-2xl font-bold">
              {formattedOpportunityValue}
            </p>
          ) : (
            <Skeleton className="h-8 w-40 mt-1" />
          )}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Weighted Pipeline Value</p>
          {!isLoading && formattedPipelineValue ? (
            <p className="text-2xl font-bold text-primary">
              {formattedPipelineValue}
            </p>
          ) : (
            <Skeleton className="h-8 w-40 mt-1" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
