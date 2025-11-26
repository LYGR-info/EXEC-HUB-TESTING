
import CalendarCard from '@/components/dashboard/calendar-card';
import KeyContactsCard from '@/components/dashboard/key-contacts-card';
import LynxAiInsightCard from '@/components/dashboard/lynx-ai-insight-card';
import ReportSummarizerCard from '@/components/dashboard/report-summarizer-card';
import TotalPipelineValueCard from '@/components/dashboard/total-pipeline-value-card';
import RecurringRevenueCard from '@/components/dashboard/recurring-revenue-card';

export interface DashboardCard {
  id: string;
  title: string;
  component: React.ComponentType;
  visible: boolean;
  className?: string;
}

export const dashboardCards: DashboardCard[] = [
  {
    id: 'total-pipeline-value',
    title: 'Total Pipeline Value',
    component: TotalPipelineValueCard,
    visible: true,
    className: 'lg:col-span-1',
  },
  {
    id: 'recurring-revenue',
    title: 'Recurring Revenue',
    component: RecurringRevenueCard,
    visible: true,
    className: 'lg:col-span-1',
  },
  {
    id: 'calendar',
    title: 'Upcoming Schedule',
    component: CalendarCard,
    visible: true,
    className: 'lg:col-span-1',
  },
  {
    id: 'key-contacts',
    title: 'Key Contacts',
    component: KeyContactsCard,
    visible: false,
    className: '',
  },
  {
    id: 'lynx-ai',
    title: 'LYNX AI Insights',
    component: LynxAiInsightCard,
    visible: true,
    className: 'lg:col-span-1',
  },
  {
    id: 'report-summarizer',
    title: 'Report Summarizer',
    component: ReportSummarizerCard,
    visible: true,
    className: 'lg:col-span-1',
  },
];
