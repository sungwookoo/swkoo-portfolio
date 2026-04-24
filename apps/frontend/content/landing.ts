export const hero = {
  eyebrow: '운영 플랫폼',
  title: 'Observatory',
  tagline: '운영 중심 DevOps 플랫폼',
  description:
    'GitOps 기반 배포 흐름과 런타임 관측을 연결해 단일 운영자가 서비스의 상태를 빠르게 판단할 수 있는 운영 신호를 만든다.',
  highlights: [
    'OCI IaaS 기반',
    'Self-managed Kubernetes (k3s) 운영',
    'Managed Kubernetes / Cloud Monitoring 미사용',
    '단일 운영자 기준 설계',
  ],
} as const;

export const liveStatusBanner = {
  trailingLabel: '파이프라인 정상',
  description: '운영 중인 파이프라인 동기화/헬스 상태',
  cta: 'Observatory 보기 →',
} as const;

export const environmentDefinition = {
  title: '운영 환경 정의',
  subtitle: '직접 책임지는 영역과 의도적으로 배제한 영역을 명확히 구분',
  rows: [
    {
      category: 'Infrastructure',
      used: 'OCI Compute (VM), OCI Container Registry',
      unused: '-',
    },
    {
      category: 'Container Platform',
      used: 'Kubernetes (k3s, self-managed)',
      unused: 'Managed Kubernetes (OKE/EKS/GKE)',
    },
    {
      category: 'CI/CD',
      used: 'GitHub Actions (CI), Argo CD (CD, GitOps)',
      unused: '클라우드 네이티브 CI 서비스',
    },
    {
      category: 'Observability',
      used: 'Prometheus, Grafana, Alertmanager',
      unused: '클라우드 네이티브 모니터링',
    },
  ],
} as const;

export const responsibilities = {
  title: '운영 책임 범위',
  subtitle: '플랫폼 운영 관점에서 직접 설계·운영하는 영역',
  groups: [
    {
      category: '플랫폼 운영 책임',
      items: [
        'OCI VM 수명주기 관리와 네트워크/보안 정책 직접 설계',
        'Terraform으로 변경 이력 관리 및 재현 가능한 인프라 운영',
        'OCI Container Registry 운영 및 이미지 정책 관리',
      ],
    },
    {
      category: '클러스터 운영',
      items: [
        'k3s 설치, 업그레이드, 장애 대응까지 단일 운영 기준 유지',
        'Ingress/TLS, 네임스페이스, 권한 구조를 직접 설계',
        '리소스 제약 환경에서 스케줄링과 용량 계획 최적화',
      ],
    },
    {
      category: '배포 흐름 표준화',
      items: [
        'GitHub Actions 기반 CI 표준 운영',
        'Argo CD로 배포 동기화와 롤백 경로 확보',
        'Kustomize로 환경별 선언형 배포 정의',
      ],
    },
    {
      category: '관측/알림 운영',
      items: [
        'Prometheus/Grafana 지표 기준 수립',
        'Alertmanager → Discord 알람 정책 운영',
        '알람 이후 대응 기준과 롤백 판단 유지',
      ],
    },
  ],
} as const;

export const infrastructureOverview = {
  title: '운영 플랫폼 개요',
  subtitle: 'Terraform + OCI + k3s 기반으로 직접 운영',
  labels: {
    cluster: '클러스터',
    gitOpsTooling: 'GitOps 도구',
    controlPlane: '운영 플랫폼 앱',
  },
  fetchFailed: '인프라 개요를 불러오지 못했습니다.',
} as const;

export const operationalGoals = {
  title: '운영 목표',
  subtitle: '지표와 배포 흐름을 하나의 판단 체계로 연결',
  items: [
    '배포 상태와 런타임 지표를 동일한 기준에서 확인',
    '알람 발생 시 롤백/대응을 즉시 결정할 수 있는 흐름 유지',
    '단일 운영자 환경에서도 반복 가능한 운영 절차 확보',
  ],
} as const;

export const featuredProject = {
  title: '핵심 기능: Pipeline Observatory',
  subtitle: '배포 흐름과 런타임 상태를 한 화면에서 판단',
  description:
    'OCI 인스턴스에서 실행 중인 애플리케이션을 파이프라인 상태와 런타임 지표로 연결해 운영 결정을 빠르게 내릴 수 있도록 만든다.',
  bullets: [
    {
      status: 'done',
      text: 'Commit → Build → Push → Sync → Deploy 흐름을 단일 타임라인으로 추적',
    },
    {
      status: 'done',
      text: 'GitHub Actions 워크플로와 Argo CD 동기화 상태 연동',
    },
    {
      status: 'done',
      text: '배포 실패/헬스 저하를 알람 흐름과 직접 연결',
    },
    {
      status: 'pending',
      text: 'Phase 3: 실시간 이벤트 스트리밍 (예정)',
    },
  ],
  liveStatusTitle: '실시간 상태',
  liveStatusBadge: '운영 중',
  ctaLabel: 'Observatory 보기 →',
  emptyState: '파이프라인 없음',
} as const;

export const contact = {
  title: '연락하기',
  subtitle: '협업이나 질문이 있으시면 언제든 연락주세요',
  emailAddress: 'sungwookoo.dev@gmail.com',
  linkedinUrl: 'https://www.linkedin.com/in/sungwookoo/',
  githubUrl: 'https://github.com/sungwookoo',
} as const;
