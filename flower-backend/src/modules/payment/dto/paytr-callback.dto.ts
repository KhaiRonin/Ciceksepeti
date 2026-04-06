import { IsIn, IsOptional, IsString } from 'class-validator';

export class PaytrCallbackDto {
  @IsString()
  merchant_oid: string;

  @IsString()
  @IsIn(['success', 'failed'])
  status: 'success' | 'failed';

  @IsString()
  total_amount: string;

  @IsOptional()
  @IsString()
  failed_reason_msg?: string;

  @IsOptional()
  @IsString()
  hash?: string;
}
