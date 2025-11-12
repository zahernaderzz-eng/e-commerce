import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { MailService } from './mail.service';
import { MailProcessor } from './email.worker.processor';
import { redisConnectionOptions } from '../config/redis.config';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('SMTP_HOST'),
          port: config.get<number>('SMTP_PORT'),
          secure: false,
          auth: {
            user: config.get<string>('SMTP_USERNAME'),
            pass: config.get<string>('SMTP_PASSWORD'),
          },
        },
      }),
    }),

    BullModule.registerQueue({
      name: 'email',
      connection: redisConnectionOptions,
    }),
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule {}
