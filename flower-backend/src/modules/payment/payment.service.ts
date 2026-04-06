import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from '@prisma/client';
import { createHmac } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { PaytrCallbackDto } from './dto/paytr-callback.dto';

type PaytrConfig = {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  okUrl: string;
  failUrl: string;
  callbackUrl: string;
  timeoutLimit: number;
  debug: boolean;
  testMode: boolean;
};

type PaymentSessionResponse = {
  provider: string;
  orderId: string;
  orderStatus: OrderStatus;
  paymentReference: string;
  amount: number;
  currency: string;
  ready: boolean;
  iframeToken: string | null;
  iframeUrl: string | null;
  okUrl: string | null;
  failUrl: string | null;
  callbackUrl: string | null;
  message: string;
};

type PaymentOrder = {
  id: string;
  userId: string;
  status: OrderStatus;
  totalPrice: unknown;
  paymentReference: string | null;
  paymentProvider: string | null;
  user: { email: string };
  address: {
    fullName: string;
    addressLine: string;
    city: string;
    country: string;
    phone: string;
  };
  items: Array<{
    quantity: number;
    price: unknown;
    product?: { name?: string | null } | null;
  }>;
};

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getPaytrConfig(): PaytrConfig {
    return this.configService.get<PaytrConfig>('payment.paytr') ?? {
      merchantId: '',
      merchantKey: '',
      merchantSalt: '',
      okUrl: '',
      failUrl: '',
      callbackUrl: '',
      timeoutLimit: 30,
      debug: false,
      testMode: true,
    };
  }

  private isPaytrConfigured(config: PaytrConfig): boolean {
    return Boolean(
      config.merchantId &&
        config.merchantKey &&
        config.merchantSalt &&
        config.okUrl &&
        config.failUrl &&
        config.callbackUrl,
    );
  }

  private getDefaultPaymentProvider(): string {
    return (this.configService.get<string>('payment.provider') ?? 'PAYTR').toUpperCase();
  }

  private resolveProvider(provider?: string): string {
    const resolved = (provider ?? this.getDefaultPaymentProvider()).trim().toUpperCase();
    return resolved || 'PAYTR';
  }

  private createPaymentReference(orderId: string, provider = 'PAYTR'): string {
    return `${provider}-${orderId.replace(/-/g, '').slice(0, 20)}-${Date.now()}`;
  }

  private buildPaytrBasket(
    items: Array<{ quantity: number; price: unknown; product?: { name?: string | null } | null }>,
  ): string {
    const basket = items.map((item) => [
      item.product?.name?.slice(0, 120) || 'Çiçek Siparişi',
      Number(item.price).toFixed(2),
      item.quantity,
    ]);

    return Buffer.from(JSON.stringify(basket)).toString('base64');
  }

  private generatePaytrToken(params: {
    merchantId: string;
    userIp: string;
    merchantOid: string;
    email: string;
    paymentAmount: string;
    userBasket: string;
    currency: string;
    testMode: string;
    merchantKey: string;
    merchantSalt: string;
  }): string {
    const hashString =
      params.merchantId +
      params.userIp +
      params.merchantOid +
      params.email +
      params.paymentAmount +
      params.userBasket +
      '0' +
      '0' +
      params.currency +
      params.testMode;

    return createHmac('sha256', params.merchantKey)
      .update(hashString + params.merchantSalt)
      .digest('base64');
  }

  private validatePaytrCallbackHash(dto: PaytrCallbackDto, config: PaytrConfig): boolean {
    if (!dto.hash) return false;

    const callbackString = `${dto.merchant_oid}${config.merchantSalt}${dto.status}${dto.total_amount}`;
    const calculatedHash = createHmac('sha256', config.merchantKey)
      .update(callbackString)
      .digest('base64');

    return calculatedHash === dto.hash;
  }

  private async findOrderForPayment(orderId: string): Promise<PaymentOrder> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        address: true,
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order as PaymentOrder;
  }

  private assertOrderCanStartPayment(order: PaymentOrder, userId: string): void {
    if (order.userId !== userId) {
      throw new ForbiddenException('Forbidden');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can start payment');
    }

    if (!order.items.length) {
      throw new BadRequestException('Order has no items');
    }
  }

  private async ensurePaymentReference(
    order: Pick<PaymentOrder, 'id' | 'paymentReference' | 'paymentProvider'>,
    provider: string,
  ): Promise<string> {
    const paymentReference = order.paymentReference ?? this.createPaymentReference(order.id, provider);

    if (!order.paymentReference || order.paymentProvider !== provider) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentProvider: provider,
          paymentReference,
        },
      });
    }

    return paymentReference;
  }

  private createPendingSessionResponse(params: {
    provider: string;
    order: Pick<PaymentOrder, 'id' | 'status' | 'totalPrice'>;
    paymentReference: string;
    okUrl?: string | null;
    failUrl?: string | null;
    callbackUrl?: string | null;
    message: string;
  }): PaymentSessionResponse {
    return {
      provider: params.provider,
      orderId: params.order.id,
      orderStatus: params.order.status,
      paymentReference: params.paymentReference,
      amount: Number(params.order.totalPrice),
      currency: 'TRY',
      ready: false,
      iframeToken: null,
      iframeUrl: null,
      okUrl: params.okUrl ?? null,
      failUrl: params.failUrl ?? null,
      callbackUrl: params.callbackUrl ?? null,
      message: params.message,
    };
  }

  async createSession(
    userId: string,
    orderId: string,
    requestIp: string,
    provider?: string,
  ): Promise<PaymentSessionResponse> {
    const selectedProvider = this.resolveProvider(provider);

    if (selectedProvider === 'PAYTR') {
      return this.createPaytrSession(userId, orderId, requestIp);
    }

    const order = await this.findOrderForPayment(orderId);
    this.assertOrderCanStartPayment(order, userId);

    const paymentReference = await this.ensurePaymentReference(order, selectedProvider);

    return this.createPendingSessionResponse({
      provider: selectedProvider,
      order,
      paymentReference,
      message: `${selectedProvider} sağlayıcısı henüz aktif değil. Sağlayıcı bilgilerini ekleyince bu akış otomatik çalışır.`,
    });
  }

  async createPaytrSession(
    userId: string,
    orderId: string,
    requestIp: string,
  ): Promise<PaymentSessionResponse> {
    const order = await this.findOrderForPayment(orderId);
    this.assertOrderCanStartPayment(order, userId);

    const config = this.getPaytrConfig();
    const paymentReference = await this.ensurePaymentReference(order, 'PAYTR');

    const baseResponse = this.createPendingSessionResponse({
      provider: 'PAYTR',
      order,
      paymentReference,
      okUrl: config.okUrl,
      failUrl: config.failUrl,
      callbackUrl: config.callbackUrl,
      message: 'PayTR yapılandırması eksik.',
    });

    if (!this.isPaytrConfigured(config)) {
      return {
        ...baseResponse,
        message: 'PayTR anahtarları tanımlanmadı. Entegrasyon hazırlığı tamamlandı, canlı bilgiler bekleniyor.',
      };
    }

    const paymentAmount = String(Math.round(Number(order.totalPrice) * 100));
    const userBasket = this.buildPaytrBasket(order.items);
    const userIp = requestIp?.replace('::ffff:', '') || '127.0.0.1';
    const testMode = config.testMode ? '1' : '0';

    const token = this.generatePaytrToken({
      merchantId: config.merchantId,
      userIp,
      merchantOid: paymentReference,
      email: order.user.email,
      paymentAmount,
      userBasket,
      currency: 'TL',
      testMode,
      merchantKey: config.merchantKey,
      merchantSalt: config.merchantSalt,
    });

    const payload = new URLSearchParams({
      merchant_id: config.merchantId,
      user_ip: userIp,
      merchant_oid: paymentReference,
      email: order.user.email,
      payment_amount: paymentAmount,
      paytr_token: token,
      user_basket: userBasket,
      debug_on: config.debug ? '1' : '0',
      no_installment: '0',
      max_installment: '0',
      user_name: order.address.fullName,
      user_address: `${order.address.addressLine}, ${order.address.city}, ${order.address.country}`,
      user_phone: order.address.phone,
      merchant_ok_url: config.okUrl,
      merchant_fail_url: config.failUrl,
      timeout_limit: String(config.timeoutLimit),
      currency: 'TL',
      test_mode: testMode,
      lang: 'tr',
    });

    const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload,
    });

    const data = (await response.json()) as {
      status?: string;
      token?: string;
      reason?: string;
    };

    if (!response.ok || data.status !== 'success' || !data.token) {
      throw new BadGatewayException(data.reason ?? 'PayTR token oluşturulamadı');
    }

    return {
      ...baseResponse,
      ready: true,
      iframeToken: data.token,
      iframeUrl: `https://www.paytr.com/odeme/guvenli/${data.token}`,
      message: 'PayTR oturumu hazır.',
    };
  }

  async handlePaytrCallback(dto: PaytrCallbackDto): Promise<string> {
    const config = this.getPaytrConfig();
    if (!this.isPaytrConfigured(config)) {
      throw new ServiceUnavailableException('PayTR callback is not configured');
    }

    if (!this.validatePaytrCallbackHash(dto, config)) {
      throw new BadRequestException('Invalid PayTR callback hash');
    }

    const order = await this.prisma.order.findUnique({
      where: { paymentReference: dto.merchant_oid },
    });

    if (!order) {
      throw new NotFoundException('Order not found for payment reference');
    }

    const callbackAmount = Number.parseInt(dto.total_amount, 10);
    const orderAmount = Math.round(Number(order.totalPrice) * 100);
    if (!Number.isFinite(callbackAmount) || callbackAmount <= 0 || callbackAmount !== orderAmount) {
      throw new BadRequestException('Invalid PayTR callback amount');
    }

    if (dto.status === 'success' && order.status === OrderStatus.PENDING) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
          paymentProvider: 'PAYTR',
        },
      });
    }

    return 'OK';
  }
}
