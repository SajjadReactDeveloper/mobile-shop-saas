import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { ProductCategory } from '@prisma/client';

interface CreateProductDto {
  name: string;
  brand?: string;
  model?: string;
  category: ProductCategory;
  buyingPrice: number;
  sellingPrice: number;
  stockQty?: number;
  imeiTracked: boolean;
  lowStockAlert?: number;
  imageUrl?: string;
}

interface AddStockDto {
  qty: number;
  imeis?: string[];
  unitPrice: number;
  supplier?: string;
}

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private gateway: EventsGateway,
  ) {}

  findAll(shopId: string, category?: ProductCategory, lowStock?: boolean) {
    return this.prisma.product.findMany({
      where: {
        shopId,
        isActive: true,
        ...(category && { category }),
        ...(lowStock && {
          stockQty: { lte: this.prisma.product.fields.lowStockAlert },
        }),
      },
      include: { _count: { select: { imeiLog: true } } },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string, shopId: string) {
    return this.prisma.product.findUniqueOrThrow({
      where: { id, shopId },
      include: { imeiLog: { where: { status: 'IN_STOCK' } } },
    });
  }

  async getLowStock(shopId: string) {
    const products = await this.prisma.product.findMany({
      where: { shopId, isActive: true },
    });
    return products.filter((p) => p.stockQty <= p.lowStockAlert);
  }

  create(shopId: string, dto: CreateProductDto) {
    return this.prisma.product.create({ data: { shopId, ...dto } });
  }

  update(id: string, shopId: string, dto: Partial<CreateProductDto>) {
    return this.prisma.product.update({ where: { id, shopId }, data: dto });
  }

  async addStock(productId: string, shopId: string, dto: AddStockDto) {
    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId, shopId },
    });

    if (product.imeiTracked) {
      if (!dto.imeis || dto.imeis.length !== dto.qty) {
        throw new BadRequestException(
          `Must provide exactly ${dto.qty} IMEI numbers for this product`,
        );
      }

      const duplicate = await this.prisma.imeiLog.findFirst({
        where: { productId, imei: { in: dto.imeis } },
      });
      if (duplicate)
        throw new BadRequestException(
          `IMEI ${duplicate.imei} already registered`,
        );
    }

    return this.prisma
      .$transaction(async (tx) => {
        const purchase = await tx.purchase.create({
          data: {
            shopId,
            supplier: dto.supplier,
            total: dto.qty * dto.unitPrice,
            items: {
              create: {
                productId,
                qty: dto.qty,
                unitPrice: dto.unitPrice,
                imeis: dto.imeis ?? [],
              },
            },
          },
        });

        await tx.product.update({
          where: { id: productId },
          data: { stockQty: { increment: dto.qty } },
        });

        if (product.imeiTracked && dto.imeis) {
          await tx.imeiLog.createMany({
            data: dto.imeis.map((imei) => ({
              productId,
              imei,
              status: 'IN_STOCK',
            })),
          });
        }

        return purchase;
      })
      .then((purchase) => {
        // notify connected clients that stock changed
        this.gateway.emitToShop(shopId, 'stock:updated', { productId });
        return purchase;
      });
  }

  getImeis(productId: string, shopId: string) {
    return this.prisma.imeiLog.findMany({
      where: { productId, product: { shopId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  softDelete(id: string, shopId: string) {
    return this.prisma.product.update({
      where: { id, shopId },
      data: { isActive: false },
    });
  }
}
