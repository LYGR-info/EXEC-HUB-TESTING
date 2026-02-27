'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ActivityLogEvent, ActivityLogType } from '@/lib/data';
import { useFirestore, useUser, useCollection, useMemoFirebase, useStorage } from '@/firebase';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { collection, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, X, Pencil, Paperclip, FileText, Loader2, FileCheck, FileX } from 'lucide-react';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActivityLogProps {
    accountId: string;
}

import { useSearchParams } from 'next/navigation';

export default function ActivityLog({ accountId }: ActivityLogProps) {
    const { user } = useUser();
    const searchParams = useSearchParams();
    // ... (rest of imports/hooks)

    const firestore = useFirestore();
    const storage = useStorage();
    const [date, setDate] = useState<Date | undefined>(new Date());

    // Sync date from URL
    useEffect(() => {
        const dateParam = searchParams.get('date');
        if (dateParam) {
            const newDate = new Date(dateParam);
            // Adjust for timezone offset to ensure we get the correct local date if just YYYY-MM-DD is passed
            // Actually, new Date('2024-07-22') is UTC, so it might show previous day in local time.
            // Better to handle it carefully. 
            // If we assume the param is YYYY-MM-DD, we can append 'T12:00:00' to be safe or use date-fns parse.
            // For simplicity, let's just try standard parsing.
            if (!isNaN(newDate.getTime())) {
                // To avoid timezone issues with YYYY-MM-DD strings being parsed as UTC:
                // We can split and create date manually or just use the date object if it works for the user's locale.
                // Let's assume standard behavior is fine for now, or fix if user complains.
                // Actually, let's fix it by appending time to force local or just use the date parts.
                const [y, m, d] = dateParam.split('-').map(Number);
                if (y && m && d) {
                    setDate(new Date(y, m - 1, d));
                } else {
                    setDate(newDate);
                }
            }
        }
    }, [searchParams]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Form state
    const [eventType, setEventType] = useState<ActivityLogType>('Meeting (online)');
    const [description, setDescription] = useState('');
    const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
    const [rating, setRating] = useState<number>(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const activityLogsRef = useMemoFirebase(() => {
        if (!user || !firestore || !accountId) return null;
        return collection(firestore, `accounts/${accountId}/activityLogs`);
    }, [user, firestore, accountId]);

    const activityLogsQuery = useMemoFirebase(() => {
        if (!activityLogsRef) return null;
        return query(activityLogsRef, orderBy('date', 'desc'));
    }, [activityLogsRef]);

    const { data: events } = useCollection<ActivityLogEvent>(activityLogsQuery);

    // Fetch contacts for this account
    const contactsRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, `contacts`);
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

    const [, setLastActivityAccountId] = useLocalStorage('last-activity-account-id', '');

    const handleSaveEvent = async () => {
        if (!activityLogsRef || !selectedDate || !user) return;

        setIsUploading(true);
        try {
            let attachmentUrl = undefined;
            let attachmentName = undefined;

            if (selectedFile && storage) {
                const storageRef = ref(storage, `accounts/${accountId}/attachments/${Date.now()}_${selectedFile.name}`);
                const snapshot = await uploadBytes(storageRef, selectedFile);
                attachmentUrl = await getDownloadURL(snapshot.ref);
                attachmentName = selectedFile.name;
            }

            const eventData: any = {
                type: eventType,
                description,
                contactIds: selectedContactIds,
                rating,
                creatorId: user.uid,
                creatorName: user.displayName || user.email || 'Unknown User',
            };

            if (attachmentUrl) {
                eventData.attachmentUrl = attachmentUrl;
                eventData.attachmentName = attachmentName;
            }

            if (editingEventId) {
                // Don't overwrite creator info on edit unless missing
                await updateDoc(doc(activityLogsRef, editingEventId), {
                    ...eventData,
                    date: Timestamp.fromDate(selectedDate),
                });
            } else {
                await addDoc(activityLogsRef, {
                    accountId,
                    date: Timestamp.fromDate(selectedDate),
                    ...eventData,
                    createdAt: serverTimestamp(),
                });
            }

            setLastActivityAccountId(accountId);
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error saving activity log:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setDescription('');
        setEventType('Meeting (online)');
        setSelectedContactIds([]);
        setRating(0);
        setEditingEventId(null);
        setSelectedFile(null);
    };

    const handleEditEvent = (event: ActivityLogEvent) => {
        setEditingEventId(event.id);
        setEventType(event.type);
        setDescription(event.description || '');
        setSelectedContactIds(event.contactIds || []);
        setRating(event.rating || 0);
        setSelectedDate(event.date?.toDate() || new Date());
        setSelectedFile(null); // Reset file input, user can upload new one to replace/add
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

    const lastActivity = events && events.length > 0 ? events[0] : null;

    const getActivityColorClass = () => {
        if (!lastActivity || !lastActivity.date) return 'text-muted-foreground';
        const daysSince = Math.floor((new Date().getTime() - lastActivity.date.toDate().getTime()) / (1000 * 3600 * 24));
        if (daysSince > 10) return 'text-red-600';
        if (daysSince > 5) return 'text-yellow-600';
        return 'text-foreground font-bold';
    };

    const activityColorClass = getActivityColorClass();

    const getRatingBadgeStyles = (rating: number) => {
        if (rating === 5) return "text-muted-foreground border-border bg-secondary/50";

        if (rating < 5) {
            // Red gradient for 0-4
            if (rating === 4) return "text-red-500 border-red-200 bg-red-50";
            if (rating === 3) return "text-red-600 border-red-300 bg-red-50";
            if (rating === 2) return "text-red-700 border-red-400 bg-red-100";
            if (rating === 1) return "text-red-800 border-red-500 bg-red-100";
            return "text-red-900 border-red-600 bg-red-200"; // 0
        } else {
            // Green gradient for 6-10
            if (rating === 6) return "text-green-500 border-green-200 bg-green-50";
            if (rating === 7) return "text-green-600 border-green-300 bg-green-50";
            if (rating === 8) return "text-green-700 border-green-400 bg-green-100";
            if (rating === 9) return "text-green-800 border-green-500 bg-green-100";
            return "text-green-900 border-green-600 bg-green-200"; // 10
        }
    };

    return (
        <div id="activity-log" className="grid md:grid-cols-2 gap-6">
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
                <CardContent className="flex flex-wrap gap-8">
                    <div className="flex-none">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            required
                            className="rounded-md border shadow w-fit"
                            disabled={{ after: new Date() }}
                            modifiers={{
                                hasEvent: eventDates
                            }}
                            modifiersStyles={{
                                hasEvent: { fontWeight: 'bold', textDecoration: 'underline', color: 'var(--primary)' }
                            }}
                        />
                    </div>
                    <div className="flex-1 min-w-[250px] space-y-4">
                        <h3 className="font-semibold text-lg">
                            {date ? format(date, 'MMMM d, yyyy') : 'Select a past date'}
                        </h3>
                        {selectedDateEvents.length > 0 ? (
                            <div className="space-y-4">
                                {selectedDateEvents.map(event => (
                                    <div key={event.id} className="border p-3 rounded-md space-y-1">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-medium text-sm bg-secondary px-2 py-0.5 rounded">
                                                    {event.type}
                                                </span>
                                                {event.rating !== undefined && (
                                                    <span className={`text-xs font-semibold border px-1.5 py-0.5 rounded-full ${getRatingBadgeStyles(event.rating)}`}>
                                                        Rating: {event.rating}/10
                                                    </span>
                                                )}
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className={`text-xs font-semibold border px-1.5 py-0.5 rounded-full flex items-center gap-1 cursor-help ${event.attachmentUrl ? 'text-green-600 border-green-200 bg-green-50' : 'text-muted-foreground border-muted bg-muted/30'}`}>
                                                                {event.attachmentUrl ? (
                                                                    <>
                                                                        <FileCheck className="h-3 w-3" />
                                                                        Transcript attached
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <FileX className="h-3 w-3" />
                                                                        No transcript
                                                                    </>
                                                                )}
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{event.attachmentUrl ? "Transcript attached" : "No transcript"}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
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

                                        {event.attachmentUrl && (
                                            <div className="mt-2">
                                                <a
                                                    href={event.attachmentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline border px-2 py-1 rounded bg-primary/5"
                                                >
                                                    <Paperclip className="h-3 w-3" />
                                                    {event.attachmentName || 'Attachment'}
                                                </a>
                                            </div>
                                        )}
                                        {event.contactIds && event.contactIds.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {event.creatorName && (
                                                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                                                        Created by: {event.creatorName}
                                                    </span>
                                                )}
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
                                        {
                                            (!event.contactIds || event.contactIds.length === 0) && event.creatorName && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                                                        Created by: {event.creatorName}
                                                    </span>
                                                </div>
                                            )
                                        }
                                    </div >
                                ))
                                }
                            </div >
                        ) : (
                            <p className="text-muted-foreground text-sm">No past activities recorded for this date.</p>
                        )}

                        {
                            date && (
                                <Button variant="outline" size="sm" onClick={() => {
                                    setSelectedDate(date);
                                    resetForm();
                                    setIsDialogOpen(true);
                                }}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Log Past Activity
                                </Button>
                            )
                        }
                    </div >
                </CardContent >

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    if (!isUploading) {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }
                }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingEventId ? 'Edit Past Activity' : 'Log Past Activity'}</DialogTitle>
                            <DialogDescription>
                                {editingEventId ? 'Update details for this past interaction.' : `Log a past interaction for ${selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}.`}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Activity Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !selectedDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate || undefined}
                                            onSelect={(d) => d && setSelectedDate(d)}
                                            initialFocus
                                            disabled={{ after: new Date() }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
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
                                <Label htmlFor="rating">Rating</Label>
                                <Select value={rating.toString()} onValueChange={(val) => setRating(Number(val))}>
                                    <SelectTrigger id="rating">
                                        <SelectValue placeholder="Select rating" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">0 - Relationship ending</SelectItem>
                                        <SelectItem value="1">1 - Disastrous</SelectItem>
                                        <SelectItem value="2">2 - Deleterious</SelectItem>
                                        <SelectItem value="3">3 - Detrimental</SelectItem>
                                        <SelectItem value="4">4 - Minor setback</SelectItem>
                                        <SelectItem value="5">5 - Neutral</SelectItem>
                                        <SelectItem value="6">6 - Small step</SelectItem>
                                        <SelectItem value="7">7 - Big leap</SelectItem>
                                        <SelectItem value="8">8 - Great success</SelectItem>
                                        <SelectItem value="9">9 - Breakthrough</SelectItem>
                                        <SelectItem value="10">10 - Closed/Near to closing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="attachment">Attachment (Optional)</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="attachment"
                                        type="file"
                                        className="cursor-pointer"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setSelectedFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Upload call transcripts or notes.</p>
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
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isUploading}>Cancel</Button>
                            <Button onClick={handleSaveEvent} disabled={isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingEventId ? 'Update Event' : 'Save Event'}
                            </Button>
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

            <Card className="h-full">
                <CardHeader>
                    <CardTitle className={`uppercase text-sm tracking-wide font-semibold ${activityColorClass}`}>Last Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    {lastActivity ? (
                        <div className="space-y-4">
                            <div>
                                <h4 className={`text-lg font-semibold ${activityColorClass}`}>
                                    {lastActivity.date ? format(lastActivity.date.toDate(), 'MMMM d') : 'Unknown Date'}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {lastActivity.description || 'No description provided.'}
                                </p>
                            </div>

                            {lastActivity.attachmentUrl && (
                                <div className="mt-1">
                                    <a
                                        href={lastActivity.attachmentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline border px-2 py-1 rounded bg-primary/5"
                                    >
                                        <Paperclip className="h-3 w-3" />
                                        {lastActivity.attachmentName || 'Attachment'}
                                    </a>
                                </div>
                            )}

                            {lastActivity.contactIds && lastActivity.contactIds.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Participants</p>
                                    <div className="flex flex-wrap gap-1">
                                        {lastActivity.contactIds.map(cid => {
                                            const contact = accountContacts.find(c => c.id === cid);
                                            return contact ? (
                                                <span key={cid} className="text-sm text-foreground">
                                                    {contact.firstName} {contact.lastName}
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                    {lastActivity.type}
                                </span>
                                {lastActivity.rating !== undefined && (
                                    <span className={`text-xs font-semibold border px-1.5 py-0.5 rounded-full ${getRatingBadgeStyles(lastActivity.rating)}`}>
                                        Rating: {lastActivity.rating}/10
                                    </span>
                                )}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className={`text-xs font-semibold border px-1.5 py-0.5 rounded-full flex items-center gap-1 cursor-help ${lastActivity.attachmentUrl ? 'text-green-600 border-green-200 bg-green-50' : 'text-muted-foreground border-muted bg-muted/30'}`}>
                                                {lastActivity.attachmentUrl ? (
                                                    <>
                                                        <FileCheck className="h-3 w-3" />
                                                        Transcript attached
                                                    </>
                                                ) : (
                                                    <>
                                                        <FileX className="h-3 w-3" />
                                                        No transcript
                                                    </>
                                                )}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{lastActivity.attachmentUrl ? "Transcript attached" : "No transcript"}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No activity recorded yet.</p>
                    )}
                </CardContent>
            </Card>
        </div >
    );
}
