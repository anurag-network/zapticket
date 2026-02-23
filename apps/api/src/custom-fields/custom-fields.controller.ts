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
import { CustomFieldsService } from './custom-fields.service';

@Controller('custom-fields')
@UseGuards(JwtAuthGuard)
export class CustomFieldsController {
  constructor(private customFieldsService: CustomFieldsService) {}

  @Post()
  async create(
    @Request() req: any,
    @Body()
    body: {
      name: string;
      key: string;
      type: string;
      required?: boolean;
      description?: string;
      placeholder?: string;
      defaultValue?: string;
      options?: Record<string, any>;
      validation?: Record<string, any>;
    },
  ) {
    return this.customFieldsService.create(req.user.organizationId, body);
  }

  @Get()
  async findAll(@Request() req: any, @Query('active') active?: string) {
    return this.customFieldsService.findByOrganization(
      req.user.organizationId,
      active === 'true',
    );
  }

  @Get(':id')
  async findOne(@Param('id') fieldId: string) {
    return this.customFieldsService.findOne(fieldId);
  }

  @Put(':id')
  async update(
    @Param('id') fieldId: string,
    @Body()
    body: {
      name?: string;
      required?: boolean;
      description?: string;
      placeholder?: string;
      defaultValue?: string;
      options?: Record<string, any>;
      validation?: Record<string, any>;
      active?: boolean;
    },
  ) {
    return this.customFieldsService.update(fieldId, body);
  }

  @Post('reorder')
  async reorder(@Request() req: any, @Body() body: { fieldIds: string[] }) {
    return this.customFieldsService.reorder(req.user.organizationId, body.fieldIds);
  }

  @Delete(':id')
  async delete(@Param('id') fieldId: string) {
    return this.customFieldsService.delete(fieldId);
  }
}

@Controller('tickets/:ticketId/custom-fields')
@UseGuards(JwtAuthGuard)
export class TicketCustomFieldsController {
  constructor(private customFieldsService: CustomFieldsService) {}

  @Get()
  async getTicketFieldValues(@Param('ticketId') ticketId: string) {
    return this.customFieldsService.getTicketFieldValues(ticketId);
  }

  @Post()
  async setFieldValues(
    @Param('ticketId') ticketId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.customFieldsService.setMultipleFieldValues(ticketId, body);
  }

  @Put(':fieldId')
  async setFieldValue(
    @Param('ticketId') ticketId: string,
    @Param('fieldId') fieldId: string,
    @Body() body: { value: any },
  ) {
    return this.customFieldsService.setFieldValue({
      fieldId,
      ticketId,
      value: body.value,
    });
  }

  @Delete()
  async deleteFieldValues(@Param('ticketId') ticketId: string) {
    return this.customFieldsService.deleteTicketFieldValues(ticketId);
  }
}
