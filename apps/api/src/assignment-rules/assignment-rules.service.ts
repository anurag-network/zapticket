import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssignmentRulesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.assignmentRule.findMany({
      where: { organizationId, isActive: true },
      include: { team: true },
      orderBy: { priority: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const rule = await this.prisma.assignmentRule.findFirst({
      where: { id, organizationId },
      include: { team: true },
    });
    if (!rule) throw new NotFoundException('Assignment rule not found');
    return rule;
  }

  async create(organizationId: string, data: {
    name: string;
    description?: string;
    conditions: any;
    actions: any;
    teamId?: string;
  }) {
    return this.prisma.assignmentRule.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, data: {
    name?: string;
    description?: string;
    conditions?: any;
    actions?: any;
    teamId?: string;
    isActive?: boolean;
  }) {
    const rule = await this.prisma.assignmentRule.findFirst({
      where: { id, organizationId },
    });
    if (!rule) throw new NotFoundException('Assignment rule not found');

    return this.prisma.assignmentRule.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    const rule = await this.prisma.assignmentRule.findFirst({
      where: { id, organizationId },
    });
    if (!rule) throw new NotFoundException('Assignment rule not found');

    return this.prisma.assignmentRule.delete({ where: { id } });
  }

  async applyRules(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) return null;

    const rules = await this.prisma.assignmentRule.findMany({
      where: { organizationId: ticket.organizationId, isActive: true },
      orderBy: { priority: 'asc' },
    });

    for (const rule of rules) {
      const matches = this.checkConditions(ticket, rule.conditions);
      if (matches) {
        const actions = rule.actions as any;
        if (actions.assignToTeam && rule.teamId) {
          const agents = await this.prisma.user.findMany({
            where: { teamId: rule.teamId, role: { in: ['AGENT', 'ADMIN'] } },
          });

          if (agents.length > 0) {
            const assignee = agents[Math.floor(Math.random() * agents.length)];
            await this.prisma.ticket.update({
              where: { id: ticketId },
              data: { assigneeId: assignee.id },
            });
            return assignee;
          }
        }
      }
    }
    return null;
  }

  private checkConditions(ticket: any, conditions: any): boolean {
    if (!conditions) return true;
    
    const { priority, status, channel, tags } = conditions;
    
    if (priority && ticket.priority !== priority) return false;
    if (status && ticket.status !== status) return false;
    if (channel && ticket.channelId !== channel) return false;
    
    return true;
  }
}
