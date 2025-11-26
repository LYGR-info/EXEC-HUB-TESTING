
import CalendarCard from '@/components/dashboard/calendar-card';
import KeyContactsCard from '@/components/dashboard/key-contacts-card';
import TaskManagerCard from '@/components/dashboard/task-manager-card';

export interface DashboardCard {
  id: string;
  title: string;
  component: React.ComponentType;
  visible: boolean;
  className?: string;
}

export const accountDashboardCards: DashboardCard[] = [
  {
    id: 'task-manager',
    title: 'Task Manager',
    component: TaskManagerCard,
    visible: true,
    className: 'lg:col-span-2',
  },
  {
    id: 'calendar',
    title: 'Account Events',
    component: CalendarCard,
    visible: true,
    className: 'lg:col-span-1',
  },
  {
    id: 'key-contacts',
    title: 'Key Contacts',
    component: KeyContactsCard,
    visible: true,
    className: 'lg:col-span-1',
  },
];
