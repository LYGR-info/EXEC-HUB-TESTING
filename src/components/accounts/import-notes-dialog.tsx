'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    Timestamp,
    getDoc
} from 'firebase/firestore';
import { fetchSpreadsheetData, extractSpreadsheetId } from '@/lib/google-sheets';
import { Loader2, Table } from 'lucide-react';

interface ImportNotesDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    accountId: string;
    accountName: string;
    currentNotes: string;
    onImportComplete: () => void;
}

export default function ImportNotesDialog({
    isOpen,
    onOpenChange,
    accountId,
    accountName,
    currentNotes,
    onImportComplete,
}: ImportNotesDialogProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [sheetInput, setSheetInput] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    const handleImport = async () => {
        if (!user || !firestore || !sheetInput) return;

        const token = localStorage.getItem('google_access_token');
        if (!token) {
            toast({
                title: 'Authentication Required',
                description: 'Please sign out and sign in with Google to enable Sheets access.',
                variant: 'destructive',
            });
            return;
        }

        const sheetId = extractSpreadsheetId(sheetInput);
        setIsImporting(true);

        try {
            // Assuming headers are in the first row, data starts from row 2
            const data = await fetchSpreadsheetData(token, sheetId, 'Sheet1!A2:F');

            let importedTasks = 0;
            let importedActivities = 0;
            let newNotes = currentNotes;

            for (const row of data) {
                const [type, dateStr, content, rating, activityType, taskDueDate] = row;

                if (!type || !content) continue;

                const date = dateStr ? new Date(dateStr) : new Date();
                const timestamp = Timestamp.fromDate(date);

                if (type.toLowerCase() === 'task') {
                    const tasksCollection = collection(firestore, `tasks`);
                    await addDoc(tasksCollection, {
                        title: content,
                        completed: false,
                        accountId,
                        dueDate: taskDueDate ? Timestamp.fromDate(new Date(taskDueDate)) : null,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    });
                    importedTasks++;
                } else if (type.toLowerCase() === 'activity') {
                    const activityLogsCollection = collection(
                        firestore,
                        `accounts/${accountId}/activityLogs`
                    );
                    await addDoc(activityLogsCollection, {
                        type: activityType || 'Meeting (online)',
                        description: content,
                        date: timestamp,
                        rating: rating ? Number(rating) : null,
                        creatorId: user.uid,
                        creatorName: user.displayName || user.email || 'System',
                        createdAt: serverTimestamp(),
                    });
                    importedActivities++;
                } else if (type.toLowerCase() === 'note') {
                    const formattedDate = date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    });
                    const noteLine = `\n[Notes from ${formattedDate}]: ${content}`;
                    newNotes = newNotes ? `${newNotes}\n${noteLine}` : noteLine;
                }
            }

            // Update account notes if changed
            if (newNotes !== currentNotes) {
                const accountRef = doc(firestore, `accounts/${accountId}`);
                await updateDoc(accountRef, {
                    notes: newNotes,
                    updatedAt: serverTimestamp(),
                });
            }

            toast({
                title: 'Import Successful',
                description: `Imported ${importedTasks} tasks and ${importedActivities} activities. Notes updated.`,
            });

            onImportComplete();
            onOpenChange(false);
            setSheetInput('');
        } catch (error: any) {
            console.error('Import error:', error);
            toast({
                title: 'Import Failed',
                description: error.message || 'An unexpected error occurred during import.',
                variant: 'destructive',
            });
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Import from Google Sheets</DialogTitle>
                    <DialogDescription>
                        Enter the Google Sheet ID or URL containing meeting notes for <strong>{accountName}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="sheetId">Google Sheet ID or URL</Label>
                        <Input
                            id="sheetId"
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            value={sheetInput}
                            onChange={(e) => setSheetInput(e.target.value)}
                            disabled={isImporting}
                        />
                    </div>
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                        <p className="font-semibold mb-1 flex items-center gap-2">
                            <Table className="h-4 w-4" /> Expected Columns (Sheet1):
                        </p>
                        <ul className="list-disc list-inside text-xs space-y-1">
                            <li>Type (Task, Note, Activity)</li>
                            <li>Date (YYYY-MM-DD)</li>
                            <li>Content</li>
                            <li>Rating (0-10, Activities only)</li>
                            <li>Activity Type (Activities only)</li>
                            <li>Task Due Date (Tasks only)</li>
                        </ul>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
                        Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={isImporting || !sheetInput}>
                        {isImporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            'Start Import'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
