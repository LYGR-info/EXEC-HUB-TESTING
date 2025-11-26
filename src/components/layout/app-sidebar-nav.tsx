"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookUser, Landmark, Calendar, Building, BarChart3, ListChecks } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: Home, wip: false },
  { href: '/rolodex', label: 'Rolodex', icon: BookUser, wip: false },
  { href: '/calendar', label: 'Calendar', icon: Calendar, wip: false },
  { href: '/accounts', label: 'Accounts', icon: Building, wip: false },
  { href: '/tasks', label: 'Tasks', icon: ListChecks, wip: false },
  { href: '/reports', label: 'BI Reports', icon: BarChart3, wip: true },
];

export default function AppSidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navLinks.map(link => (
        <SidebarMenuItem key={link.href}>
          <SidebarMenuButton
            asChild
            isActive={
              pathname === link.href ||
              (link.href !== '/' && pathname.startsWith(link.href))
            }
            tooltip={{ children: link.label }}
          >
            <Link href={link.href}>
              <link.icon />
              <span className={cn(link.wip && "text-red-400 group-hover:text-red-400")}>{link.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
