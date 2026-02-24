'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Progress } from '@zapticket/ui/components/ui/progress';
import { 
  Sparkles, TrendingUp, AlertTriangle, CheckCircle, 
  RefreshCw, Loader2, ArrowRight, User
} from 'lucide-react';

interface PredictiveCSATProps {
  ticketId: string;
}

export function PredictiveCSAT({ ticketId }: PredictiveCSATProps) {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchPrediction = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/predict-csat/ticket/${ticketId}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setPrediction(data);
      }
    } catch (error) {
      console.error('Failed to fetch prediction:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getRiskBg = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-green-50 border-green-200';
    }
  };

  if (!prediction) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Predictive Satisfaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={fetchPrediction}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Predict Customer Satisfaction
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`mt-4 ${getRiskBg(prediction.riskLevel)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Predictive Satisfaction
          </CardTitle>
          <Badge className={getRiskColor(prediction.riskLevel)}>
            {prediction.riskLevel} risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold mb-1">
            {prediction.predictedScore}%
          </div>
          <p className="text-sm text-muted-foreground">
            Predicted CSAT Score
          </p>
          <Progress 
            value={prediction.predictedScore} 
            className="mt-2 h-2"
          />
        </div>

        {prediction.factors?.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Factors:</p>
            <ul className="text-sm space-y-1">
              {prediction.factors.map((factor: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}

        {prediction.recommendations?.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Recommendations:</p>
            <ul className="space-y-2">
              {prediction.recommendations.map((rec: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <ArrowRight className="h-3 w-3 text-blue-500" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full"
          onClick={fetchPrediction}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Prediction
        </Button>
      </CardContent>
    </Card>
  );
}
