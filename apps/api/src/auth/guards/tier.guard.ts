import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../types/auth.types';

export type SubscriptionTier = 'FREE' | 'PRO' | 'BUSINESS';

export const TIER_KEY = 'requiredTier';
/** Decorate a controller/handler with the minimum tier needed to access it */
export const RequiresTier = (tier: SubscriptionTier) =>
  SetMetadata(TIER_KEY, tier);

const TIER_RANK: Record<SubscriptionTier, number> = {
  FREE: 0,
  PRO: 1,
  BUSINESS: 2,
};

@Injectable()
export class TierGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<SubscriptionTier>(
      TIER_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    // No tier requirement — allow through
    if (!required) return true;

    const req = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const shopId = req.user?.shopId;
    if (!shopId) throw new ForbiddenException('Not authenticated');

    const sub = await this.prisma.subscription.findUnique({
      where: { shopId },
      select: { tier: true, status: true },
    });

    const currentTier = sub?.tier ?? 'FREE';
    const currentRank = TIER_RANK[currentTier] ?? 0;
    const requiredRank = TIER_RANK[required] ?? 0;

    if (currentRank < requiredRank) {
      throw new ForbiddenException(
        `This feature requires the ${required} plan. Please upgrade to continue.`,
      );
    }

    return true;
  }
}
