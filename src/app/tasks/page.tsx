
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import {
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import type { Account } from '@/lib/data';
import { accounts } from '@/lib/data';

import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, PlusCircle, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  accountId?: string;
  dueDate?: Timestamp;
  notes?: string;
}

function TaskSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 border-b">
      <Skeleton className="h-5 w-5 rounded-sm" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-8 w-8" />
    </div>
  );
}

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  accountId: z.string().optional(),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const defaultFormValues: TaskFormValues = {
  title: '',
  accountId: 'none',
  dueDate: undefined,
  notes: '',
};

export default function TasksPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const accountIdFilter = searchParams.get('accountId');

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaultFormValues,
  });

  const tasksCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const baseCollection = collection(firestore, `users/${user.uid}/tasks`);
    if (accountIdFilter && accountIdFilter !== 'all') {
      return query(baseCollection, where('accountId', '==', accountIdFilter));
    }
    return baseCollection;
  }, [user, firestore, accountIdFilter]);

  const { data: tasks, isLoading: isLoadingTasks } = useCollection<Task>(tasksCollection);

  // Using static accounts for now, as in rolodex
  const isLoadingAccounts = false; 

  useEffect(() => {
    if (isDialogOpen) {
      if (editingTask) {
        form.reset({
          title: editingTask.title,
          accountId: editingTask.accountId || 'none',
          dueDate: editingTask.dueDate ? editingTask.dueDate.toDate() : undefined,
          notes: editingTask.notes || '',
        });
      } else {
        form.reset({
          ...defaultFormValues,
          accountId: (accountIdFilter !== 'all' ? accountIdFilter : 'none') || 'none',
        });
      }
    }
  }, [isDialogOpen, editingTask, form, accountIdFilter]);

  const handleAddNew = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleDelete = async (taskId: string) => {
    if (!firestore || !user) return;
    const taskRef = doc(firestore, `users/${user.uid}/tasks/${taskId}`);
    try {
      await deleteDoc(taskRef);
      toast({ title: 'Task deleted successfully' });
    } catch (error: any) {
      console.error("Error deleting document: ", error);
      toast({
        title: 'Error deleting task',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
    setTaskToDelete(null);
  };
  
  const handleToggleComplete = async (task: Task) => {
    if(!firestore || !user) return;
    const taskRef = doc(firestore, `users/${user.uid}/tasks/${task.id}`);
    try {
        await updateDoc(taskRef, { completed: !task.completed, updatedAt: serverTimestamp() });
    } catch(error: any) {
        console.error('Error updating task status', error);
        toast({ title: 'Error updating task', description: 'Could not update task status.', variant: 'destructive' });
    }
  }

  const onSubmit = async (data: TaskFormValues) => {
    if (!firestore || !user) return;
    const collectionRef = collection(firestore, `users/${user.uid}/tasks`);

    try {
      const payload: Partial<Omit<Task, 'id'>> & { title: string, updatedAt: any, dueDate?: Timestamp | undefined } = {
        title: data.title,
        accountId: data.accountId === 'none' ? '' : data.accountId,
        notes: data.notes,
        updatedAt: serverTimestamp(),
      };
      if (data.dueDate) {
        payload.dueDate = Timestamp.fromDate(data.dueDate);
      } else {
        payload.dueDate = undefined;
      }


      if (editingTask) {
        const taskRef = doc(firestore, `users/${user.uid}/tasks/${editingTask.id}`);
        await updateDoc(taskRef, payload);
        toast({ title: 'Task updated successfully' });
      } else {
        const newTask = {
          ...payload,
          completed: false,
          createdAt: serverTimestamp(),
        };
        await addDoc(collectionRef, newTask as any);
        toast({ title: 'Task added successfully' });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving task: ', error);
      toast({
        title: 'Error saving task',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAccountFilterChange = (accountId: string) => {
    const params = new URLSearchParams(searchParams);
    if (accountId === 'all') {
        params.delete('accountId');
    } else {
        params.set('accountId', accountId);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const filterDescription = accountIdFilter && accountIdFilter !== 'all'
    ? `Showing tasks for ${accounts.find(a => a.id === accountIdFilter)?.name || 'an account'}.`
    : 'A list of all your tasks across all accounts.';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Manager"
        description={filterDescription}
      >
        <div className="flex items-center gap-2">
            <Select value={accountIdFilter || 'all'} onValueChange={handleAccountFilterChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Task
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Task</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Follow up with QuantumLeap" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Due date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date < new Date(new Date().toDateString()) 
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="accountId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Account</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'none'}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Assign to an account" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {isLoadingAccounts ? (
                                <SelectItem value="loading" disabled>Loading accounts...</SelectItem>
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
                            placeholder="Add any relevant notes..."
                            className="resize-none"
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <DialogFooter>
                    <Button type="submit">Save Task</Button>
                    </DialogFooter>
                </form>
                </Form>
            </DialogContent>
            </Dialog>
        </div>

      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Your Tasks</CardTitle>
          <CardDescription>
            Click the checkbox to mark a task as complete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isLoadingTasks && (
              <>
                <TaskSkeleton />
                <TaskSkeleton />
                <TaskSkeleton />
              </>
            )}
            {tasks?.map(task => {
                const account = accounts.find(acc => acc.id === task.accountId);
                return (
                    <div key={task.id} className="flex items-center space-x-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
                        <Checkbox 
                          id={`task-${task.id}`} 
                          checked={task.completed}
                          onCheckedChange={() => handleToggleComplete(task)}
                        />
                        <div className="flex-1">
                            <Label htmlFor={`task-${task.id}`} className={cn("text-sm", task.completed ? 'line-through text-muted-foreground' : '')}>
                                {task.title}
                            </Label>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {account && (
                                    <p>{account.name}</p>
                                )}
                                {account && task.dueDate && <span className='h-1 w-1 rounded-full bg-muted-foreground'></span>}
                                {task.dueDate && (
                                    <p>Due: {format(task.dueDate.toDate(), 'MMM d, yyyy')}</p>
                                )}
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => handleEdit(task)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => setTaskToDelete(task)}
                                className="text-red-600 focus:text-red-600"
                            >
                                Delete
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            })}
             {tasks && tasks.length === 0 && !isLoadingTasks && (
                <div className="py-10 text-center text-muted-foreground">
                No tasks found. Add your first one!
                </div>
            )}
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the task
                &quot;{taskToDelete?.title}&quot;.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(taskToDelete!.id)}>
                Confirm
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    