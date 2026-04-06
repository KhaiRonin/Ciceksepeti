import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ProductTranslationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(5000)
  description?: string;
}

export class CategoryTranslationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;
}

export class ProductTranslationsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductTranslationDto)
  en?: ProductTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductTranslationDto)
  ru?: ProductTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductTranslationDto)
  ar?: ProductTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductTranslationDto)
  az?: ProductTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductTranslationDto)
  tk?: ProductTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductTranslationDto)
  hi?: ProductTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductTranslationDto)
  ko?: ProductTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductTranslationDto)
  ur?: ProductTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductTranslationDto)
  el?: ProductTranslationDto;
}

export class CategoryTranslationsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => CategoryTranslationDto)
  en?: CategoryTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CategoryTranslationDto)
  ru?: CategoryTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CategoryTranslationDto)
  ar?: CategoryTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CategoryTranslationDto)
  az?: CategoryTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CategoryTranslationDto)
  tk?: CategoryTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CategoryTranslationDto)
  hi?: CategoryTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CategoryTranslationDto)
  ko?: CategoryTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CategoryTranslationDto)
  ur?: CategoryTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CategoryTranslationDto)
  el?: CategoryTranslationDto;
}
