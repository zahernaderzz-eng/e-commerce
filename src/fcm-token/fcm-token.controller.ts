import {
  Controller,
  Post,
  Body,
  Delete,
  Get,
  UseGuards,
  Param,
} from '@nestjs/common';
import { FcmTokenService } from './fcm-token.service';
import { RegisterTokenDto } from './dto/register-token.dto';

import { AuthenticationGuard } from '../guards/authentication.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('fcm-token')
export class FcmTokenController {
  constructor(private readonly tokenService: FcmTokenService) {}

  @UseGuards(AuthenticationGuard)
  @Post()
  async registerToken(
    @CurrentUser() userId: number,
    @Body() dto: RegisterTokenDto,
  ) {
    return this.tokenService.registerToken(userId, dto);
  }

  @UseGuards(AuthenticationGuard)
  @Delete(':token')
  async deleteToken(
    @CurrentUser() userId: number,
    @Param('token') token: string,
  ) {
    return this.tokenService.deactivateToken(userId, { deviceToken: token });
  }

  @UseGuards(AuthenticationGuard)
  @Get()
  async getMyTokens(@CurrentUser() userId: number) {
    return this.tokenService.getTokensByUser(userId);
  }
}
