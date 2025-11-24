// notification/notification.controller.t
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { NotificationQueryDto } from './dto/notification-query.dto';

@Controller('notifications')
@UseGuards(AuthenticationGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getMyNotifications(
    @CurrentUser() userId: number,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationService.getNotifications(userId, query);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() userId: number) {
    return this.notificationService.getUnreadCount(userId);
  }
  @Patch(':id/read')
  async markAsRead(
    @CurrentUser() userId: number,
    @Param('id', ParseUUIDPipe) notificationId: string,
  ) {
    return this.notificationService.markAsRead(userId, notificationId);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() userId: number) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Delete(':id')
  async deleteNotification(
    @CurrentUser() userId: number,
    @Param('id', ParseUUIDPipe) notificationId: string,
  ) {
    return this.notificationService.deleteNotification(userId, notificationId);
  }
}
