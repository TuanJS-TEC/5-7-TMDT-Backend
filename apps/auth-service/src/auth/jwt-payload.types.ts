import { UserRole } from '@car-marketplace/database';

/** Gắn vào req.user sau JWT validate (UC15 / các API bảo vệ) */
export interface JwtRequestUser {
  userId: string;
  phone: string;
  role: UserRole;
}
