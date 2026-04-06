import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PresenceDto {
  @IsString()
  @MaxLength(120)
  visitorId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  path?: string;
}
