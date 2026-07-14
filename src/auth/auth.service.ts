import {
  Injectable,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthTokens, JwtPayload } from './interfaces/auth.interface';
import { tryCatch } from 'src/common/utils/try-catch';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(UsersService) private readonly usersService: UsersService,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthTokens> {
    const user = await this.usersService.create(registerDto);

    return this.buildTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async login(loginDto: LoginDto): Promise<AuthTokens> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const [isValid, hashError] = await tryCatch(
      bcrypt.compare(loginDto.password, user.passwordHash),
    );

    if (hashError || !isValid) {
      this.logger.error(
        `login - password compare failed: ${hashError?.message}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    return this.buildTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async refreshTokens(userId: string): Promise<AuthTokens> {
    const user = await this.usersService.getById(userId);

    return this.buildTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  private buildTokens(payload: JwtPayload): AuthTokens {
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(
      { sub: payload.sub, type: 'refresh' },
      { expiresIn: '7d' },
    );

    return { accessToken, refreshToken };
  }
}
