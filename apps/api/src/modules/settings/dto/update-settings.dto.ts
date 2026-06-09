import { IsOptional, IsString, IsNumber, MaxLength, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateStoreSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  storeName?: string;

  @IsOptional()
  @IsString()
  storeDescription?: string;

  @IsOptional()
  @IsString()
  logo?: string | null;

  @IsOptional()
  @IsString()
  favicon?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxCode?: string | null;

  @IsOptional()
  @IsString()
  businessLicense?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  hotline?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ward?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @IsOptional()
  @IsString()
  mapUrl?: string | null;

  @IsOptional()
  @IsString()
  openingHours?: string | null;

  @IsOptional()
  @IsString()
  deliveryPolicy?: string | null;

  @IsOptional()
  @IsString()
  returnPolicy?: string | null;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value === '' || value == null ? 0 : Number(value)))
  defaultShippingFee?: number;

  @IsOptional()
  @IsString()
  defaultShippingZone?: string | null;

  @IsOptional()
  @IsString()
  facebookUrl?: string | null;

  @IsOptional()
  @IsString()
  zaloUrl?: string | null;

  @IsOptional()
  @IsString()
  tiktokUrl?: string | null;

  @IsOptional()
  @IsString()
  youtubeUrl?: string | null;

  @IsOptional()
  @IsString()
  instagramUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  seoTitle?: string | null;

  @IsOptional()
  @IsString()
  seoDescription?: string | null;

  @IsOptional()
  @IsString()
  seoKeywords?: string | null;

  @IsOptional()
  @IsString()
  ogImage?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
