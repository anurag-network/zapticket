import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class WebhookSubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private http: HttpService
  ) {}

  async findAll(organizationId: string) {
    return this.prisma.webhookSubscription.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const sub = await this.prisma.webhookSubscription.findFirst({
      where: { id, organizationId },
    });
    if (!sub) throw new NotFoundException('Webhook subscription not found');
    return sub;
  }

  async create(organizationId: string, data: {
    name: string;
    url: string;
    events: string[];
    secret?: string;
  }) {
    return this.prisma.webhookSubscription.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, data: {
    name?: string;
    url?: string;
    events?: string[];
    secret?: string;
    isActive?: boolean;
  }) {
    const sub = await this.prisma.webhookSubscription.findFirst({
      where: { id, organizationId },
    });
    if (!sub) throw new NotFoundException('Webhook subscription not found');

    return this.prisma.webhookSubscription.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    const sub = await this.prisma.webhookSubscription.findFirst({
      where: { id, organizationId },
    });
    if (!sub) throw new NotFoundException('Webhook subscription not found');

    return this.prisma.webhookSubscription.delete({ where: { id } });
  }

  async trigger(event: string, data: any, organizationId: string) {
    const subscriptions = await this.prisma.webhookSubscription.findMany({
      where: { organizationId, isActive: true, events: { has: event } },
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await this.http.axiosRef.post(sub.url, {
            event,
            data,
            timestamp: new Date().toISOString(),
          }, {
            headers: sub.secret ? { 'X-Webhook-Secret': sub.secret } : {},
          });
          return { subscriptionId: sub.id, success: true };
        } catch (error) {
          return { subscriptionId: sub.id, success: false, error: error.message };
        }
      })
    );

    return results;
  }
}
