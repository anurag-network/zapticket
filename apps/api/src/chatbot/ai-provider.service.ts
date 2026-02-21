import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, ChatbotConfig } from '@prisma/client';

interface AIResponse {
  content: string;
  tokensUsed?: number;
}

@Injectable()
export class AIProviderService {
  private readonly logger = new Logger(AIProviderService.name);

  constructor(private configService: ConfigService) {}

  async generateResponse(
    config: ChatbotConfig,
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  ): Promise<AIResponse> {
    switch (config.aiProvider) {
      case AIProvider.OPENAI:
        return this.callOpenAI(config, messages);
      case AIProvider.ANTHROPIC:
        return this.callAnthropic(config, messages);
      case AIProvider.OLLAMA:
        return this.callOllama(config, messages);
      default:
        throw new Error(`Unsupported AI provider: ${config.aiProvider}`);
    }
  }

  private async callOpenAI(
    config: ChatbotConfig,
    messages: { role: string; content: string }[],
  ): Promise<AIResponse> {
    const apiKey = config.apiKey || this.configService.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4',
        messages,
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`OpenAI API error: ${error}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens,
    };
  }

  private async callAnthropic(
    config: ChatbotConfig,
    messages: { role: string; content: string }[],
  ): Promise<AIResponse> {
    const apiKey = config.apiKey || this.configService.get('ANTHROPIC_API_KEY');
    
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-sonnet-20240229',
        max_tokens: config.maxTokens || 500,
        system: systemMessage?.content,
        messages: userMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Anthropic API error: ${error}`);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      tokensUsed: data.usage?.total_tokens,
    };
  }

  private async callOllama(
    config: ChatbotConfig,
    messages: { role: string; content: string }[],
  ): Promise<AIResponse> {
    const endpoint = config.apiEndpoint || 'http://localhost:11434';

    const response = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model || 'llama2',
        messages,
        stream: false,
        options: {
          temperature: config.temperature || 0.7,
          num_predict: config.maxTokens || 500,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Ollama API error: ${error}`);
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.message.content,
      tokensUsed: data.eval_count,
    };
  }
}
