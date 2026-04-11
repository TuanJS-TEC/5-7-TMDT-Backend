import type { UserRole } from '@car-marketplace/database';

/** Gắn vào req.user sau JWT validate */
export interface JwtRequestUser {
  userId: string;
  phone: string;
  role: UserRole;
}
