import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider, UserRole } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  // In-memory OTP store — replace with Redis in production
  private otpStore = new Map<string, { otp: string; expiresAt: Date }>();

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const shop = await this.prisma.shop.create({
      data: {
        name: dto.shopName,
        city: dto.city,
        subscription: {
          create: {
            tier: 'FREE',
            status: 'TRIALING',
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        },
      },
    });

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        shopId: shop.id,
        name: dto.name,
        email: dto.email,
        passwordHash,
        provider: AuthProvider.EMAIL,
        role: UserRole.OWNER,
      },
    });

    return this.signToken(user.id, user.shopId, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash)
      throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account is disabled');

    return this.signToken(user.id, user.shopId, user.role);
  }

  async googleLogin(profile: {
    id: string;
    emails: { value: string }[];
    displayName: string;
  }) {
    const email = profile.emails[0].value;
    let user = await this.prisma.user.findFirst({
      where: { googleId: profile.id },
    });

    if (!user) {
      const existingByEmail = await this.prisma.user.findFirst({
        where: { email },
      });
      if (existingByEmail) {
        user = await this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: { googleId: profile.id, provider: AuthProvider.GOOGLE },
        });
      } else {
        const shop = await this.prisma.shop.create({
          data: {
            name: `${profile.displayName}'s Shop`,
            subscription: {
              create: {
                tier: 'FREE',
                status: 'TRIALING',
                trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              },
            },
          },
        });
        user = await this.prisma.user.create({
          data: {
            shopId: shop.id,
            name: profile.displayName,
            email,
            googleId: profile.id,
            provider: AuthProvider.GOOGLE,
            role: UserRole.OWNER,
          },
        });
      }
    }

    return this.signToken(user.id, user.shopId, user.role);
  }

  sendOtp(dto: SendOtpDto) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    this.otpStore.set(dto.phone, { otp, expiresAt });

    // TODO: Send via WhatsApp / SMS
    console.log(`OTP for ${dto.phone}: ${otp}`);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const record = this.otpStore.get(dto.phone);
    if (!record || record.otp !== dto.otp)
      throw new BadRequestException('Invalid OTP');
    if (record.expiresAt < new Date())
      throw new BadRequestException('OTP expired');

    this.otpStore.delete(dto.phone);

    let user = await this.prisma.user.findFirst({
      where: { phone: dto.phone },
    });

    if (!user) {
      const shop = await this.prisma.shop.create({
        data: {
          name: `Shop (${dto.phone})`,
          phone: dto.phone,
          subscription: {
            create: {
              tier: 'FREE',
              status: 'TRIALING',
              trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
          },
        },
      });
      user = await this.prisma.user.create({
        data: {
          shopId: shop.id,
          name: dto.phone,
          phone: dto.phone,
          provider: AuthProvider.PHONE,
          role: UserRole.OWNER,
        },
      });
    }

    return this.signToken(user.id, user.shopId, user.role);
  }

  private signToken(userId: string, shopId: string, role: string) {
    const payload = { sub: userId, shopId, role };
    const token = this.jwt.sign(payload);
    return { accessToken: token };
  }
}
