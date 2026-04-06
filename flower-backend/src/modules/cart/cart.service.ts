import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { RemoveFromCartDto } from './dto/remove-from-cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

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

  private mapCartWithEffectivePrices<T extends {
    items: Array<{
      product: {
        price: unknown;
        discountPercent?: unknown;
        discountStartAt?: Date | null;
        discountEndAt?: Date | null;
      };
    }>;
  }>(cart: T): T {
    return {
      ...cart,
      items: cart.items.map((item) => {
        const basePrice = Number(item.product.price);
        const effectivePrice = this.getEffectivePrice(item.product);
        const isDiscountActive = effectivePrice < basePrice;

        return {
          ...item,
          product: {
            ...item.product,
            price: effectivePrice,
            originalPrice: basePrice,
            discountPrice: isDiscountActive ? effectivePrice : null,
            isDiscountActive,
          },
        };
      }),
    };
  }

  async getMyCart(userId: string) {
    const cart = await this.ensureCart(userId);
    const fullCart = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!fullCart) {
      return null;
    }

    return this.mapCartWithEffectivePrices(fullCart);
  }

  async add(userId: string, dto: AddToCartDto) {
    const cart = await this.ensureCart(userId);

    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: dto.productId },
    });

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
        },
      });
    }

    return this.getMyCart(userId);
  }

  async remove(userId: string, dto: RemoveFromCartDto) {
    const cart = await this.ensureCart(userId);
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId: dto.productId },
    });
    return this.getMyCart(userId);
  }

  private async ensureCart(userId: string) {
    const existing = await this.prisma.cart.findUnique({ where: { userId } });
    if (existing) {
      return existing;
    }

    return this.prisma.cart.create({
      data: { userId },
    });
  }
}
