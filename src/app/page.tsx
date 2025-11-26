import DashboardGrid from '@/components/dashboard/dashboard-grid';
import DashboardSettings from '@/components/dashboard/dashboard-settings';
import PageHeader from '@/components/page-header';

export default function Home() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back, here's a summary of your activities."
      >
        <DashboardSettings />
      </PageHeader>
      <DashboardGrid />
    </div>
  );
}
