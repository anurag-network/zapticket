'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Label } from '@zapticket/ui/components/ui/label';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@zapticket/ui/components/ui/tabs';
import { 
  MessageSquare, Phone, Facebook, Twitter, Send, 
  Save, CheckCircle, AlertCircle, Copy, ExternalLink 
} from 'lucide-react';

const channelFeatures = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: MessageSquare,
    color: 'bg-green-500',
    description: 'Connect with customers on WhatsApp Business API',
    features: ['2-way messaging', 'Template messages', 'Media support', 'Webhooks'],
    envVars: ['META_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_BUSINESS_ID'],
  },
  {
    id: 'sms',
    name: 'SMS',
    icon: Phone,
    color: 'bg-blue-500',
    description: 'Send and receive SMS via Twilio',
    features: ['2-way SMS', 'MMS support', 'Phone number management', 'Webhooks'],
    envVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
  },
  {
    id: 'facebook',
    name: 'Facebook Messenger',
    icon: Facebook,
    color: 'bg-blue-600',
    description: 'Manage Facebook Page conversations',
    features: ['Page messaging', 'Post comments', 'Automated replies', 'Webhooks'],
    envVars: ['FACEBOOK_ACCESS_TOKEN', 'FACEBOOK_PAGE_ID', 'FACEBOOK_WEBHOOK_VERIFY_TOKEN'],
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: Twitter,
    color: 'bg-black',
    description: 'Handle Twitter DMs and mentions',
    features: ['Direct Messages', 'Tweet replies', 'Mention monitoring', 'Webhooks'],
    envVars: ['TWITTER_API_KEY', 'TWITTER_API_SECRET', 'TWITTER_BEARER_TOKEN'],
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: Send,
    color: 'bg-blue-400',
    description: 'Telegram Bot integration',
    features: ['Bot commands', 'Inline keyboards', 'Groups support', 'Webhooks'],
    envVars: ['TELEGRAM_BOT_TOKEN'],
  },
];

export default function ChannelsPage() {
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getWebhookUrl = (channelId: string) => {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/channels/${channelId}/webhook`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Channels</h1>
        <p className="text-muted-foreground">Connect additional communication channels</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="facebook">Facebook</TabsTrigger>
          <TabsTrigger value="twitter">Twitter</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {channelFeatures.map((channel) => (
              <Card key={channel.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${channel.color}`}>
                      <channel.icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="outline">Not Connected</Badge>
                  </div>
                  <CardTitle className="mt-4">{channel.name}</CardTitle>
                  <CardDescription>{channel.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Features:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {channel.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => setActiveChannel(channel.id)}
                    >
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {channelFeatures.map((channel) => (
          <TabsContent key={channel.id} value={channel.id}>
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${channel.color}`}>
                    <channel.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>{channel.name} Configuration</CardTitle>
                    <CardDescription>{channel.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Environment Variables</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add these environment variables to your deployment:
                  </p>
                  <div className="space-y-2">
                    {channel.envVars.map((envVar) => (
                      <div key={envVar} className="flex items-center gap-2">
                        <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">
                          {envVar}=your_value_here
                        </code>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(envVar)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Webhook URL</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Configure this URL in your {channel.name} app settings:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">
                      {getWebhookUrl(channel.id)}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="Click={() => copysm"
                      onToClipboard(getWebhookUrl(channel.id))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t">
                  {saved && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Settings saved</span>
                    </div>
                  )}
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
