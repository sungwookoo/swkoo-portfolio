import { Module } from '@nestjs/common';

import { KubeClient } from './kube.client';

@Module({
  providers: [KubeClient],
  exports: [KubeClient],
})
export class KubeModule {}
