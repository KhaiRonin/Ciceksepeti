import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AddressService } from '../address/address.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly addressService: AddressService,
  ) {}

  private getEffectivePrice(product: {
    price: unknown;
    discountPercent?: unknown;
    discountStartAt?: Date | null;
    discountEndAt?: Date | null;
  }, now: Date = new Date()): number {
    const basePrice = Number(product.price);
    const percent = Number(product.discountPercent ?? 0);
    const isStarted = !product.discountStartAt || product.discountStartAt <= now;
    const isNotEnded = !!product.discountEndAt && product.discountEndAt > now;
    const isActive = percent > 0 && isStarted && isNotEnded;

    if (!isActive) return basePrice;
    return Number((basePrice * (1 - percent / 100)).toFixed(2));
  }

  async create(userId: string, dto: CreateOrderDto) {
    await this.addressService.getOwnedAddress(userId, dto.addressId);

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    for (const item of cart.items) {
      if (item.quantity > item.product.stock) {
        throw new BadRequestException(`Insufficient stock for product ${item.product.name}`);
      }
    }

    const preparedItems = cart.items.map((item) => ({
      ...item,
      unitPrice: this.getEffectivePrice(item.product),
    }));

    const totalPrice = preparedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          addressId: dto.addressId,
          totalPrice,
          status: OrderStatus.PENDING,
          giftNote: dto.giftNote?.trim() || null,
          deliveryDate: dto.deliveryDate ?? null,
          deliveryTime: dto.deliveryTime ?? null,
          deliveryRegion: dto.deliveryRegion ?? null,
          items: {
            create: preparedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.unitPrice,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return order;
    });
  }

  list(userId: string, role: 'admin' | 'user') {
    return this.prisma.order.findMany({
      where: role === 'admin' ? {} : { userId },
      include: {
        items: { include: { product: true } },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(requesterId: string, role: 'admin' | 'user', orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        address: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (role !== 'admin' && order.userId !== requesterId) {
      throw new ForbiddenException('Forbidden');
    }

    return order;
  }
}
