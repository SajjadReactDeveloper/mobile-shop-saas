import { Module } from '@nestjs/common';
import { EasyLoadController } from './easy-load.controller';
import { EasyLoadService } from './easy-load.service';

@Module({ controllers: [EasyLoadController], providers: [EasyLoadService] })
export class EasyLoadModule {}
