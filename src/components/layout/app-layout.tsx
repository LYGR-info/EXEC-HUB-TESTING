'use client';

import React from 'react';
import AppSidebarNav from './app-sidebar-nav';
import AppHeader from './app-header';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Briefcase, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import LoginPage from '@/app/login/page';
import Breadcrumbs from './breadcrumbs';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const [isDarkMode, setIsDarkMode] = useLocalStorage('dark-mode', false);
  const [showExperimental, setShowExperimental] = useLocalStorage('show-experimental', false);

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="h-16 flex items-center p-2 justify-center">
          <div className="flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary shrink-0" />
            <h1 className="text-xl font-semibold font-headline group-data-[collapsible=icon]:hidden whitespace-nowrap">
              Executive Hub
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <AppSidebarNav showExperimental={showExperimental} />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setShowExperimental(!showExperimental)}
                tooltip={showExperimental ? "Hide experimental features" : "Show experimental features"}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                    showExperimental ? "bg-primary text-primary-foreground" : "bg-transparent"
                  )}>
                    {showExperimental && <div className="h-2 w-2 bg-current rounded-full" />}
                  </div>
                  <span className="group-data-[collapsible=icon]:hidden truncate">Show experimental features</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <AppHeader isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        <main className="flex-1 flex flex-col bg-background">
          <div className="p-4 md:p-6 border-b">
            <Breadcrumbs />
          </div>
          <div className="flex-1 p-4 md:p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
