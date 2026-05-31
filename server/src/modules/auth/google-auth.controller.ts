import { Controller, Get, Query, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { SkipJwtAuth } from './decorators';
import { AuthService } from './auth.service';

@Controller('auth')
export class GoogleAuthController {
    constructor(private readonly authService: AuthService) {}

    @SkipJwtAuth()
    @Get('google')
    redirectToGoogle(@Res() response: FastifyReply) {
        return response.redirect(this.authService.getGoogleAuthorizationUrl(), 302);
    }

    @SkipJwtAuth()
    @Get('google/callback')
    async googleCallback(
        @Query('code') code: string | undefined,
        @Query('error') error: string | undefined,
        @Res() response: FastifyReply
    ) {
        if (error || !(code?.trim())) {
            this.authService.clearAuthCookie(response);
            return response.redirect(this.authService.getGoogleFailureRedirectUrl(), 302);
        }

        try {
            const result = await this.authService.loginWithGoogleCode(code);
            this.authService.attachAuthCookie(response, result.token);
            return response.redirect(this.authService.getGoogleSuccessRedirectUrl(), 302);
        } catch {
            this.authService.clearAuthCookie(response);
            return response.redirect(this.authService.getGoogleFailureRedirectUrl(), 302);
        }
    }
}
