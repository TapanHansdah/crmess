"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';
import { Search, Bell, HelpCircle, Globe, User, FileText, Receipt, TrendingUp, Loader2, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/contacts': 'Contacts',
  '/pipeline': 'Sales Pipeline',
  '/tasks': 'Tasks',
  '/invoices': 'Invoices',
  '/products': 'Products',
  '/emails': 'Emails',
  '/documents': 'Documents',
  '/support-tickets': 'Support Tickets',
  '/reports': 'Reports & Analytics',
  '/automation': 'Automation',
  '/database': 'Database',
};

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const title = pageTitles[pathname] || 'Apex CRM';
  const [mounted, setMounted] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const searchTimeoutRef = React.useRef(null);
  const [notifications, setNotifications] = React.useState([]);
  const [notificationsLoading, setNotificationsLoading] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch notifications
  const fetchNotifications = React.useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  // Fetch notifications on mount and set up polling
  React.useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Use a fallback title during server-side rendering
  const displayTitle = mounted ? title : 'Apex CRM';

  const performSearch = React.useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults(null);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results);
        setShowResults(true);
      } else {
        setSearchResults(null);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(null);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    if (value.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    } else {
      setSearchResults(null);
      setShowResults(false);
    }
  };

  const handleResultClick = (type, id) => {
    setShowResults(false);
    setSearchQuery('');
    setSearchResults(null);
    
    switch (type) {
      case 'contact':
        router.push(`/contacts`);
        break;
      case 'lead':
        router.push(`/pipeline`);
        break;
      case 'document':
        router.push(`/documents`);
        break;
      case 'invoice':
        router.push(`/invoices`);
        break;
      default:
        break;
    }
  };

  const totalResults = searchResults
    ? (searchResults.contacts?.length || 0) +
      (searchResults.leads?.length || 0) +
      (searchResults.documents?.length || 0) +
      (searchResults.invoices?.length || 0)
    : 0;

  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to format time ago
  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white dark:bg-slate-950 shadow-sm px-4 sm:px-6">
      <div className="flex items-center gap-3 flex-1">
        <SidebarTrigger className="md:hidden" />
        <div>
          <h1 className="text-lg font-bold text-foreground">{displayTitle}</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Manage your business relationships</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md hidden sm:block" suppressHydrationWarning>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input 
            placeholder="Search contacts, deals, documents..." 
            className="pl-9 pr-9 h-9 text-sm rounded-full bg-slate-100 dark:bg-slate-800 border-0"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              if (totalResults > 0) {
                setShowResults(true);
              }
            }}
            onBlur={() => {
              // Delay to allow clicking on results
              setTimeout(() => setShowResults(false), 200);
            }}
            suppressHydrationWarning
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
                setShowResults(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults && totalResults > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            <div className="p-2">
              {searchResults.contacts && searchResults.contacts.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Contacts ({searchResults.contacts.length})
                  </div>
                  {searchResults.contacts.map((contact) => {
                    const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown';
                    return (
                      <button
                        key={contact.id}
                        onClick={() => handleResultClick('contact', contact.id)}
                        className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md flex items-center gap-3"
                      >
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{fullName}</div>
                          {contact.email && (
                            <div className="text-xs text-muted-foreground truncate">{contact.email}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {searchResults.leads && searchResults.leads.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Leads ({searchResults.leads.length})
                  </div>
                  {searchResults.leads.map((lead) => {
                    const contactName = lead.contacts
                      ? `${lead.contacts.first_name || ''} ${lead.contacts.last_name || ''}`.trim() || lead.contacts.email
                      : 'Unknown';
                    return (
                      <button
                        key={lead.id}
                        onClick={() => handleResultClick('lead', lead.id)}
                        className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md flex items-center gap-3"
                      >
                        <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{lead.title || 'Untitled Lead'}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {contactName} • {lead.stage}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {searchResults.documents && searchResults.documents.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Documents ({searchResults.documents.length})
                  </div>
                  {searchResults.documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleResultClick('document', doc.id)}
                      className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md flex items-center gap-3"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{doc.name || 'Untitled Document'}</div>
                        {doc.file_type && (
                          <div className="text-xs text-muted-foreground truncate">{doc.file_type}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.invoices && searchResults.invoices.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Invoices ({searchResults.invoices.length})
                  </div>
                  {searchResults.invoices.map((invoice) => {
                    const contactName = invoice.contacts
                      ? `${invoice.contacts.first_name || ''} ${invoice.contacts.last_name || ''}`.trim() || invoice.contacts.email
                      : 'Unknown';
                    return (
                      <button
                        key={invoice.id}
                        onClick={() => handleResultClick('invoice', invoice.id)}
                        className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md flex items-center gap-3"
                      >
                        <Receipt className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {invoice.invoice_number || 'Untitled Invoice'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {contactName} • {invoice.status}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative" suppressHydrationWarning>
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold text-sm">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notificationsLoading ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notification, index) => {
                  const timeAgo = getTimeAgo(notification.created_at || notification.timestamp);
                  return (
                    <DropdownMenuItem key={notification.id || index} className="flex flex-col items-start py-3 cursor-pointer">
                      <p className="font-medium text-sm">{notification.title || notification.message || 'Notification'}</p>
                      {notification.description && (
                        <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
                      )}
                      {notification.message && !notification.description && (
                        <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                    </DropdownMenuItem>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" suppressHydrationWarning>
              <HelpCircle className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push('/help-center')}>
              Help Center
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open('/documentation.html', '_blank')}>
              Documentation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Org Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" suppressHydrationWarning>
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="font-semibold">
              ✓ Acme Corp (Current)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Tech Startups Inc.</DropdownMenuItem>
            <DropdownMenuItem>Global Solutions Ltd.</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
