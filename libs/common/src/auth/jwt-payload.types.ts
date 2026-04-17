export type UserRole = 'buyer' | 'seller' | 'admin';

export interface JwtPayload {
  userId: string;
  phone: string;
  role: UserRole;
}

export interface JwtRequestUser extends JwtPayload {}