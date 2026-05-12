export const hero = {
  // Two lines for visual rhythm; rendered with whitespace-pre-line.
  title: 'GitHub repo 하나로\n앱을 라이브로 띄우세요',
  tagline: '그 인프라는 모두 공개됩니다.',
  description:
    'Dockerfile · GitHub Actions · k8s 매니페스트가 자동으로 생성·commit되고, ArgoCD가 배포합니다. 현재 Next.js, 친구·테스터 한정 베타.',
  primaryCta: { label: 'Deploy with GitHub', href: '/deploy' as const },
  secondaryCta: { label: '운영 콘솔 (Observatory)', href: '/observatory' as const },
} as const;

export const steps = [
  {
    n: 1,
    title: 'GitHub 로그인',
    body: '본인 repo 목록을 GitHub App을 통해 가져옵니다. 권한은 등록한 repo 한정.',
  },
  {
    n: 2,
    title: 'repo 선택 · 스택 자동 감지',
    body: 'package.json을 읽어 Next.js를 식별합니다. 포트·이미지 경로·서브도메인은 자동 결정.',
  },
  {
    n: 3,
    title: 'Deploy 클릭',
    body: 'Dockerfile + workflow가 본인 repo에 commit, 매니페스트는 swkoo-portfolio에 commit, ArgoCD가 ~5분 내 라이브로.',
  },
] as const;

export const trust = {
  title: '이 인프라는 다 들여다볼 수 있습니다',
  description:
    '운영 콘솔(Observatory)에서 배포 파이프라인·활성 알람·MTTR을 실시간에 가깝게 추적합니다. 지금 운영 중인 클러스터 상태도 그대로 노출되어 있어요.',
} as const;

export const builders = {
  title: '운영자 입장 — 어떻게 만들어졌나',
  description: '단일 노드 k3s 위의 GitOps 풀스택. 격리와 관측은 운영자 책임으로 명시.',
  bullets: [
    'OCI A1.Flex (4 OCPU · 24GB · ARM64) 단일 노드 k3s',
    'Argo CD + ApplicationSet + Image Updater (digest 자동 추적)',
    'cert-manager DNS-01 wildcard + per-app TLS',
    'per-tenant ResourceQuota · LimitRange · NetworkPolicy',
    'Prometheus + Alertmanager → Discord/백엔드 이벤트 스토어',
  ],
} as const;

export const liveStatus = {
  healthyLabel: 'Healthy',
  alertsLabel: '활성 알람',
  fetchFailed: '상태를 불러오지 못했습니다.',
} as const;
