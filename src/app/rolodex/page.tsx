
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MoreHorizontal, PlusCircle, Upload } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import PageHeader from '@/components/page-header';
import type { Contact, Account } from '@/lib/data';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const getImageById = (id: string) =>
  PlaceHolderImages.find(img => img.id === id);

function RolodexSkeleton() {
  return (
    <TableRow>
      <TableCell className="hidden sm:table-cell">
        <Skeleton className="h-10 w-10 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-24" />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Skeleton className="h-4 w-40" />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-8" />
      </TableCell>
    </TableRow>
  );
}

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  address: z.string().min(1, 'Address is required'),
  notes: z.string().optional(),
  accountId: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const defaultFormValues: ContactFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  title: '',
  company: '',
  address: '',
  notes: '',
  accountId: 'none',
};

export default function RolodexPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: defaultFormValues,
  });

  const contactsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `contacts`);
  }, [user, firestore]);

  const { data: contacts, isLoading: isLoadingContacts } =
    useCollection<Contact>(contactsCollection);

  const accountsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `accounts`);
  }, [user, firestore]);

  const { data: accounts, isLoading: isLoadingAccounts } =
    useCollection<Account>(accountsCollection);


  useEffect(() => {
    if (isDialogOpen) {
      if (editingContact) {
        form.reset({
          ...editingContact,
          accountId: editingContact.accountId || 'none',
        });
      } else {
        form.reset(defaultFormValues);
      }
    }
  }, [isDialogOpen, editingContact, form]);

  const handleAddNew = () => {
    setEditingContact(null);
    form.reset(defaultFormValues);
    setIsDialogOpen(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setIsDialogOpen(true);
  };

  const handleDelete = async (contactId: string) => {
    if (!firestore || !user) return;
    const contactRef = doc(firestore, `contacts/${contactId}`);
    try {
      await deleteDoc(contactRef);
      toast({ title: 'Contact deleted successfully' });
    } catch (error: any) {
      console.error("Error deleting document: ", error);
      toast({
        title: 'Error deleting contact',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
    setContactToDelete(null);
  };

  const onSubmit = async (data: ContactFormValues) => {
    if (!contactsCollection || !firestore || !user) return;

    try {
      let finalAccountId = data.accountId === 'none' ? '' : data.accountId;

      // Handle "Add new account" selection
      if (finalAccountId === 'new-account') {
        const newAccountData = {
          name: data.company || 'New Account',
          industry: '',
          status: 'Potential',
          logoId: `logo-${Math.floor(Math.random() * 6) + 1}`,
          opportunityType: 'Other',
          revenueStreams: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (accountsCollection) {
          const newAccountRef = await addDoc(accountsCollection, newAccountData);
          finalAccountId = newAccountRef.id;
          toast({ title: 'New account created' });
        }
      }

      const payload = {
        ...data,
        accountId: finalAccountId,
      };

      if (editingContact) {
        const contactRef = doc(
          firestore,
          `contacts/${editingContact.id}`
        );
        await updateDoc(contactRef, {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        toast({ title: 'Contact updated successfully' });
      } else {
        const newContact = {
          ...payload,
          avatarId: `avatar-${Math.floor(Math.random() * 5) + 1}`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: user.uid,
          creatorName: user.displayName || user.email || 'Unknown',
        };
        await addDoc(contactsCollection, newContact);
        toast({ title: 'Contact added successfully' });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving contact: ', error);
      toast({
        title: 'Error saving contact',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.replace(/^\uFEFF/, '').split('\n');

    const parseLine = (line: string) => {
      const values: string[] = [];
      let currentValue = '';
      let insideQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim().replace(/^"|"$/g, ''));
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim().replace(/^"|"$/g, ''));
      return values;
    };

    const headers = parseLine(lines[0]);

    return lines.slice(1).filter(line => line.trim()).map(line => {
      const values = parseLine(line);
      const contact: any = {};

      headers.forEach((header, index) => {
        if (values[index]) {
          // Map common CSV headers to our schema
          const key = header.toLowerCase();

          // Flexible mappings for various CSV formats (Google, Outlook, etc.)
          if (!contact.firstName && (key === 'first name' || key === 'firstname' || key === 'given name')) contact.firstName = values[index];
          else if (!contact.lastName && (key === 'last name' || key === 'lastname' || key === 'family name')) contact.lastName = values[index];
          else if (!contact.email && (key === 'email' || key === 'e-mail' || (key.includes('e-mail') && key.includes('value')) || key === 'e-mail address')) contact.email = values[index];
          else if (!contact.phone && (key === 'phone' || (key.includes('phone') && !key.includes('type')))) contact.phone = values[index];
          else if (!contact.title && (key === 'title' || key.includes('organization') && key.includes('title') || key === 'job title')) contact.title = values[index];
          else if (!contact.company && (key === 'company' || key.includes('organization') && key.includes('name') || key === 'company name')) contact.company = values[index];
          else if (!contact.address && (key === 'address' || (key.includes('address') && key.includes('formatted')) || key === 'business address')) contact.address = values[index];
          else if (!contact.notes && (key === 'notes' || key === 'description')) contact.notes = values[index];
        }
      });
      return contact;
    });
  };

  const [lastImportBatchId, setLastImportBatchId] = useState<string | null>(null);

  const handleUndoImport = async () => {
    if (!lastImportBatchId || !contactsCollection) return;

    try {
      // Query for contacts with this batch ID
      // Note: In a real app, we'd want an index on importBatchId. 
      // For now, client-side filtering or simple query if index exists.
      // Since we don't have an index setup guarantee, we'll filter client-side from the 'contacts' array if available,
      // or we can try to delete one by one.

      // Let's assume we can filter from the loaded contacts for simplicity and speed in this context
      const contactsToDelete = contacts?.filter(c => c.importBatchId === lastImportBatchId) || [];

      if (contactsToDelete.length === 0) {
        toast({ title: 'No contacts found to undo.' });
        return;
      }

      let deletedCount = 0;
      for (const contact of contactsToDelete) {
        await deleteDoc(doc(firestore, `contacts/${contact.id}`));
        deletedCount++;
      }

      toast({ title: `Undid import. Deleted ${deletedCount} contacts.` });
      setLastImportBatchId(null);
    } catch (error) {
      console.error("Error undoing import:", error);
      toast({
        title: 'Error undoing import',
        variant: 'destructive'
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      try {
        const parsedContacts = parseCSV(text);

        if (parsedContacts.length === 0) {
          toast({
            title: 'No contacts found',
            description: 'Please check your CSV file format.',
            variant: 'destructive',
          });
          return;
        }

        const batchId = `batch-${Date.now()}`;
        let addedCount = 0;
        for (const contactData of parsedContacts) {
          // Basic validation
          if (!contactData.firstName || !contactData.lastName) continue;

          const newContact = {
            firstName: contactData.firstName || '',
            lastName: contactData.lastName || '',
            email: contactData.email || '',
            phone: contactData.phone || '',
            title: contactData.title || '',
            company: contactData.company || '',
            address: contactData.address || '',
            notes: contactData.notes || '',
            accountId: '',
            avatarId: `avatar-${Math.floor(Math.random() * 5) + 1}`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: user?.uid || '',
            creatorName: user?.displayName || user?.email || 'Unknown',
            importBatchId: batchId,
          };

          if (contactsCollection) {
            await addDoc(contactsCollection, newContact);
            addedCount++;
          }
        }

        toast({
          title: 'Import successful',
          description: `Imported ${addedCount} contacts successfully.`
        });

        setLastImportBatchId(batchId);

        // Reset input
        event.target.value = '';
      } catch (error) {
        console.error('Error parsing CSV:', error);
        toast({
          title: 'Import failed',
          description: 'Failed to parse CSV file.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rolodex"
        description="Manage your professional contacts."
      >
        <div className="flex gap-2">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            id="csv-upload"
            onChange={handleFileUpload}
          />
          <Button variant="secondary" onClick={() => document.getElementById('csv-upload')?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          {lastImportBatchId && (
            <Button variant="destructive" onClick={handleUndoImport}>
              Undo Last Import
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingContact ? 'Edit Contact' : 'Add New Contact'}
                </DialogTitle>
                <DialogDescription>
                  Fill in the details for the contact.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="john.doe@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(123) 456-7890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Main St, Anytown, USA"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="CEO" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Inc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || 'none'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Assign to an account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new-account" className="font-semibold text-primary">
                              + Add new account
                            </SelectItem>
                            {isLoadingAccounts ? (
                              <SelectItem value="loading" disabled>
                                Loading accounts...
                              </SelectItem>
                            ) : (
                              <>
                                <SelectItem value="none">No Account</SelectItem>
                                {accounts?.map(account => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.name}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter any relevant notes..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Save Contact</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div >
      </PageHeader >
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>
            A list of your key clients and partners.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Company</TableHead>
                <TableHead className="hidden md:table-cell">Account</TableHead>
                <TableHead className="hidden md:table-cell">Created By</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingContacts && (
                <>
                  <RolodexSkeleton />
                  <RolodexSkeleton />
                  <RolodexSkeleton />
                </>
              )}
              {contacts?.map(contact => {
                const avatar = getImageById(contact.avatarId);
                const name = `${contact.firstName} ${contact.lastName}`;
                const account = accounts?.find(acc => acc.id === contact.accountId);

                return (
                  <TableRow key={contact.id}>
                    <TableCell className="hidden sm:table-cell">
                      {avatar && (
                        <Image
                          alt={name}
                          className="aspect-square rounded-full object-cover"
                          height="40"
                          src={avatar.imageUrl}
                          data-ai-hint={avatar.imageHint}
                          width="40"
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{contact.title}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {contact.company}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {account ? (
                        <Link href={`/accounts/${account.id}`} className="hover:underline text-primary">
                          {account.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {contact.creatorName && (
                        <Badge variant="secondary" className="font-normal">
                          {contact.creatorName}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleEdit(contact)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setContactToDelete(contact)}
                            className="text-red-600 focus:text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {contacts && contacts.length === 0 && !isLoadingContacts && (
            <div className="py-10 text-center text-muted-foreground">
              No contacts found. Add your first one!
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!contactToDelete} onOpenChange={(open) => !open && setContactToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the contact
              &quot;{contactToDelete?.firstName} {contactToDelete?.lastName}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(contactToDelete!.id)}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div >
  );
}