import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScheduledReportsService } from './scheduled-reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';

@ApiTags('Scheduled Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scheduled-reports')
export class ScheduledReportsController {
  constructor(private reports: ScheduledReportsService) {}

  @Get()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get all scheduled reports' })
  findAll(@Req() req: any) {
    return this.reports.findAll(req.user.organizationId);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get scheduled report by ID' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.reports.findOne(id, req.user.organizationId);
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Create scheduled report' })
  create(@Req() req: any, @Body() data: {
    name: string;
    description?: string;
    type: string;
    frequency: string;
    recipients: string[];
    filters?: any;
    nextRunAt: Date;
  }) {
    return this.reports.create(req.user.organizationId, data);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update scheduled report' })
  update(@Param('id') id: string, @Req() req: any, @Body() data: {
    name?: string;
    description?: string;
    type?: string;
    frequency?: string;
    recipients?: string[];
    filters?: any;
    isActive?: boolean;
    nextRunAt?: Date;
  }) {
    return this.reports.update(id, req.user.organizationId, data);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Delete scheduled report' })
  delete(@Param('id') id: string, @Req() req: any) {
    return this.reports.delete(id, req.user.organizationId);
  }

  @Post(':id/run')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Run scheduled report immediately' })
  run(@Param('id') id: string, @Req() req: any) {
    return this.reports.runReport(id, req.user.organizationId);
  }
}
