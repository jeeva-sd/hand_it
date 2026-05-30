import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ClsService } from 'nestjs-cls';
import { Strategy } from 'passport-jwt';
import { RequestX, TokenData } from '~/shared/types/request.type';
import { Store } from '~/shared/types/store.type';
import { appConfig } from '~/system/config';
import { getToken } from '~/system/security/token.utils';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly cls: ClsService<Store>) {
        super({
            jwtFromRequest: (req: RequestX<unknown>) => getToken(req),
            secretOrKey: appConfig.auth.basicJWT.secret,
            ignoreExpiration: false,
            passReqToCallback: true // Pass req to validate method
        });
    }

    async validate(_req: RequestX<unknown>, user: TokenData) {
        // Store requested user info in global store
        this.cls.set('tokenData', user);
        return user; // Return the validated user data
    }
}
