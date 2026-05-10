import { Prisma } from '@prisma/client';

export type AuthenticatedUser = Prisma.UserGetPayload<{
  include: { shop: { include: { subscription: true } } };
}>;
