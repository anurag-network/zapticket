import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Res } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditLogService } from './audit-log.service';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private auditService: AuditLogService) {}

  @Get('logs')
  async getLogs(
    @Request() req: any,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditService.getLogs(req.user.organizationId, {
      userId,
      action,
      resource,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Get('export')
  async exportLogs(
    @Request() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format?: 'json' | 'csv',
  ) {
    return this.auditService.exportLogs(req.user.organizationId, {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      format: format as 'json' | 'csv',
    });
  }

  @Get('user/:userId')
  async getUserActivity(
    @Request() req: any,
    @Param('userId') userId: string,
    @Query('days') days?: string,
  ) {
    return this.auditService.getUserActivity(req.user.organizationId, userId, days ? parseInt(days) : 30);
  }

  @Get('resource/:resourceType/:resourceId')
  async getResourceHistory(
    @Request() req: any,
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.auditService.getResourceHistory(req.user.organizationId, resourceType, resourceId);
  }
}
