import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Public } from '../../decorators/public.decorator';
import { PaytrCallbackDto } from './dto/paytr-callback.dto';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('orders/:orderId/session')
  createSession(
    @CurrentUser('sub') userId: string,
    @Param('orderId') orderId: string,
    @Req() request: { ip?: string },
  ) {
    return this.paymentService.createSession(userId, orderId, request.ip ?? '127.0.0.1');
  }

  @Post('paytr/orders/:orderId/session')
  createPaytrSession(
    @CurrentUser('sub') userId: string,
    @Param('orderId') orderId: string,
    @Req() request: { ip?: string },
  ) {
    return this.paymentService.createPaytrSession(userId, orderId, request.ip ?? '127.0.0.1');
  }

  @Public()
  @Post('paytr/callback')
  handlePaytrCallback(@Body() dto: PaytrCallbackDto) {
    return this.paymentService.handlePaytrCallback(dto);
  }
}
