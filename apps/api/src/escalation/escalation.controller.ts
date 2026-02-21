import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EscalationService } from './escalation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';

@ApiTags('escalation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('escalation')
export class EscalationController {
  constructor(private escalation: EscalationService) {}

  @Get('tickets')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Get all escalated tickets' })
  getEscalatedTickets(@Req() req: any) {
    return this.escalation.getEscalatedTickets(req.user.organizationId);
  }

  @Get('stats')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get escalation statistics' })
  getStats(@Req() req: any) {
    return this.escalation.getEscalationStats(req.user.organizationId);
  }

  @Post('tickets/:id/escalate')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Manually escalate a ticket' })
  escalateTicket(
    @Param('id') id: string,
    @Req() req: any,
    @Body('reason') reason: string
  ) {
    return this.escalation.escalateTicket(id, reason, req.user.id, false);
  }

  @Post('tickets/:id/resolve')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Resolve ticket escalation' })
  resolveEscalation(@Param('id') id: string, @Req() req: any) {
    return this.escalation.resolveEscalation(id, req.user.id);
  }
}
