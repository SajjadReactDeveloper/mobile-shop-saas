import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { CustomersService } from './customers.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  getAll(@CurrentUser() user: any) {
    return this.customersService.findAll(user.shopId)
  }

  @Get('overdue')
  getOverdue(@CurrentUser() user: any) {
    return this.customersService.getOverdue(user.shopId)
  }

  @Get(':id')
  getOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.customersService.findOne(id, user.shopId)
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.customersService.create(user.shopId, body)
  }

  @Post(':id/payment')
  recordPayment(@CurrentUser() user: any, @Param('id') id: string, @Body('amount') amount: number) {
    return this.customersService.recordPayment(id, user.shopId, amount)
  }

  @Post(':id/remind')
  sendReminder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.customersService.sendUdharrReminder(id, user.shopId)
  }
}
