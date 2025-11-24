// notification/notification.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationProcessor } from './notification.processor';
import { FcmTokenModule } from '../fcm-token/fcm-token.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),

    BullModule.registerQueue({
      name: 'notification',
    }),

    FcmTokenModule,
  ],

  providers: [NotificationService, NotificationProcessor],

  controllers: [NotificationController],

  exports: [NotificationService],
})
export class NotificationModule {}
