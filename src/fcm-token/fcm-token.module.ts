import { Module } from '@nestjs/common';
import { FcmTokenService } from './fcm-token.service';
import { FcmTokenController } from './fcm-token.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FcmToken } from './entities/fcm-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FcmToken])],
  controllers: [FcmTokenController],
  providers: [FcmTokenService],
  exports: [FcmTokenService],
})
export class FcmTokenModule {}
