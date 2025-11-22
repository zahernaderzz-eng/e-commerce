import {
  Body,
  Controller,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { OrdersService } from '../orders/orders.service';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @UseGuards(AuthenticationGuard)
  @Post('create-checkout-session')
  async createCheckoutSession(
    @Body() body: { orderId: string },
    @CurrentUser() userId: number,
  ) {
    return this.paymentService.createCheckoutSession(body.orderId, userId);
  }
}
