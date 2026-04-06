import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CouponType, OrderStatus, Prisma, ReturnStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AutoTranslationService } from '../../common/services/auto-translation.service';
import { sanitizeCategoryTranslations, sanitizeProductTranslations } from '../../common/utils/locale.util';

const DEFAULT_GIFT_NOTE_TEMPLATES: Array<{ recipientType: string; content: string }> = [
  { recipientType: 'SEVGILI', content: 'Kalbimin en güzel köşesi hep sana ait. İyi ki varsın, seni çok seviyorum.' },
  { recipientType: 'SEVGILI', content: 'Her günüm seninle daha anlamlı. Gülüşün hiç eksik olmasın aşkım.' },
  { recipientType: 'SEVGILI', content: 'Sana baktığımda tüm telaşlarım diniyor. İyi ki hayatımdasın.' },
  { recipientType: 'SEVGILI', content: 'Bu çiçekler sana olan sevgimin küçük bir hatırası olsun.' },
  { recipientType: 'SEVGILI', content: 'Birlikte nice güzel anı biriktirelim. Seni her şeyden çok seviyorum.' },
  { recipientType: 'SEVGILI', content: 'Kalbim her atışta adını fısıldıyor. İyi ki benimlesin.' },
  { recipientType: 'SEVGILI', content: 'Bugün de yarın da daima yanında olmak istiyorum. İyi ki varsın.' },
  { recipientType: 'SEVGILI', content: 'Varlığın en karanlık günümü bile aydınlatıyor. Seni çok seviyorum.' },
  { recipientType: 'SEVGILI', content: 'Seninle geçen her an, ömrümün en kıymetli anısı oluyor.' },
  { recipientType: 'SEVGILI', content: 'Kalbimin ritmi sensin, hayatımın en güzel sebebisin.' },
  { recipientType: 'ANNE', content: 'Canım annem, sevgin ve emeğin için minnettarım. Seni çok seviyorum.' },
  { recipientType: 'ANNE', content: 'Senin sıcaklığın ve sabrın hep yolumu aydınlattı. İyi ki annemsin.' },
  { recipientType: 'ANNE', content: 'Varlığınla güç buluyorum. Her şey için teşekkürler annem.' },
  { recipientType: 'ANNE', content: 'Duaların ve sevgin hep benimle. Seni çok seviyorum canım annem.' },
  { recipientType: 'ANNE', content: 'Hayatıma kattığın güzellikler için sonsuz teşekkür ederim annem.' },
  { recipientType: 'ANNE', content: 'Şefkatinle büyüdüm, sevginde huzur buldum. İyi ki varsın annem.' },
  { recipientType: 'ANNE', content: 'Her zor anımda ilk aklıma gelen sensin, iyi ki annemsin.' },
  { recipientType: 'ANNE', content: 'Kalbinin güzelliği evimizin en kıymetli ışığı oldu hep.' },
  { recipientType: 'ANNE', content: 'Bana kattığın değerler için ömrüm boyunca minnettar kalacağım.' },
  { recipientType: 'ANNE', content: 'Ellerin dert görmesin annem, seni çok seviyorum.' },
  { recipientType: 'BABA', content: 'Canım babam, emeğin ve desteğin için çok teşekkür ederim.' },
  { recipientType: 'BABA', content: 'Güven veren duruşunla hep yanımda oldun. İyi ki babamsın.' },
  { recipientType: 'BABA', content: 'Seninle gurur duyuyorum baba. Sağlıkla ve mutlulukla hep yanımda ol.' },
  { recipientType: 'BABA', content: 'Verdiğin her öğüt ve emek için minnettarım. Seni seviyorum baba.' },
  { recipientType: 'BABA', content: 'Varlığın bana hep güç verdi. İyi ki varsın canım babam.' },
  { recipientType: 'BABA', content: 'Sessiz desteğin ve emeğin benim için her zaman çok kıymetli.' },
  { recipientType: 'BABA', content: 'Hayata karşı dimdik durmayı senden öğrendim, teşekkür ederim.' },
  { recipientType: 'BABA', content: 'Gölgen bile bana güven veriyor baba, iyi ki varsın.' },
  { recipientType: 'BABA', content: 'Seninle geçirdiğim her an benim için büyük bir şans.' },
  { recipientType: 'BABA', content: 'Sağlığın, mutluluğun ve huzurun daim olsun canım babam.' },
  { recipientType: 'ES', content: 'Hayatı seninle paylaşmak en büyük mutluluğum. Seni çok seviyorum.' },
  { recipientType: 'ES', content: 'Evimizin en güzel yanı sensin. İyi ki ömür arkadaşımsın.' },
  { recipientType: 'ES', content: 'Birlikte geçen her gün için şükrediyorum. Nice güzel yıllara.' },
  { recipientType: 'ES', content: 'Yanında huzur buluyorum. Seninle her şey daha güzel.' },
  { recipientType: 'ES', content: 'Sevgim her gün daha da büyüyor. İyi ki benimsin.' },
  { recipientType: 'ES', content: 'Hayatın telaşı içinde en güzel sığınağım senin kalbin.' },
  { recipientType: 'ES', content: 'Aynı yolda seninle yürümek, ömrümün en güzel hediyesi.' },
  { recipientType: 'ES', content: 'Gözlerindeki huzur, tüm yorgunluğumu bir anda unutturuyor.' },
  { recipientType: 'ES', content: 'İyi günde kötü günde yanımda olduğun için teşekkür ederim.' },
  { recipientType: 'ES', content: 'Seninle her mevsim bahar gibi, iyi ki eşimsin.' },
  { recipientType: 'ARKADAS', content: 'Dostluğun hayatıma renk katıyor. İyi ki arkadaşımsın.' },
  { recipientType: 'ARKADAS', content: 'Her zor anda yanında olduğun için teşekkür ederim.' },
  { recipientType: 'ARKADAS', content: 'Birlikte güldüğümüz günler hep daim olsun. Çok değerlisin.' },
  { recipientType: 'ARKADAS', content: 'Samimiyetin ve desteğin için minnettarım. İyi ki varsın.' },
  { recipientType: 'ARKADAS', content: 'Dostluğumuzun daha nice güzel anıya uzanması dileğiyle.' },
  { recipientType: 'ARKADAS', content: 'İyi ki yollarımız kesişmiş, dostluğun bana güç veriyor.' },
  { recipientType: 'ARKADAS', content: 'Hayatın koşturmacasında varlığın en güzel mola gibi.' },
  { recipientType: 'ARKADAS', content: 'Ne olursa olsun yanında olduğumu unutma, can dostum.' },
  { recipientType: 'ARKADAS', content: 'Paylaştığımız anılar her geçen gün daha kıymetli oluyor.' },
  { recipientType: 'ARKADAS', content: 'Güzel kalbin ve dostluğun için teşekkür ederim.' },
  { recipientType: 'OGRETMEN', content: 'Emekleriniz ve rehberliğiniz için çok teşekkür ederim öğretmenim.' },
  { recipientType: 'OGRETMEN', content: 'Bilginiz ve sabrınızla hayatıma dokundunuz. Minnettarım.' },
  { recipientType: 'OGRETMEN', content: 'Yolumu aydınlatan emeğiniz hiç unutulmaz. Teşekkür ederim.' },
  { recipientType: 'OGRETMEN', content: 'Verdiğiniz değerli bilgiler için gönülden teşekkürler.' },
  { recipientType: 'OGRETMEN', content: 'İlham veren emeğiniz ve desteğiniz için saygıyla teşekkür ederim.' },
  { recipientType: 'OGRETMEN', content: 'Sadece ders değil, hayatı da öğrettiğiniz için teşekkür ederim.' },
  { recipientType: 'OGRETMEN', content: 'Sabırla verdiğiniz her emek, geleceğimde iz bıraktı.' },
  { recipientType: 'OGRETMEN', content: 'Bilginiz, nezaketiniz ve desteğiniz için minnettarım öğretmenim.' },
  { recipientType: 'OGRETMEN', content: 'Sizin sayenizde öğrenmek benim için bir keyfe dönüştü.' },
  { recipientType: 'OGRETMEN', content: 'Yol gösteren emeğiniz için sonsuz teşekkür ederim.' },
  { recipientType: 'KARDES', content: 'Canım kardeşim, iyi ki varsın. Her zaman yanındayım.' },
  { recipientType: 'KARDES', content: 'Hayatımın en güzel dostlarından biri sensin kardeşim.' },
  { recipientType: 'KARDES', content: 'Birlikte nice güzel anılar biriktirelim. Seni seviyorum.' },
  { recipientType: 'KARDES', content: 'Gülüşün hep yüzünde olsun kardeşim. İyi ki hayatımdasın.' },
  { recipientType: 'KARDES', content: 'Seninle geçen her gün daha eğlenceli ve daha anlamlı.' },
  { recipientType: 'KARDES', content: 'İyi ki aynı ailede, aynı kalpte büyümüşüz kardeşim.' },
  { recipientType: 'KARDES', content: 'Ne zaman ihtiyacın olsa, bir adım uzağındayım.' },
  { recipientType: 'KARDES', content: 'Kardeşlik bağımız hep güçlü, hep sıcacık kalsın.' },
  { recipientType: 'KARDES', content: 'Mutluluğun daim olsun, yüzün hep gülsün canım kardeşim.' },
  { recipientType: 'KARDES', content: 'Sen benim en kıymetli ailem ve en yakın arkadaşımsın.' },
  { recipientType: 'DIGER', content: 'Bu çiçekler en içten dileklerimle sana mutluluk getirsin.' },
  { recipientType: 'DIGER', content: 'Gününüz güzellikler ve sevgiyle dolsun. En iyi dileklerimle.' },
  { recipientType: 'DIGER', content: 'Tüm güzel hislerimle bu küçük hediyeyi kabul etmenizi dilerim.' },
  { recipientType: 'DIGER', content: 'Güzel bir gülümseme bırakması dileğiyle sevgilerimi gönderiyorum.' },
  { recipientType: 'DIGER', content: 'Hayatınıza neşe ve huzur katacak nice güzel günler dilerim.' },
  { recipientType: 'DIGER', content: 'Bu küçük jestin kalbinize sıcaklık vermesini dilerim.' },
  { recipientType: 'DIGER', content: 'En güzel dileklerimle, mutlu ve keyifli bir gün geçirmeniz dileğiyle.' },
  { recipientType: 'DIGER', content: 'Sizin için seçilen bu çiçekler gönülden gelen selamımdır.' },
  { recipientType: 'DIGER', content: 'Umarım bu çiçekler gününüze zarif bir mutluluk ekler.' },
  { recipientType: 'DIGER', content: 'Her şey gönlünüzce olsun, sevgi ve huzur sizinle kalsın.' },
];

export type AdminLogLevel = 'info' | 'warn' | 'error' | 'success';

export interface AdminLogEntry {
  id: string;
  level: AdminLogLevel;
  message: string;
  details?: string;
  user?: string;
  createdAt: string;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly autoTranslationService: AutoTranslationService,
  ) {}

  private normalizeRecipientType(value?: string): string {
    return (value ?? '').trim().toUpperCase();
  }

  listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true } },
      },
    });
  }

  async getLogs(limit?: string): Promise<AdminLogEntry[]> {
    const parsedLimit = Number(limit);
    const take = Number.isFinite(parsedLimit)
      ? Math.min(500, Math.max(1, Math.floor(parsedLimit)))
      : 200;
    const sourceTake = Math.max(50, Math.min(300, take));

    const [orders, users, coupons, returns, reviews, noteTemplates] = await Promise.all([
      this.prisma.order.findMany({
        take: sourceTake,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          paidAt: true,
          user: { select: { email: true } },
        },
      }),
      this.prisma.user.findMany({
        take: sourceTake,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, createdAt: true, role: true },
      }),
      this.prisma.coupon.findMany({
        take: sourceTake,
        orderBy: { createdAt: 'desc' },
        select: { id: true, code: true, createdAt: true, updatedAt: true, isActive: true },
      }),
      this.prisma.return.findMany({
        take: sourceTake,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { email: true } },
        },
      }),
      this.prisma.review.findMany({
        take: sourceTake,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          isApproved: true,
          createdAt: true,
          user: { select: { email: true } },
          product: { select: { name: true } },
        },
      }),
      this.prisma.giftNoteTemplate.findMany({
        take: sourceTake,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          recipientType: true,
          createdAt: true,
          updatedAt: true,
          isActive: true,
        },
      }),
    ]);

    const logs: AdminLogEntry[] = [];

    orders.forEach((order) => {
      logs.push({
        id: `order-created-${order.id}`,
        level: 'info',
        message: 'Sipariş oluşturuldu',
        details: `Sipariş #${order.id.slice(-8).toUpperCase()} oluşturuldu`,
        user: order.user.email,
        createdAt: order.createdAt.toISOString(),
      });

      if (order.paidAt) {
        logs.push({
          id: `order-paid-${order.id}`,
          level: 'success',
          message: 'Ödeme alındı',
          details: `Sipariş #${order.id.slice(-8).toUpperCase()} ödendi`,
          user: order.user.email,
          createdAt: order.paidAt.toISOString(),
        });
      }

      if (order.status === 'CANCELED') {
        logs.push({
          id: `order-canceled-${order.id}`,
          level: 'warn',
          message: 'Sipariş iptal edildi',
          details: `Sipariş #${order.id.slice(-8).toUpperCase()} iptal durumunda`,
          user: order.user.email,
          createdAt: order.createdAt.toISOString(),
        });
      }
    });

    users.forEach((user) => {
      logs.push({
        id: `user-created-${user.id}`,
        level: 'info',
        message: user.role === Role.admin ? 'Admin hesabı oluşturuldu' : 'Yeni kullanıcı kaydı',
        details: `${user.email} hesabı sisteme eklendi`,
        user: user.email,
        createdAt: user.createdAt.toISOString(),
      });
    });

    coupons.forEach((coupon) => {
      logs.push({
        id: `coupon-created-${coupon.id}`,
        level: 'success',
        message: 'Kupon oluşturuldu',
        details: `${coupon.code} kodlu kupon oluşturuldu`,
        createdAt: coupon.createdAt.toISOString(),
      });

      if (coupon.updatedAt.getTime() !== coupon.createdAt.getTime()) {
        logs.push({
          id: `coupon-updated-${coupon.id}`,
          level: 'info',
          message: 'Kupon güncellendi',
          details: `${coupon.code} kodlu kupon ${coupon.isActive ? 'aktif' : 'pasif'} durumda`,
          createdAt: coupon.updatedAt.toISOString(),
        });
      }
    });

    returns.forEach((item) => {
      const level: AdminLogLevel =
        item.status === 'APPROVED' || item.status === 'COMPLETED'
          ? 'success'
          : item.status === 'REJECTED'
            ? 'warn'
            : 'info';

      logs.push({
        id: `return-created-${item.id}`,
        level: 'info',
        message: 'İade talebi oluşturuldu',
        details: `İade #${item.id.slice(-8).toUpperCase()} durumu: ${item.status}`,
        user: item.user.email,
        createdAt: item.createdAt.toISOString(),
      });

      if (item.updatedAt.getTime() !== item.createdAt.getTime()) {
        logs.push({
          id: `return-updated-${item.id}`,
          level,
          message: 'İade talebi güncellendi',
          details: `İade #${item.id.slice(-8).toUpperCase()} yeni durum: ${item.status}`,
          user: item.user.email,
          createdAt: item.updatedAt.toISOString(),
        });
      }
    });

    reviews.forEach((review) => {
      logs.push({
        id: `review-created-${review.id}`,
        level: 'info',
        message: 'Yeni ürün yorumu',
        details: `${review.product.name} için ${review.rating} yıldızlı yorum`,
        user: review.user.email,
        createdAt: review.createdAt.toISOString(),
      });

      if (review.isApproved) {
        logs.push({
          id: `review-approved-${review.id}`,
          level: 'success',
          message: 'Yorum onaylı durumda',
          details: `${review.product.name} yorumu yayında`,
          user: review.user.email,
          createdAt: review.createdAt.toISOString(),
        });
      }
    });

    noteTemplates.forEach((template) => {
      logs.push({
        id: `note-template-created-${template.id}`,
        level: 'info',
        message: 'Not şablonu eklendi',
        details: `${template.recipientType} tipi için yeni şablon`,
        createdAt: template.createdAt.toISOString(),
      });

      if (template.updatedAt.getTime() !== template.createdAt.getTime()) {
        logs.push({
          id: `note-template-updated-${template.id}`,
          level: template.isActive ? 'success' : 'warn',
          message: 'Not şablonu güncellendi',
          details: `${template.recipientType} tipi şablon ${template.isActive ? 'aktif' : 'pasif'} durumda`,
          createdAt: template.updatedAt.toISOString(),
        });
      }
    });

    return logs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, take);
  }

  async syncCatalogTranslations() {
    const [categories, products] = await Promise.all([
      this.prisma.category.findMany({
        select: { id: true, name: true, translations: true },
      }),
      this.prisma.product.findMany({
        select: { id: true, name: true, description: true, translations: true },
      }),
    ]);

    let updatedCategories = 0;
    let updatedProducts = 0;

    for (const category of categories) {
      const translations = await this.autoTranslationService.buildCategoryTranslations({
        name: category.name,
        overrides: category.translations,
      });

      const sanitized = sanitizeCategoryTranslations(translations);
      const nextValue = sanitized === undefined ? Prisma.JsonNull : sanitized;
      const currentValue = category.translations ?? Prisma.JsonNull;

      if (JSON.stringify(nextValue) === JSON.stringify(currentValue)) {
        continue;
      }

      await this.prisma.category.update({
        where: { id: category.id },
        data: { translations: nextValue },
      });
      updatedCategories += 1;
    }

    for (const product of products) {
      const translations = await this.autoTranslationService.buildProductTranslations({
        name: product.name,
        description: product.description,
        overrides: product.translations,
      });

      const sanitized = sanitizeProductTranslations(translations);
      const nextValue = sanitized === undefined ? Prisma.JsonNull : sanitized;
      const currentValue = product.translations ?? Prisma.JsonNull;

      if (JSON.stringify(nextValue) === JSON.stringify(currentValue)) {
        continue;
      }

      await this.prisma.product.update({
        where: { id: product.id },
        data: { translations: nextValue },
      });
      updatedProducts += 1;
    }

    return {
      success: true,
      totals: {
        categories: categories.length,
        products: products.length,
      },
      updated: {
        categories: updatedCategories,
        products: updatedProducts,
      },
    };
  }

  listOrders() {
    return this.prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true } },
        address: true,
        items: {
          include: {
            product: { select: { id: true, name: true, images: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true } },
        address: true,
        items: {
          include: {
            product: { select: { id: true, name: true, images: true } },
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async listProducts(params?: {
    page?: string;
    limit?: string;
    search?: string;
    categoryId?: string;
    discounted?: string;
  }) {
    const page = Math.max(1, Number(params?.page ?? '1') || 1);
    const limit = Math.min(100, Math.max(1, Number(params?.limit ?? '24') || 24));

    const where: Prisma.ProductWhereInput = {};

    if (params?.categoryId?.trim()) {
      where.categoryId = params.categoryId.trim();
    }

    if (params?.search?.trim()) {
      const search = params.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (params?.discounted === 'true') {
      const now = new Date();
      const discountedFilters: Prisma.ProductWhereInput[] = [
        { discountPercent: { gt: 0 } } as unknown as Prisma.ProductWhereInput,
        {
          OR: [
            { discountStartAt: null },
            { discountStartAt: { lte: now } },
          ],
        } as unknown as Prisma.ProductWhereInput,
        { discountEndAt: { gt: now } } as unknown as Prisma.ProductWhereInput,
      ];

      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        ...discountedFilters,
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true, _count: { select: { orderItems: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getDashboardStats(period: string = 'weekly') {
    const now = new Date();
    const pointCount = period === 'daily' ? 7 : 12;

    // Chart window start
    let chartStart: Date;
    if (period === 'daily') {
      chartStart = new Date(now);
      chartStart.setDate(chartStart.getDate() - 6);
      chartStart.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      chartStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    } else {
      chartStart = new Date(now);
      chartStart.setDate(chartStart.getDate() - 11 * 7);
      chartStart.setHours(0, 0, 0, 0);
    }

    const soonThreshold = new Date(now);
    soonThreshold.setDate(soonThreshold.getDate() + 3);

    const [allOrders, products, usersCount, chartOrders, soonEndingDiscounts] = await Promise.all([
      this.prisma.order.findMany({ select: { totalPrice: true, status: true } }),
      this.prisma.product.findMany({ select: { id: true, stock: true } }),
      this.prisma.user.count({ where: { role: Role.user } }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: chartStart } },
        select: { totalPrice: true, status: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.product.count({
        where: {
          discountPercent: { gt: 0 },
          OR: [{ discountStartAt: null }, { discountStartAt: { lte: now } }],
          discountEndAt: { gt: now, lte: soonThreshold },
        } as unknown as Prisma.ProductWhereInput,
      }),
    ]);

    const totalRevenue = allOrders
      .filter((o) => o.status !== 'CANCELED')
      .reduce((sum, o) => sum + Number(o.totalPrice), 0);

    // Build chart buckets
    const revenueChart: { date: string; revenue: number; orders: number }[] = [];
    for (let i = pointCount - 1; i >= 0; i--) {
      const d = new Date(now);
      let label: string;
      let bucketStart: Date;
      let bucketEnd: Date;

      if (period === 'daily') {
        d.setDate(d.getDate() - i);
        bucketStart = new Date(d); bucketStart.setHours(0, 0, 0, 0);
        bucketEnd = new Date(d); bucketEnd.setHours(23, 59, 59, 999);
        label = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      } else if (period === 'monthly') {
        d.setMonth(d.getMonth() - i);
        bucketStart = new Date(d.getFullYear(), d.getMonth(), 1);
        bucketEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        label = d.toLocaleDateString('tr-TR', { month: 'short' });
      } else {
        d.setDate(d.getDate() - i * 7);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        bucketStart = new Date(d); bucketStart.setDate(d.getDate() + diff); bucketStart.setHours(0, 0, 0, 0);
        bucketEnd = new Date(bucketStart); bucketEnd.setDate(bucketStart.getDate() + 6); bucketEnd.setHours(23, 59, 59, 999);
        label = bucketStart.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      }

      const bucket = chartOrders.filter((o) => {
        const t = new Date(o.createdAt);
        return t >= bucketStart && t <= bucketEnd;
      });

      revenueChart.push({
        date: label,
        revenue: bucket
          .filter((o) => o.status !== 'CANCELED')
          .reduce((sum, o) => sum + Number(o.totalPrice), 0),
        orders: bucket.length,
      });
    }

    return {
      totalRevenue,
      totalOrders: allOrders.length,
      totalCustomers: usersCount,
      totalProducts: products.length,
      pendingOrders: allOrders.filter((o) => o.status === 'PENDING').length,
      lowStockProducts: products.filter((p) => p.stock <= 5).length,
      soonEndingDiscounts,
      revenueChart,
    };
  }

  updateOrderStatus(orderId: string, status: OrderStatus) {
    const data: Prisma.OrderUpdateInput = { status };
    if (status === 'PAID') {
      data.paidAt = new Date();
    }

    return this.prisma.order.update({ where: { id: orderId }, data });
  }

  updateUserRole(userId: string, role: Role) {
    return this.prisma.user.update({ where: { id: userId }, data: { role } });
  }

  async deleteUser(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }

  // ─── Kupon CRUD ────────────────────────────────────────────────────────────
  listCoupons() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createCoupon(dto: {
    code: string;
    type: CouponType;
    value: number;
    minOrder?: number;
    maxUses?: number;
    isActive: boolean;
    expiresAt?: string;
    description?: string;
  }) {
    const exists = await this.prisma.coupon.findUnique({ where: { code: dto.code } });
    if (exists) throw new BadRequestException('Bu kupon kodu zaten mevcut');
    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        type: dto.type,
        value: dto.value,
        minOrder: dto.minOrder ?? null,
        maxUses: dto.maxUses ?? null,
        isActive: dto.isActive,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        description: dto.description ?? null,
      },
    });
  }

  async updateCoupon(
    id: string,
    dto: {
      code?: string;
      type?: CouponType;
      value?: number;
      minOrder?: number;
      maxUses?: number;
      isActive?: boolean;
      expiresAt?: string;
      description?: string;
    },
  ) {
    await this.prisma.coupon.findUniqueOrThrow({ where: { id } });
    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...(dto.code && { code: dto.code.toUpperCase() }),
        ...(dto.type && { type: dto.type }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.minOrder !== undefined && { minOrder: dto.minOrder }),
        ...(dto.maxUses !== undefined && { maxUses: dto.maxUses }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async deleteCoupon(id: string) {
    await this.prisma.coupon.delete({ where: { id } });
    return { success: true };
  }

  // ─── Not Şablonları CRUD ──────────────────────────────────────────────────
  listGiftNoteTemplates(filters?: { recipientType?: string; isActive?: boolean }) {
    const recipientType = this.normalizeRecipientType(filters?.recipientType);
    return this.prisma.giftNoteTemplate.findMany({
      where: {
        ...(recipientType ? { recipientType } : {}),
        ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {}),
      },
      orderBy: [{ recipientType: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  createGiftNoteTemplate(dto: {
    recipientType: string;
    content: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const recipientType = this.normalizeRecipientType(dto.recipientType);
    const content = dto.content?.trim();

    if (!recipientType) {
      throw new BadRequestException('Alıcı tipi zorunludur.');
    }

    if (!content) {
      throw new BadRequestException('Not içeriği zorunludur.');
    }

    return this.prisma.giftNoteTemplate.create({
      data: {
        recipientType,
        content,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateGiftNoteTemplate(
    id: string,
    dto: {
      recipientType?: string;
      content?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    await this.prisma.giftNoteTemplate.findUniqueOrThrow({ where: { id } });

    const data: Prisma.GiftNoteTemplateUpdateInput = {};

    if (dto.recipientType !== undefined) {
      const recipientType = this.normalizeRecipientType(dto.recipientType);
      if (!recipientType) {
        throw new BadRequestException('Alıcı tipi boş olamaz.');
      }
      data.recipientType = recipientType;
    }

    if (dto.content !== undefined) {
      const content = dto.content.trim();
      if (!content) {
        throw new BadRequestException('Not içeriği boş olamaz.');
      }
      data.content = content;
    }

    if (dto.sortOrder !== undefined) {
      data.sortOrder = dto.sortOrder;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    return this.prisma.giftNoteTemplate.update({ where: { id }, data });
  }

  async deleteGiftNoteTemplate(id: string) {
    await this.prisma.giftNoteTemplate.delete({ where: { id } });
    return { success: true };
  }

  async seedDefaultGiftNoteTemplates() {
    const existingTemplates = await this.prisma.giftNoteTemplate.findMany({
      select: { recipientType: true, content: true },
    });

    const existingKeys = new Set(
      existingTemplates.map((item) => `${item.recipientType}::${item.content.trim()}`),
    );

    const recipientSortOrder: Record<string, number> = {};
    const defaultsWithSortOrder = DEFAULT_GIFT_NOTE_TEMPLATES.map((item) => {
      const currentSortOrder = recipientSortOrder[item.recipientType] ?? 0;
      recipientSortOrder[item.recipientType] = currentSortOrder + 1;

      return {
        recipientType: item.recipientType,
        content: item.content,
        sortOrder: currentSortOrder,
        isActive: true,
      };
    });

    const templatesToCreate = defaultsWithSortOrder.filter(
      (item) => !existingKeys.has(`${item.recipientType}::${item.content.trim()}`),
    );

    if (templatesToCreate.length > 0) {
      await this.prisma.giftNoteTemplate.createMany({ data: templatesToCreate });
    }

    const total = await this.prisma.giftNoteTemplate.count();
    return {
      created: templatesToCreate.length,
      skipped: DEFAULT_GIFT_NOTE_TEMPLATES.length - templatesToCreate.length,
      total,
    };
  }

  // ─── Yorum CRUD ────────────────────────────────────────────────────────────
  listReviews(approved?: boolean) {
    return this.prisma.review.findMany({
      where: approved !== undefined ? { isApproved: approved } : undefined,
      include: {
        product: { select: { id: true, name: true, images: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveReview(id: string, approved: boolean) {
    await this.prisma.review.findUniqueOrThrow({ where: { id } });
    return this.prisma.review.update({ where: { id }, data: { isApproved: approved } });
  }

  async deleteReview(id: string) {
    await this.prisma.review.delete({ where: { id } });
    return { success: true };
  }

  // ─── Banner CRUD ───────────────────────────────────────────────────────────
  listBanners() {
    return this.prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  createBanner(dto: {
    title: string;
    imageUrl: string;
    linkUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return this.prisma.banner.create({
      data: {
        title: dto.title,
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateBanner(
    id: string,
    dto: {
      title?: string;
      imageUrl?: string;
      linkUrl?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    await this.prisma.banner.findUniqueOrThrow({ where: { id } });
    return this.prisma.banner.update({ where: { id }, data: dto });
  }

  async deleteBanner(id: string) {
    await this.prisma.banner.delete({ where: { id } });
    return { success: true };
  }

  // ─── İade Talepleri ────────────────────────────────────────────────────────
  listReturns() {
    return this.prisma.return.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, totalPrice: true, status: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReturnStatus(id: string, status: ReturnStatus, adminNote?: string) {
    await this.prisma.return.findUniqueOrThrow({ where: { id } });
    return this.prisma.return.update({
      where: { id },
      data: { status, ...(adminNote !== undefined && { adminNote }) },
    });
  }

  // ─── Gelişmiş Raporlar ─────────────────────────────────────────────────────
  async getReports(period: string = 'monthly') {
    const now = new Date();
    let startDate: Date;
    if (period === 'weekly') {
      startDate = new Date(now);
      const day = startDate.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      startDate.setDate(startDate.getDate() + diff);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1); // yearly - this year
    }

    const [orders, topProducts, topCustomers] = await Promise.all([
      this.prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        include: {
          items: { include: { product: { select: { id: true, name: true } } } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.orderItem.groupBy({
        where: { order: { createdAt: { gte: startDate } } },
        by: ['productId'],
        _sum: { quantity: true, price: true },
        orderBy: { _sum: { price: 'desc' } },
        take: 10,
      }),
      this.prisma.order.groupBy({
        where: { createdAt: { gte: startDate } },
        by: ['userId'],
        _sum: { totalPrice: true },
        _count: { id: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 10,
      }),
    ]);

    const productIds = topProducts.map((p) => p.productId);
    const productDetails = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, images: true },
    });

    const userIds = topCustomers.map((c) => c.userId);
    const userDetails = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const totalRevenue = orders
      .filter((o) => o.status !== 'CANCELED')
      .reduce((sum, o) => sum + Number(o.totalPrice), 0);

    const byStatus = orders.reduce(
      (acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalRevenue,
      totalOrders: orders.length,
      byStatus,
      topProducts: topProducts.map((tp) => {
        const prod = productDetails.find((p) => p.id === tp.productId);
        return {
          id: tp.productId,
          name: prod?.name ?? 'Bilinmiyor',
          images: prod?.images ?? [],
          totalSold: tp._sum.quantity ?? 0,
          revenue: Number(tp._sum.price ?? 0),
        };
      }),
      topCustomers: topCustomers.map((tc) => {
        const u = userDetails.find((ud) => ud.id === tc.userId);
        return {
          id: tc.userId,
          name: u?.name ?? 'Bilinmiyor',
          email: u?.email ?? '',
          orderCount: tc._count.id,
          totalSpent: Number(tc._sum.totalPrice ?? 0),
        };
      }),
    };
  }

  async getCashZReport(date?: string, period: string = 'daily') {
    const tzOffsetMinutes = 180; // TR (UTC+3)
    const offsetMs = tzOffsetMinutes * 60_000;
    const oneDayMs = 24 * 60 * 60 * 1000;

    const toTwo = (n: number) => String(n).padStart(2, '0');
    const formatLocalDate = (y: number, m: number, d: number) => `${y}-${toTwo(m)}-${toTwo(d)}`;

    const normalizedPeriod = (period || 'daily').toLowerCase();
    const reportPeriod =
      normalizedPeriod === 'weekly' || normalizedPeriod === 'monthly' ? normalizedPeriod : 'daily';

    let year: number;
    let month: number;
    let day: number;

    if (date) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
      if (!match) {
        throw new BadRequestException('Gecersiz tarih formati. YYYY-MM-DD kullanin.');
      }
      year = Number(match[1]);
      month = Number(match[2]);
      day = Number(match[3]);
    } else {
      const nowTr = new Date(Date.now() + offsetMs);
      year = nowTr.getUTCFullYear();
      month = nowTr.getUTCMonth() + 1;
      day = nowTr.getUTCDate();
    }

    const referenceLocalUtc = new Date(Date.UTC(year, month - 1, day));

    let startLocalUtcMs: number;
    let endLocalUtcMs: number;

    if (reportPeriod === 'weekly') {
      const weekDay = referenceLocalUtc.getUTCDay();
      const mondayDiff = weekDay === 0 ? -6 : 1 - weekDay;
      startLocalUtcMs = Date.UTC(year, month - 1, day + mondayDiff, 0, 0, 0, 0);
      endLocalUtcMs = startLocalUtcMs + (7 * oneDayMs) - 1;
    } else if (reportPeriod === 'monthly') {
      startLocalUtcMs = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
      endLocalUtcMs = Date.UTC(year, month, 1, 0, 0, 0, 0) - 1;
    } else {
      startLocalUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
      endLocalUtcMs = startLocalUtcMs + oneDayMs - 1;
    }

    const startAt = new Date(startLocalUtcMs - offsetMs);
    const endAt = new Date(endLocalUtcMs - offsetMs);

    const startLocal = new Date(startAt.getTime() + offsetMs);
    const endLocal = new Date(endAt.getTime() + offsetMs);
    const reportDate = reportPeriod === 'daily'
      ? formatLocalDate(startLocal.getUTCFullYear(), startLocal.getUTCMonth() + 1, startLocal.getUTCDate())
      : `${formatLocalDate(startLocal.getUTCFullYear(), startLocal.getUTCMonth() + 1, startLocal.getUTCDate())} - ${formatLocalDate(endLocal.getUTCFullYear(), endLocal.getUTCMonth() + 1, endLocal.getUTCDate())}`;

    const isInRange = (d: Date) => d >= startAt && d <= endAt;

    const orders = await this.prisma.order.findMany({
      where: {
        OR: [
          {
            createdAt: {
              gte: startAt,
              lte: endAt,
            },
          },
          {
            paidAt: {
              gte: startAt,
              lte: endAt,
            },
          },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const completedStatuses = new Set<OrderStatus>(['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']);
    const successfulOrders = orders.filter((o) => completedStatuses.has(o.status) && isInRange(o.paidAt ?? o.createdAt));
    const canceledOrders = orders.filter((o) => o.status === 'CANCELED' && isInRange(o.createdAt));
    const createdOrders = orders.filter((o) => isInRange(o.createdAt));

    const grossRevenue = successfulOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
    const canceledRevenue = canceledOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0);

    const statusBreakdown = createdOrders.reduce(
      (acc, o) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const hourlySales = reportPeriod === 'daily'
      ? Array.from({ length: 24 }, (_, hour) => {
          const hourOrders = successfulOrders.filter((o) => {
            const local = new Date((o.paidAt ?? o.createdAt).getTime() + offsetMs);
            return local.getUTCHours() === hour;
          });

          return {
            hour: `${String(hour).padStart(2, '0')}:00`,
            orderCount: hourOrders.length,
            total: hourOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0),
          };
        }).filter((h) => h.orderCount > 0)
      : Array.from({ length: Math.floor((endLocalUtcMs - startLocalUtcMs) / oneDayMs) + 1 }, (_, i) => {
          const dayStartLocalUtc = startLocalUtcMs + i * oneDayMs;
          const dayEndLocalUtc = dayStartLocalUtc + oneDayMs - 1;
          const dayOrders = successfulOrders.filter((o) => {
            const localMs = (o.paidAt ?? o.createdAt).getTime() + offsetMs;
            return localMs >= dayStartLocalUtc && localMs <= dayEndLocalUtc;
          });

          const dayDate = new Date(dayStartLocalUtc);
          const label = `${toTwo(dayDate.getUTCDate())}.${toTwo(dayDate.getUTCMonth() + 1)}`;

          return {
            hour: label,
            orderCount: dayOrders.length,
            total: dayOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0),
          };
        }).filter((d) => d.orderCount > 0);

    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    successfulOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.productId;
        const existing = productMap.get(key);
        const lineRevenue = Number(item.price) * item.quantity;
        if (!existing) {
          productMap.set(key, {
            name: item.product?.name ?? key,
            quantity: item.quantity,
            revenue: lineRevenue,
          });
          return;
        }
        existing.quantity += item.quantity;
        existing.revenue += lineRevenue;
      });
    });

    const topProducts = Array.from(productMap.entries())
      .map(([id, value]) => ({ id, ...value }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      reportPeriod,
      reportDate,
      generatedAt: new Date().toISOString(),
      openingTime: startAt.toISOString(),
      closingTime: endAt.toISOString(),
      totalOrders: createdOrders.length,
      successfulOrders: successfulOrders.length,
      canceledOrders: canceledOrders.length,
      grossRevenue,
      canceledRevenue,
      netRevenue: grossRevenue,
      averageBasket: successfulOrders.length ? grossRevenue / successfulOrders.length : 0,
      statusBreakdown,
      hourlySales,
      topProducts,
    };
  }
}
