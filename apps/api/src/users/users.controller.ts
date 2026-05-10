import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(UserRole.OWNER)
  getAll(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findAll(user.shopId);
  }

  @Post('invite')
  @Roles(UserRole.OWNER)
  invite(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      name: string;
      email?: string;
      phone?: string;
      role: UserRole;
      password?: string;
    },
  ) {
    return this.usersService.invite(user.shopId, body);
  }

  @Patch(':id/role')
  @Roles(UserRole.OWNER)
  updateRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('role') role: UserRole,
  ) {
    return this.usersService.updateRole(id, user.shopId, role);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  deactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.usersService.deactivate(id, user.shopId);
  }
}
