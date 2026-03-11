import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChannelService } from './channel.service';

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelController {
  constructor(private channelService: ChannelService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.channelService.findAll(req.user.organizationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.channelService.findOne(id, req.user.organizationId);
  }

  @Post()
  async create(
    @Request() req: any,
    @Body() data: { type: string; name: string; config?: Record<string, any> },
  ) {
    return this.channelService.create(req.user.organizationId, data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() data: { name?: string; config?: Record<string, any>; active?: boolean },
  ) {
    return this.channelService.update(id, req.user.organizationId, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.channelService.delete(id, req.user.organizationId);
  }

  @Post(':id/toggle')
  async toggleActive(@Param('id') id: string, @Request() req: any) {
    return this.channelService.toggleActive(id, req.user.organizationId);
  }

  @Get(':id/config')
  async getConfig(@Param('id') id: string, @Request() req: any) {
    return this.channelService.getConfig(id, req.user.organizationId);
  }

  @Patch(':id/config')
  async updateConfig(
    @Param('id') id: string,
    @Request() req: any,
    @Body() config: Record<string, any>,
  ) {
    return this.channelService.updateConfig(id, req.user.organizationId, config);
  }

  @Get('type/:type')
  async getByType(@Param('type') type: string, @Request() req: any) {
    return this.channelService.getByType(req.user.organizationId, type);
  }
}
