import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy, JWT_SECRET } from './strategies/jwt.strategy';
import {
  GoogleStrategy,
  isGoogleOAuthEnabled,
} from './strategies/google.strategy';

const providers: Array<
  typeof AuthService | typeof JwtStrategy | typeof GoogleStrategy
> = [AuthService, JwtStrategy];

if (isGoogleOAuthEnabled()) {
  providers.push(GoogleStrategy);
}

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers,
  exports: [AuthService],
})
export class AuthModule {}
