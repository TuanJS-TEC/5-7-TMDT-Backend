import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { normalizeVnPhone, VN_PHONE_REGEX } from '../../auth/phone.util';

export class UpdateSellerProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Họ tên / tên showroom quá ngắn' })
  @MaxLength(200, { message: 'Họ tên / tên showroom quá dài' })
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Địa chỉ không được để trống nếu gửi lên' })
  @MaxLength(500, { message: 'Địa chỉ quá dài' })
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000, { message: 'Mô tả quá dài' })
  sellerDescription?: string;

  /** SĐT hiển thị — gửi "" hoặc null để xóa */
  @IsOptional()
  @ValidateIf(
    (_, o) =>
      o.displayPhone != null && String(o.displayPhone).trim() !== '',
  )
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeVnPhone(value) : value,
  )
  @IsString()
  @Matches(VN_PHONE_REGEX, {
    message: 'Số điện thoại hiển thị không đúng định dạng',
  })
  displayPhone?: string | null;

  /** URL ảnh (CDN https hoặc đường dẫn /uploads/...) */
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  @Matches(/^(\/|https?:\/\/).+/, {
    message: 'avatarUrl phải bắt đầu bằng / hoặc http(s)://',
  })
  avatarUrl?: string;
}
