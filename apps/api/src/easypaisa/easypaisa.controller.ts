import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EasypaisaService } from './easypaisa.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@ApiTags('Easypaisa / JazzCash')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('easypaisa')
export class EasypaisaController {
  constructor(private easypaisaService: EasypaisaService) {}

  @Get('accounts')
  getAccounts(@CurrentUser() user: AuthenticatedUser) {
    return this.easypaisaService.getAccounts(user.shopId);
  }

  @Post('accounts')
  addAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { accountPhone: string; currentBalance: number },
  ) {
    return this.easypaisaService.addAccount(user.shopId, body);
  }

  @Get('accounts/:id/transactions')
  getTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.easypaisaService.getTransactions(id, user.shopId);
  }

  @Post('accounts/:id/transactions')
  addTransaction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body()
    body: {
      type: string;
      amount: number;
      fee: number;
      description?: string;
    },
  ) {
    return this.easypaisaService.addTransaction(id, user.shopId, body);
  }
}
