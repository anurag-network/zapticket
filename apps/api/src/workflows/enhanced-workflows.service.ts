import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface TimeTrigger {
  type: 'delay' | 'scheduled' | ' SLA breach';
  delayMinutes?: number;
  scheduleCron?: string;
  slaBreachType?: 'response' | 'resolution';
}

interface WebhookAction {
  type: 'webhook' | 'http_request';
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  retryCount?: number;
}

interface BranchCondition {
  if: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  };
  then: string;
  else?: string;
}

interface EnhancedWorkflow {
  id: string;
  name: string;
  description?: string;
  trigger: {
    type: string;
    conditions?: any[];
    timeTrigger?: TimeTrigger;
  };
  conditions?: BranchCondition[];
  actions: any[];
  active: boolean;
  priority: number;
}

@Injectable()
export class EnhancedWorkflowsService {
  private readonly logger = new Logger(EnhancedWorkflowsService.name);

  constructor(private prisma: PrismaService) {}

  async createWithTimeTrigger(
    organizationId: string,
    data: {
      name: string;
      description?: string;
      triggerType: string;
      timeTrigger?: TimeTrigger;
      conditions?: any[];
      actions: any[];
      active?: boolean;
      priority?: number;
    },
  ) {
    const workflow = await this.prisma.workflow.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description,
        trigger: {
          type: data.triggerType,
          timeTrigger: data.timeTrigger,
          conditions: data.conditions || [],
        } as any,
        actions: data.actions as any,
        active: data.active ?? true,
        priority: data.priority ?? 0,
      },
    });

    if (data.timeTrigger?.type === 'scheduled' && data.timeTrigger.scheduleCron) {
      await this.scheduleWorkflow(workflow.id, data.timeTrigger.scheduleCron);
    }

    return workflow;
  }

  async executeWebhook(action: WebhookAction): Promise<any> {
    try {
      const response = await fetch(action.url, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
          ...action.headers,
        },
        body: action.body ? JSON.stringify(action.body) : undefined,
      });

      const responseData = await response.text();
      
      return {
        success: response.ok,
        status: response.status,
        response: responseData,
      };
    } catch (error) {
      this.logger.error(`Webhook execution failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async executeExternalAPI(action: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
    auth?: {
      type: 'bearer' | 'basic' | 'api_key';
      credentials: any;
    };
  }): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...action.headers,
      };

      if (action.auth) {
        switch (action.auth.type) {
          case 'bearer':
            headers['Authorization'] = `Bearer ${action.auth.credentials.token}`;
            break;
          case 'basic':
            const basicAuth = Buffer.from(
              `${action.auth.credentials.username}:${action.auth.credentials.password}`
            ).toString('base64');
            headers['Authorization'] = `Basic ${basicAuth}`;
            break;
          case 'api_key':
            headers[action.auth.credentials.headerName || 'X-API-Key'] = 
              action.auth.credentials.key;
            break;
        }
      }

      const response = await fetch(action.url, {
        method: action.method,
        headers,
        body: action.body ? JSON.stringify(action.body) : undefined,
      });

      const responseData = await response.text();
      
      return {
        success: response.ok,
        status: response.status,
        response: responseData,
      };
    } catch (error) {
      this.logger.error(`External API execution failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async evaluateBranch(
    conditions: BranchCondition[],
    context: Record<string, any>,
  ): Promise<string> {
    for (const condition of conditions) {
      const { field, operator, value } = condition.if;
      const fieldValue = this.getNestedValue(context, field);
      
      let matches = false;
      switch (operator) {
        case 'equals':
          matches = fieldValue === value;
          break;
        case 'not_equals':
          matches = fieldValue !== value;
          break;
        case 'contains':
          matches = String(fieldValue).includes(value);
          break;
        case 'greater_than':
          matches = Number(fieldValue) > Number(value);
          break;
        case 'less_than':
          matches = Number(fieldValue) < Number(value);
          break;
      }

      if (matches) {
        return condition.then;
      }
    }

    const lastCondition = conditions[conditions.length - 1];
    return lastCondition?.else || 'default';
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  private async scheduleWorkflow(workflowId: string, cron: string): Promise<void> {
    this.logger.log(`Scheduled workflow ${workflowId} with cron: ${cron}`);
  }

  async processTimeBasedTriggers(organizationId: string): Promise<void> {
    const workflows = await this.prisma.workflow.findMany({
      where: {
        organizationId,
        active: true,
      },
    });

    for (const workflow of workflows) {
      const trigger = workflow.trigger as any;
      if (trigger?.timeTrigger?.type === 'delay') {
        await this.processDelayTrigger(workflow, trigger.timeTrigger.delayMinutes);
      } else if (trigger?.timeTrigger?.type === 'SLA breach') {
        await this.processSLABreachTrigger(workflow, trigger.timeTrigger.slaBreachType);
      }
    }
  }

  private async processDelayTrigger(workflow: any, delayMinutes?: number): Promise<void> {
    if (!delayMinutes) return;

    const cutoffTime = new Date(Date.now() - delayMinutes * 60 * 1000);

    const tickets = await this.prisma.ticket.findMany({
      where: {
        organizationId: workflow.organizationId,
        createdAt: { lte: cutoffTime },
        workflowExecutions: {
          none: {
            workflowId: workflow.id,
          },
        },
      },
    });

    for (const ticket of tickets) {
      await this.executeWorkflow(workflow, ticket);
    }
  }

  private async processSLABreachTrigger(
    workflow: any,
    breachType?: 'response' | 'resolution',
  ): Promise<void> {
    const breaches = await this.prisma.sLABreach.findMany({
      where: {
        ticket: { organizationId: workflow.organizationId },
        breachType: breachType || 'RESPONSE',
      },
      include: { ticket: true },
    });

    for (const breach of breaches) {
      await this.executeWorkflow(workflow, breach.ticket);
    }
  }

  private async executeWorkflow(workflow: any, ticket: any): Promise<void> {
    try {
      const actions = workflow.actions as any[];
      
      for (const action of actions) {
        switch (action.type) {
          case 'webhook':
            await this.executeWebhook(action.config);
            break;
          case 'http_request':
            await this.executeExternalAPI(action.config);
            break;
          default:
            await this.executeDefaultAction(action, ticket);
        }
      }

      await this.prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          ticketId: ticket.id,
          executedAt: new Date(),
          status: 'COMPLETED',
        },
      });
    } catch (error) {
      this.logger.error(`Workflow execution failed: ${error.message}`);
      
      await this.prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          ticketId: ticket.id,
          executedAt: new Date(),
          status: 'FAILED',
          error: error.message,
        },
      });
    }
  }

  private async executeDefaultAction(action: any, ticket: any): Promise<void> {
    switch (action.type) {
      case 'set_status':
        await this.prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: action.config.status },
        });
        break;
      case 'set_priority':
        await this.prisma.ticket.update({
          where: { id: ticket.id },
          data: { priority: action.config.priority },
        });
        break;
      case 'assign_to':
        await this.prisma.ticket.update({
          where: { id: ticket.id },
          data: { assigneeId: action.config.userId },
        });
        break;
      case 'add_tag':
        const tag = await this.prisma.tag.upsert({
          where: {
            name_organizationId: {
              name: action.config.tagName,
              organizationId: ticket.organizationId,
            },
          },
          create: {
            name: action.config.tagName,
            organizationId: ticket.organizationId,
          },
          update: {},
        });
        await this.prisma.ticketTag.create({
          data: { ticketId: ticket.id, tagId: tag.id },
        });
        break;
    }
  }
}
