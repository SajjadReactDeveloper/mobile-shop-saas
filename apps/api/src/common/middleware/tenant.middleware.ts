import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedUser } from '../../auth/types/auth.types';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(
    req: Request & { user?: Pick<AuthenticatedUser, 'shopId'> },
    _res: Response,
    next: NextFunction,
  ) {
    const routeShopId = req.params?.shopId;
    if (routeShopId && req.user && req.user.shopId !== routeShopId) {
      throw new ForbiddenException('Access denied to this shop');
    }
    next();
  }
}
