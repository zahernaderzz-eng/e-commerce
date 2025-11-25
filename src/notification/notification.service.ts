// src/notification/notification.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import * as admin from 'firebase-admin';
import { Notification } from './entities/notification.entity';
import { FcmTokenService } from '../fcm-token/fcm-token.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { getMessaging } from '../firebase/firebase-admin';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,

    private readonly fcmTokenService: FcmTokenService,

    @InjectQueue('notification')
    private readonly notificationQueue: Queue,
  ) {}

  async sendToUser(
    userId: number,
    title: string,
    body: string,
    type: 'order' | 'promotion' | 'general' = 'general',
    data?: Record<string, any>,
  ) {
    await this.notificationQueue.add('send-to-user', {
      userId,
      title,
      body,
      type,
      data: data || {},
    });

    this.logger.log(`Queued notification for user ${userId}`);

    return {
      success: true,
      message: 'Notification queued successfully',
    };
  }

  async sendToUserInternal(
    userId: number,
    title: string,
    body: string,
    type: 'order' | 'promotion' | 'general',
    data?: Record<string, any>,
  ) {
    try {
      const tokens = await this.fcmTokenService.getActiveTokensByUser(userId);

      if (!tokens || tokens.length === 0) {
        this.logger.warn(` No active tokens for user ${userId}`);
        return {
          success: false,
          message: 'User has no active device tokens',
        };
      }

      this.logger.log(
        `Found ${tokens.length} active token(s) for user ${userId}`,
      );

      const result = await this.sendMulticast(tokens, title, body, data);

      this.logger.log(
        `Firebase result: ${result.successCount} success, ${result.failureCount} failed`,
      );

      await this.handleFailedTokens(result, tokens);

      await this.saveNotification(userId, title, body, type, data);

      return {
        success: true,
        message: 'Notification sent successfully',
        successCount: result.successCount,
        failureCount: result.failureCount,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to send notification to user ${userId}: ${error?.message || error}`,
      );
      throw error;
    }
  }

  private async sendMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<admin.messaging.BatchResponse> {
    // Ensure data values are strings (FCM requires string-string map)
    const preparedData: Record<string, string> = {};
    if (data) {
      Object.keys(data).forEach((k) => {
        const v = data[k];
        preparedData[k] = typeof v === 'string' ? v : JSON.stringify(v ?? '');
      });
    }

    const message: admin.messaging.MulticastMessage = {
      tokens,

      notification: {
        title,
        body,
      },

      data: preparedData,

      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
          priority: 'high',
        },
      },

      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true,
          },
        },
      },
    };

    try {
      const messaging = getMessaging();
      // use sendMulticast which returns BatchResponse
      const response = await messaging.sendEachForMulticast(message);

      this.logger.log(
        `Multicast result: ${response.successCount} success, ${response.failureCount} failed`,
      );

      return response;
    } catch (error: any) {
      this.logger.error(`Firebase multicast error: ${error?.message || error}`);
      throw error;
    }
  }

  private async handleFailedTokens(
    result: admin.messaging.BatchResponse,
    tokens: string[],
  ): Promise<void> {
    if (result.failureCount === 0) {
      this.logger.log('All tokens succeeded, no cleanup needed');
      return;
    }

    this.logger.warn(`${result.failureCount} token(s) failed, checking...`);

    const invalidTokens: string[] = [];

    result.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const errorCode = (resp.error as any).code;
        const token = tokens[idx];
        this.logger.debug(`Token ${idx}: ${errorCode}`);

        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/invalid-argument'
        ) {
          invalidTokens.push(token);
          this.logger.warn(
            ` Marking token for removal: ${token?.substring(0, 20) || token}...`,
          );
        } else if (errorCode === 'messaging/message-rate-exceeded') {
          this.logger.warn(`⏱ Rate limit exceeded for token ${idx}`);
        } else if (errorCode === 'messaging/third-party-auth-error') {
          this.logger.error(` Firebase auth error for token ${idx}`);
        } else {
          this.logger.error(` Unknown error for token ${idx}: ${errorCode}`);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await this.fcmTokenService.removeInvalidTokens(invalidTokens);
      this.logger.log(
        ` Removed ${invalidTokens.length} invalid token(s) from database`,
      );
    } else {
      this.logger.log('No invalid tokens to remove');
    }
  }

  private async saveNotification(
    userId: number,
    title: string,
    body: string,
    type: 'order' | 'promotion' | 'general',
    data?: Record<string, any>,
  ): Promise<Notification> {
    try {
      const notification = this.notificationRepo.create({
        userId: String(userId),
        title,
        body,
        type,
        data: data || {},
        isRead: false,
      });

      const saved = await this.notificationRepo.save(notification);

      this.logger.log(
        `Notification saved to DB (ID: ${saved.id}) for user ${userId}`,
      );

      return saved;
    } catch (error: any) {
      this.logger.error(
        `Failed to save notification for user ${userId}: ${
          (error as any)?.message || error
        }`,
      );
      throw error;
    }
  }

  async sendToMultipleUsers(
    userIds: number[],
    title: string,
    body: string,
    type: 'order' | 'promotion' | 'general' = 'general',
    data?: Record<string, any>,
  ) {
    if (!userIds || userIds.length === 0) {
      this.logger.warn('sendToMultipleUsers called with empty userIds array');
      return {
        success: false,
        message: 'No user IDs provided',
      };
    }

    await this.notificationQueue.add('send-to-multiple', {
      userIds,
      title,
      body,
      type,
      data: data || {},
    });

    this.logger.log(`Queued notification for ${userIds.length} users`);

    return {
      success: true,
      message: `Notification queued for ${userIds.length} users`,
    };
  }

  async sendToMultipleUsersInternal(
    userIds: number[],
    title: string,
    body: string,
    type: 'order' | 'promotion' | 'general',
    data?: Record<string, any>,
  ): Promise<void> {
    this.logger.log(
      `Starting to send notifications to ${userIds.length} users`,
    );

    let successCount = 0;
    let failureCount = 0;

    for (const userId of userIds) {
      try {
        await this.sendToUserInternal(userId, title, body, type, data);
        successCount++;

        this.logger.debug(`✅ Sent to user ${userId}`);
      } catch (error: any) {
        failureCount++;

        this.logger.error(
          `Failed to send to user ${userId}: ${error?.message || error}`,
        );
      }
    }

    this.logger.log(
      `📊 Batch complete: ${successCount} succeeded, ${failureCount} failed out of ${userIds.length} users`,
    );
  }

  async sendBroadcast(
    title: string,
    body: string,
    type: 'promotion' | 'general' = 'general',
    data?: Record<string, any>,
  ) {
    await this.notificationQueue.add('send-broadcast', {
      title,
      body,
      type,
      data: data || {},
    });

    this.logger.log(`Queued broadcast notification`);

    return {
      success: true,
      message: 'Broadcast notification queued',
    };
  }
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];

    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }

    return chunks;
  }

  async sendBroadcastInternal(
    title: string,
    body: string,
    type: 'promotion' | 'general',
    data?: Record<string, any>,
  ): Promise<void> {
    try {
      this.logger.log(` Starting broadcast notification...`);

      const allTokens = await this.fcmTokenService.getAllActiveTokens();

      if (!allTokens || allTokens.length === 0) {
        this.logger.warn(' No active tokens found for broadcast');
        return;
      }

      this.logger.log(`Found ${allTokens.length} active tokens for broadcast`);

      const batches = this.chunkArray(allTokens, 500);

      this.logger.log(`Split into ${batches.length} batches`);

      let totalSuccess = 0;
      let totalFailure = 0;

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        this.logger.log(
          `Sending batch ${i + 1}/${batches.length} (${batch.length} tokens)`,
        );

        try {
          const result = await this.sendMulticast(batch, title, body, data);

          totalSuccess += result.successCount;
          totalFailure += result.failureCount;

          await this.handleFailedTokens(result, batch);

          this.logger.log(
            `Batch ${i + 1} complete: ${result.successCount} success, ${result.failureCount} failed`,
          );
        } catch (error: any) {
          this.logger.error(
            `Batch ${i + 1} failed: ${error?.message || error}`,
          );
          totalFailure += batch.length;
        }
      }

      this.logger.log(
        `Broadcast complete: ${totalSuccess} succeeded, ${totalFailure} failed out of ${allTokens.length} total tokens`,
      );
    } catch (error: any) {
      this.logger.error(`Broadcast failed: ${error?.message || error}`);
      throw error;
    }
  }

  async getNotifications(userId: number, query: NotificationQueryDto) {
    const { page = 1, limit = 20, filter = 'all', type = 'all' } = query;

    const where: any = {
      userId: String(userId),
    };

    if (filter === 'read') {
      where.isRead = true;
    } else if (filter === 'unread') {
      where.isRead = false;
    }

    // Filter by type
    if (type !== 'all') {
      where.type = type;
    }

    const [notifications, total] = await this.notificationRepo.findAndCount({
      where,
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getUnreadCount(userId: number) {
    const count = await this.notificationRepo.count({
      where: {
        userId: String(userId),
        isRead: false,
      },
    });

    return {
      unreadCount: count,
    };
  }

  async markAsRead(userId: number, notificationId: string) {
    const notification = await this.notificationRepo.findOne({
      where: {
        id: notificationId,
        userId: String(userId),
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.isRead) {
      return {
        success: true,
        message: 'Notification already marked as read',
      };
    }

    notification.isRead = true;
    await this.notificationRepo.save(notification);

    return {
      success: true,
      message: 'Notification marked as read',
    };
  }

  async markAllAsRead(userId: number) {
    const result = await this.notificationRepo.update(
      {
        userId: String(userId),
        isRead: false,
      },
      {
        isRead: true,
      },
    );

    return {
      success: true,
      message: `Marked ${result.affected || 0} notification(s) as read`,
      count: result.affected || 0,
    };
  }

  async deleteNotification(userId: number, notificationId: string) {
    const notification = await this.notificationRepo.findOne({
      where: {
        id: notificationId,
        userId: String(userId),
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepo.delete({ id: notificationId });

    return {
      success: true,
      message: 'Notification deleted successfully',
    };
  }

  async sendNewProductNotificationToFollowers(
    userIds: number[],
    productId: number,
    productName: string,
  ) {
    if (!userIds || userIds.length === 0) {
      this.logger.log('No followers found for new product notification');
      return;
    }

    await this.sendToMultipleUsers(
      userIds,
      'New Product Added! ',
      `Check out our new product: ${productName}`,
      'promotion',
      { productId: String(productId) },
    );
  }
}
