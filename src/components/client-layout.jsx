'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutGrid,
  Users,
  KanbanSquare,
  CheckSquare,
  LogOut,
  Settings,
  FileText,
  Mail,
  Package,
  Receipt,
  Ticket,
  BarChart3,
  Zap,
  Bell,
  Search,
  Database,
} from 'lucide-react';
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
import { Input } from './ui/input';
import AppLayout from './app-layout';

const mainMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/pipeline', label: 'Sales Pipeline', icon: KanbanSquare },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
];

const secondaryMenuItems = [
  { href: '/support-tickets', label: 'Support Tickets', icon: Ticket },
  { href: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { href: '/automation', label: 'Automation', icon: Zap },
];

const tertiaryMenuItems = [
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/emails', label: 'Emails', icon: Mail },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/database', label: 'Database', icon: Database },
];

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const currentUserAvatar = getPlaceholderImage('current-user-avatar');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  // Prevent hydration mismatch by not rendering navigation until client-side is ready
  if (!mounted) {
    return (
      <SidebarProvider>
        <Sidebar className="border-r border-border">
          <SidebarHeader className="border-b border-border p-4 bg-gradient-to-b from-blue-50 to-background">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-600 text-white font-bold text-lg">
                A
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight">Apex CRM</h1>
                <p className="text-xs text-muted-foreground">Enterprise Edition</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent />
          <SidebarFooter />
        </Sidebar>
        <AppLayout>{children}</AppLayout>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-border">
        {/* Header */}
        <SidebarHeader className="border-b border-border p-4 bg-gradient-to-b from-blue-50 to-background">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-600 text-white font-bold text-lg">
              A
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">Apex CRM</h1>
              <p className="text-xs text-muted-foreground">Enterprise Edition</p>
            </div>
          </div>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent>
          <SidebarMenu className="gap-1">
            {/* Core Sales */}
            <div className="px-2 py-4 first:pt-2">
              <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Core
              </p>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="transition-colors"
                  >
                    <a href={item.href} className="text-sm">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>

            {/* Operations */}
            <div className="px-2 py-4">
              <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Operations
              </p>
              {secondaryMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="transition-colors"
                  >
                    <a href={item.href} className="text-sm">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>

            {/* Tools & Admin */}
            <div className="px-2 py-4">
              <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Tools & Admin
              </p>
              {tertiaryMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="transition-colors"
                  >
                    <a href={item.href} className="text-sm">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>
          </SidebarMenu>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="justify-start w-full gap-3 p-2 h-auto hover:bg-muted"
              >
                <Avatar className="h-8 w-8">
                  {currentUserAvatar && (
                    <AvatarImage src={currentUserAvatar.imageUrl} alt="User Avatar" />
                  )}
                  <AvatarFallback className="bg-blue-600 text-white">
                    {user?.first_name?.[0]}{user?.last_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.company || 'User'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="end">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                {user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings & Privacy</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>Usage & Billing</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <AppLayout>{children}</AppLayout>
    </SidebarProvider>
  );
}

