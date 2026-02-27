
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowUpRight, BookUser } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';

import { collection, query, where, limit } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ActivityLogEvent, Contact } from '@/lib/data';
import { format } from 'date-fns';
import { useState } from 'react';
import { orderBy } from 'firebase/firestore';

const getImageById = (id: string) =>
  PlaceHolderImages.find(img => img.id === id);

function KeyContactsSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className='space-y-2'>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

import { useRouter } from 'next/navigation';

function ContactActivityHistory({ accountId, contactId, onClose }: { accountId: string | undefined, contactId: string, onClose: () => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const activityQuery = useMemoFirebase(() => {
    if (!user || !firestore || !accountId || !contactId) return null;
    return query(
      collection(firestore, `accounts/${accountId}/activityLogs`),
      where('contactIds', 'array-contains', contactId)
    );
  }, [user, firestore, accountId, contactId]);

  const { data: rawActivities, isLoading } = useCollection<ActivityLogEvent>(activityQuery);

  const activities = rawActivities
    ? [...rawActivities]
      .sort((a, b) => (b.date?.toMillis() || 0) - (a.date?.toMillis() || 0))
      .slice(0, 5)
    : [];

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Loading history...</div>;
  }

  if (!activities || activities.length === 0) {
    return <div className="p-4 text-center text-sm text-muted-foreground">No recent activity found for this contact.</div>;
  }

  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <div
          key={activity.id}
          className="border rounded-md p-3 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => {
            if (activity.date) {
              const dateStr = format(activity.date.toDate(), 'yyyy-MM-dd');
              router.push(`?date=${dateStr}#activity-log`);
              onClose();
            }
          }}
        >
          <div className="flex justify-between items-start mb-1">
            <span className="font-semibold">{activity.type}</span>
            <span className="text-xs text-muted-foreground">
              {activity.date ? format(activity.date.toDate(), 'MMM d, yyyy') : 'Unknown date'}
            </span>
          </div>
          <p className="text-muted-foreground line-clamp-2">{activity.description}</p>
        </div>
      ))}
    </div>
  );
}

export default function KeyContactsCard({ accountId }: { accountId?: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const contactsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    if (accountId) {
      return query(
        collection(firestore, `contacts`),
        where('accountId', '==', accountId),
        limit(4)
      );
    }
    return query(
      collection(firestore, `contacts`),
      limit(4)
    );
  }, [user, firestore, accountId]);

  const { data: contacts, isLoading } = useCollection<Contact>(contactsQuery);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookUser className="w-6 h-6" />
            Key Contacts
          </CardTitle>
          <CardDescription>Contacts associated with this account.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <ul className="space-y-4">
              <KeyContactsSkeleton />
              <KeyContactsSkeleton />
            </ul>
          )}
          {contacts && contacts.length > 0 && (
            <ul className="space-y-4">
              {contacts.map(contact => {
                const avatar = getImageById(contact.avatarId);
                const name = `${contact.firstName} ${contact.lastName}`;
                return (
                  <li key={contact.id}>
                    <button
                      onClick={() => setSelectedContact(contact)}
                      className="flex items-center gap-4 w-full text-left hover:bg-muted/50 p-2 rounded-md transition-colors"
                    >
                      <Avatar className="h-10 w-10 border">
                        {avatar && (
                          <Image
                            src={avatar.imageUrl}
                            alt={contact.lastName}
                            data-ai-hint={avatar.imageHint}
                            width={40}
                            height={40}
                          />
                        )}
                        <AvatarFallback>{contact.firstName?.charAt(0)}{contact.lastName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{name}</p>
                        <p className="text-sm text-muted-foreground">
                          {contact.title}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {contacts && contacts.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">No contacts are linked to this account yet.</p>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/rolodex">
              Go to Rolodex <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedContact ? `${selectedContact.firstName} ${selectedContact.lastName}` : 'Contact Details'}
            </DialogTitle>
            <DialogDescription>
              Recent activity involving this contact.
            </DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <ContactActivityHistory
              accountId={accountId}
              contactId={selectedContact.id}
              onClose={() => setSelectedContact(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
