import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { onboardingConfig } from '../config/onboarding.config';
import { webhooksConfig } from '../config/webhooks.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersRepository } from './users.repository';

@Module({
  imports: [
    ConfigModule.forFeature(onboardingConfig),
    ConfigModule.forFeature(webhooksConfig),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersRepository, JwtAuthGuard],
  exports: [AuthService, UsersRepository, JwtAuthGuard],
})
export class OnboardingModule {}
