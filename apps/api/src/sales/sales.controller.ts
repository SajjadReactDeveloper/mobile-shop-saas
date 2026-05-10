import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Get()
  getAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.salesService.findAll(user.shopId, from, to);
  }

  @Get('daily-summary')
  getDailySummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('date') date: string,
  ) {
    return this.salesService.dailySummary(
      user.shopId,
      date ?? new Date().toISOString().split('T')[0],
    );
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.salesService.findOne(id, user.shopId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      customerId?: string;
      items: {
        productId: string;
        qty: number;
        unitPrice: number;
        imei?: string;
      }[];
      discount?: number;
      paymentMethod: string;
      isCredit?: boolean;
    },
  ) {
    return this.salesService.create(user.shopId, user.id, body);
  }
}
