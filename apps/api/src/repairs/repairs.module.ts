import { Module } from '@nestjs/common';
import { RepairsController } from './repairs.controller';
import { RepairsService } from './repairs.service';

// NotificationsModule is @Global() so it's available without explicit import
@Module({ controllers: [RepairsController], providers: [RepairsService] })
export class RepairsModule {}
