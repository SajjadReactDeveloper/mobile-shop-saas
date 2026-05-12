import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RepairsService } from './repairs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RepairStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@ApiTags('Repairs')
@Controller('repairs')
export class RepairsController {
  constructor(private repairsService: RepairsService) {}

  /** Public — no auth needed. Used for customer repair tracking links */
  @Get('track/:jobNumber')
  async trackRepair(@Param('jobNumber') jobNumber: string) {
    const job = await this.repairsService.trackByJobNumber(jobNumber);
    if (!job) throw new NotFoundException('Repair job not found');
    return job;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  getAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: RepairStatus,
  ) {
    return this.repairsService.findAll(user.shopId, status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.repairsService.findOne(id, user.shopId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('status') status: RepairStatus,
  ) {
    return this.repairsService.updateStatus(id, user.shopId, status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/parts')
  addPart(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { productId: string; qty: number; unitPrice: number },
  ) {
    return this.repairsService.addPart(id, user.shopId, body);
  }
}
