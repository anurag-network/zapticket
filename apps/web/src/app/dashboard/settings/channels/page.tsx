'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label, Badge, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from '@zapticket/ui';
import { 
  MessageSquare, Phone, Facebook, Twitter, Send, Save, 
  CheckCircle, AlertCircle, Copy, Trash2, Plus, RefreshCw, Settings
} from 'lucide-react';

interface Channel {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const channelDefinitions = {
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: MessageSquare,
    color: 'bg-green-500',
    description: 'Connect with customers on WhatsApp Business API',
    features: ['2-way messaging', 'Template messages', 'Media support', 'Webhooks'],
    configFields: [
      { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', required: true },
      { key: 'businessAccountId', label: 'Business Account ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
    envVars: ['META_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_BUSINESS_ID'],
  },
  sms: {
    id: 'sms',
    name: 'SMS',
    icon: Phone,
    color: 'bg-blue-500',
    description: 'Send and receive SMS via Twilio',
    features: ['2-way SMS', 'MMS support', 'Phone number management', 'Webhooks'],
    configFields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', required: true },
      { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
      { key: 'phoneNumber', label: 'Phone Number', type: 'text', required: true },
    ],
    envVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook Messenger',
    icon: Facebook,
    color: 'bg-blue-600',
    description: 'Manage Facebook Page conversations',
    features: ['Page messaging', 'Post comments', 'Automated replies', 'Webhooks'],
    configFields: [
      { key: 'pageId', label: 'Page ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'appSecret', label: 'App Secret', type: 'password', required: true },
    ],
    envVars: ['FACEBOOK_ACCESS_TOKEN', 'FACEBOOK_PAGE_ID', 'FACEBOOK_WEBHOOK_VERIFY_TOKEN'],
  },
  twitter: {
    id: 'twitter',
    name: 'Twitter/X',
    icon: Twitter,
    color: 'bg-black',
    description: 'Handle Twitter DMs and mentions',
    features: ['Direct Messages', 'Tweet replies', 'Mention monitoring', 'Webhooks'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
      { key: 'bearerToken', label: 'Bearer Token', type: 'password', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'accessTokenSecret', label: 'Access Token Secret', type: 'password', required: true },
    ],
    envVars: ['TWITTER_API_KEY', 'TWITTER_API_SECRET', 'TWITTER_BEARER_TOKEN'],
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    icon: Send,
    color: 'bg-blue-400',
    description: 'Telegram Bot integration',
    features: ['Bot commands', 'Inline keyboards', 'Groups support', 'Webhooks'],
    configFields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', required: true },
    ],
    envVars: ['TELEGRAM_BOT_TOKEN'],
  },
};

export default function ChannelsPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState<string | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/channels`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setChannels(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getChannel = (type: string) => channels.find(c => c.type.toUpperCase() === type.toUpperCase());

  const handleSave = async (channelId: string) => {
    setSaving(true);
    const token = localStorage.getItem('accessToken');
    
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/channels/${channelId}/config`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(configForm),
        }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      fetchChannels();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (channelId: string) => {
    const token = localStorage.getItem('accessToken');
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/channels/${channelId}/toggle`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchChannels();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateChannel = async (type: string) => {
    const token = localStorage.getItem('accessToken');
    const channelDef = channelDefinitions[type as keyof typeof channelDefinitions];
    
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/channels`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: type.toUpperCase(),
            name: channelDef.name,
            config: configForm,
          }),
        }
      );
      setShowCreateModal(null);
      setConfigForm({});
      fetchChannels();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm('Are you sure you want to delete this channel?')) return;
    
    const token = localStorage.getItem('accessToken');
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/channels/${channelId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchChannels();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getWebhookUrl = (channelId: string) => {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/channels/${channelId.toLowerCase()}/webhook`;
  };

  const openConfigModal = (type: string) => {
    const channel = getChannel(type);
    if (channel) {
      setConfigForm(channel.config || {});
    } else {
      setConfigForm({});
    }
    setShowCreateModal(type);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Channels</h1>
        <p className="text-muted-foreground">Connect additional communication channels</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="facebook">Facebook</TabsTrigger>
          <TabsTrigger value="twitter">Twitter</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {Object.values(channelDefinitions).map((channel) => {
              const existingChannel = getChannel(channel.id);
              return (
                <Card key={channel.id} className={`hover:shadow-lg transition-shadow ${existingChannel?.active ? 'border-green-500 border-2' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-lg ${channel.color}`}>
                        <channel.icon className="h-6 w-6 text-white" />
                      </div>
                      {existingChannel ? (
                        existingChannel.active ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )
                      ) : (
                        <Badge variant="outline">Not Connected</Badge>
                      )}
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
                        variant={existingChannel ? "outline" : "default"}
                        onClick={() => openConfigModal(channel.id)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        {existingChannel ? 'Configure' : 'Connect'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {Object.values(channelDefinitions).map((channelDef) => {
          const existingChannel = getChannel(channelDef.id);
          
          return (
            <TabsContent key={channelDef.id} value={channelDef.id}>
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${channelDef.color}`}>
                        <channelDef.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle>{channelDef.name} Configuration</CardTitle>
                        <CardDescription>{channelDef.description}</CardDescription>
                      </div>
                    </div>
                    {existingChannel && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Enabled</span>
                          <Switch
                            checked={existingChannel.active}
                            onCheckedChange={() => handleToggle(existingChannel.id)}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteChannel(existingChannel.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!existingChannel ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">This channel is not configured yet.</p>
                      <Button onClick={() => openConfigModal(channelDef.id)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Connect {channelDef.name}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="text-lg font-medium mb-4">Configuration</h3>
                        <div className="grid gap-4 max-w-xl">
                          {channelDef.configFields.map((field) => (
                            <div key={field.key} className="grid gap-2">
                              <Label htmlFor={field.key}>
                                {field.label}
                                {field.required && <span className="text-destructive"> *</span>}
                              </Label>
                              <Input
                                id={field.key}
                                type={field.type}
                                value={configForm[field.key] || existingChannel.config?.[field.key] || ''}
                                onChange={(e) => setConfigForm({ ...configForm, [field.key]: e.target.value })}
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                              />
                            </div>
                          ))}
                          <Button onClick={() => handleSave(existingChannel.id)} disabled={saving} className="mt-2">
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Configuration'}
                          </Button>
                          {saved && (
                            <span className="text-green-600 text-sm flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Configuration saved!
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <h3 className="text-lg font-medium mb-4">Webhook URL</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Configure this URL in your {channelDef.name} app settings to receive incoming messages:
                        </p>
                        <div className="flex items-center gap-2 max-w-xl">
                          <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
                            {getWebhookUrl(channelDef.id)}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => copyToClipboard(getWebhookUrl(channelDef.id))}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Environment Variables</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      If using Docker or Kubernetes, add these to your environment configuration:
                    </p>
                    <div className="space-y-2 max-w-xl">
                      {channelDef.envVars.map((envVar) => (
                        <div key={envVar} className="flex items-center gap-2">
                          <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">
                            {envVar}=your_value_here
                          </code>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => copyToClipboard(envVar)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
