import '@fastify/view';
import { Controller, Get, HttpCode, Patch, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
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
    ProfileImageParamsPayload,
    profileImageParamsSchema,
    ResetPasswordPagePayload,
    ResetPasswordPayload,
    resetPasswordPageSchema,
    resetPasswordSchema,
    SignupPayload,
    signupSchema,
    UpdateProfilePayload,
    UploadProfileImagePayload,
    updateProfileSchema,
    uploadProfileImageSchema
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

    @Patch('profile')
    @UseGuards(JwtAuthGuard)
    @Sanitize(updateProfileSchema)
    async updateProfile(@Req() request: RequestX<UpdateProfilePayload>) {
        return this.authService.updateProfile(request.user, request.payload);
    }

    @Put('profile-image')
    @UseGuards(JwtAuthGuard)
    @Sanitize(uploadProfileImageSchema)
    async uploadProfileImage(@Req() request: RequestX<UploadProfileImagePayload>) {
        return this.authService.uploadProfileImage(request.user, request.payload);
    }

    @Get('profile-image/:userId')
    @SkipJwtAuth()
    @Sanitize(profileImageParamsSchema)
    async getProfileImage(@Req() request: RequestX<ProfileImageParamsPayload>, @Res() res: FastifyReply) {
        const { userId } = request.payload;
        const { stream, contentType } = await this.authService.getProfileImage(userId);

        res.header('Content-Type', contentType);
        res.header('Cache-Control', 'public, max-age=604800'); // Cache for 7 days
        res.send(stream);
    }
}
