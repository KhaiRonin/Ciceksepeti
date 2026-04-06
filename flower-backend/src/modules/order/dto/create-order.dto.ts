import { IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  addressId: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  giftNote?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  deliveryDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(1[2-9]|2[0-3]):(00|30)$/)
  deliveryTime?: string;

  @IsOptional()
  @IsIn(['GIRNE', 'LEFKOSA', 'GAZIMAGUSA'])
  deliveryRegion?: 'GIRNE' | 'LEFKOSA' | 'GAZIMAGUSA';
}
