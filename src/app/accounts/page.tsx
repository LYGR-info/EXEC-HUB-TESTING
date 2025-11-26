'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type Account, AccountStatus } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import PageHeader from '@/components/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<AccountStatus, string> = {
  Ongoing:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  Established:
    'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  Potential:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  Lost: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const getImageById = (id: string) =>
  PlaceHolderImages.find(img => img.id === id);

export default function AccountsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountIndustry, setNewAccountIndustry] = useState('');

  const accountsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/accounts`);
  }, [user, firestore]);

  const { data: accounts, isLoading } = useCollection<Account>(accountsCollection);

  const handleStatusChange = async (accountId: string, newStatus: AccountStatus) => {
    if (!firestore || !user) return;
    const accountRef = doc(firestore, `users/${user.uid}/accounts/${accountId}`);
    try {
      await updateDoc(accountRef, { status: newStatus });
      toast({ title: 'Status updated' });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: 'Error updating status', variant: 'destructive' });
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountsCollection || !user) return;

    try {
      const newAccount: Partial<Account> = {
        name: newAccountName,
        industry: newAccountIndustry,
        status: 'Potential',
        logoId: `logo-${Math.floor(Math.random() * 6) + 1}`,
        opportunityType: 'Other',
        revenueStreams: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(accountsCollection, newAccount);
      toast({ title: 'Account created successfully' });
      setIsDialogOpen(false);
      setNewAccountName('');
      setNewAccountIndustry('');
    } catch (error) {
      console.error("Error creating account:", error);
      toast({ title: 'Error creating account', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        description="Manage your client accounts and pipeline."
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add New Account
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
              <DialogDescription>
                Create a new client account to track in your pipeline.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAccount}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="industry" className="text-right">
                    Industry
                  </Label>
                  <Input
                    id="industry"
                    value={newAccountIndustry}
                    onChange={(e) => setNewAccountIndustry(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Account</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Client Accounts</CardTitle>
          <CardDescription>
            A list of all active and potential accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[64px] sm:table-cell">
                  <span className="sr-only">Logo</span>
                </TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts?.map(account => {
                const logo = getImageById(account.logoId);
                return (
                  <TableRow key={account.id} className="group">
                    <TableCell className="hidden sm:table-cell">
                      {logo && (
                        <div className="flex items-center justify-center bg-muted rounded-md w-12 h-12">
                          <Image
                            alt={`${account.name} logo`}
                            className="aspect-square object-contain rounded-md p-1"
                            height="32"
                            src={logo.imageUrl}
                            data-ai-hint={logo.imageHint}
                            width="32"
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/accounts/${account.id}`} className="hover:underline">
                        {account.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {account.industry}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={account.status}
                        onValueChange={(newStatus: AccountStatus) => handleStatusChange(account.id, newStatus)}
                      >
                        <SelectTrigger
                          className={`w-32 border-none focus:ring-0 ${statusColors[account.status]}`}
                        >
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ongoing">Ongoing</SelectItem>
                          <SelectItem value="Established">Established</SelectItem>
                          <SelectItem value="Potential">Potential</SelectItem>
                          <SelectItem value="Lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/accounts/${account.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {accounts?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No accounts found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
