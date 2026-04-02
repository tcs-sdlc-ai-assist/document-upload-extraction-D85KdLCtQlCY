import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(128)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(64)
  password: string;
}

export class UserInfoDto {
  id: string;
  email: string;
  displayName: string;
}

export class AuthResponseDto {
  user: UserInfoDto;
  token: string;
}

export class SessionDto {
  user: UserInfoDto;
  expiresAt: string;
}

export class LogoutResponseDto {
  message: string;
}