import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { EasypaisaService } from './easypaisa.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@ApiTags('Easypaisa / JazzCash')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('easypaisa')
export class EasypaisaController {
  constructor(private easypaisaService: EasypaisaService) {}

  @Get('accounts')
  getAccounts(@CurrentUser() user: any) {
    return this.easypaisaService.getAccounts(user.shopId)
  }

  @Post('accounts')
  addAccount(@CurrentUser() user: any, @Body() body: any) {
    return this.easypaisaService.addAccount(user.shopId, body)
  }

  @Get('accounts/:id/transactions')
  getTransactions(@CurrentUser() user: any, @Param('id') id: string) {
    return this.easypaisaService.getTransactions(id, user.shopId)
  }

  @Post('accounts/:id/transactions')
  addTransaction(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.easypaisaService.addTransaction(id, user.shopId, body)
  }
}
