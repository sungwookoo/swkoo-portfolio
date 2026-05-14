import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { onboardingConfig } from '../config/onboarding.config';
import { webhooksConfig } from '../config/webhooks.config';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';
import { UsersRepository } from './users.repository';

@Module({
  imports: [
    ConfigModule.forFeature(onboardingConfig),
    ConfigModule.forFeature(webhooksConfig),
  ],
  controllers: [AuthController, AdminController],
  providers: [AuthService, UsersRepository, JwtAuthGuard, OptionalJwtAuthGuard, AdminGuard],
  exports: [AuthService, UsersRepository, JwtAuthGuard, OptionalJwtAuthGuard, AdminGuard],
})
export class OnboardingModule {}
