import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('reviews')
@UseGuards(AuthenticationGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  async create(@CurrentUser() userId: string, @Body() dto: CreateReviewDto) {
    const review = await this.reviewsService.create(+userId, dto);
    return { success: true, message: 'Review created', data: review };
  }

  @Get('product/:productId')
  async findByProduct(
    @Param('productId') productId: string,
    @Query('page') page = 1,
  ) {
    const reviews = await this.reviewsService.findByProduct(+productId, +page);
    return { success: true, data: reviews };
  }

  @Patch(':id')
  async update(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    const updated = await this.reviewsService.update(+userId, +id, dto);
    return { success: true, message: 'Review updated', data: updated };
  }

  @Delete(':id')
  async remove(@CurrentUser() userId: string, @Param('id') id: string) {
    await this.reviewsService.remove(+userId, +id);
    return { success: true, message: 'Review deleted' };
  }
}
