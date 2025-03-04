import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  BadGatewayException,
  Put,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schema/user.schema';
import mongoose from 'mongoose';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRoles } from 'src/enums/roles-enum';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { IReqUserProfile } from 'src/interfaces/req-user';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(RolesGuard, JwtAuthGuard)
  @Roles(UserRoles.ADMIN)
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN, UserRoles.USER)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: IReqUserProfile,
  ): Promise<User> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadGatewayException('Invalid mongo ID');
    }

    if (user.role !== 'admin' && id !== user.userId) {
      throw new ForbiddenException('You are not allowed to access this user');
    }

    return this.usersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRoles.ADMIN, UserRoles.USER)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: IReqUserProfile,
  ): Promise<User> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadGatewayException('Invalid mongo ID');
    }

    if (user.role !== 'admin' && id !== user.userId) {
      throw new ForbiddenException('You are not allowed to access this user');
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRoles.ADMIN, UserRoles.USER)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: IReqUserProfile,
  ): Promise<User> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadGatewayException('Invalid mongo ID');
    }

    if (user.role !== 'admin' && id !== user.userId) {
      throw new ForbiddenException('You are not allowed to access this user');
    }

    return this.usersService.remove(id);
  }
}
