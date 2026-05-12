import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CashRegisterService } from './cash-register.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@ApiTags('Cash Register')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cash-register')
export class CashRegisterController {
  constructor(private cashRegisterService: CashRegisterService) {}

  @Get('today')
  getToday(@CurrentUser() user: AuthenticatedUser) {
    return this.cashRegisterService.getToday(user.shopId);
  }

  @Get('history')
  getHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.cashRegisterService.getHistory(user.shopId);
  }

  @Post('open')
  openDay(
    @CurrentUser() user: AuthenticatedUser,
    @Body('openingBalance') openingBalance: number,
    @Body('date') date?: string,
  ) {
    return this.cashRegisterService.openDay(user.shopId, openingBalance, date);
  }

  @Post(':id/expense')
  addExpense(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { description: string; amount: number },
  ) {
    return this.cashRegisterService.addExpense(id, user.shopId, body);
  }

  @Post(':id/quick-sale')
  addQuickSale(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body()
    body: {
      productName: string;
      buyingPrice: number;
      sellingPrice: number;
      qty: number;
    },
  ) {
    return this.cashRegisterService.addQuickSale(id, user.shopId, body);
  }

  @Post(':id/close')
  closeDay(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.cashRegisterService.closeDay(id, user.shopId, user.id);
  }
}
