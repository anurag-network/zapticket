'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@zapticket/ui/components/ui/tabs';
import { 
  Sparkles, FileText, MessageSquare, RefreshCw, 
  Check, Copy, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp
} from 'lucide-react';

interface AISuggestion {
  id: string;
  content: string;
  source: 'ai' | 'knowledge_base' | 'canned' | 'similar_tickets';
  confidence: number;
}

interface TicketSummary {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sentiment: string;
  generatedAt: string;
}

interface TicketAIProps {
  ticketId: string;
}

export function TicketAI({ ticketId }: TicketAIProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`/api/smart-responses/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch(`/api/ai/summarize/ticket/${ticketId}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        setShowSummary(true);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const copyToClipboard = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'ai':
        return <Badge className="bg-purple-100 text-purple-800">AI</Badge>;
      case 'knowledge_base':
        return <Badge className="bg-blue-100 text-blue-800">Knowledge Base</Badge>;
      case 'canned':
        return <Badge className="bg-green-100 text-green-800">Canned</Badge>;
      case 'similar_tickets':
        return <Badge className="bg-orange-100 text-orange-800">Similar</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Assistant
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="suggestions" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Replies
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="space-y-3 mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={fetchSuggestions}
              disabled={loadingSuggestions}
            >
              {loadingSuggestions ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate Suggestions
            </Button>

            {suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={suggestion.id || index} 
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      {getSourceBadge(suggestion.source)}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {Math.round(suggestion.confidence * 100)}% match
                        </span>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap mb-3">
                      {suggestion.content}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(suggestion.content, suggestion.id || index.toString())}
                      >
                        {copiedId === (suggestion.id || index.toString()) ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : (
                          <Copy className="h-3 w-3 mr-1" />
                        )}
                        Copy
                      </Button>
                      <Button size="sm" variant="ghost">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <ThumbsDown className="h-3 w-3 mr-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click "Generate Suggestions" to get AI-powered reply suggestions</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-3 mt-4">
            {!showSummary ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full" 
                onClick={fetchSummary}
                disabled={loadingSummary}
              >
                {loadingSummary ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Generate Summary
              </Button>
            ) : summary ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={getSentimentColor(summary.sentiment)}>
                    {summary.sentiment} sentiment
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={fetchSummary}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">Summary</h4>
                  <p className="text-sm text-muted-foreground">{summary.summary}</p>
                </div>

                {summary.keyPoints.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Key Points</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {summary.keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.actionItems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Action Items</h4>
                    <ul className="text-sm space-y-1">
                      {summary.actionItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <input type="checkbox" className="mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Generated: {new Date(summary.generatedAt).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click "Generate Summary" to get an AI summary of this ticket</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
