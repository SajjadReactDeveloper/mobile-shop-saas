import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { InventoryService } from './inventory.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { ProductCategory } from '@prisma/client'

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  @ApiQuery({ name: 'category', enum: ProductCategory, required: false })
  @ApiQuery({ name: 'lowStock', type: Boolean, required: false })
  getAll(@CurrentUser() user: any, @Query('category') category?: ProductCategory, @Query('lowStock') lowStock?: string) {
    return this.inventoryService.findAll(user.shopId, category, lowStock === 'true')
  }

  @Get('low-stock')
  getLowStock(@CurrentUser() user: any) {
    return this.inventoryService.getLowStock(user.shopId)
  }

  @Get(':id')
  getOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.inventoryService.findOne(id, user.shopId)
  }

  @Get(':id/imeis')
  getImeis(@CurrentUser() user: any, @Param('id') id: string) {
    return this.inventoryService.getImeis(id, user.shopId)
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.inventoryService.create(user.shopId, body)
  }

  @Post(':id/stock')
  addStock(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.inventoryService.addStock(id, user.shopId, body)
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.inventoryService.update(id, user.shopId, body)
  }

  @Delete(':id')
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.inventoryService.softDelete(id, user.shopId)
  }
}
