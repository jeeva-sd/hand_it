import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import * as Handlebars from 'handlebars';
import { StringUtils } from '~/shared/utils/string.utils';
import { appConfig } from '~/system/config';
import { EMAIL_TEMPLATE_MAP, EmailType } from './email.constants';

@Injectable()
export class EmailsService {
    private readonly logger = new Logger(EmailsService.name);

    constructor() {
        if (appConfig.email?.enabled && appConfig.email.apiKey) {
            sgMail.setApiKey(appConfig.email.apiKey);
        }
        this.registerHandlebarsHelpers();
    }

    private registerHandlebarsHelpers(): void {
        if (!Handlebars.helpers.eq) {
            Handlebars.registerHelper('eq', (a, b) => a === b);
        }
        if (!Handlebars.helpers.contains) {
            Handlebars.registerHelper('contains', (str, substr) => typeof str === 'string' && str.includes(substr));
        }
        if (!Handlebars.helpers.or) {
            Handlebars.registerHelper('or', (a, b) => a || b);
        }
        if (!Handlebars.helpers.titleCase) {
            Handlebars.registerHelper('titleCase', value =>
                typeof value === 'string' ? StringUtils.toTitleCase(value) : ''
            );
        }
    }

    private async compileTemplate(templateName: string, context: unknown): Promise<string> {
        try {
            const templatePath = path.join(process.cwd(), 'src/views', `${templateName}.hbs`);
            const source = await fs.readFile(templatePath, 'utf8');
            const compiled = Handlebars.compile(source);
            // Inject backend URL and logo URL into context
            const enhancedContext = {
                ...(typeof context === 'object' ? context : {}),
                logoUrl: `${appConfig.backend.url}/static/logo.svg`,
                backendUrl: appConfig.backend.url
            };
            return compiled(enhancedContext);
        } catch (error) {
            const err = error as Error;
            this.logger.error(`Failed to compile template ${templateName}: ${err.message}`, err.stack);
            throw error;
        }
    }

    /**
     * Send email with template and context
     * Loads template, generates HTML, sends email
     */
    async sendTemplate(to: string, subject: string, emailType: EmailType, context: unknown): Promise<boolean> {
        if (!appConfig.email?.enabled) {
            this.logger.warn(`Email service disabled. Skipping ${emailType} to ${to}`);
            return false;
        }

        try {
            const templateName = EMAIL_TEMPLATE_MAP[emailType];
            if (!templateName) {
                throw new Error(`Unknown email type: ${emailType}`);
            }

            const html = await this.compileTemplate(templateName, context);
            const msg = { to, from: appConfig.email.from, subject, html };

            if (!msg.from) {
                throw new Error('Sender email address not configured');
            }

            await sgMail.send(msg);
            this.logger.log(`${emailType} sent to ${to}`);
            return true;
        } catch (error) {
            const err = error as Error & { response?: { body?: unknown } };
            this.logger.error(`Failed to send ${emailType} to ${to}: ${err.message}`, err.stack);
            if (err.response?.body) {
                this.logger.error(`SendGrid: ${JSON.stringify(err.response.body)}`);
            }
            return false;
        }
    }
}
