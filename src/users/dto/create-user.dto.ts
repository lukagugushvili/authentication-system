import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRoles } from 'src/enums/roles-enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(UserRoles, { message: 'Role must be either USER or ADMIN' })
  @IsOptional()
  role?: UserRoles;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  refreshToken?: string;
}
