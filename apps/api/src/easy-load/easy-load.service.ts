import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EasyLoadNetwork, EasyLoadTxnType } from '@prisma/client';

@Injectable()
export class EasyLoadService {
  constructor(private prisma: PrismaService) {}

  getAccounts(shopId: string) {
    return this.prisma.easyLoadAccount.findMany({
      where: { shopId, isActive: true },
    });
  }

  addAccount(
    shopId: string,
    data: {
      network: EasyLoadNetwork;
      phoneNumber: string;
      currentBalance: number;
    },
  ) {
    return this.prisma.easyLoadAccount.create({ data: { shopId, ...data } });
  }

  getTransactions(accountId: string, shopId: string) {
    return this.prisma.easyLoadTxn.findMany({
      where: { accountId, account: { shopId } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async load(
    accountId: string,
    shopId: string,
    data: { amount: number; customerPhone: string; profitMargin: number },
  ) {
    const account = await this.prisma.easyLoadAccount.findUniqueOrThrow({
      where: { id: accountId, shopId },
    });
    if (Number(account.currentBalance) < data.amount) {
      throw new BadRequestException('Insufficient balance on this SIM');
    }

    const balanceAfter = Number(account.currentBalance) - data.amount;

    return this.prisma.$transaction(async (tx) => {
      await tx.easyLoadAccount.update({
        where: { id: accountId },
        data: { currentBalance: balanceAfter },
      });
      return tx.easyLoadTxn.create({
        data: {
          accountId,
          type: EasyLoadTxnType.LOAD,
          amount: data.amount,
          customerPhone: data.customerPhone,
          profitMargin: data.profitMargin,
          balanceAfter,
        },
      });
    });
  }

  async topup(
    accountId: string,
    shopId: string,
    data: { amount: number; notes?: string },
  ) {
    const account = await this.prisma.easyLoadAccount.findUniqueOrThrow({
      where: { id: accountId, shopId },
    });
    const balanceAfter = Number(account.currentBalance) + data.amount;

    return this.prisma.$transaction(async (tx) => {
      await tx.easyLoadAccount.update({
        where: { id: accountId },
        data: { currentBalance: balanceAfter },
      });
      return tx.easyLoadTxn.create({
        data: {
          accountId,
          type: EasyLoadTxnType.TOPUP,
          amount: data.amount,
          balanceAfter,
          notes: data.notes,
        },
      });
    });
  }

  async dailySummary(shopId: string, date: string) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const accounts = await this.prisma.easyLoadAccount.findMany({
      where: { shopId },
      include: {
        transactions: {
          where: { createdAt: { gte: start, lte: end }, type: 'LOAD' },
        },
      },
    });

    return accounts.map((acc) => ({
      network: acc.network,
      phoneNumber: acc.phoneNumber,
      currentBalance: acc.currentBalance,
      totalLoaded: acc.transactions.reduce((s, t) => s + Number(t.amount), 0),
      totalProfit: acc.transactions.reduce(
        (s, t) => s + Number(t.profitMargin),
        0,
      ),
      txnCount: acc.transactions.length,
    }));
  }
}
