import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService
  ) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.config.get('SMTP_HOST');
    const port = this.config.get('SMTP_PORT');
    const user = this.config.get('SMTP_USER');
    const pass = this.config.get('SMTP_PASS');

    if (!host || !port) {
      this.logger.warn('SMTP not configured. Email sending disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: parseInt(port) === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    this.logger.log('SMTP transporter initialized');
  }

  async sendEmail(data: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.transporter) {
      return { success: false, error: 'SMTP not configured' };
    }

    try {
      const from = this.config.get('SMTP_FROM') || 'noreply@zapticket.local';
      const result = await this.transporter.sendMail({
        from,
        to: Array.isArray(data.to) ? data.to.join(', ') : data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
        replyTo: data.replyTo,
        attachments: data.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      });

      this.logger.log(`Email sent to ${data.to}: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async sendTicketReply(data: {
    ticketId: string;
    to: string;
    subject: string;
    message: string;
    ticketUrl: string;
  }): Promise<{ success: boolean; error?: string }> {
    const html = `
      <!DOCTYPE html>
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
              <h2 style="margin: 0;">${data.subject}</h2>
            </div>
            <div class="content">
              <p>You have received a new reply to your support ticket.</p>
              <div class="message">
                ${data.message}
              </div>
              <p>
                <a href="${data.ticketUrl}" class="button">View Ticket</a>
              </p>
            </div>
            <div class="footer">
              <p>This is an automated message from ZapTicket Support</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: data.to,
      subject: `[Ticket #${data.ticketId.slice(-6).toUpperCase()}] ${data.subject}`,
      html,
      text: data.message,
    });
  }

  async sendPasswordReset(data: {
    to: string;
    resetUrl: string;
    name?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const html = `
      <!DOCTYPE html>
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
              <p>Hello ${data.name || 'there'},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <p style="text-align: center;">
                <a href="${data.resetUrl}" class="button">Reset Password</a>
              </p>
              <p>This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>ZapTicket Support</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: data.to,
      subject: 'Reset Your Password - ZapTicket',
      html,
      text: `Reset your password: ${data.resetUrl}`,
    });
  }
}
