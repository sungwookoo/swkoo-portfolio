import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { onboardingConfig } from '../config/onboarding.config';
import { KubeModule } from '../kube/kube.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { PipelinesModule } from '../pipelines/pipelines.module';
import { AccountController } from './account.controller';
import { CleanupService } from './cleanup.service';
import { DeployController } from './deploy.controller';
import { DeployService } from './deploy.service';
import { EnvService } from './env.service';
import { GithubAppService } from './github-app.service';

@Module({
  imports: [
    OnboardingModule,
    PipelinesModule,
    KubeModule,
    ConfigModule.forFeature(onboardingConfig),
  ],
  controllers: [DeployController, AccountController],
  providers: [DeployService, GithubAppService, EnvService, CleanupService],
  exports: [DeployService, GithubAppService, EnvService],
})
export class DeployModule {}
