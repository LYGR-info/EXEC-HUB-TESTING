import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { expenses } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowUpRight, Landmark } from 'lucide-react';

const statusColors = {
  Approved: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

export default function RecentExpensesCard() {
  const recentExpenses = expenses.slice(0, 3);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Landmark className="w-6 h-6" />
            Recent Expenses
        </CardTitle>
        <CardDescription>A quick look at your latest expenses.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {recentExpenses.map(expense => (
            <li key={expense.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium">{expense.description}</p>
                <p className="text-sm text-muted-foreground">
                  {expense.category}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  ${expense.amount.toFixed(2)}
                </p>
                <Badge
                  variant="outline"
                  className={`border-none text-xs ${statusColors[expense.status]}`}
                >
                  {expense.status}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/expenses">
            View All Expenses <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
