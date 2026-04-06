import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  AppLocale,
  DEFAULT_LOCALE,
  localizeCategory,
  sanitizeCategoryTranslations,
} from '../../common/utils/locale.util';
import { AutoTranslationService } from '../../common/services/auto-translation.service';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly autoTranslationService: AutoTranslationService,
  ) {}

  async list(locale: AppLocale = DEFAULT_LOCALE) {
    const categories = await this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { products: true } } },
    });

    return categories.map((category) => localizeCategory(category, locale));
  }

  async create(dto: CreateCategoryDto) {
    const exists = await this.prisma.category.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Category already exists');

    const translations = await this.autoTranslationService.buildCategoryTranslations({ name: dto.name });
    const sanitizedTranslations = sanitizeCategoryTranslations(translations);

    return this.prisma.category.create({
      data: {
        ...dto,
        ...(sanitizedTranslations !== undefined ? { translations: sanitizedTranslations } : {}),
      },
    });
  }

  async update(id: string, dto: Partial<CreateCategoryDto>) {
    const exists = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true, name: true, translations: true },
    });
    if (!exists) throw new NotFoundException('Category not found');

    const nextName = dto.name ?? exists.name;
    const translations = await this.autoTranslationService.buildCategoryTranslations({
      name: nextName,
      overrides: exists.translations,
    });
    const sanitizedTranslations = sanitizeCategoryTranslations(translations);

    return this.prisma.category.update({
      where: { id },
      data: {
        ...dto,
        ...(sanitizedTranslations !== undefined
          ? { translations: sanitizedTranslations }
          : { translations: Prisma.JsonNull }),
      },
    });
  }

  async delete(id: string) {
    const exists = await this.prisma.category.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Category not found');

    const productCount = await this.prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      const fallbackName = 'Kategorisiz';
      const fallback = await this.prisma.category.upsert({
        where: { name: fallbackName },
        create: { name: fallbackName },
        update: {},
      });

      if (fallback.id === id) {
        throw new BadRequestException('Bu kategori silinemez.');
      }

      await this.prisma.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: fallback.id },
      });
    }

    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('Kategori ilişkili kayıtlar nedeniyle silinemedi.');
      }
      throw error;
    }

    return { success: true };
  }
}
