
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
import type { Contact } from '@/lib/data';
import { collection, query, where, limit } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

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

export default function KeyContactsCard({ accountId }: { accountId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const contactsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !accountId) return null;
    return query(
      collection(firestore, `users/${user.uid}/contacts`),
      where('accountId', '==', accountId),
      limit(4)
    );
  }, [user, firestore, accountId]);

  const { data: contacts, isLoading } = useCollection<Contact>(contactsQuery);

  return (
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
                <li key={contact.id} className="flex items-center gap-4">
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
  );
}
