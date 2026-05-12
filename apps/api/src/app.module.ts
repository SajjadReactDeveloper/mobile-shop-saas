import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ShopsModule } from './shops/shops.module';
import { UsersModule } from './users/users.module';
import { InventoryModule } from './inventory/inventory.module';
import { SalesModule } from './sales/sales.module';
import { PurchasesModule } from './purchases/purchases.module';
import { EasyLoadModule } from './easy-load/easy-load.module';
import { EasypaisaModule } from './easypaisa/easypaisa.module';
import { RepairsModule } from './repairs/repairs.module';
import { CustomersModule } from './customers/customers.module';
import { CashRegisterModule } from './cash-register/cash-register.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { EventsGateway } from './gateway/events.gateway';
import { PrismaModule } from './prisma/prisma.module';
import { UploadModule } from './upload/upload.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ShopsModule,
    UsersModule,
    InventoryModule,
    SalesModule,
    PurchasesModule,
    EasyLoadModule,
    EasypaisaModule,
    RepairsModule,
    CustomersModule,
    CashRegisterModule,
    ReportsModule,
    NotificationsModule,
    SubscriptionsModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [EventsGateway],
})
export class AppModule {}
