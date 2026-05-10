import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.shop.findUniqueOrThrow({
      where: { id },
      include: { subscription: true },
    });
  }

  update(
    id: string,
    data: {
      name?: string;
      city?: string;
      address?: string;
      phone?: string;
      enabledModules?: string[];
    },
  ) {
    return this.prisma.shop.update({ where: { id }, data });
  }

  async getStats(shopId: string) {
    const [products, customers, pendingRepairs] = await Promise.all([
      this.prisma.product.count({ where: { shopId, isActive: true } }),
      this.prisma.customer.count({ where: { shopId } }),
      this.prisma.repairJob.count({
        where: { shopId, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
      }),
    ]);
    return { products, customers, pendingRepairs };
  }
}
