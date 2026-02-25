import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DataExportService } from './data-export.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';

@ApiTags('Data Export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('export')
export class DataExportController {
  constructor(private exportService: DataExportService) {}

  @Get('tickets')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Export tickets to JSON or CSV' })
  exportTickets(
    @Req() req: any,
    @Query('format') format: 'json' | 'csv' = 'json',
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.exportService.exportTickets(req.user.organizationId, format, {
      status,
      priority,
      assigneeId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('customers')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Export customers to JSON or CSV' })
  exportCustomers(
    @Req() req: any,
    @Query('format') format: 'json' | 'csv' = 'json'
  ) {
    return this.exportService.exportCustomers(req.user.organizationId, format);
  }

  @Get('agents')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Export agents to JSON or CSV' })
  exportAgents(
    @Req() req: any,
    @Query('format') format: 'json' | 'csv' = 'json'
  ) {
    return this.exportService.exportAgents(req.user.organizationId, format);
  }
}
