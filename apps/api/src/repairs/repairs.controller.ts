import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { RepairsService } from './repairs.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { RepairStatus } from '@prisma/client'

@ApiTags('Repairs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('repairs')
export class RepairsController {
  constructor(private repairsService: RepairsService) {}

  @Get()
  getAll(@CurrentUser() user: any, @Query('status') status?: RepairStatus) {
    return this.repairsService.findAll(user.shopId, status)
  }

  @Get(':id')
  getOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.repairsService.findOne(id, user.shopId)
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.repairsService.create(user.shopId, body)
  }

  @Patch(':id/status')
  updateStatus(@CurrentUser() user: any, @Param('id') id: string, @Body('status') status: RepairStatus) {
    return this.repairsService.updateStatus(id, user.shopId, status)
  }

  @Post(':id/parts')
  addPart(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.repairsService.addPart(id, user.shopId, body)
  }
}
