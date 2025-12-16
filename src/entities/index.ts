// src/entities/index.ts
import { User } from '../user/entities/user.entity';
import { ResetToken } from '../auth/entities/reset-token-entity';
import { OTP } from '../otp/entities/otp.entity';
import { Role } from '../roles/entities/role.entity';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { ProductImage } from '../products/entities/product-image.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { FcmToken } from '../fcm-token/entities/fcm-token.entity';
import { Notification } from '../notification/entities/notification.entity';
import { Review } from '../reviews/entities/review.entity';
import { Follower } from '../followers/entities/follower.entity';

export const ENTITIES = [
  User,
  ResetToken,
  OTP,
  Role,
  Category,
  Product,
  ProductImage,
  Cart,
  CartItem,
  Order,
  OrderItem,
  FcmToken,
  Notification,
  Review,
  Follower,
];
