'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { 
  Tag, RefreshCw, Loader2, Check, ArrowRight, 
  User, AlertCircle
} from 'lucide-react';

interface AutoCategorizeProps {
  ticketId: string;
  onApply?: (category: string, tags: string[], priority: string) => void;
}

export function AutoCategorize({ ticketId, onApply }: AutoCategorizeProps) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  const fetchCategorization = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/categorize/ticket/${ticketId}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (error) {
      console.error('Failed to categorize:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = async () => {
    if (!result) return;

    try {
      await fetch(`/api/ai/categorize/ticket/${ticketId}/auto`, {
        method: 'POST',
      });
      setApplied(true);
      onApply?.(result.category, result.suggestedTags, result.suggestedPriority);
    } catch (error) {
      console.error('Failed to apply:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'NORMAL': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Tag className="h-4 w-4" />
          AI Categorization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result ? (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={fetchCategorization}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Tag className="h-4 w-4 mr-2" />
            )}
            Analyze & Categorize
          </Button>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Category:</span>
                <Badge variant="outline">{result.category}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Confidence:</span>
                <span className={`text-sm ${getConfidenceColor(result.confidence)}`}>
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Suggested Priority:</span>
                <Badge className={getPriorityColor(result.suggestedPriority)}>
                  {result.suggestedPriority}
                </Badge>
              </div>

              {result.suggestedTags?.length > 0 && (
                <div>
                  <span className="text-sm font-medium block mb-2">Suggested Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {result.suggestedTags.map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {result.suggestedAssigneeId && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Suggested assignee available</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="flex-1"
                onClick={applySuggestion}
                disabled={applied}
              >
                {applied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Applied
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Apply Suggestions
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchCategorization}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
