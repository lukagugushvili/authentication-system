import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { LoginRes } from './auth-response/login-res';
import * as bcrypt from 'bcrypt';
import { RegisterRes } from './auth-response/register-res';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}
  async register(registerDto: CreateUserDto): Promise<RegisterRes> {
    const { email, password } = registerDto;
    try {
      const emailInUse = await this.userService.findFieldsForAuth(email);

      if (emailInUse) {
        throw new BadRequestException(`User with ${email} already exists`);
      }

      const salt_rounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
      const hashedPassword = await bcrypt.hash(password, salt_rounds);

      const registerIn = await this.userService.create({
        ...registerDto,
        password: hashedPassword,
      });

      return {
        message: 'User registered successfully',
        userId: registerIn?.id,
      };
    } catch (error) {
      console.error(`Error registering user: ${error.message}`);
      throw new BadRequestException(
        `Could not register user: ${error.message}`,
      );
    }
  }

  async login(loginDto: LoginDto): Promise<LoginRes> {
    const { email, password } = loginDto;
    try {
      const user = await this.userService.findFieldsForAuth(email);
      if (!user) throw new UnauthorizedException('Invalid credentials');

      const arePasswordsEqual = await bcrypt.compare(password, user.password);
      if (!arePasswordsEqual) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = { sub: user.id, email: user.email, role: user.role };
      const access_token = this.jwtService.sign(payload);

      return { message: 'Logged in successfully', access_token };
    } catch (error) {
      console.error(`Error logging in user: ${error.message}`);
      throw new BadRequestException(`Could not log in user: ${error.message}`);
    }
  }
}
