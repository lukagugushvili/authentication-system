import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Model } from 'mongoose';
import { User } from './schema/user.schema';
import { UserRoles } from 'src/enums/roles-enum';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const existingUser = await this.userModel.findOne({
        email: createUserDto.email,
      });

      if (existingUser)
        throw new BadRequestException(
          `User ${createUserDto.email} already exists`,
        );

      const newUser = await this.userModel.create({
        ...createUserDto,
        role: UserRoles.USER,
      });

      await newUser.save();

      return newUser;
    } catch (error) {
      console.error(`Error creating user: ${error.message}`);
      throw new BadRequestException(`Could not create user: ${error.message}`);
    }
  }

  async findAll(): Promise<User[]> {
    const users = await this.userModel.find().exec();

    if (!users || users.length < 1) {
      throw new NotFoundException('Can not find users');
    }

    return users;
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id);

    if (!user) throw new NotFoundException(`User with ID: ${id} not found`);

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const user = await this.userModel.findById(id).lean();
      if (!user) throw new NotFoundException('User not found');

      if (updateUserDto?.role === 'admin' && user.role !== 'admin') {
        throw new BadRequestException('You can not change role to admin');
      }

      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updateUserDto, { new: true })
        .exec();

      if (!updatedUser) {
        throw new BadRequestException('User update failed: Please try again.');
      }

      return updatedUser;
    } catch (error) {
      console.error(`Error updating user: ${id}, ${error.message}`);
      throw new BadRequestException(`Could not update user: ${error.message}`);
    }
  }

  async remove(id: string): Promise<User> {
    try {
      const user = await this.userModel.findByIdAndDelete(id);

      if (!user) throw new NotFoundException(`User with ID: ${id} not found`);

      return user;
    } catch (error) {
      console.error(`Error removing user: ${id}, ${error.message}`);
      throw new BadRequestException(`Could not remove user: ${error.message}`);
    }
  }
}
