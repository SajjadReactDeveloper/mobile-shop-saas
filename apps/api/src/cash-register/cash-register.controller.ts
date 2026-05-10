import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { CashRegisterService } from './cash-register.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@ApiTags('Cash Register')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cash-register')
export class CashRegisterController {
  constructor(private cashRegisterService: CashRegisterService) {}

  @Get('today')
  getToday(@CurrentUser() user: any) {
    return this.cashRegisterService.getToday(user.shopId)
  }

  @Get('history')
  getHistory(@CurrentUser() user: any) {
    return this.cashRegisterService.getHistory(user.shopId)
  }

  @Post('open')
  openDay(@CurrentUser() user: any, @Body('openingBalance') openingBalance: number, @Body('date') date?: string) {
    return this.cashRegisterService.openDay(user.shopId, openingBalance, date)
  }

  @Post(':id/expense')
  addExpense(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.cashRegisterService.addExpense(id, user.shopId, body)
  }

  @Post(':id/close')
  closeDay(@CurrentUser() user: any, @Param('id') id: string) {
    return this.cashRegisterService.closeDay(id, user.shopId, user.id)
  }
}
