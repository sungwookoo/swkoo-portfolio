export const hero = {
  title: 'Self-hosted GitOps experiment',
  description:
    'Single-operator k3s 클러스터에서 배포 파이프라인을 운영하고, 친구의 앱을 호스팅하는 실험 공간.',
  ctaLabel: 'Observatory 열기',
} as const;

export const liveStatus = {
  healthyLabel: 'Healthy',
  alertsLabel: '활성 알람',
  fetchFailed: '상태를 불러오지 못했습니다.',
} as const;
