import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';

import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthenticationGuard } from '../guards/authentication.guard';

@UseGuards(AuthenticationGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  create(@CurrentUser() userId: number) {
    return this.ordersService.createOrderFromCart(userId);
  }

  @Get()
  findAll(@CurrentUser() userId: number) {
    return this.ordersService.findAllForUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() userId: number) {
    return this.ordersService.findOneById(id, userId);
  }
}
