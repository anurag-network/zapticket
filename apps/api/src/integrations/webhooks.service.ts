import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {}

  async findAll(organizationId: string) {
    return this.prisma.webhook.findMany({
      where: { organizationId },
      include: {
        _count: { select: { deliveries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    return this.prisma.webhook.findFirst({
      where: { id, organizationId },
      include: {
        deliveries: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async create(organizationId: string, data: {
    url: string;
    events: string[];
    secret?: string;
  }) {
    const secret = data.secret || crypto.randomBytes(32).toString('hex');
    
    return this.prisma.webhook.create({
      data: {
        url: data.url,
        events: data.events,
        secret,
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, data: Partial<{
    url: string;
    events: string[];
    active: boolean;
  }>) {
    return this.prisma.webhook.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    await this.prisma.webhook.delete({ where: { id } });
    return { success: true };
  }

  async trigger(event: string, organizationId: string, payload: any) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        organizationId,
        active: true,
        events: { has: event },
      },
    });

    for (const webhook of webhooks) {
      await this.deliver(webhook, event, payload);
    }
  }

  private async deliver(webhook: any, event: string, payload: any) {
    const timestamp = new Date().toISOString();
    const body = JSON.stringify({
      event,
      timestamp,
      data: payload,
    });

    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(body)
      .digest('hex');

    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        event,
        payload: body as any,
        webhookId: webhook.id,
      },
    });

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ZapTicket-Event': event,
          'X-ZapTicket-Signature': `sha256=${signature}`,
          'X-ZapTicket-Timestamp': timestamp,
        },
        body,
      });

      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          statusCode: response.status,
          response: await response.text().catch(() => ''),
          deliveredAt: new Date(),
        },
      });

      this.logger.log(`Webhook ${webhook.id} delivered: ${response.status}`);
    } catch (error: any) {
      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          statusCode: 0,
          response: error.message,
        },
      });

      this.logger.error(`Webhook ${webhook.id} failed: ${error.message}`);
    }
  }

  verifySignature(body: string, signature: string, secret: string): boolean {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return `sha256=${expected}` === signature;
  }
}
