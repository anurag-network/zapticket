'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@zapticket/ui/components/ui/tooltip';
import { Loader2 } from 'lucide-react';

interface Sentiment {
  score: number;
  type: string;
  confidence: number;
  keywords: string[];
}

const sentimentConfig: Record<string, { color: string; label: string; emoji: string }> = {
  VERY_NEGATIVE: { color: 'bg-red-500', label: 'Very Negative', emoji: '😠' },
  NEGATIVE: { color: 'bg-orange-500', label: 'Negative', emoji: '🙁' },
  NEUTRAL: { color: 'bg-yellow-500', label: 'Neutral', emoji: '😐' },
  POSITIVE: { color: 'bg-green-500', label: 'Positive', emoji: '🙂' },
  VERY_POSITIVE: { color: 'bg-emerald-500', label: 'Very Positive', emoji: '😊' },
};

export function SentimentBadge({ ticketId }: { ticketId: string }) {
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    analyzeSentiment();
  }, [ticketId]);

  const analyzeSentiment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sentiment/analyze/ticket/${ticketId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setSentiment(await res.json());
      }
    } catch (error) {
      console.error('Failed to analyze sentiment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Analyzing...
      </Badge>
    );
  }

  if (!sentiment) {
    return null;
  }

  const config = sentimentConfig[sentiment.type] || sentimentConfig.NEUTRAL;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge className={`${config.color} text-white gap-1`}>
            <span>{config.emoji}</span>
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Sentiment Analysis</p>
            <p className="text-xs">Score: {(sentiment.score * 100).toFixed(0)}%</p>
            <p className="text-xs">Confidence: {(sentiment.confidence * 100).toFixed(0)}%</p>
            {sentiment.keywords.length > 0 && (
              <p className="text-xs">Keywords: {sentiment.keywords.slice(0, 5).join(', ')}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
