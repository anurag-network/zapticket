import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VisualWorkflowService } from './visual-workflow.service';

@Controller('visual-workflows')
@UseGuards(JwtAuthGuard)
export class VisualWorkflowController {
  constructor(private workflowService: VisualWorkflowService) {}

  @Get()
  async listWorkflows(@Request() req: any) {
    return this.workflowService.getOrganizationWorkflows(req.user.organizationId);
  }

  @Get(':id')
  async getWorkflow(@Param('id') id: string) {
    return this.workflowService.getWorkflow(id);
  }

  @Post()
  async createWorkflow(
    @Request() req: any,
    @Body() body: {
      name: string;
      description?: string;
      triggerType: string;
      nodes: any[];
      edges: any[];
    }
  ) {
    return this.workflowService.createWorkflow(
      req.user.organizationId,
      body.name,
      body.description || '',
      body.triggerType,
      { nodes: body.nodes, edges: body.edges }
    );
  }

  @Put(':id')
  async updateWorkflow(
    @Param('id') id: string,
    @Body() body: Partial<{
      name: string;
      description: string;
      nodes: any[];
      edges: any[];
      active: boolean;
    }>
  ) {
    return this.workflowService.updateWorkflow(id, body);
  }

  @Delete(':id')
  async deleteWorkflow(@Param('id') id: string) {
    await this.workflowService.deleteWorkflow(id);
    return { success: true };
  }

  @Post(':id/execute')
  async executeWorkflow(
    @Param('id') id: string,
    @Body('ticketId') ticketId: string
  ) {
    await this.workflowService.executeWorkflow(id, ticketId);
    return { success: true };
  }

  @Get(':id/executions')
  async getExecutions(
    @Param('id') id: string,
    @Query('limit') limit?: string
  ) {
    return this.workflowService.getWorkflowExecutions(
      id,
      limit ? parseInt(limit) : 50
    );
  }
}
