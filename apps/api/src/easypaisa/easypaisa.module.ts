import { Module } from '@nestjs/common'
import { EasypaisaController } from './easypaisa.controller'
import { EasypaisaService } from './easypaisa.service'

@Module({ controllers: [EasypaisaController], providers: [EasypaisaService] })
export class EasypaisaModule {}
