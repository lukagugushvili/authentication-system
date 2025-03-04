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
import { User } from 'src/users/schema/user.schema';
import { GenerateTokensRes } from './auth-response/generate-tokens-res';

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

      if (!hashedPassword) {
        throw new BadRequestException('Error hashing password');
      }

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
      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.updateToken(user.id, tokens.refresh_token);

      return {
        message: 'Logged in successfully',
        tokens,
      };
    } catch (error) {
      console.error(`Error logging in user: ${error.message}`);
      throw new BadRequestException(`Could not log in user: ${error.message}`);
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findFieldsForAuth(email);
    if (!user) return null;

    const arePasswordsEqual = await bcrypt.compare(password, user.password);
    if (!arePasswordsEqual) return null;

    return user;
  }

  async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<GenerateTokensRes> {
    const payload = { sub: userId, email, role };

    const token = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_TOKEN_KEY,
      expiresIn: '7d',
    });

    return { access_token: token, refresh_token: refreshToken };
  }

  async updateToken(userId: string, refreshToken: string) {
    const rounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hashedRefreshToken = await bcrypt.hash(refreshToken, rounds);
    await this.userService.update(userId, { refreshToken: hashedRefreshToken });
  }
}
