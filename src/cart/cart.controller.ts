import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { CartService } from './cart.service';
import { AddItemDto } from './dto/item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@UseGuards(AuthenticationGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() userId: number) {
    return this.cartService.findCart(userId);
  }

  @Post('items')
  addItem(@Body() addItemDto: AddItemDto, @CurrentUser() userId: number) {
    return this.cartService.addItemTocart(addItemDto, userId);
  }

  @Patch('items/:id')
  updateItem(
    @Param('id', ParseIntPipe) itemId: number,
    @Body() updateItemDto: UpdateItemDto,
    @CurrentUser() userId: number,
  ) {
    return this.cartService.updateCartItem(
      { itemId, quantity: updateItemDto.quantity },
      userId,
    );
  }

  @Delete('items/:id')
  removeItem(
    @Param('id', ParseIntPipe) itemId: number,
    @CurrentUser() userId: number,
  ) {
    return this.cartService.removeItem(itemId, userId);
  }

  @Delete('clear')
  clearCart(@CurrentUser() userId: number) {
    return this.cartService.clearCart(userId);
  }
}
