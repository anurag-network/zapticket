import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowsService, WorkflowAction, WorkflowRule } from './workflows.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';

@ApiTags('workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workflows')
export class WorkflowsController {
  constructor(private workflows: WorkflowsService) {}

  @Get()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'List all workflows' })
  findAll(@Req() req: any) {
    return this.workflows.findAll(req.user.organizationId);
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Create workflow' })
  create(
    @Req() req: any,
    @Body() data: {
      name: string;
      description?: string;
      trigger: WorkflowRule['trigger'];
      actions: WorkflowAction[];
      active?: boolean;
    }
  ) {
    return this.workflows.create(req.user.organizationId, data);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get workflow details' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.workflows.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update workflow' })
  update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() data: Partial<{
      name: string;
      description: string;
      trigger: WorkflowRule['trigger'];
      actions: WorkflowAction[];
      active: boolean;
      priority: number;
    }>
  ) {
    return this.workflows.update(id, req.user.organizationId, data);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Delete workflow' })
  delete(@Param('id') id: string, @Req() req: any) {
    return this.workflows.delete(id, req.user.organizationId);
  }
}
