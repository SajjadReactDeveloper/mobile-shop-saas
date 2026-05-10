import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  findAll(shopId: string) {
    return this.prisma.customer.findMany({ where: { shopId }, orderBy: { name: 'asc' } })
  }

  findOne(id: string, shopId: string) {
    return this.prisma.customer.findUniqueOrThrow({
      where: { id, shopId },
      include: { ledgerEntries: { orderBy: { createdAt: 'desc' }, take: 50 }, sales: { orderBy: { createdAt: 'desc' }, take: 10 } },
    })
  }

  create(shopId: string, data: { name: string; phone?: string; notes?: string }) {
    return this.prisma.customer.create({ data: { shopId, ...data } })
  }

  getOverdue(shopId: string) {
    return this.prisma.customer.findMany({
      where: { shopId, balanceOwed: { gt: 0 } },
      orderBy: { balanceOwed: 'desc' },
    })
  }

  async recordPayment(id: string, shopId: string, amount: number) {
    await this.prisma.customer.update({
      where: { id, shopId },
      data: { balanceOwed: { decrement: amount } },
    })
    return this.prisma.ledgerEntry.create({
      data: { customerId: id, amount, type: 'PAYMENT', description: 'Manual payment received' },
    })
  }

  async sendUdharrReminder(id: string, shopId: string) {
    const customer = await this.prisma.customer.findUniqueOrThrow({ where: { id, shopId } })
    if (!customer.phone) throw new Error('Customer has no phone number')
    await this.notifications.sendWhatsApp(
      customer.phone,
      `Dear ${customer.name}, your outstanding balance is PKR ${customer.balanceOwed}. Please clear at your earliest convenience. Thank you!`,
    )
    return { message: 'Reminder sent' }
  }
}
