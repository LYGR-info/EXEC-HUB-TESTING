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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollBar } from '@/components/ui/scroll-area';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import Link from 'next/link';
import { flattenOpportunities, calculateRevenue, calculateWeightedValue } from '@/lib/data';

export default function TotalPipelineValueCard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [formattedOpportunityValue, setFormattedOpportunityValue] = useState<string | null>(null);
  const [formattedPipelineValue, setFormattedPipelineValue] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const accountsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `accounts`);
  }, [user, firestore]);

  const { data: accounts, isLoading } = useCollection<Account>(accountsCollection);

  const { totalOpportunityValue, totalPipelineValue, opportunityList } = useMemo(() => {
    if (!accounts) return { totalOpportunityValue: 0, totalPipelineValue: 0, opportunityList: [] };

    const activeAccounts = accounts.filter(a => a.status !== 'Lost');
    const flatList = flattenOpportunities(activeAccounts).filter(opp => opp.type !== 'Monthly Fee');

    const totals = activeAccounts.reduce(
      (acc, account) => {
        let accountOpportunityValue = 0;
        let accountPipelineValue = 0;

        // Handle new revenueStreams structure
        if (account.revenueStreams && account.revenueStreams.length > 0) {
          account.revenueStreams.forEach(stream => {
            if (stream.type === 'Sale-side' || stream.type === 'Buy-side' || stream.type === 'Raise') {
              // Opportunity Value is the total Deal Size
              accountOpportunityValue += stream.opportunityValue || 0;
              // Pipeline Value is the weighted potential commission
              accountPipelineValue += calculateWeightedValue(stream);
            }
            // Monthly Fee excluded from Pipeline calculations
          });
        }
        // Fallback for legacy data structure (if any)
        else {
          if (account.calculationType === 'Sale-side' || account.calculationType === 'Buy-side' || account.calculationType === 'Raise') {
            const legacyStream: any = {
              type: account.calculationType,
              opportunityValue: account.opportunityValue,
              confidenceRate: account.confidenceRate || 0,
              commission: account.commission,
              isCommissionApplied: (account.commission || 0) > 0
            };
            accountOpportunityValue += account.opportunityValue || 0;
            accountPipelineValue += calculateWeightedValue(legacyStream);
          }
        }

        return {
          totalOpportunityValue: acc.totalOpportunityValue + accountOpportunityValue,
          totalPipelineValue: acc.totalPipelineValue + accountPipelineValue,
        };
      },
      { totalOpportunityValue: 0, totalPipelineValue: 0 }
    );

    return { ...totals, opportunityList: flatList };
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

  const formatCurrencySimple = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <>
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
          <div
            className="cursor-pointer hover:bg-muted/50 p-2 -m-2 rounded-md transition-colors"
            onClick={() => setIsDetailsOpen(true)}
          >
            <p className="text-sm text-muted-foreground">Total Opportunity Value</p>
            {!isLoading && formattedOpportunityValue ? (
              <p className="text-2xl font-bold">
                {formattedOpportunityValue}
              </p>
            ) : (
              <Skeleton className="h-8 w-40 mt-1" />
            )}
          </div>
          <div
            className="cursor-pointer hover:bg-muted/50 p-2 -m-2 rounded-md transition-colors"
            onClick={() => setIsDetailsOpen(true)}
          >
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

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Pipeline Breakdown</DialogTitle>
            <DialogDescription>
              Detailed view of all active opportunities contributing to the pipeline.
            </DialogDescription>
          </DialogHeader>

          <ScrollAreaPrimitive.Root className="flex-1 mt-4 border rounded-md relative overflow-hidden">
            <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
              <div className="min-w-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Opportunity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Transaction Value</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Confidence</TableHead>
                      <TableHead className="text-right">Weighted Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {opportunityList.length > 0 ? (
                      opportunityList.map((opp, index) => {
                        let transactionValue = 0;
                        let revenueValue = 0;
                        let commissionDisplay = '-';

                        if (opp.type === 'Sale-side' || opp.type === 'Buy-side' || opp.type === 'Raise') {
                          transactionValue = opp.opportunityValue || 0;
                          revenueValue = calculateRevenue(opp);
                        }

                        const weightedValue = calculateWeightedValue(opp);

                        return (
                          <TableRow key={`${opp.id}-${index}`}>
                            <TableCell>
                              <Link href={`/accounts/${opp.accountId}`} className="font-medium text-primary hover:underline">
                                {opp.accountName}
                              </Link>
                            </TableCell>
                            <TableCell>{opp.name || 'Unnamed Opportunity'}</TableCell>
                            <TableCell>{opp.type}</TableCell>
                            <TableCell className="text-right">{formatCurrencySimple(transactionValue)}</TableCell>
                            <TableCell className="text-right">{commissionDisplay}</TableCell>
                            <TableCell className="text-right">{formatCurrencySimple(revenueValue)}</TableCell>
                            <TableCell className="text-right">{opp.confidenceRate}%</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrencySimple(weightedValue)}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                          No active opportunities found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar orientation="horizontal" />
            <ScrollBar orientation="vertical" />
            <ScrollAreaPrimitive.Corner />
          </ScrollAreaPrimitive.Root>
        </DialogContent>
      </Dialog>
    </>
  );
}
