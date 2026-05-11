import { Module } from '@nestjs/common';

import { OnboardingModule } from '../onboarding/onboarding.module';
import { DeployController } from './deploy.controller';
import { DeployService } from './deploy.service';

@Module({
  imports: [OnboardingModule],
  controllers: [DeployController],
  providers: [DeployService],
  exports: [DeployService],
})
export class DeployModule {}
