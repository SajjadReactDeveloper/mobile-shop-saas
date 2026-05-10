import { Module } from '@nestjs/common'
import { CustomersController } from './customers.controller'
import { CustomersService } from './customers.service'

// NotificationsModule is @Global() so it's available without explicit import
@Module({ controllers: [CustomersController], providers: [CustomersService] })
export class CustomersModule {}
