import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EasypaisaTxnType } from '@prisma/client';

@Injectable()
export class EasypaisaService {
  constructor(private prisma: PrismaService) {}

  getAccounts(shopId: string) {
    return this.prisma.easypaisaAccount.findMany({
      where: { shopId, isActive: true },
    });
  }

  addAccount(
    shopId: string,
    data: {
      accountName: string;
      accountPhone: string;
      provider?: string;
      currentBalance: number;
    },
  ) {
    return this.prisma.easypaisaAccount.create({ data: { shopId, ...data } });
  }

  getTransactions(accountId: string, shopId: string) {
    return this.prisma.easypaisaTxn.findMany({
      where: { accountId, account: { shopId } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async addTransaction(
    accountId: string,
    shopId: string,
    data: {
      type: EasypaisaTxnType;
      amount: number;
      fee?: number;
      commission?: number;
      counterparty?: string;
      notes?: string;
    },
  ) {
    const account = await this.prisma.easypaisaAccount.findUniqueOrThrow({
      where: { id: accountId, shopId },
    });
    const current = Number(account.currentBalance);
    const amount =
      data.type === 'RECEIVE' || data.type === 'CASH_IN'
        ? data.amount
        : -data.amount;
    const balanceAfter = current + amount - (data.fee ?? 0);

    return this.prisma.$transaction(async (tx) => {
      await tx.easypaisaAccount.update({
        where: { id: accountId },
        data: { currentBalance: balanceAfter },
      });
      return tx.easypaisaTxn.create({
        data: {
          accountId,
          type: data.type,
          amount: data.amount,
          fee: data.fee ?? 0,
          commission: data.commission ?? 0,
          counterparty: data.counterparty,
          balanceAfter,
          notes: data.notes,
        },
      });
    });
  }
}
