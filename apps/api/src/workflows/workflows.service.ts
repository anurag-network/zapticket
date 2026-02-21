import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface WorkflowRule {
  id: string;
  name: string;
  description?: string;
  trigger: {
    type: 'ticket_created' | 'ticket_updated' | 'message_added';
    conditions: WorkflowCondition[];
  };
  actions: WorkflowAction[];
  active: boolean;
  priority: number;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'is_empty' | 'is_not_empty';
  value?: string;
}

export interface WorkflowAction {
  type: 'set_status' | 'set_priority' | 'assign_to' | 'add_tag' | 'send_email' | 'add_message';
  config: Record<string, any>;
}

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    const workflows = await this.prisma.workflow.findMany({
      where: { organizationId },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });

    return workflows.map((w) => ({
      ...w,
      trigger: w.trigger as any,
      actions: w.actions as any,
    }));
  }

  async findOne(id: string, organizationId: string) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, organizationId },
    });
    if (!workflow) throw new Error('Workflow not found');

    return {
      ...workflow,
      trigger: workflow.trigger as any,
      actions: workflow.actions as any,
    };
  }

  async create(organizationId: string, data: {
    name: string;
    description?: string;
    trigger: WorkflowRule['trigger'];
    actions: WorkflowAction[];
    active?: boolean;
    priority?: number;
  }) {
    const maxPriority = await this.prisma.workflow.aggregate({
      where: { organizationId },
      _max: { priority: true },
    });

    return this.prisma.workflow.create({
      data: {
        name: data.name,
        description: data.description,
        trigger: data.trigger as any,
        actions: data.actions as any,
        active: data.active ?? true,
        priority: data.priority ?? (maxPriority._max.priority || 0) + 1,
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, data: Partial<{
    name: string;
    description: string;
    trigger: WorkflowRule['trigger'];
    actions: WorkflowAction[];
    active: boolean;
    priority: number;
  }>) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, organizationId },
    });
    if (!workflow) throw new Error('Workflow not found');

    return this.prisma.workflow.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        trigger: data.trigger as any,
        actions: data.actions as any,
        active: data.active,
        priority: data.priority,
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, organizationId },
    });
    if (!workflow) throw new Error('Workflow not found');

    await this.prisma.workflow.delete({ where: { id } });
    return { success: true };
  }

  async executeWorkflow(workflowId: string, context: { ticketId: string; data: any }) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow || !workflow.active) return;

    const trigger = workflow.trigger as WorkflowRule['trigger'];
    const actions = workflow.actions as WorkflowAction[];

    for (const action of actions) {
      await this.executeAction(action, context);
    }
  }

  private async executeAction(action: WorkflowAction, context: { ticketId: string; data: any }) {
    const { ticketId } = context;

    switch (action.type) {
      case 'set_status':
        await this.prisma.ticket.update({
          where: { id: ticketId },
          data: { status: action.config.status as any },
        });
        break;

      case 'set_priority':
        await this.prisma.ticket.update({
          where: { id: ticketId },
          data: { priority: action.config.priority as any },
        });
        break;

      case 'assign_to':
        await this.prisma.ticket.update({
          where: { id: ticketId },
          data: { assigneeId: action.config.userId },
        });
        break;

      case 'add_tag':
        const tag = await this.prisma.tag.upsert({
          where: { name_organizationId: { name: action.config.tagName, organizationId: context.data.organizationId } },
          create: { name: action.config.tagName, organizationId: context.data.organizationId },
          update: {},
        });
        await this.prisma.ticketTag.create({
          data: { ticketId, tagId: tag.id },
        }).catch(() => {});
        break;

      case 'add_message':
        await this.prisma.message.create({
          data: {
            ticketId,
            authorId: action.config.authorId || '',
            content: action.config.message,
            type: 'NOTE',
          },
        });
        break;
    }
  }

  async processTrigger(
    type: 'ticket_created' | 'ticket_updated' | 'message_added',
    context: { ticketId: string; organizationId: string; data: any }
  ) {
    const workflows = await this.prisma.workflow.findMany({
      where: { organizationId: context.organizationId, active: true },
      orderBy: { priority: 'asc' },
    });

    for (const workflow of workflows) {
      const trigger = workflow.trigger as WorkflowRule['trigger'];
      
      if (trigger.type !== type) continue;

      const matches = this.evaluateConditions(trigger.conditions, context.data);
      
      if (matches) {
        await this.executeWorkflow(workflow.id, context);
      }
    }
  }

  private evaluateConditions(conditions: WorkflowCondition[], data: any): boolean {
    return conditions.every((condition) => {
      const fieldValue = this.getNestedValue(data, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
        case 'starts_with':
          return String(fieldValue).toLowerCase().startsWith(String(condition.value).toLowerCase());
        case 'is_empty':
          return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);
        case 'is_not_empty':
          return !!fieldValue && fieldValue !== '' && !(Array.isArray(fieldValue) && fieldValue.length === 0);
        default:
          return true;
      }
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
