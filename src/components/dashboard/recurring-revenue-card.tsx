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


export default function RecurringRevenueCard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [formattedMrr, setFormattedMrr] = useState<string | null>(null);

  const accountsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/accounts`);
  }, [user, firestore]);

  const { data: accounts, isLoading } = useCollection<Account>(accountsCollection);

  const totalMrr = useMemo(() => {
    if (!accounts) return 0;
    return accounts.reduce((total, account) => {
      let accountMrr = 0;

      // Handle new revenueStreams structure
      if (account.revenueStreams && account.revenueStreams.length > 0) {
        account.revenueStreams.forEach(stream => {
          if (stream.type === 'Monthly Fee') {
            accountMrr += (stream.monthlyFee || 0);
          }
        });
      }
      // Fallback for legacy data structure
      else if (account.calculationType === 'Monthly Fee') {
        accountMrr += (account.monthlyFee || 0);
      }

      return total + accountMrr;
    }, 0);
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

  return (
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
        <div>
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
  );
}
