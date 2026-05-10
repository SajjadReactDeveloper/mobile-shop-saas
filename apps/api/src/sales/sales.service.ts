import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PaymentMethod } from '@prisma/client'

interface SaleItemInput {
  productId: string
  qty: number
  unitPrice: number
  imei?: string
}

interface CreateSaleDto {
  customerId?: string
  items: SaleItemInput[]
  discount?: number
  paymentMethod: PaymentMethod
  amountPaid: number
  notes?: string
}

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async findAll(shopId: string, from?: string, to?: string) {
    return this.prisma.sale.findMany({
      where: {
        shopId,
        ...(from && to && { createdAt: { gte: new Date(from), lte: new Date(to) } }),
      },
      include: { customer: true, createdBy: { select: { name: true } }, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  }

  findOne(id: string, shopId: string) {
    return this.prisma.sale.findUniqueOrThrow({
      where: { id, shopId },
      include: { customer: true, items: { include: { product: true } }, createdBy: { select: { name: true } } },
    })
  }

  async create(shopId: string, userId: string, dto: CreateSaleDto) {
    const subtotal = dto.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0)
    const discount = dto.discount ?? 0
    const total = subtotal - discount

    const invoiceCount = await this.prisma.sale.count({ where: { shopId } })
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(5, '0')}`

    return this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId, shopId } })
        if (product.stockQty < item.qty) {
          throw new BadRequestException(`Insufficient stock for ${product.name}`)
        }

        if (product.imeiTracked) {
          if (!item.imei) throw new BadRequestException(`IMEI required for ${product.name}`)
          const imeiRecord = await tx.imeiLog.findFirst({
            where: { productId: item.productId, imei: item.imei, status: 'IN_STOCK' },
          })
          if (!imeiRecord) throw new BadRequestException(`IMEI ${item.imei} not found or already sold`)
        }
      }

      const sale = await tx.sale.create({
        data: {
          shopId,
          customerId: dto.customerId,
          invoiceNumber,
          subtotal,
          discount,
          total,
          amountPaid: dto.amountPaid,
          paymentMethod: dto.paymentMethod,
          notes: dto.notes,
          createdById: userId,
          items: { create: dto.items },
        },
      })

      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { decrement: item.qty } },
        })

        if (item.imei) {
          await tx.imeiLog.updateMany({
            where: { productId: item.productId, imei: item.imei },
            data: { status: 'SOLD', saleId: sale.id },
          })
        }
      }

      if (dto.customerId && dto.paymentMethod === PaymentMethod.CREDIT) {
        const creditAmount = total - dto.amountPaid
        if (creditAmount > 0) {
          await tx.customer.update({
            where: { id: dto.customerId },
            data: { balanceOwed: { increment: creditAmount } },
          })
          await tx.ledgerEntry.create({
            data: {
              customerId: dto.customerId,
              amount: creditAmount,
              type: 'CREDIT',
              description: `Sale ${invoiceNumber}`,
              saleId: sale.id,
            },
          })
        }
      }

      return sale
    })
  }

  async dailySummary(shopId: string, date: string) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    const sales = await this.prisma.sale.findMany({
      where: { shopId, createdAt: { gte: start, lte: end } },
      include: { items: { include: { product: true } } },
    })

    const totalRevenue = sales.reduce((s, sale) => s + Number(sale.total), 0)
    const totalCogs = sales.reduce(
      (s, sale) =>
        s + sale.items.reduce((is, item) => is + Number(item.product.buyingPrice) * item.qty, 0),
      0,
    )

    return { date, totalSales: sales.length, totalRevenue, totalCogs, grossProfit: totalRevenue - totalCogs }
  }
}
