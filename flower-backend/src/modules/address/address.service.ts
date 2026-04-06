import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.address.findMany({ where: { userId } });
  }

  create(userId: string, dto: CreateAddressDto) {
    return this.prisma.address.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async getOwnedAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  async remove(userId: string, addressId: string) {
    await this.getOwnedAddress(userId, addressId);
    await this.prisma.address.delete({ where: { id: addressId } });
    return { success: true };
  }
}
