import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { webhooksConfig } from '../config/webhooks.config';
import { EventsRepository } from './events.repository';

@Module({
  imports: [ConfigModule.forFeature(webhooksConfig)],
  providers: [EventsRepository],
  exports: [EventsRepository]
})
export class EventsModule {}
