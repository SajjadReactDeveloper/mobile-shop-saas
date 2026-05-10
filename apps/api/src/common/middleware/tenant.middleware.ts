import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

// JWT validation happens in JwtAuthGuard; this middleware just enforces
// that the authenticated user's shopId matches any :shopId in the route.
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request & { user?: any }, res: Response, next: NextFunction) {
    const routeShopId = req.params?.shopId
    if (routeShopId && req.user && req.user.shopId !== routeShopId) {
      throw new ForbiddenException('Access denied to this shop')
    }
    next()
  }
}
