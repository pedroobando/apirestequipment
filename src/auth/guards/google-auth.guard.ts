import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { isGoogleOAuthEnabled } from '../strategies/google.strategy';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext) {
    if (!isGoogleOAuthEnabled()) {
      throw new UnauthorizedException(
        'Google OAuth is not configured on this server',
      );
    }
    return super.canActivate(context);
  }
}
