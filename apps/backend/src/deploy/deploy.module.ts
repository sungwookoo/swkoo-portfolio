import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { onboardingConfig } from '../config/onboarding.config';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { DeployController } from './deploy.controller';
import { DeployService } from './deploy.service';
import { GithubAppService } from './github-app.service';

@Module({
  imports: [OnboardingModule, ConfigModule.forFeature(onboardingConfig)],
  controllers: [DeployController],
  providers: [DeployService, GithubAppService],
  exports: [DeployService, GithubAppService],
})
export class DeployModule {}
