import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async overview(shopId: string, from: string, to: string) {
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const [sales, repairs, easyLoadTxns, easypaisaTxns, inventoryValue] =
      await Promise.all([
        this.prisma.sale.findMany({
          where: { shopId, createdAt: { gte: start, lte: end } },
          include: { items: { include: { product: true } } },
        }),
        this.prisma.repairJob.findMany({
          where: {
            shopId,
            status: 'DELIVERED',
            deliveredAt: { gte: start, lte: end },
          },
        }),
        this.prisma.easyLoadTxn.findMany({
          where: {
            account: { shopId },
            type: 'LOAD',
            createdAt: { gte: start, lte: end },
          },
        }),
        this.prisma.easypaisaTxn.findMany({
          where: { account: { shopId }, createdAt: { gte: start, lte: end } },
        }),
        this.prisma.product.findMany({
          where: { shopId, isActive: true },
          select: { stockQty: true, buyingPrice: true },
        }),
      ]);

    const salesRevenue = sales.reduce((s, sale) => s + Number(sale.total), 0);
    const salesCogs = sales.reduce(
      (s, sale) =>
        s +
        sale.items.reduce(
          (is, item) => is + Number(item.product.buyingPrice) * item.qty,
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
    const inventoryValuation = inventoryValue.reduce(
      (s, p) => s + p.stockQty * Number(p.buyingPrice),
      0,
    );

    return {
      period: { from, to },
      sales: {
        count: sales.length,
        revenue: salesRevenue,
        cogs: salesCogs,
        grossProfit: salesRevenue - salesCogs,
      },
      repairs: { count: repairs.length, revenue: repairRevenue },
      easyLoad: { count: easyLoadTxns.length, profit: easyLoadProfit },
      easypaisa: {
        count: easypaisaTxns.length,
        commission: easypaisaCommission,
      },
      totalProfit:
        salesRevenue -
        salesCogs +
        repairRevenue +
        easyLoadProfit +
        easypaisaCommission,
      inventoryValuation,
    };
  }

  async topProducts(shopId: string, from: string, to: string) {
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const items = await this.prisma.saleItem.findMany({
      where: { sale: { shopId, createdAt: { gte: start, lte: end } } },
      include: { product: true },
    });

    const map = new Map<
      string,
      { name: string; qty: number; revenue: number }
    >();
    for (const item of items) {
      const entry = map.get(item.productId) ?? {
        name: item.product.name,
        qty: 0,
        revenue: 0,
      };
      entry.qty += item.qty;
      entry.revenue += Number(item.unitPrice) * item.qty;
      map.set(item.productId, entry);
    }

    return [...map.entries()]
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  async receivables(shopId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { shopId, balanceOwed: { gt: 0 } },
      select: { id: true, name: true, phone: true, balanceOwed: true },
    });
    const total = customers.reduce((s, c) => s + Number(c.balanceOwed), 0);
    return { total, customers };
  }

  /** Returns one data-point per day between from→to for the trend chart */
  async dailyTrend(shopId: string, from: string, to: string) {
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const sales = await this.prisma.sale.findMany({
      where: { shopId, createdAt: { gte: start, lte: end } },
      include: {
        items: { include: { product: { select: { buyingPrice: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const map = new Map<
      string,
      { revenue: number; profit: number; sales: number }
    >();

    for (const sale of sales) {
      const day = sale.createdAt.toISOString().split('T')[0];
      const revenue = Number(sale.total);
      const cogs = sale.items.reduce(
        (s, i) => s + Number(i.product.buyingPrice) * i.qty,
        0,
      );
      const entry = map.get(day) ?? { revenue: 0, profit: 0, sales: 0 };
      entry.revenue += revenue;
      entry.profit += revenue - cogs;
      entry.sales += 1;
      map.set(day, entry);
    }

    // Fill every day in range (even days with no sales → 0)
    const days: {
      date: string;
      revenue: number;
      profit: number;
      sales: number;
    }[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.toISOString().split('T')[0];
      days.push({
        date: day,
        ...(map.get(day) ?? { revenue: 0, profit: 0, sales: 0 }),
      });
      cur.setDate(cur.getDate() + 1);
    }

    return days;
  }

  /** Products that will run out within `days` days at current sales velocity */
  async restockSuggestions(shopId: string, lookbackDays = 30) {
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);

    const [products, recentItems] = await Promise.all([
      this.prisma.product.findMany({
        where: { shopId, isActive: true },
        select: {
          id: true,
          name: true,
          category: true,
          stockQty: true,
          imageUrl: true,
        },
      }),
      this.prisma.saleItem.findMany({
        where: { sale: { shopId, createdAt: { gte: since } } },
        select: { productId: true, qty: true },
      }),
    ]);

    const soldMap = new Map<string, number>();
    for (const item of recentItems) {
      soldMap.set(
        item.productId,
        (soldMap.get(item.productId) ?? 0) + item.qty,
      );
    }

    return products
      .map((p) => {
        const totalSold = soldMap.get(p.id) ?? 0;
        const dailyRate = totalSold / lookbackDays;
        const daysLeft =
          dailyRate > 0 ? Math.floor(p.stockQty / dailyRate) : null;
        return { ...p, dailyRate: Math.round(dailyRate * 10) / 10, daysLeft };
      })
      .filter((p) => p.daysLeft !== null && p.daysLeft <= 14)
      .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999))
      .slice(0, 20);
  }
}
