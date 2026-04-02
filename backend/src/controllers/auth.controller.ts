import { Controller, Post, Get, Body, Req, Res, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../common/dto/auth.dto';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = this.extractIp(req);
    const result = await this.authService.login(loginDto.email, loginDto.password, ipAddress);

    res.cookie('session', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.token;

    const result = await this.authService.logout(token, this.extractIp(req));

    res.cookie('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });

    return result;
  }

  @Get('session')
  @HttpCode(HttpStatus.OK)
  async session(@Req() req: AuthenticatedRequest) {
    const token = req.token;

    return this.authService.validateSession(token);
  }

  private extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];

    if (forwarded) {
      const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      const ip = forwardedStr.split(',')[0].trim();
      if (ip.length > 0) {
        return ip;
      }
    }

    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}