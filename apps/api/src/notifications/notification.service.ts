import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { HandlebarsEmailService } from '../email/handlebars-email.service';

interface CreateNotificationInput {
  userId: string;
  organizationId: string;
  type: string;
  title: string;
  message: string;
  ticketId?: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private handlebarsEmail: HandlebarsEmailService,
  ) {}

  async create(input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        organizationId: input.organizationId,
        type: input.type,
        title: input.title,
        message: input.message,
        ticketId: input.ticketId,
        data: input.data as any,
      },
    });
  }

  async createForUsers(
    userIds: string[],
    organizationId: string,
    type: string,
    title: string,
    message: string,
    ticketId?: string,
    data?: Record<string, any>
  ) {
    const notifications = await Promise.all(
      userIds.map((userId) =>
        this.create({
          userId,
          organizationId,
          type,
          title,
          message,
          ticketId,
          data,
        })
      )
    );

    return notifications;
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  }

  async getUserNotifications(userId: string, limit: number = 50, unreadOnly: boolean = false) {
    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        ticket: { select: { id: true, subject: true } },
      },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async deleteNotification(notificationId: string) {
    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  }

  async deleteAllRead(userId: string) {
    await this.prisma.notification.deleteMany({
      where: {
        userId,
        read: true,
      },
    });

    return { success: true };
  }

  async notifyTicketAssigned(
    assigneeId: string,
    organizationId: string,
    ticketId: string,
    ticketSubject: string
  ) {
    const notification = await this.create({
      userId: assigneeId,
      organizationId,
      type: 'TICKET_ASSIGNED',
      title: 'New Ticket Assigned',
      message: `You have been assigned to: ${ticketSubject}`,
      ticketId,
      data: { ticketId },
    });

    await this.sendEmailIfEnabled(assigneeId, 'emailOnTicketAssigned', notification, ticketSubject);
    return notification;
  }

  async notifyTicketReplied(
    userId: string,
    organizationId: string,
    ticketId: string,
    ticketSubject: string,
    repliedBy: string
  ) {
    const notification = await this.create({
      userId,
      organizationId,
      type: 'TICKET_REPLIED',
      title: 'New Reply',
      message: `${repliedBy} replied to: ${ticketSubject}`,
      ticketId,
      data: { ticketId },
    });

    await this.sendEmailIfEnabled(userId, 'emailOnTicketReplied', notification, ticketSubject);
    return notification;
  }

  async notifySLABreach(
    userId: string,
    organizationId: string,
    ticketId: string,
    ticketSubject: string,
    breachType: string
  ) {
    const notification = await this.create({
      userId,
      organizationId,
      type: 'SLA_BREACH',
      title: 'SLA Breach Warning',
      message: `${breachType} SLA breached for: ${ticketSubject}`,
      ticketId,
      data: { ticketId, breachType },
    });

    await this.sendEmailIfEnabled(userId, 'emailOnSlaBreach', notification, ticketSubject);
    return notification;
  }

  async notifyMention(
    userId: string,
    organizationId: string,
    ticketId: string,
    ticketSubject: string,
    mentionedBy: string
  ) {
    const notification = await this.create({
      userId,
      organizationId,
      type: 'MENTION',
      title: 'You were mentioned',
      message: `${mentionedBy} mentioned you in: ${ticketSubject}`,
      ticketId,
      data: { ticketId },
    });

    await this.sendEmailIfEnabled(userId, 'emailOnMention', notification, ticketSubject);
    return notification;
  }

  private async getPreferences(userId: string) {
    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return prefs;
  }

  private async sendEmailIfEnabled(
    userId: string,
    preferenceKey: 'emailOnTicketAssigned' | 'emailOnTicketReplied' | 'emailOnMention' | 'emailOnSlaBreach' | 'emailOnTicketCreated' | 'emailOnTicketClosed',
    notification: any,
    ticketSubject?: string
  ) {
    try {
      const prefs = await this.getPreferences(userId);
      
      if (!prefs[preferenceKey]) {
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (!user?.email) {
        return;
      }

      const webUrl = process.env.WEB_URL || 'http://localhost:3000';
      const ticketUrl = notification.ticketId 
        ? `${webUrl}/dashboard/tickets/${notification.ticketId}`
        : webUrl;

      const templateData = {
        userName: user.name || 'User',
        ticketId: notification.ticketId,
        ticketSubject: ticketSubject,
        ticketUrl,
        message: notification.message,
        organizationName: 'ZapTicket',
        unsubscribeUrl: `${webUrl}/settings/notifications`,
        helpUrl: `${webUrl}/help`,
      };

      const templateMap: Record<string, string> = {
        emailOnTicketAssigned: 'ticket-assigned',
        emailOnTicketReplied: 'ticket-replied',
        emailOnMention: 'mention',
        emailOnSlaBreach: 'sla-breach',
      };

      const templateName = templateMap[preferenceKey];
      const html = templateName 
        ? this.handlebarsEmail.renderTemplate(templateName, templateData)
        : this.getEmailTemplate(notification.title, notification.message, ticketUrl, user.name || 'User');

      const emailSubject = `[ZapTicket] ${notification.title}`;

      await this.emailService.sendEmail({
        to: user.email,
        subject: emailSubject,
        html,
        text: `${notification.title}\n\n${notification.message}\n\nView at: ${ticketUrl}`,
      });

      this.logger.log(`Email notification sent to ${user.email} for ${notification.type}`);
    } catch (error) {
      this.logger.error(`Failed to send email notification: ${error.message}`);
    }
  }

  private getEmailTemplate(title: string, message: string, url: string, userName: string): string {
    return `
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
        <h2 style="margin: 0;">${title}</h2>
      </div>
      <div class="content">
        <p>Hello ${userName},</p>
        <div class="message">
          <p>${message}</p>
        </div>
        <p>
          <a href="${url}" class="button">View Details</a>
        </p>
      </div>
      <div class="footer">
        <p>This is an automated notification from ZapTicket</p>
        <p>You can manage your email notification preferences in your account settings.</p>
      </div>
    </div>
  </body>
</html>
    `.trim();
  }

  async getPreferences(userId: string) {
    return this.getPreferences(userId);
  }

  async updatePreferences(userId: string, data: {
    emailOnTicketAssigned?: boolean;
    emailOnTicketReplied?: boolean;
    emailOnMention?: boolean;
    emailOnSlaBreach?: boolean;
    emailOnTicketCreated?: boolean;
    emailOnTicketClosed?: boolean;
    emailOnCsatSurvey?: boolean;
  }) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }
}
