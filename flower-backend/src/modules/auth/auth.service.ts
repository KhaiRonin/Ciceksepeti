import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../../common/services/redis.service';
import { randomUUID } from 'crypto';

interface RefreshPayload {
  sub: string;
  tokenId: string;
}

@Injectable()
export class AuthService {
  private readonly passwordRounds = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('Email already in use');
    }

    const password = await bcrypt.hash(dto.password, this.passwordRounds);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password,
        name: dto.name,
      },
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto, ip: string) {
    await this.assertBruteForceLimit(dto.email, ip);
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      await this.registerFailedAttempt(dto.email, ip);
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      await this.registerFailedAttempt(dto.email, ip);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.clearFailedAttempts(dto.email, ip);
    return this.issueTokens(user.id, user.email, user.role);
  }

  async refresh(dto: RefreshDto) {
    let payload: RefreshPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshPayload>(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isBlacklisted = await this.redisService.get(`rt:blacklist:${payload.tokenId}`);
    if (isBlacklisted) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    const storedToken = await this.prisma.token.findUnique({ where: { id: payload.tokenId } });
    if (!storedToken || storedToken.userId !== payload.sub) {
      await this.revokeAllUserTokens(payload.sub);
      throw new UnauthorizedException('Token reuse detected');
    }

    const tokenMatch = await bcrypt.compare(dto.refreshToken, storedToken.hashedRefreshToken);
    if (!tokenMatch) {
      await this.revokeAllUserTokens(payload.sub);
      throw new UnauthorizedException('Token reuse detected');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.prisma.token.delete({ where: { id: payload.tokenId } });
    await this.redisService.set(
      `rt:blacklist:${payload.tokenId}`,
      '1',
      Math.max(1, Math.floor((storedToken.expiresAt.getTime() - Date.now()) / 1000)),
    );

    return this.issueTokens(user.id, user.email, user.role);
  }

  async logout(userId: string, dto: LogoutDto) {
    if (dto.refreshToken) {
      try {
        const payload = await this.jwtService.verifyAsync<RefreshPayload>(dto.refreshToken, {
          secret: this.configService.get<string>('jwt.refreshSecret'),
        });

        if (payload.sub === userId) {
          const token = await this.prisma.token.findUnique({ where: { id: payload.tokenId } });
          if (token) {
            await this.prisma.token.delete({ where: { id: payload.tokenId } });
            await this.redisService.set(
              `rt:blacklist:${payload.tokenId}`,
              '1',
              Math.max(1, Math.floor((token.expiresAt.getTime() - Date.now()) / 1000)),
            );
          }
        }
      } catch {
        await this.prisma.token.deleteMany({ where: { userId } });
      }
      return { success: true };
    }

    await this.prisma.token.deleteMany({ where: { userId } });
    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, this.passwordRounds);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await this.prisma.token.deleteMany({ where: { userId } });

    return { success: true };
  }

  private async issueTokens(userId: string, email: string, role: 'admin' | 'user') {
    const tokenId = randomUUID();
    const accessExpiresIn = this.configService.get<string>('jwt.accessExpiresIn') ?? '15m';
    const accessSeconds = this.parseExpiryToSeconds(accessExpiresIn);
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d';
    const refreshSeconds = this.parseExpiryToSeconds(refreshExpiresIn);

    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email, role },
      {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: accessSeconds,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, tokenId },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: refreshSeconds,
      },
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, this.passwordRounds);
    await this.prisma.token.create({
      data: {
        id: tokenId,
        userId,
        hashedRefreshToken,
        expiresAt: new Date(Date.now() + refreshSeconds * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessExpiresIn,
    };
  }

  private parseExpiryToSeconds(expiry: string): number {
    const parsed = /^([0-9]+)([smhd])$/.exec(expiry);
    if (!parsed) {
      return 7 * 24 * 60 * 60;
    }

    const value = Number(parsed[1]);
    const unit = parsed[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };
    return value * multipliers[unit];
  }

  private async assertBruteForceLimit(email: string, ip: string): Promise<void> {
    const key = `bf:${email}:${ip}`;
    const attempts = Number((await this.redisService.get(key)) ?? 0);
    if (attempts >= 5) {
      throw new UnauthorizedException('Too many failed attempts. Try again later.');
    }
  }

  private async registerFailedAttempt(email: string, ip: string): Promise<void> {
    const key = `bf:${email}:${ip}`;
    const attempts = await this.redisService.incr(key);
    if (attempts === 1) {
      await this.redisService.expire(key, 15 * 60);
    }
  }

  private async clearFailedAttempts(email: string, ip: string): Promise<void> {
    await this.redisService.del(`bf:${email}:${ip}`);
  }

  private async revokeAllUserTokens(userId: string): Promise<void> {
    const tokens = await this.prisma.token.findMany({ where: { userId } });
    for (const token of tokens) {
      await this.redisService.set(
        `rt:blacklist:${token.id}`,
        '1',
        Math.max(1, Math.floor((token.expiresAt.getTime() - Date.now()) / 1000)),
      );
    }
    await this.prisma.token.deleteMany({ where: { userId } });
  }
}
