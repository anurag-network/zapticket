import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentStrategy, Ticket, User } from '@prisma/client';

interface TicketWithTags extends Ticket {
  tags?: { tagId: string }[];
}

interface AssignmentResult {
  success: boolean;
  assigneeId?: string;
  assignee?: Partial<User>;
  reason?: string;
}

@Injectable()
export class AssignmentService {
  private readonly logger = new Logger(AssignmentService.name);

  constructor(private prisma: PrismaService) {}

  async autoAssignTicket(ticketId: string): Promise<AssignmentResult> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        tags: { select: { tagId: true } },
        organization: {
          include: {
            assignmentRules: {
              where: { active: true },
              orderBy: { priority: 'desc' },
            },
          },
        },
      },
    });

    if (!ticket) {
      return { success: false, reason: 'Ticket not found' };
    }

    if (ticket.assigneeId) {
      return { success: false, reason: 'Ticket already assigned' };
    }

    const rules = ticket.organization?.assignmentRules || [];

    for (const rule of rules) {
      if (!this.matchesConditions(ticket, rule.conditions as Record<string, any>)) {
        continue;
      }

      const assignee = await this.findAssignee(
        ticket.organizationId,
        rule.strategy,
        rule.teamId,
        ticket
      );

      if (assignee) {
        await this.prisma.ticket.update({
          where: { id: ticketId },
          data: { assigneeId: assignee.id },
        });

        await this.incrementWorkload(assignee.id);

        this.logger.log(`Auto-assigned ticket ${ticketId} to agent ${assignee.id} using ${rule.strategy}`);

        return {
          success: true,
          assigneeId: assignee.id,
          assignee: { id: assignee.id, name: assignee.name, email: assignee.email },
          reason: `Assigned using ${rule.strategy} strategy`,
        };
      }
    }

    return { success: false, reason: 'No matching assignment rule or available agent' };
  }

  async manualAssign(ticketId: string, assigneeId: string, assignedById: string): Promise<AssignmentResult> {
    const existingAssignment = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { assigneeId: true },
    });

    if (existingAssignment?.assigneeId) {
      return { success: false, reason: 'Ticket already assigned to another agent' };
    }

    const assignee = await this.prisma.user.findUnique({
      where: { id: assigneeId },
    });

    if (!assignee) {
      return { success: false, reason: 'Assignee not found' };
    }

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { assigneeId },
    });

    await this.incrementWorkload(assigneeId);

    return {
      success: true,
      assigneeId: assignee.id,
      assignee: { id: assignee.id, name: assignee.name, email: assignee.email },
      reason: 'Manually assigned',
    };
  }

  async reassignTicket(ticketId: string, newAssigneeId: string, reason: string): Promise<AssignmentResult> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return { success: false, reason: 'Ticket not found' };
    }

    const previousAssigneeId = ticket.assigneeId;

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { assigneeId: newAssigneeId },
    });

    if (previousAssigneeId) {
      await this.decrementWorkload(previousAssigneeId);
    }
    await this.incrementWorkload(newAssigneeId);

    const newAssignee = await this.prisma.user.findUnique({
      where: { id: newAssigneeId },
    });

    return {
      success: true,
      assigneeId: newAssigneeId,
      assignee: newAssignee ? { id: newAssignee.id, name: newAssignee.name, email: newAssignee.email } : undefined,
      reason: `Reassigned: ${reason}`,
    };
  }

  private matchesConditions(ticket: TicketWithTags, conditions: Record<string, any> | null): boolean {
    if (!conditions) return true;

    if (conditions.priority && conditions.priority.length > 0) {
      if (!conditions.priority.includes(ticket.priority)) return false;
    }

    if (conditions.channelType && conditions.channelType.length > 0) {
      if (ticket.channelId) {
        const channel = this.prisma.channel.findUnique({
          where: { id: ticket.channelId },
        });
      }
    }

    return true;
  }

  private async findAssignee(
    organizationId: string,
    strategy: AssignmentStrategy,
    teamId?: string | null,
    ticket?: TicketWithTags | null
  ): Promise<User | null> {
    const whereClause: any = {
      organizationId,
      role: { in: ['AGENT', 'ADMIN', 'OWNER'] },
    };

    if (teamId) {
      whereClause.teamId = teamId;
    }

    const agents = await this.prisma.user.findMany({
      where: whereClause,
      include: { workload: true },
    });

    if (agents.length === 0) return null;

    switch (strategy) {
      case AssignmentStrategy.ROUND_ROBIN:
        return this.roundRobinSelect(agents, organizationId, teamId);

      case AssignmentStrategy.LEAST_BUSY:
        return this.leastBusySelect(agents);

      case AssignmentStrategy.RANDOM:
        return agents[Math.floor(Math.random() * agents.length)];

      case AssignmentStrategy.SKILLS_BASED:
        return this.skillsBasedSelect(agents, ticket);

      default:
        return agents[0];
    }
  }

  private async roundRobinSelect(agents: User[], organizationId: string, teamId?: string | null): Promise<User> {
    const workloads = await this.prisma.agentWorkload.findMany({
      where: {
        organizationId,
        agentId: { in: agents.map(a => a.id) },
      },
      orderBy: { lastAssignedAt: 'asc' },
    });

    if (workloads.length === 0) {
      return agents[0];
    }

    const oldestWorkload = workloads[0];
    return agents.find(a => a.id === oldestWorkload.agentId) || agents[0];
  }

  private leastBusySelect(agents: (User & { workload?: any })[]): User {
    const sorted = [...agents].sort((a, b) => {
      const aLoad = a.workload?.openTickets || 0;
      const bLoad = b.workload?.openTickets || 0;
      return aLoad - bLoad;
    });

    return sorted[0];
  }

  private skillsBasedSelect(agents: User[], ticket?: TicketWithTags | null): User {
    return agents[0];
  }

  private async incrementWorkload(agentId: string): Promise<void> {
    await this.prisma.agentWorkload.upsert({
      where: { agentId },
      create: {
        agentId,
        openTickets: 1,
        lastAssignedAt: new Date(),
        organizationId: (await this.prisma.user.findUnique({ where: { id: agentId } }))?.organizationId || '',
      },
      update: {
        openTickets: { increment: 1 },
        lastAssignedAt: new Date(),
      },
    });
  }

  private async decrementWorkload(agentId: string): Promise<void> {
    const workload = await this.prisma.agentWorkload.findUnique({
      where: { agentId },
    });

    if (workload && workload.openTickets > 0) {
      await this.prisma.agentWorkload.update({
        where: { agentId },
        data: { openTickets: { decrement: 1 } },
      });
    }
  }

  async getAgentWorkload(organizationId: string): Promise<{ agentId: string; agentName: string | null; openTickets: number; lastAssignedAt: Date | null }[]> {
    const workloads = await this.prisma.agentWorkload.findMany({
      where: { organizationId },
      include: { agent: { select: { id: true, name: true } } },
      orderBy: { openTickets: 'desc' },
    });

    return workloads.map(w => ({
      agentId: w.agentId,
      agentName: w.agent?.name,
      openTickets: w.openTickets,
      lastAssignedAt: w.lastAssignedAt,
    }));
  }

  async syncWorkloads(organizationId: string): Promise<void> {
    const agents = await this.prisma.user.findMany({
      where: {
        organizationId,
        role: { in: ['AGENT', 'ADMIN', 'OWNER'] },
      },
      include: {
        assignedTickets: {
          where: {
            status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'ESCALATED'] },
          },
        },
      },
    });

    for (const agent of agents) {
      await this.prisma.agentWorkload.upsert({
        where: { agentId: agent.id },
        create: {
          agentId: agent.id,
          organizationId,
          openTickets: agent.assignedTickets.length,
        },
        update: {
          openTickets: agent.assignedTickets.length,
        },
      });
    }
  }
}
