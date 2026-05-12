import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DailySummaryService } from './daily-summary.service';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private dailySummary: DailySummaryService) {}

  /** Manually trigger the daily P&L WhatsApp summary for this shop */
  @Post('daily-summary/send')
  sendDailySummary(@CurrentUser() user: AuthenticatedUser) {
    return this.dailySummary.sendForShop(user.shopId);
  }
}
