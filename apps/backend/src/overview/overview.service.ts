import { Injectable } from '@nestjs/common';

import type { PortfolioOverview } from './overview.types';

@Injectable()
export class OverviewService {
  getOverview(): PortfolioOverview {
    return {
      owner: {
        name: 'Sungwoo Koo',
        domain: 'swkoo.kr',
        mission:
          'Personal infrastructure playground showcasing GitOps-first workflows on a self-managed K3s cluster.'
      },
      infrastructure: {
        cluster: {
          distribution: 'K3s',
          location: 'Oracle Cloud Infrastructure (ap-tokyo-1)',
          gitOpsTooling: ['Argo CD', 'OCI Container Registry', 'Terraform automation']
        },
        controlPlane: ['Argo CD', 'Portainer', 'Grafana/Prometheus stack', 'Private Docker Registry']
      },
      gitopsVision: {
        description:
          'Deliver an end-to-end view of pipeline health. Each deployment should be trackable from commit to K3s workload rollout.',
        roadmap: [
          'Phase 1: Landing page + static infrastructure overview API',
          'Phase 2: Argo CD Application status ingestion & dashboard',
          'Phase 3: Real-time event streaming across all GitOps-enabled workloads'
        ]
      }
    };
  }
}
