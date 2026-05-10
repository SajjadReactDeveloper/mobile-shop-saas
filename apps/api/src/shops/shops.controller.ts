import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ShopsService } from './shops.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@ApiTags('Shop')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shop')
export class ShopsController {
  constructor(private shopsService: ShopsService) {}

  @Get()
  getShop(@CurrentUser() user: AuthenticatedUser) {
    return this.shopsService.findById(user.shopId);
  }

  @Get('stats')
  getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.shopsService.getStats(user.shopId);
  }

  @Patch()
  updateShop(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      name?: string;
      city?: string;
      address?: string;
      phone?: string;
      enabledModules?: string[];
    },
  ) {
    return this.shopsService.update(user.shopId, body);
  }
}
