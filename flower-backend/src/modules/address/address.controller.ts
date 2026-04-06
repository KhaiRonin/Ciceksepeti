import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CreateAddressDto } from './dto/create-address.dto';
import { AddressService } from './address.service';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  list(@CurrentUser('sub') userId: string) {
    return this.addressService.list(userId);
  }

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateAddressDto) {
    return this.addressService.create(userId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') addressId: string) {
    return this.addressService.remove(userId, addressId);
  }
}
