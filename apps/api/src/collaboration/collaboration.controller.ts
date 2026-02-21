import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CollaborationService } from './collaboration.service';

@Controller('collaboration')
@UseGuards(JwtAuthGuard)
export class CollaborationController {
  constructor(private collaborationService: CollaborationService) {}

  @Post('ticket/:ticketId/join')
  async joinTicket(@Param('ticketId') ticketId: string, @Request() req: any) {
    return this.collaborationService.joinTicket(ticketId, req.user.id);
  }

  @Delete('ticket/:ticketId/leave')
  async leaveTicket(@Param('ticketId') ticketId: string, @Request() req: any) {
    await this.collaborationService.leaveTicket(ticketId, req.user.id);
    return { success: true };
  }

  @Post('ticket/:ticketId/start-editing')
  async startEditing(@Param('ticketId') ticketId: string, @Request() req: any) {
    return this.collaborationService.startEditing(ticketId, req.user.id);
  }

  @Post('ticket/:ticketId/stop-editing')
  async stopEditing(@Param('ticketId') ticketId: string, @Request() req: any) {
    await this.collaborationService.stopEditing(ticketId, req.user.id);
    return { success: true };
  }

  @Post('ticket/:ticketId/cursor')
  async updateCursor(
    @Param('ticketId') ticketId: string,
    @Request() req: any,
    @Body() body: { line: number; column: number }
  ) {
    await this.collaborationService.updateCursorPosition(
      ticketId,
      req.user.id,
      body
    );
    return { success: true };
  }

  @Post('ticket/:ticketId/heartbeat')
  async heartbeat(@Param('ticketId') ticketId: string, @Request() req: any) {
    await this.collaborationService.heartbeat(ticketId, req.user.id);
    return { success: true };
  }

  @Get('ticket/:ticketId/collaborators')
  async getCollaborators(@Param('ticketId') ticketId: string) {
    return this.collaborationService.getActiveCollaborators(ticketId);
  }
}
