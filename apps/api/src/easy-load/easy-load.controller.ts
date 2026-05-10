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
import { EasyLoadService } from './easy-load.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@ApiTags('Easy Load')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('easy-load')
export class EasyLoadController {
  constructor(private easyLoadService: EasyLoadService) {}

  @Get('accounts')
  getAccounts(@CurrentUser() user: AuthenticatedUser) {
    return this.easyLoadService.getAccounts(user.shopId);
  }

  @Post('accounts')
  addAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: { network: string; phoneNumber: string; currentBalance: number },
  ) {
    return this.easyLoadService.addAccount(user.shopId, body);
  }

  @Get('accounts/:id/transactions')
  getTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.easyLoadService.getTransactions(id, user.shopId);
  }

  @Post('accounts/:id/load')
  load(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { customerPhone: string; amount: number; profit: number },
  ) {
    return this.easyLoadService.load(id, user.shopId, body);
  }

  @Post('accounts/:id/topup')
  topup(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { amount: number },
  ) {
    return this.easyLoadService.topup(id, user.shopId, body);
  }

  @Get('daily-summary')
  getDailySummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('date') date: string,
  ) {
    return this.easyLoadService.dailySummary(
      user.shopId,
      date ?? new Date().toISOString().split('T')[0],
    );
  }
}
