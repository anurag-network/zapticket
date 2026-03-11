import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

interface EmailTemplateData {
  userName?: string;
  ticketId?: string;
  ticketSubject?: string;
  ticketUrl?: string;
  message?: string;
  assigneeName?: string;
  priority?: string;
  status?: string;
  organizationName?: string;
  createdAt?: string;
  dueAt?: string;
  customerName?: string;
  csatScore?: number;
  csatUrl?: string;
  [key: string]: any;
}

@Injectable()
export class HandlebarsEmailService {
  private readonly logger = new Logger(HandlebarsEmailService.name);
  private readonly templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private readonly baseTemplate: HandlebarsTemplateDelegate;

  constructor(private configService: ConfigService) {
    this.baseTemplate = this.compileBaseTemplate();
    this.registerDefaultTemplates();
  }

  private compileBaseTemplate(): HandlebarsTemplateDelegate {
    const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.6; 
      color: #1f2937; 
      background-color: #f3f4f6;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px;
    }
    .email-wrapper {
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
    }
    .header .logo {
      font-size: 28px;
      margin-bottom: 8px;
    }
    .content {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #111827;
    }
    .message {
      margin-bottom: 24px;
      color: #4b5563;
    }
    .ticket-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .ticket-card .ticket-id {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .ticket-card .ticket-subject {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 12px;
    }
    .ticket-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      font-size: 14px;
    }
    .ticket-detail {
      display: flex;
      flex-direction: column;
    }
    .ticket-detail .label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .ticket-detail .value {
      font-weight: 500;
      color: #111827;
    }
    .priority-critical { color: #dc2626; }
    .priority-high { color: #ea580c; }
    .priority-medium { color: #ca8a04; }
    .priority-low { color: #16a34a; }
    .status-open { background: #dbeafe; color: #1d4ed8; }
    .status-pending { background: #fef3c7; color: #b45309; }
    .status-resolved { background: #d1fae5; color: #047857; }
    .status-closed { background: #f3f4f6; color: #6b7280; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      margin: 16px 0;
    }
    .button:hover {
      background: #2563eb;
    }
    .footer {
      background: #f9fafb;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      font-size: 12px;
      color: #6b7280;
      margin: 4px 0;
    }
    .footer .company {
      font-weight: 600;
      color: #374151;
    }
    .social-links {
      margin: 16px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #6b7280;
      text-decoration: none;
    }
    .action-buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin: 20px 0;
    }
    .action-button {
      flex: 1;
      display: inline-block;
      padding: 12px 20px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      text-align: center;
    }
    .action-button.primary {
      background: #3b82f6;
      color: white;
    }
    .action-button.secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-wrapper">
      <div class="header">
        <div class="logo">🎫</div>
        <h1>{{organizationName}}</h1>
      </div>
      <div class="content">
        {{> @partial-block }}
      </div>
      <div class="footer">
        <p class="company">{{organizationName}}</p>
        <p>You received this email because you are subscribed to ticket notifications.</p>
        <p>
          <a href="{{unsubscribeUrl}}" style="color: #6b7280;">Manage preferences</a> • 
          <a href="{{helpUrl}}" style="color: #6b7280;">Help Center</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
    return Handlebars.compile(baseTemplate);
  }

  private registerDefaultTemplates() {
    Handlebars.registerPartial('header', this.compilePartial('header'));
    Handlebars.registerPartial('footer', this.compilePartial('footer'));
  }

  private compilePartial(name: string): HandlebarsTemplateDelegate {
    return Handlebars.compile('{{> (lookup . "${name}") }}');
  }

  renderTemplate(templateName: string, data: EmailTemplateData): string {
    try {
      const template = this.templates.get(templateName);
      if (!template) {
        throw new Error(`Template ${templateName} not found`);
      }

      const defaultData = {
        organizationName: data.organizationName || 'ZapTicket',
        title: data.title || 'Notification',
        unsubscribeUrl: data.unsubscribeUrl || '#',
        helpUrl: data.helpUrl || '#',
        ...data,
      };

      return this.baseTemplate({
        ...defaultData,
        body: template(defaultData),
      });
    } catch (error) {
      this.logger.error(`Failed to render template ${templateName}: ${error.message}`);
      return this.renderFallback(templateName, data);
    }
  }

  renderFallback(templateName: string, data: EmailTemplateData): string {
    const fallbacks: Record<string, string> = {
      'ticket-assigned': `
        <p class="greeting">Hello {{userName}},</p>
        <p class="message">A new ticket has been assigned to you.</p>
        <div class="ticket-card">
          <div class="ticket-id">#{{ticketId}}</div>
          <div class="ticket-subject">{{ticketSubject}}</div>
          <div class="ticket-details">
            <div class="ticket-detail">
              <span class="label">Priority</span>
              <span class="value priority-{{priority}}">{{priority}}</span>
            </div>
            <div class="ticket-detail">
              <span class="label">Status</span>
              <span class="value">{{status}}</span>
            </div>
            <div class="ticket-detail">
              <span class="label">Customer</span>
              <span class="value">{{customerName}}</span>
            </div>
            <div class="ticket-detail">
              <span class="label">Created</span>
              <span class="value">{{createdAt}}</span>
            </div>
          </div>
        </div>
        <div class="action-buttons">
          <a href="{{ticketUrl}}" class="action-button primary">View Ticket</a>
        </div>
      `,
      'ticket-replied': `
        <p class="greeting">Hello {{userName}},</p>
        <p class="message">{{assigneeName}} has replied to ticket #{{ticketId}}.</p>
        <div class="ticket-card">
          <div class="ticket-id">#{{ticketId}}</div>
          <div class="ticket-subject">{{ticketSubject}}</div>
          <div class="message" style="margin-top: 16px; padding: 16px; background: #f9fafb; border-radius: 8px;">
            {{message}}
          </div>
        </div>
        <div class="action-buttons">
          <a href="{{ticketUrl}}" class="action-button primary">View Reply</a>
        </div>
      `,
      'sla-breach': `
        <p class="greeting">Hello {{userName}},</p>
        <p class="message" style="color: #dc2626; font-weight: 600;">⚠️ SLA Warning: {{breachType}} breach for ticket #{{ticketId}}</p>
        <div class="ticket-card" style="border-color: #fecaca; background: #fef2f2;">
          <div class="ticket-id">#{{ticketId}}</div>
          <div class="ticket-subject">{{ticketSubject}}</div>
          <div class="ticket-details">
            <div class="ticket-detail">
              <span class="label">Priority</span>
              <span class="value priority-critical">{{priority}}</span>
            </div>
            <div class="ticket-detail">
              <span class="label">Due At</span>
              <span class="value" style="color: #dc2626;">{{dueAt}}</span>
            </div>
          </div>
        </div>
        <div class="action-buttons">
          <a href="{{ticketUrl}}" class="action-button primary" style="background: #dc2626;">Take Action</a>
        </div>
      `,
      'mention': `
        <p class="greeting">Hello {{userName}},</p>
        <p class="message">{{mentionedBy}} mentioned you in ticket #{{ticketId}}.</p>
        <div class="ticket-card">
          <div class="ticket-id">#{{ticketId}}</div>
          <div class="ticket-subject">{{ticketSubject}}</div>
        </div>
        <div class="action-buttons">
          <a href="{{ticketUrl}}" class="action-button primary">View Mention</a>
        </div>
      `,
      'csat-survey': `
        <p class="greeting">Hello {{customerName}},</p>
        <p class="message">Your support ticket #{{ticketId}} has been resolved. Please take a moment to rate your experience.</p>
        <div class="action-buttons">
          <a href="{{csatUrl}}?score=5" class="action-button" style="background: #22c55e; color: white;">😊 Great</a>
          <a href="{{csatUrl}}?score=3" class="action-button" style="background: #eab308; color: white;">😐 Okay</a>
          <a href="{{csatUrl}}?score=1" class="action-button" style="background: #dc2626; color: white;">😞 Poor</a>
        </div>
      `,
    };

    const fallback = fallbacks[templateName] || `<p>${data.message || 'You have a new notification.'}</p>`;
    const template = Handlebars.compile(fallback);
    
    return this.baseTemplate({
      ...data,
      organizationName: data.organizationName || 'ZapTicket',
      title: 'Notification',
      body: template(data),
    });
  }

  registerTemplate(name: string, template: string) {
    this.templates.set(name, Handlebars.compile(template));
  }

  registerTemplatesFromDir(dir: string) {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.endsWith('.hbs')) {
          const name = file.replace('.hbs', '');
          const content = fs.readFileSync(path.join(dir, file), 'utf-8');
          this.registerTemplate(name, content);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to load templates from ${dir}: ${error.message}`);
    }
  }
}
