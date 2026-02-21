import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BulkOperationsService } from './bulk-operations.service';

@Controller('bulk-operations')
@UseGuards(JwtAuthGuard)
export class BulkOperationsController {
  constructor(private bulkOperationsService: BulkOperationsService) {}

  @Post('execute')
  async execute(
    @Request() req: any,
    @Body() body: {
      ticketIds: string[];
      action: string;
      value?: any;
    }
  ) {
    return this.bulkOperationsService.executeBulkOperation(
      req.user.organizationId,
      req.user.id,
      {
        ticketIds: body.ticketIds,
        action: body.action as any,
        value: body.value,
      }
    );
  }

  @Get('status/:operationId')
  async getStatus(@Param('operationId') operationId: string) {
    return this.bulkOperationsService.getOperationStatus(operationId);
  }

  @Get('history')
  async getHistory(
    @Request() req: any,
    @Query('limit') limit?: string
  ) {
    return this.bulkOperationsService.getOrganizationOperations(
      req.user.organizationId,
      limit ? parseInt(limit) : 20
    );
  }
}
