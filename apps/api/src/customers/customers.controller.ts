import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  getAll(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.findAll(user.shopId);
  }

  @Get('overdue')
  getOverdue(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.getOverdue(user.shopId);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.customersService.findOne(id, user.shopId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { name: string; phone?: string; notes?: string },
  ) {
    return this.customersService.create(user.shopId, body);
  }

  @Post(':id/payment')
  recordPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('amount') amount: number,
  ) {
    return this.customersService.recordPayment(id, user.shopId, amount);
  }

  @Post(':id/remind')
  sendReminder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.customersService.sendUdharrReminder(id, user.shopId);
  }
}
