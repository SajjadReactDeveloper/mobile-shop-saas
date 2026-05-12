import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getSubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.getSubscription(user.shopId);
  }

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createCheckout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { priceId: string; returnUrl: string },
  ) {
    return this.subscriptionsService.createCheckoutSession(
      user.shopId,
      body.priceId,
      body.returnUrl,
    );
  }

  @Post('portal')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createPortal(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { returnUrl: string },
  ) {
    return this.subscriptionsService.createPortalSession(
      user.shopId,
      body.returnUrl,
    );
  }

  @Post('webhook')
  handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') sig: string,
  ) {
    return this.subscriptionsService.handleWebhook(
      req.rawBody ?? Buffer.from(''),
      sig,
    );
  }
}
