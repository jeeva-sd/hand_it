import '@fastify/view';
import { Controller, Get, Post, Req, Res, BadRequestException } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { RequestX } from '~/shared/types/request.type';
import { SkipJwtAuth } from '../auth/decorators';
import { WorkspaceInvitationService } from './workspace-invitation.service';
import { AuthService } from '../auth/auth.service';

@Controller('invite')
export class InviteController {
    constructor(
        private readonly invitationService: WorkspaceInvitationService,
        private readonly authService: AuthService
    ) {}

    @SkipJwtAuth()
    @Get()
    async renderInvitePage(@Req() request: any, @Res() response: FastifyReply) {
        const token = request.query.token;
        if (!token) {
            return response.type('text/html').view('invite', {
                valid: false,
                errorMessage: 'Invitation link is invalid or missing.'
            });
        }

        const pageModel = await this.invitationService.getInvitePageData(token);
        return response.type('text/html').view('invite', pageModel);
    }

    @SkipJwtAuth()
    @Post('accept')
    async acceptInvitation(@Req() request: any, @Res() response: FastifyReply) {
        const { token, password, confirmPassword } = request.body || {};
        if (!token) {
            throw new BadRequestException('Token is required');
        }

        try {
            const result = await this.invitationService.acceptInvitation(token, password, confirmPassword);
            this.authService.attachAuthCookie(response, result.token);
            return response.send({ success: true, redirectUrl: result.redirectUrl });
        } catch (error: any) {
            return response.status(400).send({ success: false, message: error.message });
        }
    }

    @SkipJwtAuth()
    @Post('decline')
    async declineInvitation(@Req() request: any, @Res() response: FastifyReply) {
        const { token } = request.body || {};
        if (!token) {
            throw new BadRequestException('Token is required');
        }

        try {
            const result = await this.invitationService.declineInvitation(token);
            return response.send({ success: true, message: result.message });
        } catch (error: any) {
            return response.status(400).send({ success: false, message: error.message });
        }
    }
}
