export const generalEvents = { reminders: { dispatch: 'reminders.dispatch' }, email: { send: 'email.send' } } as const;

export const fifoConsumerEvents = { user: { created: 'user.created' } } as const;
