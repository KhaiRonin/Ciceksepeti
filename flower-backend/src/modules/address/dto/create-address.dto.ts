import { IsPhoneNumber, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @IsPhoneNumber()
  phone: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  country: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  addressLine: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  postalCode: string;
}

export class AddressIdDto {
  @IsUUID()
  id: string;
}
