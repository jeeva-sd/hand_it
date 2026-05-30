export const EMAIL_TYPES = { PASSWORD_RESET: 'password-reset', ACCOUNT_SETUP: 'account-setup' } as const;

export type EmailType = (typeof EMAIL_TYPES)[keyof typeof EMAIL_TYPES];

export const EMAIL_TEMPLATE_MAP: Record<EmailType, string> = {
    [EMAIL_TYPES.PASSWORD_RESET]: 'password-reset-email',
    [EMAIL_TYPES.ACCOUNT_SETUP]: 'account-setup-email'
};
