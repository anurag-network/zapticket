'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@zapticket/ui/components/ui/button';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { MentionCenter } from '@/components/mentions/MentionCenter';
import { LogOut, Settings, Book, MessageSquare, Home, Users } from 'lucide-react';

interface DashboardHeaderProps {
  title?: string;
  showNav?: boolean;
}

export function DashboardHeader({ title = 'ZapTicket', showNav = true }: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1
          className="text-xl font-bold cursor-pointer"
          onClick={() => router.push('/dashboard')}
        >
          {title}
        </h1>
        {showNav && (
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/tickets/new">
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-4 w-4 mr-1" />
                Tickets
              </Button>
            </Link>
            <Link href="/dashboard/kb">
              <Button variant="ghost" size="sm">
                <Book className="h-4 w-4 mr-1" />
                KB
              </Button>
            </Link>
            <Link href="/dashboard/customer-health">
              <Button variant="ghost" size="sm">
                <Users className="h-4 w-4 mr-1" />
                Customers
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </Link>
            <div className="flex items-center ml-2 border-l pl-2">
              <MentionCenter />
              <NotificationCenter />
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
