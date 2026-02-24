import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EnhancedWorkflowsService } from './enhanced-workflows.service';

@Controller('workflows/enhanced')
@UseGuards(JwtAuthGuard)
export class EnhancedWorkflowsController {
  constructor(private enhancedWorkflows: EnhancedWorkflowsService) {}

  @Post()
  async createWorkflow(
    @Request() req: any,
    @Body() data: {
      name: string;
      description?: string;
      triggerType: string;
      timeTrigger?: {
        type: 'delay' | 'scheduled' | 'SLA breach';
        delayMinutes?: number;
        scheduleCron?: string;
        slaBreachType?: 'response' | 'resolution';
      };
      conditions?: any[];
      actions: any[];
      active?: boolean;
      priority?: number;
    },
  ) {
    return this.enhancedWorkflows.createWithTimeTrigger(
      req.user.organizationId,
      data,
    );
  }

  @Post('execute-webhook')
  async executeWebhook(@Body() action: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
    retryCount?: number;
  }) {
    return this.enhancedWorkflows.executeWebhook(action);
  }

  @Post('execute-api')
  async executeExternalAPI(@Body() action: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
    auth?: {
      type: 'bearer' | 'basic' | 'api_key';
      credentials: any;
    };
  }) {
    return this.enhancedWorkflows.executeExternalAPI(action);
  }

  @Post('process-time-triggers')
  async processTimeTriggers(@Request() req: any) {
    await this.enhancedWorkflows.processTimeBasedTriggers(req.user.organizationId);
    return { success: true };
  }

  @Post('evaluate-branch')
  async evaluateBranch(
    @Body() body: {
      conditions: any[];
      context: Record<string, any>;
    },
  ) {
    const result = await this.enhancedWorkflows.evaluateBranch(
      body.conditions,
      body.context,
    );
    return { path: result };
  }
}
