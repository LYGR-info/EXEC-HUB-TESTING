'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Repeat } from 'lucide-react';
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


export default function RecurringRevenueCard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [formattedMrr, setFormattedMrr] = useState<string | null>(null);

  const accountsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `accounts`);
  }, [user, firestore]);

  const { data: accounts, isLoading } = useCollection<Account>(accountsCollection);

  const { totalMrr, mrrList } = useMemo(() => {
    if (!accounts) return { totalMrr: 0, mrrList: [] };

    const activeAccounts = accounts.filter(a => a.status !== 'Lost');
    const flatList: any[] = [];

    const total = activeAccounts.reduce((acc, account) => {
      let accountMrr = 0;

      // Handle new revenueStreams structure
      if (account.revenueStreams && account.revenueStreams.length > 0) {
        account.revenueStreams.forEach(stream => {
          if (stream.type === 'Monthly Fee') {
            const fee = stream.monthlyFee || 0;
            accountMrr += fee;
            flatList.push({
              accountId: account.id,
              accountName: account.name,
              name: stream.name || 'Unnamed Opportunity',
              monthlyFee: fee,
              contractTerm: stream.contractTerm || 0,
            });
          }
        });
      }
      // Fallback for legacy data structure
      else if (account.calculationType === 'Monthly Fee') {
        const fee = account.monthlyFee || 0;
        accountMrr += fee;
        flatList.push({
          accountId: account.id,
          accountName: account.name,
          name: 'Legacy Opportunity',
          monthlyFee: fee,
          contractTerm: account.contractTerm || 0,
        });
      }

      return acc + accountMrr;
    }, 0);

    return { totalMrr: total, mrrList: flatList };
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

    setFormattedMrr(formatCurrency(totalMrr));
  }, [totalMrr]);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="w-6 h-6" />
            Recurring Revenue
          </CardTitle>
          <CardDescription>
            The total monthly recurring revenue (MRR).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="cursor-pointer hover:bg-muted/50 p-2 -m-2 rounded-md transition-colors"
            onClick={() => setIsDetailsOpen(true)}
          >
            <p className="text-sm text-muted-foreground">Total MRR</p>
            {!isLoading && formattedMrr ? (
              <p className="text-2xl font-bold">
                {formattedMrr}
              </p>
            ) : (
              <Skeleton className="h-8 w-40 mt-1" />
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Recurring Revenue Breakdown</DialogTitle>
            <DialogDescription>
              Detailed view of all active recurring revenue streams.
            </DialogDescription>
          </DialogHeader>

          <ScrollAreaPrimitive.Root className="flex-1 mt-4 border rounded-md relative overflow-hidden">
            <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
              <div className="min-w-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Opportunity</TableHead>
                      <TableHead className="text-right">Monthly Fee</TableHead>
                      <TableHead className="text-right">Term (Months)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mrrList.length > 0 ? (
                      mrrList.map((item, index) => (
                        <TableRow key={`${item.accountId}-${index}`}>
                          <TableCell>
                            <Link href={`/accounts/${item.accountId}`} className="font-medium text-primary hover:underline">
                              {item.accountName}
                            </Link>
                          </TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(item.monthlyFee)}
                          </TableCell>
                          <TableCell className="text-right">{item.contractTerm}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                          No recurring revenue found.
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
