import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RepairsService } from './repairs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RepairStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@ApiTags('Repairs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('repairs')
export class RepairsController {
  constructor(private repairsService: RepairsService) {}

  @Get()
  getAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: RepairStatus,
  ) {
    return this.repairsService.findAll(user.shopId, status);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.repairsService.findOne(id, user.shopId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      customerId: string;
      deviceBrand: string;
      deviceModel: string;
      faultDesc: string;
      photos?: string[];
      advancePaid?: number;
      totalQuote?: number;
      technicianId?: string;
      notes?: string;
    },
  ) {
    return this.repairsService.create(user.shopId, body);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('status') status: RepairStatus,
  ) {
    return this.repairsService.updateStatus(id, user.shopId, status);
  }

  @Post(':id/parts')
  addPart(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { productId: string; qty: number; unitPrice: number },
  ) {
    return this.repairsService.addPart(id, user.shopId, body);
  }
}
