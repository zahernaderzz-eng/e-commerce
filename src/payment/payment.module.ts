import { Module } from '@nestjs/common';

import { RawWebhookController } from './webhook.controller';
import { ConfigModule } from '@nestjs/config';
import { OrdersModule } from '../orders/orders.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot(),
    OrdersModule,
    BullModule.forRoot({
      connection: { host: 'localhost', port: 6379 },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'fixed', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullModule.registerQueue({ name: 'email' }),
  ],
  providers: [PaymentService],
  controllers: [PaymentController, RawWebhookController],
})
export class PaymentModule {}
