import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class DailySummaryService {
  private readonly logger = new Logger(DailySummaryService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /** Runs every day at 9:00 PM Pakistan Standard Time (UTC+5 = 16:00 UTC) */
  @Cron('0 16 * * *', { timeZone: 'UTC' })
  async sendDailySummaries() {
    this.logger.log('Running daily WhatsApp P&L summaries…');

    const shops = await this.prisma.shop.findMany({
      include: {
        users: {
          where: { role: 'OWNER', isActive: true },
          select: { phone: true, name: true },
          take: 1,
        },
      },
    });

    let sent = 0;
    for (const shop of shops) {
      const ownerPhone = shop.users[0]?.phone ?? shop.phone;
      if (!ownerPhone) continue;

      try {
        const summary = await this.buildSummary(shop.id);
        const message = this.formatMessage(
          shop.name,
          shop.city ?? null,
          summary,
        );
        await this.notifications.sendWhatsApp(ownerPhone, message);
        sent++;
      } catch (err) {
        this.logger.error(`Failed summary for shop ${shop.id}: ${String(err)}`);
      }
    }

    this.logger.log(`Daily summaries sent: ${sent}/${shops.length}`);
  }

  /** Manual trigger — call from controller for "Send Now" button */
  async sendForShop(
    shopId: string,
  ): Promise<{ sent: boolean; message: string }> {
    const shop = await this.prisma.shop.findUniqueOrThrow({
      where: { id: shopId },
      include: {
        users: {
          where: { role: 'OWNER', isActive: true },
          select: { phone: true, name: true },
          take: 1,
        },
      },
    });

    const ownerPhone = shop.users[0]?.phone ?? shop.phone;
    if (!ownerPhone) {
      return {
        sent: false,
        message:
          'No phone number found for the shop owner. Add a phone number in Shop Profile → Settings.',
      };
    }

    const summary = await this.buildSummary(shopId);
    const message = this.formatMessage(shop.name, shop.city ?? null, summary);
    await this.notifications.sendWhatsApp(ownerPhone, message);

    return { sent: true, message: `Summary sent to ${ownerPhone}` };
  }

  private async buildSummary(shopId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [sales, repairs, easyLoadTxns, easypaisaTxns, payments, receivables] =
      await Promise.all([
        this.prisma.sale.findMany({
          where: { shopId, createdAt: { gte: today, lte: todayEnd } },
          include: {
            items: { include: { product: { select: { buyingPrice: true } } } },
          },
        }),
        this.prisma.repairJob.findMany({
          where: {
            shopId,
            status: 'DELIVERED',
            deliveredAt: { gte: today, lte: todayEnd },
          },
          select: { totalQuote: true },
        }),
        this.prisma.easyLoadTxn.findMany({
          where: {
            account: { shopId },
            type: 'LOAD',
            createdAt: { gte: today, lte: todayEnd },
          },
          select: { profitMargin: true },
        }),
        this.prisma.easypaisaTxn.findMany({
          where: {
            account: { shopId },
            createdAt: { gte: today, lte: todayEnd },
          },
          select: { commission: true },
        }),
        // Udhaar collected today
        this.prisma.ledgerEntry.findMany({
          where: {
            customer: { shopId },
            type: 'PAYMENT',
            createdAt: { gte: today, lte: todayEnd },
          },
          select: { amount: true },
        }),
        // Total outstanding udhaar
        this.prisma.customer.aggregate({
          where: { shopId },
          _sum: { balanceOwed: true },
        }),
      ]);

    const salesRevenue = sales.reduce((s, sale) => s + Number(sale.total), 0);
    const salesCogs = sales.reduce(
      (s, sale) =>
        s +
        sale.items.reduce(
          (is, i) => is + Number(i.product.buyingPrice) * i.qty,
          0,
        ),
      0,
    );
    const repairRevenue = repairs.reduce(
      (s, j) => s + Number(j.totalQuote ?? 0),
      0,
    );
    const easyLoadProfit = easyLoadTxns.reduce(
      (s, t) => s + Number(t.profitMargin),
      0,
    );
    const easypaisaCommission = easypaisaTxns.reduce(
      (s, t) => s + Number(t.commission),
      0,
    );
    const udharrCollected = payments.reduce((s, p) => s + Number(p.amount), 0);
    const totalOutstanding = Number(receivables._sum.balanceOwed ?? 0);

    return {
      salesCount: sales.length,
      salesRevenue,
      grossProfit: salesRevenue - salesCogs,
      repairsDelivered: repairs.length,
      repairRevenue,
      easyLoadProfit,
      easypaisaCommission,
      udharrCollected,
      totalOutstanding,
      totalProfit:
        salesRevenue -
        salesCogs +
        repairRevenue +
        easyLoadProfit +
        easypaisaCommission,
    };
  }

  private formatMessage(
    shopName: string,
    city: string | null,
    s: Awaited<ReturnType<typeof this.buildSummary>>,
  ): string {
    const date = new Date().toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString('en-PK')}`;

    const lines: string[] = [
      `📊 *Daily Summary — ${date}*`,
      `🏪 *${shopName}*${city ? `, ${city}` : ''}`,
      '',
      `💰 Revenue:      *${pkr(s.salesRevenue)}*`,
      `📈 Gross Profit: *${pkr(s.grossProfit)}*`,
      `🛒 Sales:        ${s.salesCount} transaction${s.salesCount !== 1 ? 's' : ''}`,
    ];

    if (s.repairsDelivered > 0) {
      lines.push(
        `🔧 Repairs:      ${s.repairsDelivered} delivered (${pkr(s.repairRevenue)})`,
      );
    }
    if (s.easyLoadProfit > 0) {
      lines.push(`⚡ Easy Load:    ${pkr(s.easyLoadProfit)} profit`);
    }
    if (s.easypaisaCommission > 0) {
      lines.push(`💚 Easypaisa:   ${pkr(s.easypaisaCommission)} commission`);
    }
    if (s.udharrCollected > 0) {
      lines.push(`💳 Udhaar in:   ${pkr(s.udharrCollected)}`);
    }

    lines.push('');
    lines.push(`✅ *Total Profit: ${pkr(s.totalProfit)}*`);

    if (s.totalOutstanding > 0) {
      lines.push(`⚠️  Outstanding: ${pkr(s.totalOutstanding)} udhaar pending`);
    }

    if (s.salesCount === 0 && s.repairsDelivered === 0) {
      lines.push('');
      lines.push('_No sales recorded today. Keep going! 💪_');
    }

    lines.push('');
    lines.push('_Sent by Mobile Shop 📱_');

    return lines.join('\n');
  }
}
