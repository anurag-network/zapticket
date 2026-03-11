import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.emailTemplate.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const template = await this.prisma.emailTemplate.findFirst({
      where: { id, organizationId },
    });

    if (!template) {
      throw new NotFoundException('Email template not found');
    }

    return template;
  }

  async create(organizationId: string, data: {
    name: string;
    subject: string;
    body: string;
    type?: string;
  }) {
    return this.prisma.emailTemplate.create({
      data: {
        organizationId,
        name: data.name,
        subject: data.subject,
        body: data.body,
        type: data.type || 'custom',
      },
    });
  }

  async update(id: string, organizationId: string, data: {
    name?: string;
    subject?: string;
    body?: string;
    type?: string;
    active?: boolean;
  }) {
    const template = await this.prisma.emailTemplate.findFirst({
      where: { id, organizationId },
    });

    if (!template) {
      throw new NotFoundException('Email template not found');
    }

    return this.prisma.emailTemplate.update({
      where: { id },
      data: {
        name: data.name,
        subject: data.subject,
        body: data.body,
        type: data.type,
        active: data.active,
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const template = await this.prisma.emailTemplate.findFirst({
      where: { id, organizationId },
    });

    if (!template) {
      throw new NotFoundException('Email template not found');
    }

    await this.prisma.emailTemplate.delete({
      where: { id },
    });

    return { success: true };
  }

  async toggleActive(id: string, organizationId: string) {
    const template = await this.prisma.emailTemplate.findFirst({
      where: { id, organizationId },
    });

    if (!template) {
      throw new NotFoundException('Email template not found');
    }

    return this.prisma.emailTemplate.update({
      where: { id },
      data: { active: !template.active },
    });
  }

  async getByType(organizationId: string, type: string) {
    return this.prisma.emailTemplate.findFirst({
      where: { organizationId, type, active: true },
    });
  }

  async getDefaultTemplates(): Promise<any[]> {
    return [
      {
        name: 'Ticket Reply',
        type: 'ticket_reply',
        subject: '[Ticket #{{ticket_id}}] {{subject}}',
        body: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .message { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">{{subject}}</h2>
    </div>
    <div class="content">
      <p>Hello {{customer_name}},</p>
      <div class="message">
        {{message_content}}
      </div>
      <p>
        <a href="{{ticket_url}}" class="button">View Ticket</a>
      </p>
    </div>
    <div class="footer">
      <p>Best regards,<br>{{agent_name}}</p>
    </div>
  </div>
</body>
</html>`,
      },
      {
        name: 'Ticket Created',
        type: 'ticket_created',
        subject: 'Your ticket #{{ticket_id}} has been created',
        body: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">Ticket Created</h2>
    </div>
    <div class="content">
      <p>Hello {{customer_name}},</p>
      <p>Your support ticket has been created successfully.</p>
      <p><strong>Ticket ID:</strong> #{{ticket_id}}</p>
      <p><strong>Subject:</strong> {{subject}}</p>
      <p><strong>Description:</strong> {{description}}</p>
      <p>
        <a href="{{ticket_url}}" class="button">View Ticket</a>
      </p>
    </div>
    <div class="footer">
      <p>Thank you for contacting us!</p>
    </div>
  </div>
</body>
</html>`,
      },
      {
        name: 'Ticket Closed',
        type: 'ticket_closed',
        subject: 'Your ticket #{{ticket_id}} has been closed',
        body: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6b7280; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">Ticket Closed</h2>
    </div>
    <div class="content">
      <p>Hello {{customer_name}},</p>
      <p>Your support ticket #{{ticket_id}} has been closed.</p>
      <p>If you need any further assistance, please create a new ticket.</p>
    </div>
    <div class="footer">
      <p>Thank you for using ZapTicket!</p>
    </div>
  </div>
</body>
</html>`,
      },
      {
        name: 'Password Reset',
        type: 'password_reset',
        subject: 'Reset your password',
        body: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">Password Reset</h2>
    </div>
    <div class="content">
      <p>Hello {{user_name}},</p>
      <p>We received a request to reset your password. Click the button below:</p>
      <p style="text-align: center;">
        <a href="{{reset_url}}" class="button">Reset Password</a>
      </p>
      <p>This link expires in 1 hour.</p>
    </div>
    <div class="footer">
      <p>ZapTicket Support</p>
    </div>
  </div>
</body>
</html>`,
      },
    ];
  }
}
