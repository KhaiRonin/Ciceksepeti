import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateOrderDto) {
    return this.orderService.create(userId, dto);
  }

  @Get()
  list(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: 'admin' | 'user',
  ) {
    return this.orderService.list(userId, role);
  }

  @Get(':id')
  getById(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: 'admin' | 'user',
    @Param('id') orderId: string,
  ) {
    return this.orderService.getById(userId, role, orderId);
  }
}
