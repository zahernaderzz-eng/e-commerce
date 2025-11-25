import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';

import { DataSource, Repository } from 'typeorm';
import { CartService } from '../cart/cart.service';
import { Product } from '../products/entities/product.entity';
import { Order } from './entities/order.entity';
import { StautsOrder } from './enums/order-status.enum';
import { OrderItem } from './entities/order-item.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    private dataSource: DataSource,
    private cartService: CartService,
    private notificationService: NotificationService,
  ) {}
  async createOrderFromCart(userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const toMoney = (value: number) => Number(value.toFixed(2));

    try {
      const cart = await this.cartService.findCart(userId);
      if (!cart || !cart.items || cart.items.length === 0) {
        throw new BadRequestException('Cart not found or empty');
      }

      for (const item of cart.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new ConflictException(
            `Not enough stock for product ${product.id}`,
          );
        }

        item.product = product;
      }

      const order = new Order();
      order.userId = userId;
      order.status = StautsOrder.pending;
      order.total = toMoney(0);
      order.items = [];

      for (const item of cart.items) {
        const product = item.product as Product;

        const unitPrice = Number(product.price);
        const quantity = Number(item.quantity);

        const lineTotal = toMoney(unitPrice * quantity);

        const orderItem = new OrderItem();
        orderItem.product = product;
        orderItem.productId = product.id;
        orderItem.quantity = quantity;
        orderItem.unitPrice = toMoney(unitPrice);
        orderItem.lineTotal = toMoney(lineTotal);

        order.items.push(orderItem);

        order.total = toMoney(order.total + lineTotal);
      }

      const createdOrder = await queryRunner.manager.save(Order, order);

      await queryRunner.manager.delete(CartItem, { cartId: cart.id });

      await queryRunner.commitTransaction();

      await this.notificationService.sendToUser(
        userId,
        'Order Received!',
        `Your order #${createdOrder.id.substring(0, 8)} has been received and is being processed`,
        'order',
        {
          orderId: createdOrder.id,
          screen: 'OrderDetails',
          orderStatus: StautsOrder.pending,
        },
      );

      this.logger.log(`Notification queued for order ${createdOrder.id}`);
      return createdOrder;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
  async reduceStockForOrder(orderId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items', 'items.product'],
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      if (order.stockReduced) {
        this.logger.warn(`Stock already reduced for order ${orderId}`);
        return;
      }

      for (const item of order.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new ConflictException(
            `Not enough stock for product ${product.id}. Available: ${product.stock}, Required: ${item.quantity}`,
          );
        }

        product.stock = product.stock - item.quantity;

        if (product.stock < 0) {
          throw new ConflictException(
            `Invalid stock state for product ${product.id}`,
          );
        }

        await queryRunner.manager.save(Product, product);
      }

      order.stockReduced = true;
      await queryRunner.manager.save(Order, order);

      await queryRunner.commitTransaction();

      await this.notificationService.sendToUser(
        order.userId,
        'Payment Successful!',
        `Payment confirmed for order #${orderId.substring(0, 8)}. Your order is being prepared`,
        'order',
        {
          orderId: order.id,
          screen: 'OrderDetails',
          orderStatus: order.status,
        },
      );
      this.logger.log(`Stock reduced successfully for order ${orderId}`);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to reduce stock for order ${orderId}:`, err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllForUser(userId: number) {
    return this.orderRepository.find({
      where: { userId },
      relations: {
        items: {
          product: true,
        },
      },
      order: {
        createAt: 'DESC',
      },
    });
  }

  async findOneById(orderId: string, userId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        items: {
          product: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async getOrderById(id: string) {
    return this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });
  }

  async updateOrderStatus(id: string, status: StautsOrder) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user'], // ← نجيب الـ user عشان نبعتله notification
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const oldStatus = order.status;
    order.status = status;

    const updatedOrder = await this.orderRepository.save(order);

    await this.sendStatusNotification(order.userId, id, status, oldStatus);

    return updatedOrder;
  }

  async updatePaymentInfo(
    orderId: string,
    paymentInfo: {
      paymentIntentId?: string;
      checkoutSessionId?: string;
      paymentStatus?: string;
    },
  ) {
    this.logger.log(`Updating payment info for order ${orderId}`);

    try {
      const result = await this.dataSource
        .getRepository(Order)
        .update({ id: orderId }, paymentInfo);

      if (result.affected === 0) {
        this.logger.warn(
          `Order ${orderId} not found when updating payment info`,
        );
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      this.logger.log(
        `Payment info updated for order ${orderId}: ${JSON.stringify(paymentInfo)}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to update payment info for order ${orderId}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  async findOne(
    orderId: string,
    options?: { relations?: string[] },
  ): Promise<Order> {
    const order = await this.dataSource.getRepository(Order).findOne({
      where: { id: orderId },
      relations: options?.relations || [],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  private async sendStatusNotification(
    userId: number,
    orderId: string,
    newStatus: StautsOrder,
    oldStatus: StautsOrder,
  ) {
    if (newStatus === oldStatus) {
      return;
    }

    const orderIdShort = orderId.substring(0, 8);

    let title: string;
    let body: string;

    switch (newStatus) {
      case StautsOrder.processing:
        title = ' Order Processing';
        body = `Your order #${orderIdShort} is now being processed`;
        break;

      case StautsOrder.delivered:
        title = 'Order Delivered!';
        body = `Your order #${orderIdShort} has been delivered. Enjoy!`;
        break;

      case StautsOrder.cancelled:
        title = 'Order Cancelled';
        body = `Your order #${orderIdShort} has been cancelled`;
        break;

      default:
        return;
    }

    await this.notificationService.sendToUser(userId, title, body, 'order', {
      orderId,
      screen: 'OrderDetails',
      orderStatus: newStatus,
    });

    this.logger.log(
      `Status notification queued for order ${orderId}: ${newStatus}`,
    );
  }
}
