'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, CardContent, Switch } from '@zapticket/ui';

interface NotificationPreferences {
  emailOnTicketAssigned: boolean;
  emailOnTicketReplied: boolean;
  emailOnMention: boolean;
  emailOnSlaBreach: boolean;
  emailOnTicketCreated: boolean;
  emailOnTicketClosed: boolean;
  emailOnCsatSurvey: boolean;
}

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/notifications/preferences`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setPreferences(data);
      } else {
        setPreferences({
          emailOnTicketAssigned: true,
          emailOnTicketReplied: true,
          emailOnMention: true,
          emailOnSlaBreach: true,
          emailOnTicketCreated: false,
          emailOnTicketClosed: false,
          emailOnCsatSurvey: true,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: !preferences[key] });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!preferences) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setSaving(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/notifications/preferences`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(preferences),
        }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Failed to load preferences</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold cursor-pointer" onClick={() => router.push('/dashboard')}>
            ZapTicket
          </h1>
          <Button variant="outline" onClick={() => router.push('/dashboard/settings')}>
            Back to Settings
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold mb-2">Email Notifications</h2>
          <p className="text-muted-foreground mb-6">
            Configure when you want to receive email notifications about ticket activity.
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Ticket Assigned</p>
                    <p className="text-sm text-muted-foreground">
                      Receive an email when a ticket is assigned to you
                    </p>
                  </div>
                  <Switch
                    checked={preferences.emailOnTicketAssigned}
                    onCheckedChange={() => handleToggle('emailOnTicketAssigned')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Reply</p>
                    <p className="text-sm text-muted-foreground">
                      Receive an email when someone replies to a ticket you created or are assigned to
                    </p>
                  </div>
                  <Switch
                    checked={preferences.emailOnTicketReplied}
                    onCheckedChange={() => handleToggle('emailOnTicketReplied')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mentioned</p>
                    <p className="text-sm text-muted-foreground">
                      Receive an email when you are mentioned in a ticket
                    </p>
                  </div>
                  <Switch
                    checked={preferences.emailOnMention}
                    onCheckedChange={() => handleToggle('emailOnMention')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SLA Breach Warning</p>
                    <p className="text-sm text-muted-foreground">
                      Receive an email when an SLA breach is about to occur or has occurred
                    </p>
                  </div>
                  <Switch
                    checked={preferences.emailOnSlaBreach}
                    onCheckedChange={() => handleToggle('emailOnSlaBreach')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Ticket Created</p>
                    <p className="text-sm text-muted-foreground">
                      Receive an email when new tickets are created in your organization
                    </p>
                  </div>
                  <Switch
                    checked={preferences.emailOnTicketCreated}
                    onCheckedChange={() => handleToggle('emailOnTicketCreated')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Ticket Closed</p>
                    <p className="text-sm text-muted-foreground">
                      Receive an email when a ticket is closed
                    </p>
                  </div>
                  <Switch
                    checked={preferences.emailOnTicketClosed}
                    onCheckedChange={() => handleToggle('emailOnTicketClosed')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">CSAT Survey</p>
                    <p className="text-sm text-muted-foreground">
                      Receive an email when a customer satisfaction survey is sent
                    </p>
                  </div>
                  <Switch
                    checked={preferences.emailOnCsatSurvey}
                    onCheckedChange={() => handleToggle('emailOnCsatSurvey')}
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
                {saved && <span className="text-green-600 text-sm">Preferences saved!</span>}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
