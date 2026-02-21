'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Label } from '@zapticket/ui/components/ui/label';
import { Switch } from '@zapticket/ui/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@zapticket/ui/components/ui/select';
import { Alert, AlertDescription } from '@zapticket/ui/components/ui/alert';
import { Textarea } from '@zapticket/ui/components/ui/textarea';
import { Info, Save, Loader2 } from 'lucide-react';

interface ChatbotConfig {
  name: string;
  welcomeMessage: string;
  aiProvider: 'OPENAI' | 'ANTHROPIC' | 'OLLAMA';
  apiKey?: string;
  apiEndpoint?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  active: boolean;
}

const defaultConfig: ChatbotConfig = {
  name: 'Zapdeck',
  welcomeMessage: "Hi! I'm Zapdeck, your support assistant. How can I help you today?",
  aiProvider: 'OPENAI',
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 500,
  active: true,
};

const modelOptions: Record<string, string[]> = {
  OPENAI: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  ANTHROPIC: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
  OLLAMA: ['llama2', 'mistral', 'codellama', 'phi'],
};

export default function ChatbotSettingsPage() {
  const [config, setConfig] = useState<ChatbotConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/chatbot/config', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setConfig({
            name: data.name || 'Zapdeck',
            welcomeMessage: data.welcomeMessage || defaultConfig.welcomeMessage,
            aiProvider: data.aiProvider || 'OPENAI',
            apiKey: data.apiKey || '',
            apiEndpoint: data.apiEndpoint || '',
            model: data.model || 'gpt-4',
            temperature: data.temperature ?? 0.7,
            maxTokens: data.maxTokens ?? 500,
            active: data.active ?? true,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/chatbot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Chatbot Settings</h1>
          <p className="text-muted-foreground">Configure your Zapdeck AI chatbot</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {saved && (
        <Alert className="mb-6">
          <AlertDescription>Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic chatbot configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Bot Name</Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="active"
                  checked={config.active}
                  onCheckedChange={(checked) => setConfig({ ...config, active: checked })}
                />
                <Label htmlFor="active">Chatbot Active</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="welcomeMessage">Welcome Message</Label>
              <Textarea
                id="welcomeMessage"
                value={config.welcomeMessage}
                onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Provider</CardTitle>
            <CardDescription>Select and configure your AI provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={config.aiProvider}
                  onValueChange={(value: 'OPENAI' | 'ANTHROPIC' | 'OLLAMA') =>
                    setConfig({
                      ...config,
                      aiProvider: value,
                      model: modelOptions[value][0],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPENAI">OpenAI (GPT-4/3.5)</SelectItem>
                    <SelectItem value="ANTHROPIC">Anthropic (Claude)</SelectItem>
                    <SelectItem value="OLLAMA">Ollama (Local)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="model">Model</Label>
                <Select
                  value={config.model}
                  onValueChange={(value) => setConfig({ ...config, model: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelOptions[config.aiProvider].map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {config.aiProvider !== 'OLLAMA' && (
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder={config.aiProvider === 'OPENAI' ? 'sk-...' : 'sk-ant-...'}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to use environment variable
                </p>
              </div>
            )}

            {config.aiProvider === 'OLLAMA' && (
              <div>
                <Label htmlFor="apiEndpoint">Ollama Endpoint</Label>
                <Input
                  id="apiEndpoint"
                  value={config.apiEndpoint}
                  onChange={(e) => setConfig({ ...config, apiEndpoint: e.target.value })}
                  placeholder="http://localhost:11434"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="temperature">Temperature: {config.temperature}</Label>
                <Input
                  id="temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Lower = more focused, Higher = more creative</p>
              </div>

              <div>
                <Label htmlFor="maxTokens">Max Response Length</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min="100"
                  max="2000"
                  value={config.maxTokens}
                  onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) || 500 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Ticket Creation:</strong> The chatbot will automatically create tickets when it
            collects the required information: Name, Email, Category, and Issue Description.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
