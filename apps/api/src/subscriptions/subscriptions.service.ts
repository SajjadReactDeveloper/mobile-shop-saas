import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  SubscriptionStatus,
  SubscriptionTier as PrismaTier,
} from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private stripe: InstanceType<typeof Stripe>;

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

    let event: any;

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
      const session = event.data.object;

      const shopId = session.metadata?.shopId as string | undefined;

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
      const sub = event.data.object;
      await this.prisma.subscription.updateMany({
        where: { stripeSubId: sub.id as string },
        data: { status: 'CANCELED', tier: 'FREE' },
      });
    }

    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      const rawStatus = (sub.status as string).toUpperCase();
      const validStatuses: string[] = Object.values(SubscriptionStatus);
      const status = validStatuses.includes(rawStatus)
        ? (rawStatus as SubscriptionStatus)
        : SubscriptionStatus.ACTIVE;
      const rawTier = (
        (sub.metadata?.tier as string | undefined) ?? 'PRO'
      ).toUpperCase();
      const validTiers: string[] = Object.values(PrismaTier);
      const tier = validTiers.includes(rawTier)
        ? (rawTier as PrismaTier)
        : PrismaTier.PRO;
      await this.prisma.subscription.updateMany({
        where: { stripeSubId: sub.id as string },
        data: {
          status,
          tier,
          renewsAt: sub.current_period_end
            ? new Date((sub.current_period_end as number) * 1000)
            : undefined,
        },
      });
    }

    return { received: true };
  }

  async createPortalSession(shopId: string, returnUrl: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { shopId },
    });
    if (!sub?.stripeSubId) return { url: null };

    // Retrieve the Stripe subscription to get the customer ID
    const stripeSub = await this.stripe.subscriptions.retrieve(sub.stripeSubId);
    const customerId =
      typeof stripeSub.customer === 'string'
        ? stripeSub.customer
        : stripeSub.customer.id;

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  }
}
