import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { RemoveFromCartDto } from './dto/remove-from-cart.dto';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser('sub') userId: string) {
    return this.cartService.getMyCart(userId);
  }

  @Post('add')
  add(@CurrentUser('sub') userId: string, @Body() dto: AddToCartDto) {
    return this.cartService.add(userId, dto);
  }

  @Post('remove')
  remove(@CurrentUser('sub') userId: string, @Body() dto: RemoveFromCartDto) {
    return this.cartService.remove(userId, dto);
  }
}
