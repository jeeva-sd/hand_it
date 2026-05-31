import '@fastify/view';
import { Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { RequestX } from '~/shared/types/request.type';
import { Sanitize } from '~/system';
import { AuthService } from './auth.service';
import { SkipJwtAuth } from './decorators';
import {
    ForgetPasswordPayload,
    forgetPasswordSchema,
    LoginPayload,
    loginSchema,
    ResetPasswordPagePayload,
    ResetPasswordPayload,
    resetPasswordPageSchema,
    resetPasswordSchema,
    SignupPayload,
    signupSchema
} from './schemas';
import { JwtAuthGuard } from './strategies/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get('me')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    async me(@Req() request: RequestX<unknown>) {
        return this.authService.getMe(request.user);
    }

    @Post('signup')
    @SkipJwtAuth()
    @Sanitize(signupSchema)
    async signup(@Req() request: RequestX<SignupPayload>) {
        return this.authService.signup(request.payload);
    }

    @Post('login')
    @SkipJwtAuth()
    @HttpCode(200)
    @Sanitize(loginSchema)
    async login(@Req() request: RequestX<LoginPayload>, @Res({ passthrough: true }) response: FastifyReply) {
        const result = await this.authService.login(request.payload);
        this.authService.attachAuthCookie(response, result.token);
        return result;
    }

    @Post('logout')
    @HttpCode(200)
    @SkipJwtAuth()
    logout(@Res({ passthrough: true }) response: FastifyReply) {
        this.authService.clearAuthCookie(response);
        return { message: 'Logged out successfully' };
    }

    @Post('forget')
    @SkipJwtAuth()
    @HttpCode(200)
    @Sanitize(forgetPasswordSchema)
    async forgetPassword(@Req() request: RequestX<ForgetPasswordPayload>) {
        return this.authService.forgetPassword(request.payload);
    }

    @SkipJwtAuth()
    @HttpCode(200)
    @Post('forgot-password')
    @Sanitize(forgetPasswordSchema)
    async forgotPassword(@Req() request: RequestX<ForgetPasswordPayload>) {
        return this.authService.forgetPassword(request.payload);
    }

    @SkipJwtAuth()
    @HttpCode(200)
    @Post('forget-password')
    @Sanitize(forgetPasswordSchema)
    async forgetPasswordAlias(@Req() request: RequestX<ForgetPasswordPayload>) {
        return this.authService.forgetPassword(request.payload);
    }

    @SkipJwtAuth()
    @Get('reset-password')
    @Sanitize(resetPasswordPageSchema)
    async renderResetPasswordPage(@Req() request: RequestX<ResetPasswordPagePayload>, @Res() response: FastifyReply) {
        const pageModel = await this.authService.getResetPasswordPage(request.payload.token);
        return response.type('text/html').view('password-reset', pageModel);
    }

    @SkipJwtAuth()
    @HttpCode(200)
    @Post('reset-password')
    @Sanitize(resetPasswordSchema)
    async resetPassword(
        @Req() request: RequestX<ResetPasswordPayload>,
        @Res({ passthrough: true }) response: FastifyReply
    ) {
        const result = await this.authService.resetPassword(request.payload);
        this.authService.attachAuthCookie(response, result.token);
        return result;
    }

    @SkipJwtAuth()
    @HttpCode(200)
    @Post('reset')
    @Sanitize(resetPasswordSchema)
    async resetPasswordAlias(
        @Req() request: RequestX<ResetPasswordPayload>,
        @Res({ passthrough: true }) response: FastifyReply
    ) {
        const result = await this.authService.resetPassword(request.payload);
        this.authService.attachAuthCookie(response, result.token);
        return result;
    }
}
