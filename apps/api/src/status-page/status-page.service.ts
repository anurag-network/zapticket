import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StatusPageService {
  private readonly logger = new Logger(StatusPageService.name);

  constructor(private prisma: PrismaService) {}

  async getStatusPage(organizationId: string) {
    const statusPage = await this.prisma.statusPage.findUnique({
      where: { organizationId },
      include: {
        components: {
          orderBy: { order: 'asc' },
        },
        incidents: {
          where: {
            resolvedAt: null,
          },
          orderBy: { createdAt: 'desc' },
          include: {
            updates: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    return statusPage;
  }

  async getStatusPageBySlug(slug: string) {
    const statusPage = await this.prisma.statusPage.findUnique({
      where: { slug },
      include: {
        components: {
          orderBy: { order: 'asc' },
        },
        incidents: {
          where: {
            resolvedAt: null,
          },
          orderBy: { createdAt: 'desc' },
          include: {
            updates: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    return statusPage;
  }

  async create(organizationId: string, data: {
    title: string;
    description?: string;
    logoUrl?: string;
    primaryColor?: string;
    domain?: string;
  }) {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return this.prisma.statusPage.create({
      data: {
        organizationId,
        title: data.title,
        slug: `${slug}-${Date.now()}`,
        description: data.description,
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor || '#3b82f6',
        domain: data.domain,
      },
    });
  }

  async update(organizationId: string, data: {
    title?: string;
    description?: string;
    logoUrl?: string;
    primaryColor?: string;
    domain?: string;
    isPublic?: boolean;
  }) {
    return this.prisma.statusPage.update({
      where: { organizationId },
      data,
    });
  }

  async addComponent(statusPageId: string, data: {
    name: string;
    description?: string;
    category?: string;
  }) {
    return this.prisma.statusComponent.create({
      data: {
        statusPageId,
        name: data.name,
        description: data.description,
        category: data.category,
      },
    });
  }

  async updateComponentStatus(componentId: string, status: string) {
    return this.prisma.statusComponent.update({
      where: { id: componentId },
      data: { status },
    });
  }

  async createIncident(statusPageId: string, data: {
    title: string;
    description?: string;
    severity?: string;
  }) {
    return this.prisma.statusIncident.create({
      data: {
        statusPageId,
        title: data.title,
        description: data.description,
        severity: data.severity || 'minor',
        status: 'investigating',
      },
      include: {
        updates: true,
      },
    });
  }

  async addIncidentUpdate(incidentId: string, data: {
    content: string;
    status: string;
    componentId?: string;
  }) {
    return this.prisma.statusUpdate.create({
      data: {
        incidentId,
        content: data.content,
        status: data.status,
        componentId: data.componentId,
      },
    });
  }

  async resolveIncident(incidentId: string) {
    return this.prisma.statusIncident.update({
      where: { id: incidentId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
      },
    });
  }

  async subscribe(statusPageId: string, email: string) {
    const existing = await this.prisma.statusSubscriber.findFirst({
      where: { statusPageId, email },
    });

    if (existing) {
      return existing;
    }

    const verifyToken = uuidv4();

    return this.prisma.statusSubscriber.create({
      data: {
        statusPageId,
        email,
        verifyToken,
      },
    });
  }

  async verifySubscription(token: string) {
    const subscriber = await this.prisma.statusSubscriber.findFirst({
      where: { verifyToken: token },
    });

    if (!subscriber) {
      throw new NotFoundException('Invalid verification token');
    }

    return this.prisma.statusSubscriber.update({
      where: { id: subscriber.id },
      data: { verified: true, verifyToken: null },
    });
  }

  async unsubscribe(statusPageId: string, email: string) {
    return this.prisma.statusSubscriber.deleteMany({
      where: { statusPageId, email },
    });
  }

  async getOverallStatus(organizationId: string): Promise<string> {
    const statusPage = await this.prisma.statusPage.findUnique({
      where: { organizationId },
      include: {
        components: true,
        incidents: {
          where: { resolvedAt: null },
        },
      },
    });

    if (!statusPage) return 'unknown';

    if (statusPage.incidents.length > 0) {
      const critical = statusPage.incidents.find(i => i.severity === 'critical');
      if (critical) return 'major_outage';
      return 'degraded';
    }

    const components = statusPage.components;
    const operational = components.filter(c => c.status === 'operational').length;
    
    if (operational === components.length) return 'operational';
    if (operational > components.length / 2) return 'degraded';
    return 'major_outage';
  }
}
