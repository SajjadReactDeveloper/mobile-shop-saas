import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProductCategory } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  @ApiQuery({ name: 'category', enum: ProductCategory, required: false })
  @ApiQuery({ name: 'lowStock', type: Boolean, required: false })
  getAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('category') category?: ProductCategory,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.inventoryService.findAll(
      user.shopId,
      category,
      lowStock === 'true',
    );
  }

  @Get('low-stock')
  getLowStock(@CurrentUser() user: AuthenticatedUser) {
    return this.inventoryService.getLowStock(user.shopId);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.inventoryService.findOne(id, user.shopId);
  }

  @Get(':id/imeis')
  getImeis(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.inventoryService.getImeis(id, user.shopId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      name: string;
      category: ProductCategory;
      buyingPrice: number;
      sellingPrice: number;
      stockQty: number;
      imeiTracked: boolean;
      lowStockThreshold?: number;
    },
  ) {
    return this.inventoryService.create(user.shopId, body);
  }

  @Post(':id/stock')
  addStock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body()
    body: {
      qty: number;
      unitPrice: number;
      imeis?: string[];
      supplier?: string;
    },
  ) {
    return this.inventoryService.addStock(id, user.shopId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      sellingPrice: number;
      lowStockThreshold: number;
    }>,
  ) {
    return this.inventoryService.update(id, user.shopId, body);
  }

  @Delete(':id')
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.inventoryService.softDelete(id, user.shopId);
  }
}
