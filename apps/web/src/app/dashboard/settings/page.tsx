'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@zapticket/ui';
import {
  Users,
  Group,
  Shield,
  Building2,
  LayoutDashboard,
  FileText,
  Zap,
  FileCode,
  Tag,
  CheckSquare,
  Calendar,
  Clock,
  Bolt,
  Link2,
  Webhook,
  Timer,
  BarChart3,
  Clock4,
  BookOpen,
  Globe,
  Mail,
  MessageSquare,
  Phone,
  Palette,
  Lock,
  Settings2,
  Ticket,
  Cpu,
  Plug,
  Key,
  Workflow,
  Languages,
  ShieldCheck,
  Wrench,
  Activity,
  Package,
  Session,
  FileBarChart,
  Bot,
  ListChecks,
} from 'lucide-react';

const settingsCategories = [
  {
    title: 'People & Access',
    items: [
      { title: 'Users', description: 'Manage users and permissions', href: '/dashboard/settings/users', icon: Users, color: 'text-blue-500' },
      { title: 'Groups', description: 'Organize users into groups', href: '/dashboard/settings/groups', icon: Group, color: 'text-purple-500' },
      { title: 'Roles', description: 'Define roles and access levels', href: '/dashboard/settings/roles', icon: Shield, color: 'text-red-500' },
      { title: 'Organizations', description: 'Manage organizations', href: '/dashboard/settings/organizations', icon: Building2, color: 'text-green-500' },
    ],
  },
  {
    title: 'Communication Channels',
    items: [
      { title: 'Web', description: 'Website widget settings', href: '/dashboard/settings/channels/web', icon: Globe, color: 'text-cyan-500' },
      { title: 'Form', description: 'Support form configuration', href: '/dashboard/settings/forms', icon: FileText, color: 'text-orange-500' },
      { title: 'Email', description: 'Email channel settings', href: '/dashboard/settings/channels/email', icon: Mail, color: 'text-yellow-500' },
      { title: 'Chat', description: 'Live chat & chatbot (Zapdeck)', href: '/dashboard/settings/chatbot', icon: MessageSquare, color: 'text-pink-500' },
      { title: 'SMS', description: 'SMS notifications', href: '/dashboard/settings/channels/sms', icon: Phone, color: 'text-indigo-500' },
    ],
  },
  {
    title: 'Knowledge & Content',
    items: [
      { title: 'Knowledge Base', description: 'Articles and categories', href: '/dashboard/settings/knowledge-base', icon: BookOpen, color: 'text-emerald-500' },
      { title: 'Tags', description: 'Manage ticket and article tags', href: '/dashboard/settings/tags', icon: Tag, color: 'text-gray-500' },
      { title: 'Templates', description: 'Email and notification templates', href: '/dashboard/settings/templates', icon: FileCode, color: 'text-violet-500' },
      { title: 'Text Modules', description: 'Canned responses and snippets', href: '/dashboard/settings/text-modules', icon: FileText, color: 'text-slate-500' },
    ],
  },
  {
    title: 'Automation',
    items: [
      { title: 'Triggers', description: 'Automated event responses', href: '/dashboard/settings/triggers', icon: Bolt, color: 'text-amber-500' },
      { title: 'Macros', description: 'Predefined action sequences', href: '/dashboard/settings/macros', icon: Zap, color: 'text-lime-500' },
      { title: 'SLAs', description: 'Service level agreements', href: '/dashboard/settings/slas', icon: Clock, color: 'text-rose-500' },
      { title: 'Scheduler', description: 'Scheduled tasks and jobs', href: '/dashboard/settings/scheduler', icon: Timer, color: 'text-sky-500' },
      { title: 'Assignment Rules', description: 'Auto ticket assignment', href: '/dashboard/settings/assignment-rules', icon: ListChecks, color: 'text-teal-500' },
      { title: 'Checklists', description: 'Ticket checklists', href: '/dashboard/settings/checklists', icon: CheckSquare, color: 'text-fuchsia-500' },
    ],
  },
  {
    title: 'Reporting',
    items: [
      { title: 'Overview', description: 'Dashboard overview settings', href: '/dashboard/settings/overview', icon: LayoutDashboard, color: 'text-blue-500' },
      { title: 'Report Profiles', description: 'Custom report configurations', href: '/dashboard/settings/report-profiles', icon: BarChart3, color: 'text-green-500' },
      { title: 'Time Accounting', description: 'Time tracking settings', href: '/dashboard/settings/time-accounting', icon: Clock4, color: 'text-purple-500' },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { title: 'Webhooks', description: 'Outgoing webhooks', href: '/dashboard/settings/integrations', icon: Webhook, color: 'text-orange-500' },
      { title: 'API', description: 'API keys and documentation', href: '/dashboard/settings/integrations/api-keys', icon: Key, color: 'text-red-500' },
      { title: 'Public Links', description: 'Shareable ticket links', href: '/dashboard/settings/public-links', icon: Link2, color: 'text-cyan-500' },
    ],
  },
  {
    title: 'System',
    items: [
      { title: 'Branding', description: 'Logo, colors, and themes', href: '/dashboard/settings/branding', icon: Palette, color: 'text-pink-500' },
      { title: 'Security', description: 'Authentication and security', href: '/dashboard/settings/security', icon: Lock, color: 'text-red-600' },
      { title: 'Ticket', description: 'Ticket settings and defaults', href: '/dashboard/settings/ticket', icon: Ticket, color: 'text-blue-500' },
      { title: 'Core Workflows', description: 'Workflow management', href: '/dashboard/settings/workflows', icon: Workflow, color: 'text-purple-500' },
      { title: 'Translations', description: 'Language and localization', href: '/dashboard/settings/translations', icon: Languages, color: 'text-green-500' },
      { title: 'Data Privacy', description: 'Privacy and compliance', href: '/dashboard/settings/data-privacy', icon: ShieldCheck, color: 'text-indigo-500' },
      { title: 'Maintenance', description: 'System maintenance', href: '/dashboard/settings/maintenance', icon: Wrench, color: 'text-gray-500' },
      { title: 'Monitoring', description: 'System health monitoring', href: '/dashboard/settings/monitoring', icon: Activity, color: 'text-emerald-500' },
      { title: 'Packages', description: 'Installed packages', href: '/dashboard/settings/packages', icon: Package, color: 'text-amber-500' },
      { title: 'Sessions', description: 'Active user sessions', href: '/dashboard/settings/sessions', icon: Session, color: 'text-slate-500' },
      { title: 'System Report', description: 'System diagnostics', href: '/dashboard/settings/system-report', icon: FileBarChart, color: 'text-violet-500' },
      { title: 'Version', description: 'Version information', href: '/dashboard/settings/version', icon: Cpu, color: 'text-gray-600' },
    ],
  },
];

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 bg-background z-10">
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

        <div className="space-y-8">
          {settingsCategories.map((category) => (
            <div key={category.title}>
              <h3 className="text-lg font-medium mb-4 text-muted-foreground">{category.title}</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full hover:border-primary/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-3 text-base">
                            <Icon className={`h-5 w-5 ${item.color}`} />
                            {item.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
