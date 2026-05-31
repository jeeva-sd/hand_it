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

    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    @Get('me')
    async me(@Req() request: RequestX<unknown>) {
        return this.authService.getMe(request.user);
    }

    @SkipJwtAuth()
    @Sanitize(signupSchema)
    @Post('signup')
    async signup(@Req() request: RequestX<SignupPayload>) {
        const payload = request.payload as SignupPayload;
        return this.authService.signup(payload);
    }

    @SkipJwtAuth()
    @HttpCode(200)
    @Sanitize(loginSchema)
    @Post('login')
    async login(@Req() request: RequestX<LoginPayload>, @Res({ passthrough: true }) response: FastifyReply) {
        const payload = request.payload as LoginPayload;
        const result = await this.authService.login(payload);
        this.authService.attachAuthCookie(response, result.token);
        return result;
    }

    @SkipJwtAuth()
    @HttpCode(200)
    @Post('logout')
    logout(@Res({ passthrough: true }) response: FastifyReply) {
        this.authService.clearAuthCookie(response);
        return { message: 'Logged out successfully' };
    }

    @SkipJwtAuth()
    @HttpCode(200)
    @Sanitize(forgetPasswordSchema)
    @Post('forget')
    async forgetPassword(@Req() request: RequestX<ForgetPasswordPayload>) {
        const payload = request.payload as ForgetPasswordPayload;
        return this.authService.forgetPassword(payload);
    }

    @SkipJwtAuth()
    @HttpCode(200)
    @Sanitize(forgetPasswordSchema)
    @Post('forgot-password')
    async forgotPassword(@Req() request: RequestX<ForgetPasswordPayload>) {
        const payload = request.payload as ForgetPasswordPayload;
        return this.authService.forgetPassword(payload);
    }

    @SkipJwtAuth()
    @Sanitize(resetPasswordPageSchema)
    @Get('reset-password')
    async renderResetPasswordPage(@Req() request: RequestX<ResetPasswordPagePayload>, @Res() response: FastifyReply) {
        const payload = request.payload as ResetPasswordPagePayload;
        const pageModel = await this.authService.getResetPasswordPage(payload.token);
        return response.type('text/html').view('password-reset', pageModel);
    }

    @SkipJwtAuth()
    @HttpCode(200)
    @Sanitize(resetPasswordSchema)
    @Post('reset-password')
    async resetPassword(
        @Req() request: RequestX<ResetPasswordPayload>,
        @Res({ passthrough: true }) response: FastifyReply
    ) {
        const payload = request.payload as ResetPasswordPayload;
        const result = await this.authService.resetPassword(payload);
        this.authService.attachAuthCookie(response, result.token);
        return result;
    }

    @SkipJwtAuth()
    @HttpCode(200)
    @Sanitize(resetPasswordSchema)
    @Post('reset')
    async resetPasswordAlias(
        @Req() request: RequestX<ResetPasswordPayload>,
        @Res({ passthrough: true }) response: FastifyReply
    ) {
        const payload = request.payload as ResetPasswordPayload;
        const result = await this.authService.resetPassword(payload);
        this.authService.attachAuthCookie(response, result.token);
        return result;
    }
}
