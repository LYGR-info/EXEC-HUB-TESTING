'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import {
  collection,
  query,
  where,
  limit,
  Timestamp,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  accountId?: string;
  dueDate?: Timestamp;
}

function TaskSkeleton() {
  return (
    <div className="flex items-center space-x-3">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

export default function TaskManagerCard({ accountId }: { accountId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const tasksQuery = useMemoFirebase(() => {
    if (!user || !firestore || !accountId) return null;
    return query(
      collection(firestore, `users/${user.uid}/tasks`),
      where('accountId', '==', accountId),
      limit(5)
    );
  }, [user, firestore, accountId]);

  const { data: tasks, isLoading } = useCollection<Task>(tasksQuery);

  const handleToggleComplete = async (task: Task) => {
    if (!firestore || !user) return;
    const taskRef = doc(firestore, `users/${user.uid}/tasks/${task.id}`);
    try {
      await updateDoc(taskRef, {
        completed: !task.completed,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Error updating task status', error);
      toast({
        title: 'Error updating task',
        description: 'Could not update task status.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="w-6 h-6" />
          Task Manager
        </CardTitle>
        <CardDescription>
          Track deal pipeline and next steps for this account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading && (
            <>
              <TaskSkeleton />
              <TaskSkeleton />
              <TaskSkeleton />
            </>
          )}
          {tasks &&
            tasks.length > 0 &&
            tasks.map(task => (
              <div key={task.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`task-card-${task.id}`}
                  checked={task.completed}
                  onCheckedChange={() => handleToggleComplete(task)}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`task-card-${task.id}`}
                    className={cn(
                      'text-sm font-medium leading-none',
                      task.completed
                        ? 'line-through text-muted-foreground'
                        : 'peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                    )}
                  >
                    {task.title}
                  </Label>
                  {task.dueDate && (
                     <p className="text-xs text-muted-foreground">
                        Due: {format(task.dueDate.toDate(), 'MMM d, yyyy')}
                     </p>
                  )}
                </div>
              </div>
            ))}
          {tasks && tasks.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">
              No tasks for this account yet.
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/tasks?accountId=${accountId}`}>
            Go to Task Manager
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
