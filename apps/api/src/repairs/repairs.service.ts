import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RepairStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class RepairsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private gateway: EventsGateway,
  ) {}

  findAll(shopId: string, status?: RepairStatus) {
    return this.prisma.repairJob.findMany({
      where: { shopId, ...(status && { status }) },
      include: { customer: true, technician: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string, shopId: string) {
    return this.prisma.repairJob.findUniqueOrThrow({
      where: { id, shopId },
      include: {
        customer: true,
        technician: { select: { name: true } },
        parts: { include: { product: true } },
      },
    });
  }

  async create(
    shopId: string,
    data: {
      customerId: string;
      deviceBrand: string;
      deviceModel: string;
      faultDesc: string;
      photos?: string[];
      advancePaid?: number;
      totalQuote?: number;
      technicianId?: string;
      notes?: string;
    },
  ) {
    const count = await this.prisma.repairJob.count({ where: { shopId } });
    const jobNumber = `JOB-${String(count + 1).padStart(5, '0')}`;
    return this.prisma.repairJob.create({
      data: { shopId, jobNumber, ...data },
    });
  }

  async updateStatus(id: string, shopId: string, status: RepairStatus) {
    const job = await this.prisma.repairJob.update({
      where: { id, shopId },
      data: {
        status,
        ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
      },
      include: { customer: true },
    });

    if (status === RepairStatus.READY && job.customer?.phone) {
      await this.notifications.sendWhatsApp(
        job.customer.phone,
        `✅ Your device (${job.deviceBrand} ${job.deviceModel}) is ready for pickup!\n\nJob #${job.jobNumber}\nPlease visit our shop to collect it. Thank you! 🙏`,
      );
    }

    this.gateway.emitToShop(job.shopId, 'repair:updated', {
      id: job.id,
      jobNumber: job.jobNumber,
      status: job.status,
    });

    return job;
  }

  /** Public — no shopId check, returns only safe fields */
  async trackByJobNumber(jobNumber: string) {
    return this.prisma.repairJob.findFirst({
      where: { jobNumber },
      select: {
        jobNumber: true,
        deviceBrand: true,
        deviceModel: true,
        status: true,
        faultDesc: true,
        createdAt: true,
        deliveredAt: true,
        shop: { select: { name: true, city: true } },
      },
    });
  }

  async addPart(
    jobId: string,
    shopId: string,
    data: { productId: string; qty: number; unitPrice: number },
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: data.productId, shopId },
        data: { stockQty: { decrement: data.qty } },
      });
      return tx.repairPart.create({ data: { jobId, ...data } });
    });
  }
}
