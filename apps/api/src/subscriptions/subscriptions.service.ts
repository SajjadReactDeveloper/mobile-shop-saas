import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(config.get<string>('STRIPE_SECRET_KEY', ''));
  }

  getSubscription(shopId: string) {
    return this.prisma.subscription.findUnique({ where: { shopId } });
  }

  async createCheckoutSession(
    shopId: string,
    priceId: string,
    returnUrl: string,
  ) {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { shopId },
      success_url: `${returnUrl}?success=true`,
      cancel_url: `${returnUrl}?canceled=true`,
    });
    return { url: session.url };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET', '');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err}`);
      throw new Error('Invalid webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const shopId = session.metadata?.shopId;
      if (shopId && session.subscription) {
        await this.prisma.subscription.update({
          where: { shopId },
          data: {
            stripeSubId: session.subscription as string,
            status: 'ACTIVE',
            tier: 'PRO',
          },
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      await this.prisma.subscription.updateMany({
        where: { stripeSubId: sub.id },
        data: { status: 'CANCELED', tier: 'FREE' },
      });
    }

    return { received: true };
  }
}
