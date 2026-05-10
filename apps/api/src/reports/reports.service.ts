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
}
