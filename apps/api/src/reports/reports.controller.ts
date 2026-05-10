import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { ReportsService } from './reports.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('overview')
  getOverview(@CurrentUser() user: any, @Query('from') from: string, @Query('to') to: string) {
    const today = new Date().toISOString().split('T')[0]
    return this.reportsService.overview(user.shopId, from ?? today, to ?? today)
  }

  @Get('top-products')
  getTopProducts(@CurrentUser() user: any, @Query('from') from: string, @Query('to') to: string) {
    const today = new Date().toISOString().split('T')[0]
    return this.reportsService.topProducts(user.shopId, from ?? today, to ?? today)
  }

  @Get('receivables')
  getReceivables(@CurrentUser() user: any) {
    return this.reportsService.receivables(user.shopId)
  }
}
