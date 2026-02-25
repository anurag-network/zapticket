import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DraftsService } from './drafts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';

@ApiTags('Drafts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('drafts')
export class DraftsController {
  constructor(private drafts: DraftsService) {}

  @Get()
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Get all drafts for current user' })
  findAll(@Req() req: any) {
    return this.drafts.findAll(req.user.id);
  }

  @Get('ticket/:ticketId')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Get draft for a specific ticket' })
  findByTicket(@Param('ticketId') ticketId: string, @Req() req: any) {
    return this.drafts.findByTicket(ticketId, req.user.id);
  }

  @Post('ticket/:ticketId')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Save draft for a ticket' })
  save(
    @Param('ticketId') ticketId: string,
    @Req() req: any,
    @Body() body: { content: string; isInternal?: boolean }
  ) {
    return this.drafts.upsert(ticketId, req.user.id, body.content, body.isInternal);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Delete a draft' })
  delete(@Param('id') id: string, @Req() req: any) {
    return this.drafts.delete(id, req.user.id);
  }

  @Delete('ticket/:ticketId')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Delete draft for a ticket' })
  deleteByTicket(@Param('ticketId') ticketId: string, @Req() req: any) {
    return this.drafts.deleteByTicket(ticketId, req.user.id);
  }
}
