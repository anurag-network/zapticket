import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  data: Record<string, any>;
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

@Injectable()
export class VisualWorkflowService {
  private readonly logger = new Logger(VisualWorkflowService.name);

  constructor(private prisma: PrismaService) {}

  async createWorkflow(
    organizationId: string,
    name: string,
    description: string,
    triggerType: string,
    definition: WorkflowDefinition
  ) {
    return this.prisma.visualWorkflow.create({
      data: {
        organizationId,
        name,
        description,
        triggerType,
        nodes: definition.nodes as any,
        edges: definition.edges as any,
      },
    });
  }

  async updateWorkflow(
    workflowId: string,
    updates: Partial<{
      name: string;
      description: string;
      nodes: WorkflowNode[];
      edges: WorkflowEdge[];
      active: boolean;
    }>
  ) {
    return this.prisma.visualWorkflow.update({
      where: { id: workflowId },
      data: {
        ...updates,
        nodes: updates.nodes as any,
        edges: updates.edges as any,
      },
    });
  }

  async getWorkflow(workflowId: string) {
    return this.prisma.visualWorkflow.findUnique({
      where: { id: workflowId },
    });
  }

  async getOrganizationWorkflows(organizationId: string) {
    return this.prisma.visualWorkflow.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteWorkflow(workflowId: string) {
    await this.prisma.workflowExecution.deleteMany({
      where: { workflowId },
    });

    await this.prisma.visualWorkflow.delete({
      where: { id: workflowId },
    });
  }

  async executeWorkflow(workflowId: string, ticketId: string): Promise<void> {
    const workflow = await this.prisma.visualWorkflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow || !workflow.active) {
      return;
    }

    const execution = await this.prisma.workflowExecution.create({
      data: {
        workflowId,
        ticketId,
        status: 'running',
      },
    });

    try {
      const nodes = workflow.nodes as WorkflowNode[];
      const edges = workflow.edges as WorkflowEdge[];

      const executionLog: any[] = [];

      const triggerNode = nodes.find((n) => n.type === 'trigger');
      if (!triggerNode) {
        throw new Error('No trigger node found');
      }

      await this.executeNode(triggerNode, nodes, edges, ticketId, executionLog);

      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          executionLog: executionLog as any,
        },
      });

      this.logger.log(`Workflow ${workflowId} executed successfully for ticket ${ticketId}`);
    } catch (error) {
      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          error: error.message,
        },
      });

      this.logger.error(`Workflow ${workflowId} failed: ${error.message}`);
    }
  }

  private async executeNode(
    node: WorkflowNode,
    allNodes: WorkflowNode[],
    edges: WorkflowEdge[],
    ticketId: string,
    log: any[]
  ): Promise<void> {
    log.push({
      nodeId: node.id,
      type: node.type,
      timestamp: new Date(),
      action: 'started',
    });

    switch (node.type) {
      case 'trigger':
        break;

      case 'condition':
        const conditionMet = await this.evaluateCondition(node.data, ticketId);
        if (!conditionMet) {
          log.push({
            nodeId: node.id,
            timestamp: new Date(),
            action: 'condition_not_met',
          });
          return;
        }
        break;

      case 'action':
        await this.executeAction(node.data, ticketId);
        break;
    }

    log.push({
      nodeId: node.id,
      timestamp: new Date(),
      action: 'completed',
    });

    const outgoingEdges = edges.filter((e) => e.source === node.id);
    for (const edge of outgoingEdges) {
      const nextNode = allNodes.find((n) => n.id === edge.target);
      if (nextNode) {
        await this.executeNode(nextNode, allNodes, edges, ticketId, log);
      }
    }
  }

  private async evaluateCondition(data: Record<string, any>, ticketId: string): Promise<boolean> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) return false;

    switch (data.conditionType) {
      case 'priority':
        return ticket.priority === data.value;

      case 'status':
        return ticket.status === data.value;

      case 'has_tag':
        const tag = await this.prisma.ticketTag.findFirst({
          where: { ticketId, tagId: data.tagId },
        });
        return !!tag;

      case 'time_elapsed':
        const hoursSinceCreation =
          (Date.now() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceCreation >= (data.hours || 0);

      default:
        return true;
    }
  }

  private async executeAction(data: Record<string, any>, ticketId: string): Promise<void> {
    switch (data.actionType) {
      case 'update_status':
        await this.prisma.ticket.update({
          where: { id: ticketId },
          data: { status: data.status },
        });
        break;

      case 'update_priority':
        await this.prisma.ticket.update({
          where: { id: ticketId },
          data: { priority: data.priority },
        });
        break;

      case 'add_tag':
        await this.prisma.ticketTag.create({
          data: {
            ticketId,
            tagId: data.tagId,
          },
        });
        break;

      case 'assign_agent':
        await this.prisma.ticket.update({
          where: { id: ticketId },
          data: { assigneeId: data.agentId },
        });
        break;

      case 'add_note':
        await this.prisma.message.create({
          data: {
            ticketId,
            authorId: data.authorId || 'system',
            content: data.noteContent,
            type: 'NOTE',
          },
        });
        break;

      case 'escalate':
        await this.prisma.ticket.update({
          where: { id: ticketId },
          data: {
            status: 'ESCALATED',
            escalatedAt: new Date(),
            escalatedReason: data.reason || 'Workflow escalation',
          },
        });
        break;

      case 'send_webhook':
        await fetch(data.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId, data: data.webhookData }),
        });
        break;

      default:
        this.logger.warn(`Unknown action type: ${data.actionType}`);
    }
  }

  async getWorkflowExecutions(workflowId: string, limit: number = 50) {
    return this.prisma.workflowExecution.findMany({
      where: { workflowId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  async triggerWorkflowsForTicket(ticketId: string, triggerType: string): Promise<void> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) return;

    const workflows = await this.prisma.visualWorkflow.findMany({
      where: {
        organizationId: ticket.organizationId,
        triggerType,
        active: true,
      },
    });

    for (const workflow of workflows) {
      await this.executeWorkflow(workflow.id, ticketId);
    }
  }
}
