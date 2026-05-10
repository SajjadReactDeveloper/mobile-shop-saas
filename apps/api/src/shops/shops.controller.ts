import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { ShopsService } from './shops.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@ApiTags('Shop')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shop')
export class ShopsController {
  constructor(private shopsService: ShopsService) {}

  @Get()
  getShop(@CurrentUser() user: any) {
    return this.shopsService.findById(user.shopId)
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.shopsService.getStats(user.shopId)
  }

  @Patch()
  updateShop(@CurrentUser() user: any, @Body() body: any) {
    return this.shopsService.update(user.shopId, body)
  }
}
