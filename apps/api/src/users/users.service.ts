import { Injectable, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UserRole, AuthProvider } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll(shopId: string) {
    return this.prisma.user.findMany({
      where: { shopId },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
    })
  }

  async invite(shopId: string, data: { name: string; email?: string; phone?: string; role: UserRole; password?: string }) {
    const existing = await this.prisma.user.findFirst({
      where: { shopId, OR: [{ email: data.email }, { phone: data.phone }] },
    })
    if (existing) throw new ConflictException('User already exists in this shop')

    const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : undefined

    return this.prisma.user.create({
      data: {
        shopId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        passwordHash,
        provider: AuthProvider.EMAIL,
      },
      select: { id: true, name: true, email: true, phone: true, role: true },
    })
  }

  updateRole(id: string, shopId: string, role: UserRole) {
    return this.prisma.user.update({ where: { id, shopId }, data: { role } })
  }

  deactivate(id: string, shopId: string) {
    return this.prisma.user.update({ where: { id, shopId }, data: { isActive: false } })
  }
}
