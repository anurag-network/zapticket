'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@zapticket/ui';

const settingsItems = [
  {
    title: 'Teams',
    description: 'Manage teams and assign members',
    href: '/dashboard/settings/teams',
    icon: '👥',
  },
  {
    title: 'Users',
    description: 'View and manage organization users',
    href: '/dashboard/settings/users',
    icon: '👤',
  },
  {
    title: 'Forms',
    description: 'Create and manage support forms',
    href: '/dashboard/settings/forms',
    icon: '📝',
  },
  {
    title: 'Organization',
    description: 'Organization settings and branding',
    href: '/dashboard/settings/organization',
    icon: '🏢',
  },
];

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold cursor-pointer" onClick={() => router.push('/dashboard')}>
            ZapTicket
          </h1>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-6">Settings</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {settingsItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{item.icon}</span>
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
