import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  private readonly languageCodes: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    pt: 'Portuguese',
    it: 'Italian',
    nl: 'Dutch',
    ru: 'Russian',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
    hi: 'Hindi',
    tr: ': 'Polish',
    sv: 'Turkish',
    plSwedish',
    da: 'Danish',
    fi: 'Finnish',
    no: 'Norwegian',
    th: 'Thai',
    vi: 'Vietnamese',
    id: 'Indonesian',
    ms: 'Malay',
    uk: 'Ukrainian',
    cs: 'Czech',
    ro: 'Romanian',
    hu: 'Hungarian',
    el: 'Greek',
    he: 'Hebrew',
  };

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string,
  ): Promise<TranslationResult> {
    if (!sourceLanguage) {
      sourceLanguage = await this.detectLanguage(text);
    }

    if (sourceLanguage === targetLanguage) {
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage,
        targetLanguage,
      };
    }

    const apiKey = this.configService.get('GOOGLE_TRANSLATE_API_KEY') 
      || this.configService.get('DEEPL_API_KEY');

    if (!apiKey) {
      this.logger.warn('No translation API key configured');
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage,
        targetLanguage,
      };
    }

    try {
      const translated = await this.callTranslationAPI(text, sourceLanguage, targetLanguage, apiKey);
      
      return {
        originalText: text,
        translatedText: translated,
        sourceLanguage,
        targetLanguage,
      };
    } catch (error) {
      this.logger.error(`Translation failed: ${error.message}`);
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage,
        targetLanguage,
      };
    }
  }

  async detectLanguage(text: string): Promise<string> {
    const apiKey = this.configService.get('GOOGLE_TRANSLATE_API_KEY');

    if (!apiKey) {
      return this.simpleLanguageDetection(text);
    }

    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2/detect?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: text }),
        }
      );

      if (!response.ok) {
        return this.simpleLanguageDetection(text);
      }

      const data = await response.json();
      return data.data?.detections?.[0]?.[0]?.language || 'en';
    } catch (error) {
      this.logger.error(`Language detection failed: ${error.message}`);
      return this.simpleLanguageDetection(text);
    }
  }

  private simpleLanguageDetection(text: string): string {
    const patterns: Record<string, RegExp[]> = {
      en: [/\b(the|a|an|is|are|was|were|have|has|do|does)\b/i],
      es: [/\b(el|la|los|las|un|una|es|son|está|hay|que)\b/i],
      fr: [/\b(le|la|les|un|une|est|sont|être|avoir|que|dans)\b/i],
      de: [/\b(der|die|das|ein|eine|ist|sind|haben|werden|kann)\b/i],
      pt: [/\b(o|a|os|as|um|uma|é|são|está|ter|que)\b/i],
      it: [/\b(il|la|lo|gli|le|un|una|è|sono|essere|avere)\b/i],
      ru: [/[а-яА-яёЁ]/],
      zh: [/[\u4e00-\u9fff]/],
      ja: [/[\u3040-\u309f\u30a0-\u30ff]/],
      ko: [/[\uac00-\ud7af]/],
      ar: [/[\u0600-\u06ff]/],
      hi: [/[\u0900-\u097f]/],
    };

    for (const [lang, regexps] of Object.entries(patterns)) {
      for (const pattern of regexps) {
        if (pattern.test(text)) {
          return lang;
        }
      }
    }

    return 'en';
  }

  private async callTranslationAPI(
    text: string,
    source: string,
    target: string,
    apiKey: string,
  ): Promise<string> {
    const googleKey = this.configService.get('GOOGLE_TRANSLATE_API_KEY');
    
    if (googleKey) {
      return this.translateWithGoogle(text, source, target, googleKey);
    }

    const deeplKey = this.configService.get('DEEPL_API_KEY');
    if (deeplKey) {
      return this.translateWithDeepL(text, source, target, deeplKey);
    }

    throw new Error('No translation API configured');
  }

  private async translateWithGoogle(
    text: string,
    source: string,
    target: string,
    apiKey: string,
  ): Promise<string> {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source,
          target,
          format: 'text',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Translate error: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.translations?.[0]?.translatedText || text;
  }

  private async translateWithDeepL(
    text: string,
    source: string,
    target: string,
    apiKey: string,
  ): Promise<string> {
    const langMap: Record<string, string> = {
      en: 'EN', es: 'ES', fr: 'FR', de: 'DE', 
      pt: 'PT', it: 'IT', nl: 'NL', ru: 'RU',
      zh: 'ZH', ja: 'JA', ko: 'KO', ar: 'AR',
    };

    const sourceLang = langMap[source] || source.toUpperCase();
    const targetLang = langMap[target] || target.toUpperCase();

    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        source_lang: sourceLang,
        target_lang: targetLang,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepL error: ${response.status}`);
    }

    const data = await response.json();
    return data.translations?.[0]?.text || text;
  }

  async translateTicketMessages(
    ticketId: string,
    targetLanguage: string,
  ): Promise<void> {
    const messages = await this.prisma.message.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });

    for (const message of messages) {
      if (message.language === targetLanguage) continue;

      const translation = await this.translateText(
        message.content,
        targetLanguage,
      );

      await this.prisma.message.update({
        where: { id: message.id },
        data: {
          content: translation.translatedText,
          language: targetLanguage,
        },
      });
    }
  }

  getSupportedLanguages(): { code: string; name: string }[] {
    return Object.entries(this.languageCodes).map(([code, name]) => ({
      code,
      name,
    }));
  }
}
