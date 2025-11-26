'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ActivityLogEvent, ActivityLogType } from '@/lib/data';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, X, Pencil } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ActivityLogProps {
    accountId: string;
}

export default function ActivityLog({ accountId }: ActivityLogProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Form state
    const [eventType, setEventType] = useState<ActivityLogType>('Meeting (online)');
    const [description, setDescription] = useState('');
    const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

    const activityLogsRef = useMemoFirebase(() => {
        if (!user || !firestore || !accountId) return null;
        return collection(firestore, `users/${user.uid}/accounts/${accountId}/activityLogs`);
    }, [user, firestore, accountId]);

    const activityLogsQuery = useMemoFirebase(() => {
        if (!activityLogsRef) return null;
        return query(activityLogsRef, orderBy('date', 'desc'));
    }, [activityLogsRef]);

    const { data: events } = useCollection<ActivityLogEvent>(activityLogsQuery);

    // Fetch contacts for this account
    const contactsRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, `users/${user.uid}/contacts`);
    }, [user, firestore]);

    // In a real app with many contacts, we'd query by accountId. 
    // For now, we'll filter client-side or assume the list is manageable.
    // Ideally: query(contactsRef, where('accountId', '==', accountId))
    // But we need to make sure 'accountId' is indexed or use client-side filtering if small.
    // Let's filter client-side from the full contacts list for simplicity if we don't have a composite index.
    const { data: allContacts } = useCollection<any>(contactsRef); // Using 'any' to avoid circular dep or re-import issues, but ideally 'Contact'

    const accountContacts = useMemo(() => {
        return allContacts?.filter((c: any) => c.accountId === accountId) || [];
    }, [allContacts, accountId]);

    const [searchTerm, setSearchTerm] = useState('');
    const filteredContacts = useMemo(() => {
        return accountContacts.filter((contact: any) =>
            contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.lastName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [accountContacts, searchTerm]);

    // Map events to dates for calendar modifiers
    const eventDates = useMemo(() => {
        if (!events) return [];
        return events.map(event => event.date?.toDate());
    }, [events]);

    const handleDateSelect = (date: Date | undefined) => {
        setDate(date);
        if (date) {
            setSelectedDate(date);
        }
    };

    const [eventToDelete, setEventToDelete] = useState<string | null>(null);

    const [editingEventId, setEditingEventId] = useState<string | null>(null);

    const handleSaveEvent = async () => {
        if (!activityLogsRef || !selectedDate) return;

        try {
            if (editingEventId) {
                await updateDoc(doc(activityLogsRef, editingEventId), {
                    type: eventType,
                    description,
                    contactIds: selectedContactIds,
                    // Don't update date or createdAt for now, or allow date change if needed
                });
            } else {
                await addDoc(activityLogsRef, {
                    accountId,
                    date: Timestamp.fromDate(selectedDate),
                    type: eventType,
                    description,
                    contactIds: selectedContactIds,
                    createdAt: serverTimestamp(),
                });
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error saving activity log:", error);
        }
    };

    const resetForm = () => {
        setDescription('');
        setEventType('Meeting (online)');
        setSelectedContactIds([]);
        setEditingEventId(null);
    };

    const handleEditEvent = (event: ActivityLogEvent) => {
        setEditingEventId(event.id);
        setEventType(event.type);
        setDescription(event.description || '');
        setSelectedContactIds(event.contactIds || []);
        setSelectedDate(event.date?.toDate() || new Date());
        setIsDialogOpen(true);
    };

    const handleDeleteEvent = async () => {
        if (!activityLogsRef || !eventToDelete) return;

        try {
            await deleteDoc(doc(activityLogsRef, eventToDelete));
            setEventToDelete(null);
        } catch (error) {
            console.error("Error deleting activity log:", error);
        }
    };

    const getEventsForDate = (date: Date) => {
        if (!events) return [];
        return events.filter(event => {
            const eventDate = event.date?.toDate();
            return eventDate &&
                eventDate.getDate() === date.getDate() &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getFullYear() === date.getFullYear();
        });
    };

    const selectedDateEvents = date ? getEventsForDate(date) : [];

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Activity Log
                </CardTitle>
                <CardDescription>
                    Track meetings, calls, and emails. Click a date to add an event.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        className="rounded-md border shadow"
                        modifiers={{
                            hasEvent: eventDates
                        }}
                        modifiersStyles={{
                            hasEvent: { fontWeight: 'bold', textDecoration: 'underline', color: 'var(--primary)' }
                        }}
                    />
                </div>
                <div className="flex-1 space-y-4">
                    <h3 className="font-semibold text-lg">
                        {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
                    </h3>
                    {selectedDateEvents.length > 0 ? (
                        <div className="space-y-4">
                            {selectedDateEvents.map(event => (
                                <div key={event.id} className="border p-3 rounded-md space-y-1">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-sm bg-secondary px-2 py-0.5 rounded">
                                            {event.type}
                                        </span>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                                onClick={() => handleEditEvent(event)}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                onClick={() => setEventToDelete(event.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{event.description}</p>
                                    {event.contactIds && event.contactIds.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {event.contactIds.map(cid => {
                                                const contact = accountContacts.find(c => c.id === cid);
                                                return contact ? (
                                                    <span key={cid} className="text-xs bg-muted px-1.5 py-0.5 rounded border">
                                                        {contact.firstName} {contact.lastName}
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">No events for this date.</p>
                    )}

                    {date && (
                        <Button variant="outline" size="sm" onClick={() => {
                            setSelectedDate(date);
                            resetForm();
                            setIsDialogOpen(true);
                        }}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Event
                        </Button>
                    )}
                </div>
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingEventId ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
                        <DialogDescription>
                            {editingEventId ? 'Update details for this interaction.' : `Log an interaction for ${selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}.`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="type">Event Type</Label>
                            <Select value={eventType} onValueChange={(val: ActivityLogType) => setEventType(val)}>
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Meeting (online)">Meeting (online)</SelectItem>
                                    <SelectItem value="Meeting (in person)">Meeting (in person)</SelectItem>
                                    <SelectItem value="Email">Email</SelectItem>
                                    <SelectItem value="Phonecall">Phonecall</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Notes about the interaction..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Contacts (Optional)</Label>
                            {accountContacts.length > 0 ? (
                                <>
                                    <Input
                                        placeholder="Search contacts..."
                                        value={searchTerm}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                        className="mb-2"
                                    />
                                    <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-2">
                                        {filteredContacts.length > 0 ? (
                                            filteredContacts.map(contact => (
                                                <div key={contact.id} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`contact-${contact.id}`}
                                                        checked={selectedContactIds.includes(contact.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedContactIds([...selectedContactIds, contact.id]);
                                                            } else {
                                                                setSelectedContactIds(selectedContactIds.filter(id => id !== contact.id));
                                                            }
                                                        }}
                                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                    />
                                                    <label
                                                        htmlFor={`contact-${contact.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {contact.firstName} {contact.lastName}
                                                    </label>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground p-2">No contacts match your search.</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">No contacts associated with this account.</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveEvent}>{editingEventId ? 'Update Event' : 'Save Event'}</Button>
                    </DialogFooter>
                </DialogContent >
            </Dialog >

            <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this activity log.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card >
    );
}
