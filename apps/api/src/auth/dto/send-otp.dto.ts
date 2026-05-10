import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '+923001234567' })
  @IsString()
  @Matches(/^\+\d{10,15}$/, {
    message: 'Phone must be in E.164 format (e.g. +923001234567)',
  })
  phone: string;
}
