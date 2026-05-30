import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { z } from 'zod';
import { AckHandler } from '~/system';
import { fifoConsumerEvents, generalEvents } from './event.patterns';

const generalQueuePayloadSchema = z.object({}).passthrough();
type GeneralQueuePayload = z.infer<typeof generalQueuePayloadSchema>;

const userCreatedEventSchema = z
    .object({ userId: z.string().trim().min(1).optional(), email: z.string().email().optional() })
    .passthrough();

type UserCreatedEvent = z.infer<typeof userCreatedEventSchema>;

@Controller()
export class EventConsumer {
    @EventPattern(generalEvents.reminders.dispatch)
    @AckHandler(generalQueuePayloadSchema)
    async handleGeneralReminderDispatch(@Payload() payload: GeneralQueuePayload, @Ctx() context: RmqContext) {
        void context;
        return { consumed: true, queue: 'general', event: generalEvents.reminders.dispatch, payload };
    }

    @EventPattern(fifoConsumerEvents.user.created)
    @AckHandler(userCreatedEventSchema)
    async handleUserCreated(@Payload() payload: UserCreatedEvent, @Ctx() context: RmqContext) {
        void context;
        return {
            consumed: true,
            queue: 'fifo',
            event: fifoConsumerEvents.user.created,
            userId: payload.userId ?? null
        };
    }
}
