'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { ScrollArea } from '@zapticket/ui/components/ui/scroll-area';
import { Lightbulb, BookOpen, MessageSquare, History, Copy, Loader2 } from 'lucide-react';

interface Suggestion {
  content: string;
  source: 'ai' | 'knowledge_base' | 'similar_tickets';
  confidence: number;
}

const sourceIcons = {
  ai: Lightbulb,
  knowledge_base: BookOpen,
  similar_tickets: History,
};

const sourceLabels = {
  ai: 'AI Suggested',
  knowledge_base: 'Knowledge Base',
  similar_tickets: 'Similar Ticket',
};

export function SmartResponseSuggestions({ ticketId }: { ticketId: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, [ticketId]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/smart-responses/ticket/${ticketId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        setSuggestions(await res.json());
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'ai':
        return 'bg-purple-100 text-purple-800';
      case 'knowledge_base':
        return 'bg-blue-100 text-blue-800';
      case 'similar_tickets':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Suggested Responses
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadSuggestions} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No suggestions available</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={loadSuggestions}>
              Generate Suggestions
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {suggestions.map((s, i) => {
                const SourceIcon = sourceIcons[s.source];
                return (
                  <div
                    key={i}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className={getSourceColor(s.source)}>
                        <SourceIcon className="h-3 w-3 mr-1" />
                        {sourceLabels[s.source]}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {(s.confidence * 100).toFixed(0)}% match
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(s.content, String(i))}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap line-clamp-4">{s.content}</p>
                    {copied === String(i) && (
                      <p className="text-xs text-green-600 mt-1">Copied!</p>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
