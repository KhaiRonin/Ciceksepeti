import {
	IsArray,
	IsInt,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	IsUUID,
	MaxLength,
	Max,
	Min,
	MinLength,
	IsBoolean,
} from 'class-validator';

export class UpdateProductDto {
	@IsOptional()
	@IsString()
	@MinLength(2)
	@MaxLength(200)
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsNumber({ maxDecimalPlaces: 2 })
	@IsPositive()
	price?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	stock?: number;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	images?: string[];

	@IsOptional()
	@IsUUID()
	categoryId?: string;

	@IsOptional()
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	@Max(100)
	discountPercent?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	discountDays?: number;

	@IsOptional()
	@IsBoolean()
	clearDiscount?: boolean;
}
