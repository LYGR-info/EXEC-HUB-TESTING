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
} from '@/components/ui/sidebar';
import { Briefcase, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import LoginPage from '@/app/login/page';
import Breadcrumbs from './breadcrumbs';

import { useLocalStorage } from '@/hooks/use-local-storage';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const [isDarkMode, setIsDarkMode] = useLocalStorage('dark-mode', false);

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
          <AppSidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className={isDarkMode ? 'dark' : ''}>
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
