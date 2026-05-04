export const hero = {
  title: 'GitOps 인프라 운영 사례',
  description: [
    'OCI A1 단일 노드 k3s 위에서 Argo CD · GitHub Actions · Prometheus 스택을 직접 설계·운영합니다.',
    '배포 흐름과 알람 신호를 한 화면에서 판단합니다.',
  ],
  ctaLabel: 'Observatory 열기',
} as const;

export const liveStatus = {
  healthyLabel: 'Healthy',
  alertsLabel: '활성 알람',
  fetchFailed: '상태를 불러오지 못했습니다.',
} as const;
