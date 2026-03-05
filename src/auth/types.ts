import type { Role } from './roles';

export type AuthenticatedUser = {
  userId: string;
  email?: string;
  role: Role;
};

