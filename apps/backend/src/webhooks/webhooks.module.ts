import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { webhooksConfig } from '../config/webhooks.config';
import { EventsModule } from '../events/events.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [ConfigModule.forFeature(webhooksConfig), EventsModule],
  controllers: [WebhooksController],
  providers: [WebhooksService]
})
export class WebhooksModule {}
