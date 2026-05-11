import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { onboardingConfig } from '../config/onboarding.config';
import { webhooksConfig } from '../config/webhooks.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersRepository } from './users.repository';

@Module({
  imports: [
    ConfigModule.forFeature(onboardingConfig),
    ConfigModule.forFeature(webhooksConfig),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersRepository],
  exports: [AuthService, UsersRepository],
})
export class OnboardingModule {}
