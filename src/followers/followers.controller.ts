import {
  Controller,
  Post,
  Delete,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FollowersService } from './followers.service';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('store')
@UseGuards(AuthenticationGuard)
export class FollowersController {
  constructor(private readonly followersService: FollowersService) {}

  @Post('follow')
  async follow(@CurrentUser() userId: number) {
    const data = await this.followersService.follow(userId);
    return { success: true, message: 'Followed store', data };
  }

  @Delete('unfollow')
  async unfollow(@CurrentUser() userId: number) {
    await this.followersService.unfollow(userId);
    return { success: true, message: 'Unfollowed store' };
  }

  @Get('followers')
  async list(@Query('page') page = 1) {
    const data = await this.followersService.list(+page);
    return { success: true, data };
  }
}
