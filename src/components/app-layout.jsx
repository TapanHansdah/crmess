'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  LayoutGrid,
  Users,
  KanbanSquare,
  CheckSquare,
  LogOut,
  Settings,
  Database,
} from 'lucide-react';
import AppHeader from '@/components/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/pipeline', label: 'Sales Pipeline', icon: KanbanSquare },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/database', label: 'Database', icon: Database },
];

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const currentUserAvatar = getPlaceholderImage('current-user-avatar');

  return (
    <SidebarInset>
      <AppHeader />
      <main className="p-4 sm:p-6 lg:p-8">{children}</main>
    </SidebarInset>
  );
}
