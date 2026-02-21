import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('unread') unread?: string
  ) {
    return this.notificationService.getUserNotifications(
      req.user.id,
      limit ? parseInt(limit) : 50,
      unread === 'true'
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationService.getUnreadCount(req.user.id);
    return { count };
  }

  @Post(':id/read')
  async markAsRead(@Param('id') notificationId: string) {
    return this.notificationService.markAsRead(notificationId);
  }

  @Post('read-all')
  async markAllAsRead(@Request() req: any) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  async deleteNotification(@Param('id') notificationId: string) {
    return this.notificationService.deleteNotification(notificationId);
  }

  @Delete('read')
  async deleteAllRead(@Request() req: any) {
    return this.notificationService.deleteAllRead(req.user.id);
  }
}
