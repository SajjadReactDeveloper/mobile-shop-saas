import {
  Injectable,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class CashRegisterService {
  constructor(private prisma: PrismaService) {}

  async openDay(shopId: string, openingBalance: number, date?: string) {
    const day = date ? new Date(date) : new Date();
    day.setHours(0, 0, 0, 0);

    const existing = await this.prisma.cashRegister.findUnique({
      where: { shopId_date: { shopId, date: day } },
    });
    if (existing)
      throw new ConflictException('Cash register already opened for today');

    return this.prisma.cashRegister.create({
      data: { shopId, date: day, openingBalance },
    });
  }

  async getToday(shopId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.prisma.cashRegister.findUnique({
      where: { shopId_date: { shopId, date: today } },
      include: {
        expenseItems: { orderBy: { createdAt: 'asc' } },
        quickSales: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async addExpense(
    registerId: string,
    shopId: string,
    data: { description: string; amount: number },
  ) {
    const register = await this.prisma.cashRegister.findUniqueOrThrow({
      where: { id: registerId, shopId },
    });
    if (register.isClosed)
      throw new ForbiddenException('Day is already closed');

    await this.prisma.cashRegister.update({
      where: { id: registerId },
      data: { expenses: { increment: data.amount } },
    });
    return this.prisma.cashExpense.create({
      data: { cashRegisterId: registerId, ...data },
    });
  }

  async addQuickSale(
    registerId: string,
    shopId: string,
    data: {
      productName: string;
      buyingPrice: number;
      sellingPrice: number;
      qty: number;
    },
  ) {
    const register = await this.prisma.cashRegister.findUniqueOrThrow({
      where: { id: registerId, shopId },
    });
    if (register.isClosed)
      throw new ForbiddenException('Day is already closed');

    const revenue = data.sellingPrice * data.qty;
    await this.prisma.cashRegister.update({
      where: { id: registerId },
      data: { salesCash: { increment: revenue } },
    });
    return this.prisma.quickSale.create({
      data: { cashRegisterId: registerId, ...data },
    });
  }

  async closeDay(registerId: string, shopId: string, userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (user.role !== UserRole.OWNER)
      throw new ForbiddenException('Only owner can close the day');

    const register = await this.prisma.cashRegister.findUniqueOrThrow({
      where: { id: registerId, shopId },
      include: { expenseItems: true },
    });

    const closingBalance =
      Number(register.openingBalance) +
      Number(register.salesCash) +
      Number(register.easyLoadCash) +
      Number(register.easypaisaCash) +
      Number(register.repairCash) -
      Number(register.expenses);

    return this.prisma.cashRegister.update({
      where: { id: registerId },
      data: { closingBalance, isClosed: true },
    });
  }

  getHistory(shopId: string) {
    return this.prisma.cashRegister.findMany({
      where: { shopId },
      orderBy: { date: 'desc' },
      take: 30,
    });
  }
}
