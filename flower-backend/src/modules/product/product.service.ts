import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  AppLocale,
  DEFAULT_LOCALE,
  localizeProduct,
  sanitizeProductTranslations,
} from '../../common/utils/locale.util';
import { AutoTranslationService } from '../../common/services/auto-translation.service';

type OccasionRule = {
  include: string[];
  exclude?: string[];
};

const OCCASION_KEYWORDS: Record<string, OccasionRule> = {
  'valentines-day': {
    include: ['kırmızı gül', 'gül buketi', 'romantik', 'aşk', 'kalp', 'sevgili'],
    exclude: ['taziye', 'cenaze', 'geçmiş olsun', 'yeni bebek'],
  },
  'mothers-day': {
    include: ['anne', 'anneler günü', 'pembe', 'lilyum', 'ortanca', 'zarif'],
    exclude: ['taziye', 'cenaze', 'erkek'],
  },
  'womens-day': {
    include: ['kadınlar günü', 'mimoza', 'lale', 'bahar', 'canlı renk'],
    exclude: ['taziye', 'cenaze', 'yeni bebek', 'saksı', 'bonsai', 'bitki'],
  },
  'fathers-day': {
    include: ['babalar günü', 'saksı', 'bonsai', 'bitki', 'minimal', 'erkek'],
    exclude: ['pembe', 'taziye', 'cenaze', 'yeni bebek'],
  },
  'teachers-day': {
    include: ['öğretmen', 'öğretmenler günü', 'karanfil', 'masa çiçeği', 'teşekkür'],
    exclude: ['taziye', 'cenaze', 'romantik'],
  },
  anniversary: {
    include: ['yıldönümü', 'romantik', 'gül', 'orkide', 'çift', 'aşk'],
    exclude: ['taziye', 'cenaze', 'geçmiş olsun'],
  },
  birthday: {
    include: ['doğum günü', 'renkli', 'kutlama', 'neşeli', 'ayçiçeği', 'mix'],
    exclude: ['taziye', 'cenaze', 'sade beyaz'],
  },
  'new-baby': {
    include: ['yeni bebek', 'hoş geldin bebek', 'beyaz', 'pastel', 'papatya', 'nazik'],
    exclude: ['taziye', 'cenaze', 'romantik', 'kırmızı gül'],
  },
  congratulations: {
    include: ['tebrik', 'başarı', 'mezuniyet', 'terfi', 'açılış', 'premium', 'orkide', 'lilyum'],
    exclude: ['taziye', 'cenaze', 'geçmiş olsun'],
  },
  'get-well': {
    include: ['geçmiş olsun', 'moral', 'ferah', 'papatya', 'canlı', 'sağlık'],
    exclude: ['taziye', 'cenaze', 'kırmızı gül'],
  },
  sympathy: {
    include: ['taziye', 'başsağlığı', 'cenaze', 'vefat', 'anma', 'çelenk'],
    exclude: ['doğum günü', 'kutlama', 'romantik', 'yeni bebek'],
  },
};

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly autoTranslationService: AutoTranslationService,
  ) {}

  listActiveGiftNoteTemplates(recipientType?: string) {
    const normalizedType = (recipientType ?? '').trim().toUpperCase();

    return this.prisma.giftNoteTemplate.findMany({
      where: {
        isActive: true,
        ...(normalizedType ? { recipientType: normalizedType } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  private getEffectivePrice(product: {
    price: Prisma.Decimal | number;
    discountPercent?: Prisma.Decimal | number | null;
    discountStartAt?: Date | null;
    discountEndAt?: Date | null;
  }, now: Date = new Date()): number {
    const basePrice = Number(product.price);
    const percent = Number(product.discountPercent ?? 0);
    const isStarted = !product.discountStartAt || product.discountStartAt <= now;
    const isNotEnded = !!product.discountEndAt && product.discountEndAt > now;
    const isActive = percent > 0 && isStarted && isNotEnded;

    if (!isActive) return basePrice;

    const discounted = basePrice * (1 - percent / 100);
    return Number(Math.max(0, discounted).toFixed(2));
  }

  private mapProductForStorefront<T extends {
    price: Prisma.Decimal | number;
    discountPercent?: Prisma.Decimal | number | null;
    discountStartAt?: Date | null;
    discountEndAt?: Date | null;
  }>(product: T, now: Date = new Date()) {
    const basePrice = Number(product.price);
    const effectivePrice = this.getEffectivePrice(product, now);
    const isDiscountActive = effectivePrice < basePrice;

    return {
      ...product,
      price: effectivePrice,
      originalPrice: basePrice,
      discountPrice: isDiscountActive ? effectivePrice : null,
      isDiscountActive,
    };
  }

  private buildDiscountUpdate(dto: {
    discountPercent?: number;
    discountDays?: number;
    clearDiscount?: boolean;
  }): {
    discountPercent?: number | null;
    discountStartAt?: Date | null;
    discountEndAt?: Date | null;
  } {
    if (dto.clearDiscount) {
      return {
        discountPercent: null,
        discountStartAt: null,
        discountEndAt: null,
      };
    }

    const hasPercent = dto.discountPercent !== undefined;
    const hasDays = dto.discountDays !== undefined;

    if (!hasPercent && !hasDays) {
      return {};
    }

    if (!hasPercent || !hasDays) {
      throw new BadRequestException('İndirim oranı ve gün bilgisi birlikte girilmelidir.');
    }

    if ((dto.discountPercent ?? 0) <= 0 || (dto.discountDays ?? 0) <= 0) {
      return {
        discountPercent: null,
        discountStartAt: null,
        discountEndAt: null,
      };
    }

    const now = new Date();
    const endAt = new Date(now);
    endAt.setDate(endAt.getDate() + (dto.discountDays ?? 0));

    return {
      discountPercent: dto.discountPercent,
      discountStartAt: now,
      discountEndAt: endAt,
    };
  }

  async list(params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    sort?: string;
    discounted?: boolean;
    occasion?: string;
    locale?: AppLocale;
  }) {
    const locale = params?.locale ?? DEFAULT_LOCALE;
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(100, Math.max(1, params?.limit ?? 24));
    const sort = (params?.sort ?? 'newest').toLowerCase();

    const filters: Prisma.ProductWhereInput[] = [];

    if (params?.categoryId) {
      filters.push({ categoryId: params.categoryId });
    }

    if (params?.search?.trim()) {
      const search = params.search.trim();
      filters.push({ OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ] });
    }

    if (params?.occasion?.trim()) {
      const occasionKey = params.occasion.trim().toLowerCase();
      const rule = OCCASION_KEYWORDS[occasionKey];

      if (rule?.include?.length) {
        const keywordOr: Prisma.ProductWhereInput[] = rule.include.flatMap((keyword) => ([
          { name: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ]));

        filters.push({ OR: keywordOr });
      }

      if (rule?.exclude?.length) {
        const keywordNot: Prisma.ProductWhereInput[] = rule.exclude.flatMap((keyword) => ([
          { name: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ]));

        filters.push({ NOT: keywordNot });
      }
    }

    if (params?.discounted) {
      filters.push({
        discountPercent: { gt: 0 },
      });
      filters.push({
        OR: [
          { discountStartAt: null },
          { discountStartAt: { lte: new Date() } },
        ],
      });
      filters.push({
        discountEndAt: { gt: new Date() },
      });
    }

    const where: Prisma.ProductWhereInput = filters.length ? { AND: filters } : {};

    if (sort === 'best-selling') {
      const sold = await this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            status: {
              not: 'CANCELED',
            },
          },
          product: where,
        },
        _sum: { quantity: true },
      });

      const soldSorted = sold
        .map((s) => ({
          productId: s.productId,
          soldQty: Number(s._sum.quantity ?? 0),
        }))
        .filter((s) => s.soldQty > 0)
        .sort((a, b) => b.soldQty - a.soldQty);

      const total = soldSorted.length;

      if (!total) {
        const [fallbackData, fallbackTotal] = await Promise.all([
          this.prisma.product.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { category: true },
            skip: (page - 1) * limit,
            take: limit,
          }),
          this.prisma.product.count({ where }),
        ]);

        return {
          data: fallbackData.map((product) => localizeProduct(this.mapProductForStorefront(product), locale)),
          total: fallbackTotal,
          page,
          limit,
        };
      }

      const qtyByProduct = new Map<string, number>();
      soldSorted.forEach((s) => qtyByProduct.set(s.productId, s.soldQty));

      const start = (page - 1) * limit;
      const pagedIds = soldSorted.slice(start, start + limit).map((s) => s.productId);

      const allProducts = await this.prisma.product.findMany({
        where: { id: { in: pagedIds } },
        include: { category: true },
      });

      allProducts.sort((a, b) => {
        const qtyDiff = (qtyByProduct.get(b.id) ?? 0) - (qtyByProduct.get(a.id) ?? 0);
        if (qtyDiff !== 0) return qtyDiff;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      return {
        data: allProducts.map((product) => localizeProduct(this.mapProductForStorefront(product), locale)),
        total,
        page,
        limit,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: data.map((product) => localizeProduct(this.mapProductForStorefront(product), locale)),
      total,
      page,
      limit,
    };
  }

  async listAll() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
  }

  async getById(id: string, locale: AppLocale = DEFAULT_LOCALE) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return localizeProduct(this.mapProductForStorefront(product), locale);
  }

  async create(dto: CreateProductDto) {
    const discountData = this.buildDiscountUpdate({
      discountPercent: dto.discountPercent,
      discountDays: dto.discountDays,
    });

    const translations = await this.autoTranslationService.buildProductTranslations({
      name: dto.name,
      description: dto.description,
    });
    const sanitizedTranslations = sanitizeProductTranslations(translations);

    const data: Prisma.ProductUncheckedCreateInput = {
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
      images: dto.images ?? [],
      categoryId: dto.categoryId,
      ...(sanitizedTranslations !== undefined ? { translations: sanitizedTranslations } : {}),
      ...(discountData.discountPercent !== undefined ? { discountPercent: discountData.discountPercent } : {}),
      ...(discountData.discountStartAt !== undefined ? { discountStartAt: discountData.discountStartAt } : {}),
      ...(discountData.discountEndAt !== undefined ? { discountEndAt: discountData.discountEndAt } : {}),
    };

    return this.prisma.product.create({ data });
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, description: true, translations: true },
    });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const discountData = this.buildDiscountUpdate({
      discountPercent: dto.discountPercent,
      discountDays: dto.discountDays,
      clearDiscount: dto.clearDiscount,
    });

    const nextName = dto.name ?? existing.name;
    const nextDescription = dto.description ?? existing.description;
    const translations = await this.autoTranslationService.buildProductTranslations({
      name: nextName,
      description: nextDescription,
      overrides: existing.translations,
    });
    const sanitizedTranslations = sanitizeProductTranslations(translations);

    const data: Prisma.ProductUncheckedUpdateInput = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.price !== undefined ? { price: dto.price } : {}),
      ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
      ...(dto.images !== undefined ? { images: dto.images } : {}),
      ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
      ...(sanitizedTranslations !== undefined
        ? { translations: sanitizedTranslations }
        : { translations: Prisma.JsonNull }),
      ...(discountData.discountPercent !== undefined ? { discountPercent: discountData.discountPercent } : {}),
      ...(discountData.discountStartAt !== undefined ? { discountStartAt: discountData.discountStartAt } : {}),
      ...(discountData.discountEndAt !== undefined ? { discountEndAt: discountData.discountEndAt } : {}),
    };

    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.getById(id);

    const activeOrderItemCount = await this.prisma.orderItem.count({
      where: {
        productId: id,
        order: {
          status: {
            not: 'CANCELED',
          },
        },
      },
    });

    if (activeOrderItemCount > 0) {
      throw new BadRequestException('Bu ürün aktif siparişlerde kullanıldığı için silinemez.');
    }

    // If product is only linked to canceled orders, remove those line items first.
    await this.prisma.orderItem.deleteMany({
      where: {
        productId: id,
        order: {
          status: 'CANCELED',
        },
      },
    });

    await this.prisma.cartItem.deleteMany({ where: { productId: id } });

    try {
      await this.prisma.product.delete({ where: { id } });
    } catch (error) {
      // Guard against any remaining FK constraint edge cases.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('Ürün ilişkili kayıtlar nedeniyle silinemedi.');
      }
      throw error;
    }

    return { success: true };
  }
}
