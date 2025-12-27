import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Status } from './enums/cart.status';
import { AddItemDto } from './dto/item.dto';
import { UserService } from '../user/user.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private cartItemRepo: Repository<CartItem>,
    private productService: ProductsService,
  ) {}
  async getOrCreateCart(userId: number) {
    const cart = await this.cartRepo.findOne({
      where: { userId, status: Status.active },
      relations: ['items'],
    });

    if (!cart) {
      const newCart = this.cartRepo.create({
        userId,
        status: Status.active,
        items: [],
      });

      await this.cartRepo.save(newCart);
      return newCart;
    }

    return cart;
  }

  async addItemTocart(item: AddItemDto, userId: number) {
    const cart = await this.getOrCreateCart(userId);

    const productItem = await this.productService.findOne(item.productId);
    if (!productItem) {
      throw new BadRequestException('Product not found');
    }
    if (productItem.data.stock <= 0) {
      throw new BadRequestException('Product is out of stock');
    }

    if (item.quantity > productItem.data.stock) {
      throw new BadRequestException(
        `Only ${productItem.data.stock} items left in stock`,
      );
    }
    const existingItem = await this.cartItemRepo.findOne({
      where: {
        cartId: cart.id,
        productId: item.productId,
      },
    });

    if (!existingItem) {
      const cartItem = this.cartItemRepo.create({
        cartId: cart.id,
        productId: productItem.data.id,
        quantity: item.quantity,
        price: productItem.data.price,
      });

      await this.cartItemRepo.save(cartItem);
    } else {
      const newQty = existingItem.quantity + item.quantity;
      if (newQty > productItem.data.stock) {
        throw new BadRequestException(
          `You can only add ${
            productItem.data.stock - existingItem.quantity
          } more of this item.`,
        );
      }
      existingItem.quantity = newQty;

      await this.cartItemRepo.save(existingItem);
    }

    return await this.findCart(userId);
  }

  async findCart(userId: number) {
    return this.cartRepo.findOne({
      where: { userId, status: Status.active },
      relations: ['items', 'items.product'],
    });
  }

  async updateCartItem(
    data: { itemId: number; quantity: number },
    userId: number,
  ) {
    const { itemId, quantity } = data;
    const cart = await this.findCart(userId);
    if (!cart) throw new BadRequestException('Cart is empty');
    const cartItem = await this.cartItemRepo.findOne({
      where: { id: itemId },
      relations: ['product'],
    });
    if (!cartItem) {
      throw new BadRequestException('cartItem not found');
    }

    if (cartItem.cartId !== cart.id) {
      throw new BadRequestException('Cart item does not belong to this user');
    }
    if (quantity === 0) {
      await this.cartItemRepo.remove(cartItem);
      return await this.findCart(userId);
    }
    if (quantity > cartItem.product.stock) {
      throw new BadRequestException(
        `Only ${cartItem.product.stock} items left in stock`,
      );
    }

    cartItem.quantity = quantity;
    await this.cartItemRepo.save(cartItem);

    return await this.findCart(userId);
  }

  async removeItem(itemId: number, userId: number) {
    const cart = await this.findCart(userId);
    if (!cart) {
      throw new BadRequestException('Cart is empty');
    }

    const cartItem = await this.cartItemRepo.findOne({
      where: { id: itemId },
    });

    if (!cartItem) {
      throw new BadRequestException('Cart item not found');
    }

    if (cartItem.cartId !== cart.id) {
      throw new BadRequestException('This item does not belong to your cart');
    }

    await this.cartItemRepo.remove(cartItem);

    return await this.findCart(userId);
  }

  async clearCart(userId: number) {
    const cart = await this.findCart(userId);

    if (!cart) {
      throw new BadRequestException('Cart is empty');
    }

    if (!cart.items || cart.items.length === 0) {
      return cart;
    }

    await this.cartItemRepo.delete({ cartId: cart.id });

    return await this.findCart(userId);
  }
}
