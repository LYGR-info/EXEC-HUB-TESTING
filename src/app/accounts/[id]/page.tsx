'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Building,
  Save,
  PlusCircle,
  Calculator,
  Pencil,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Account, AccountStatus, OpportunityType, RevenueStream, Valuation } from '@/lib/data';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import RevenueStreamCard from '@/components/accounts/revenue-stream-card';
import ValuationCard from '@/components/accounts/valuation-card';
import AccountDashboardGrid from '@/components/dashboard/account-dashboard-grid';
import ActivityLog from '@/components/accounts/activity-log';
import ImportNotesDialog from '@/components/accounts/import-notes-dialog';

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const accountId = params.id as string;

  const accountRef = useMemo(() => {
    if (!user || !firestore || !accountId) return null;
    return doc(firestore, `accounts/${accountId}`);
  }, [user, firestore, accountId]);

  const { data: account, isLoading } = useDoc<Account>(accountRef);

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [status, setStatus] = useState<AccountStatus>('Potential');
  const [opportunityType, setOpportunityType] = useState<OpportunityType>('Other');
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [revenueStreams, setRevenueStreams] = useState<RevenueStream[]>([]);
  const [valuations, setValuations] = useState<Valuation[]>([]);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setIndustry(account.industry);
      setStatus(account.status);
      setOpportunityType(account.opportunityType);
      setNotes(account.notes || '');

      // Initialize revenue streams
      if (account.revenueStreams && account.revenueStreams.length > 0) {
        setRevenueStreams(account.revenueStreams);
      } else {
        // Migration/Fallback: If no revenue streams, try to create one from legacy fields
        if (account.calculationType) {
          const legacyStream: RevenueStream = {
            id: `rs-${Date.now()}`,
            type: account.calculationType,
            opportunityValue: account.opportunityValue,
            monthlyFee: account.monthlyFee,
            contractTerm: account.contractTerm,
            confidenceRate: account.confidenceRate || 50,
            commission: account.commission,
            isCommissionApplied: (account.commission || 0) > 0,
          } as RevenueStream;
          setRevenueStreams([legacyStream]);
        } else {
          setRevenueStreams([]);
        }
      }

      // Initialize valuations
      if (account.valuations && account.valuations.length > 0) {
        setValuations(account.valuations);
      } else if (account.companyValuation) {
        // Migration from legacy field
        setValuations([{
          id: `val-${Date.now()}`,
          amount: account.companyValuation,
          isEstimate: false,
        }]);
      } else {
        setValuations([]);
      }
    }
  }, [account]);

  const handleSave = async () => {
    if (!accountRef) return;

    try {
      await updateDoc(accountRef, {
        name,
        industry,
        status,
        opportunityType,
        revenueStreams,
        valuations,
        notes,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Account updated',
        description: 'Changes have been saved successfully.',
      });
    } catch (error) {
      console.error('Error updating account:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const addRevenueStream = () => {
    const newStream: RevenueStream = {
      id: `rs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      type: 'Sale-side',
      confidenceRate: 50,
      opportunityValue: 0,
      isCommissionApplied: false,
      commission: 0,
    };
    setRevenueStreams([...revenueStreams, newStream]);
  };

  const updateRevenueStream = (updatedStream: RevenueStream) => {
    setRevenueStreams(revenueStreams.map(s => s.id === updatedStream.id ? updatedStream : s));
  };

  const deleteRevenueStream = (streamId: string) => {
    setRevenueStreams(revenueStreams.filter(s => s.id !== streamId));
  };

  const addValuation = () => {
    const newValuation: Valuation = {
      id: `val-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount: 0,
      isEstimate: false,
    };
    setValuations([...valuations, newValuation]);
  };

  const updateValuation = (updatedValuation: Valuation) => {
    setValuations(valuations.map(v => v.id === updatedValuation.id ? updatedValuation : v));
  };

  const deleteValuation = (valuationId: string) => {
    setValuations(valuations.filter(v => v.id !== valuationId));
  };

  if (isLoading) {
    return <div className="p-8">Loading account details...</div>;
  }

  if (!account) {
    return <div className="p-8">Account not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{name}</h1>
          <p className="text-muted-foreground">
            Manage account details and opportunities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Import from Sheets
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              General details about the account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name</Label>
              <div className="relative">
                <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Acme Corp"
                  className="pl-8"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="Technology"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value: AccountStatus) => setStatus(value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Potential">Potential</SelectItem>
                    <SelectItem value="Ongoing">Ongoing</SelectItem>
                    <SelectItem value="Established">Established</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Opportunity Type</Label>
                <Select
                  value={opportunityType}
                  onValueChange={(value: OpportunityType) =>
                    setOpportunityType(value)
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sell-side">Sell-side</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Notes</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setIsEditingNotes(!isEditingNotes)}
                >
                  {isEditingNotes ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Done
                    </>
                  ) : (
                    <>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </>
                  )}
                </Button>
              </div>

              {isEditingNotes ? (
                <Textarea
                  placeholder="Add account notes here..."
                  className="min-h-[100px] resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  autoFocus
                />
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md min-h-[60px] whitespace-pre-wrap">
                  {notes || 'No notes added yet.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Opportunities</h2>
            <div className="flex gap-2">
              {valuations.length === 0 && (
                <Button size="sm" variant="outline" onClick={addValuation}>
                  <Calculator className="mr-2 h-4 w-4" />
                  Add Valuation
                </Button>
              )}
              <Button size="sm" onClick={addRevenueStream}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Opportunity
              </Button>
            </div>
          </div>

          {valuations.map(valuation => (
            <ValuationCard
              key={valuation.id}
              valuation={valuation}
              onUpdate={updateValuation}
              onDelete={deleteValuation}
              accountId={accountId}
            />
          ))}

          {revenueStreams.map(stream => (
            <RevenueStreamCard
              key={stream.id}
              stream={stream}
              onUpdate={updateRevenueStream}
              onDelete={deleteRevenueStream}
            />
          ))}

          {revenueStreams.length === 0 && valuations.length === 0 && (
            <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
              No opportunities added. Click "Add Opportunity" to define revenue.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <ActivityLog accountId={accountId} />
      </div>

      <AccountDashboardGrid accountId={accountId} />

      <ImportNotesDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        accountId={accountId}
        accountName={name}
        currentNotes={notes}
        onImportComplete={() => {
          // Re-fetch or manually update local state if needed
          // Since useDoc is used, it might auto-update if Firestore updates
        }}
      />
    </div>
  );
}
