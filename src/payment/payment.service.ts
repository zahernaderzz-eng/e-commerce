import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { OrderItem } from '../orders/entities/order-item.entity';
import { StautsOrder } from '../orders/enums/order-status.enum';
import { OrdersService } from '../orders/orders.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private logger = new Logger(PaymentService.name);

  constructor(
    private config: ConfigService,
    private orderService: OrdersService,
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {
    this.stripe = new Stripe(this.config.getOrThrow('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-11-17.clover',
    });
  }

  async createCheckoutSession(orderId: string, userId: number) {
    this.logger.log(`Creating checkout session for order ${orderId}`);

    try {
      const order = await this.orderService.findOne(orderId, {
        relations: ['items', 'items.product'],
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      if (order.status === StautsOrder.paid) {
        throw new BadRequestException('This order has already been paid');
      }

      if (order.paymentIntentId) {
        throw new BadRequestException(
          'Payment is already in progress for this order',
        );
      }

      if (order.userId !== userId) {
        throw new ForbiddenException('You cannot pay for this order');
      }

      if (!order.items || order.items.length === 0) {
        throw new BadRequestException('Cannot process empty order');
      }

      //Stripe Line Items Important
      const line_items = order.items.map((item: OrderItem) => {
        const priceNumber = Number(item.unitPrice);

        if (isNaN(priceNumber) || priceNumber <= 0) {
          this.logger.error(
            `Invalid unitPrice for item ${item.id}: ${item.unitPrice}`,
          );
          throw new BadRequestException(
            `Invalid price for product ${item.productId}`,
          );
        }

        const unit_amount = Math.round(priceNumber * 100);

        if (!Number.isInteger(unit_amount) || unit_amount <= 0) {
          this.logger.error(
            `Invalid unit_amount for item ${item.id}: ${unit_amount}`,
          );
          throw new BadRequestException(
            `Invalid amount for product ${item.productId}`,
          );
        }

        const quantity = Number(item.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          this.logger.error(
            `Invalid quantity for item ${item.id}: ${item.quantity}`,
          );
          throw new BadRequestException(
            `Invalid quantity for product ${item.productId}`,
          );
        }

        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.product?.title ?? `Product ${item.productId}`,
              description: item.product?.description,
            },
            unit_amount,
          },
          quantity,
        };
      });

      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items,
        metadata: {
          orderId: order.id,
          userId: userId.toString(),
        },
        success_url: `https://google.com?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://google.com`,

        expires_at: Math.floor(Date.now() / 1000) + 1800,
        customer_email: order.user?.email,
      });

      this.logger.log(
        `Checkout session created: ${session.id} for order ${orderId}`,
      );

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException ||
        err instanceof ForbiddenException
      ) {
        throw err;
      }

      this.logger.error(
        `Failed to create checkout session for order ${orderId}: ${err.message}`,
        err.stack,
      );
      throw new InternalServerErrorException(
        'Failed to create checkout session',
      );
    }
  }
  async handleWebhook(event: Stripe.Event) {
    this.logger.log(`Received webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        const paymentIntentId = session.payment_intent as string;
        const paymentStatus = session.payment_status;

        this.logger.log(
          `Checkout completed for order ${orderId}, PaymentIntent: ${paymentIntentId}`,
        );

        if (paymentStatus === 'paid') {
          try {
            // Store the PaymentIntent ID
            await this.orderService.updatePaymentInfo(orderId!, {
              paymentIntentId: paymentIntentId,
            });

            // Update order status
            await this.orderService.updateOrderStatus(
              orderId!,
              StautsOrder.paid,
            );

            // Reduce stock after successful payment
            await this.orderService.reduceStockForOrder(orderId!);
            const order = await this.orderService.findOne(orderId!, {
              relations: ['items', 'items.product', 'user'],
            });
            await this.emailQueue.add('order-confirmation', {
              to: order.user.email,
              orderData: {
                orderId: order.id,
                total: Number(order.total),
                items: order.items.map((item) => ({
                  productName: item.product.title,
                  quantity: item.quantity,
                  unitPrice: Number(item.unitPrice),
                  lineTotal: Number(item.lineTotal),
                })),
                createdAt: order.createAt,
              },
            });

            this.logger.log(` Order ${orderId} processed and email sent`);

            return { orderId, status: 'paid', paymentIntentId };
          } catch (error) {
            this.logger.error(
              `Failed to process paid order ${orderId}:`,
              error.stack,
            );

            await this.orderService.updateOrderStatus(
              orderId!,
              StautsOrder.failed,
            );

            throw error;
          }
        }

        this.logger.warn(`Order ${orderId} payment status: ${paymentStatus}`);
        break;

      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        const failedOrderId = failedPaymentIntent.metadata?.orderId;

        this.logger.error(
          `Payment failed for order ${failedOrderId}, PaymentIntent: ${failedPaymentIntent.id}`,
        );

        if (failedOrderId) {
          await this.orderService.updatePaymentInfo(failedOrderId, {
            paymentIntentId: failedPaymentIntent.id,
            paymentStatus: 'failed',
          });

          await this.orderService.updateOrderStatus(
            failedOrderId,
            StautsOrder.failed,
          );
        }
        break;

      default:
        this.logger.warn(`Unhandled event type: ${event.type}`);
    }
  }
}
