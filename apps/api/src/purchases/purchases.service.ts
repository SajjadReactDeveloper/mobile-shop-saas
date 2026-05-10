import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  findAll(shopId: string) {
    return this.prisma.purchase.findMany({
      where: { shopId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }
}
