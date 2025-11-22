import { Controller, Post, Req, Res, Headers, HttpCode } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class RawWebhookController {
  constructor(
    private paymentService: PaymentService,
    private config: ConfigService,
  ) {}

  @Post('/payment/webhook')
  @HttpCode(200)
  async handleRawWebhook(
    @Req() req: any,
    @Res() res: any,
    @Headers('stripe-signature') signature: string,
  ) {
    let event;
    const secret = this.config.get('STRIPE_WEBHOOK_SECRET');

    try {
      const payload = req.rawBody || req.body;

      if (!payload) {
        throw new Error('No payload received');
      }

      event = this.paymentService['stripe'].webhooks.constructEvent(
        payload,
        signature,
        secret!,
      );

      console.log('Webhook verified successfully:', event.type);
    } catch (err) {
      console.error(' Webhook signature error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    await this.paymentService.handleWebhook(event);
    return res.status(200).json({ received: true });
  }
}
