import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AssignmentService } from './assignment.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('assignment-rules')
@UseGuards(JwtAuthGuard)
export class AssignmentRuleController {
  constructor(
    private assignmentService: AssignmentService,
    private prisma: PrismaService,
  ) {}

  @Get()
  async listRules(@Request() req: any) {
    return this.prisma.assignmentRule.findMany({
      where: { organizationId: req.user.organizationId },
      include: { team: true },
      orderBy: { priority: 'desc' },
    });
  }

  @Post()
  async createRule(@Request() req: any, @Body() body: any) {
    return this.prisma.assignmentRule.create({
      data: {
        name: body.name,
        description: body.description,
        strategy: body.strategy,
        conditions: body.conditions,
        active: body.active ?? true,
        priority: body.priority ?? 0,
        teamId: body.teamId,
        organizationId: req.user.organizationId,
      },
    });
  }

  @Put(':id')
  async updateRule(@Param('id') id: string, @Body() body: any) {
    return this.prisma.assignmentRule.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        strategy: body.strategy,
        conditions: body.conditions,
        active: body.active,
        priority: body.priority,
        teamId: body.teamId,
      },
    });
  }

  @Delete(':id')
  async deleteRule(@Param('id') id: string) {
    await this.prisma.assignmentRule.delete({ where: { id } });
    return { success: true };
  }
}

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketAssignmentController {
  constructor(
    private assignmentService: AssignmentService,
    private prisma: PrismaService,
  ) {}

  @Post(':ticketId/assign')
  async assignTicket(
    @Param('ticketId') ticketId: string,
    @Body('assigneeId') assigneeId: string,
    @Request() req: any,
  ) {
    return this.assignmentService.manualAssign(ticketId, assigneeId, req.user.id);
  }

  @Post(':ticketId/auto-assign')
  async autoAssignTicket(@Param('ticketId') ticketId: string) {
    return this.assignmentService.autoAssignTicket(ticketId);
  }

  @Post(':ticketId/reassign')
  async reassignTicket(
    @Param('ticketId') ticketId: string,
    @Body('assigneeId') assigneeId: string,
    @Body('reason') reason: string,
  ) {
    return this.assignmentService.reassignTicket(ticketId, assigneeId, reason);
  }

  @Get('workload')
  async getWorkload(@Request() req: any) {
    return this.assignmentService.getAgentWorkload(req.user.organizationId);
  }

  @Post('workload/sync')
  async syncWorkload(@Request() req: any) {
    await this.assignmentService.syncWorkloads(req.user.organizationId);
    return { success: true };
  }
}
