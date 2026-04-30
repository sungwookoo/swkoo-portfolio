export const hero = {
  emoji: '🐟',
  title: 'Pipeline Observatory',
  subtitle:
    'GitOps 파이프라인과 런타임 상태를 한 화면에서 판단하는 운영 콘솔',
} as const;

export const statsLabels = {
  totalPipelines: '총 파이프라인',
  healthy: '정상',
  synced: '동기화 완료',
  lastUpdatedPrefix: '마지막 업데이트:',
} as const;

export const alerts = {
  title: '활성 알람',
  subtitle: 'Alertmanager로부터 현재 발화 중인 알람 목록',
  empty: '현재 활성 알람 없음',
  unconfigured: 'Alertmanager 자격 증명이 설정되지 않았습니다.',
  unconfiguredHint:
    '백엔드 환경 변수 ALERTMANAGER_BASE_URL 을 지정하면 활성 알람이 여기 표시됩니다.',
  severityLabel: {
    critical: 'Critical',
    warning: 'Warning',
    info: 'Info',
    unknown: 'Unknown',
  },
  pipelineCardBadge: '알람',
  consoleLink: {
    label: 'Grafana 알림 목록',
    url: 'https://grafana.swkoo.kr/alerting/list',
  },
  namespaceLabel: 'namespace',
} as const;

export const deployments = {
  title: '최근 배포',
  subtitle: 'Argo CD 동기화 이력에 GitHub commit 메타데이터를 결합',
  empty: '아직 배포 이력이 없습니다',
  unconfigured: 'Argo CD 자격 증명이 설정되지 않았습니다.',
  unconfiguredHint: '백엔드 환경 변수 ARGOCD_BASE_URL / ARGOCD_AUTH_TOKEN 을 지정해주세요.',
  stageLabel: {
    commit: 'commit',
    build: 'CI build',
    sync: 'Argo synced',
  },
  buildDuration: 'commit → ready',
} as const;

export const legend = {
  title: '상태 범례',
  sections: [
    {
      title: '파이프라인',
      items: [
        { color: 'bg-emerald-400', label: '성공' },
        { color: 'bg-rose-400', label: '실패' },
        { color: 'bg-sky-400', label: '실행 중' },
        { color: 'bg-slate-500', label: '대기' },
      ],
    },
    {
      title: '동기화',
      items: [
        { color: 'bg-emerald-400/90', label: '동기화 완료' },
        { color: 'bg-amber-400/90', label: '동기화 필요' },
      ],
    },
    {
      title: '헬스',
      items: [
        { color: 'bg-emerald-400/90', label: '정상' },
        { color: 'bg-amber-400/90', label: '저하' },
        { color: 'bg-rose-400/90', label: '미확인' },
      ],
    },
  ],
} as const;

export const emptyStates = {
  unconfiguredTitle: 'Argo CD 자격 증명이 설정되지 않았습니다.',
  unconfiguredHintPrefix: '백엔드 환경 변수',
  unconfiguredHintEnvVars: ['ARGOCD_BASE_URL', 'ARGOCD_AUTH_TOKEN'] as const,
  unconfiguredHintSuffix: '을 지정해주세요.',
  noPipelinesTitle: '파이프라인이 아직 없습니다',
  noPipelinesHint: 'Argo CD에 Application을 추가하면 여기에 표시됩니다.',
} as const;

export const problemDefinition = {
  title: '문제 정의',
  subtitle: '운영 판단 속도를 떨어뜨리는 실무 문제를 기준으로 설계했다.',
  statements: [
    '서비스 수가 늘면서 CI/CD 파이프라인이 분산되어 전체 상태 파악이 느려진다.',
    '장애 발생 시 배포 상태와 런타임 지표가 분리되어 원인 추적 시간이 길어진다.',
    '단일 운영자 환경에서 수동 확인이 늘어나면 운영 리스크가 커진다.',
  ],
} as const;

export const designPrinciples = {
  title: '설계 원칙',
  subtitle: '단일 운영자 환경에서 실제로 유지 가능한 기준을 선택했다.',
  principles: [
    {
      title: 'Git 기반 운영',
      description:
        '배포 상태와 변경 이력을 Git으로 고정해 추적과 롤백을 단순화한다.',
    },
    {
      title: '수동 작업 최소화',
      description:
        '빌드, 배포, 동기화를 자동화해 한 명이 여러 서비스를 운영할 수 있게 한다.',
    },
    {
      title: '빠른 원인 분석',
      description:
        '파이프라인 상태와 런타임 지표를 한 화면에서 연결해 MTTR을 줄인다.',
    },
    {
      title: '자원 제약 고려',
      description:
        '단일 노드 환경을 전제로 알람 기준과 리소스 정책을 보수적으로 설계한다.',
    },
    {
      title: '표준화된 배포 경로',
      description:
        '서비스별 편차를 허용하지 않고 동일한 배포 경로로 운영 안정성을 확보한다.',
    },
  ],
} as const;

export const architecture = {
  title: '아키텍처 및 데이터 흐름',
  subtitle: '코드 변경부터 운영 알람까지 이어지는 흐름을 기준으로 설명한다.',
  dataFlow: {
    title: '데이터/이벤트 흐름',
    steps: [
      '코드 변경이 GitHub Actions를 트리거해 테스트와 빌드를 수행한다.',
      '이미지는 OCI Container Registry로 푸시되고 태그가 갱신된다.',
      'Argo CD가 Git 상태를 감시해 동기화한다.',
      'k3s 클러스터의 Deployment가 업데이트되고 런타임이 변경된다.',
      'Prometheus가 지표를 수집하고 Grafana에서 운영 지표를 시각화한다.',
    ],
  },
  failureFlow: {
    title: '실패/알림 흐름',
    steps: [
      'CI 실패 시 이미지가 생성되지 않아 배포가 진행되지 않는다.',
      '동기화 실패 또는 헬스 저하 시 Alertmanager가 Discord로 알림을 전달한다.',
      '알림 수신 후 최근 배포를 롤백하거나 로그/지표를 기반으로 원인을 판단한다.',
    ],
  },
} as const;

export const cicdScenarios = {
  title: 'CI/CD 운영 시나리오',
  subtitle: '운영 시나리오 중심으로 자동화 범위를 정의했다.',
  scenarios: [
    {
      title: 'PR 머지 시 자동 실행',
      description:
        '테스트 → 빌드 → 이미지 푸시 → 매니페스트 반영 후 Argo CD 동기화가 수행된다.',
    },
    {
      title: '실패 시 중단 지점',
      description:
        'CI 실패 시 이미지 생성이 중단되고, CD 실패 시 동기화 상태가 OutOfSync로 유지된다.',
    },
    {
      title: '롤백 방식',
      description:
        'Git revert 또는 Argo CD의 이전 리비전 동기화로 즉시 복구한다.',
    },
    {
      title: '배포 후 모니터링',
      description:
        'Prometheus 지표와 Alertmanager 알람이 배포 직후 상태를 검증한다.',
    },
  ],
} as const;

export const observability = {
  title: '관측',
  subtitle:
    'Prometheus/Grafana 기반으로 알람 기준을 직접 정의하고, Alertmanager → Discord로 전달한다.',
  metrics: {
    title: '주요 지표',
    items: [
      'API 5xx 오류율과 P95 응답 지연',
      'Pod 재시작 횟수, CPU/메모리 사용률',
      'Argo CD Sync/Health 상태와 이미지 태그',
    ],
  },
  alerts: {
    title: '알람 기준',
    items: [
      '5xx 오류율 2% 이상 2분 지속',
      'Pod 재시작 10분 내 3회 이상',
      'Argo CD OutOfSync 5분 이상 지속',
    ],
  },
  runbook: {
    title: '운영 판단',
    items: [
      '배포 직후 오류율 상승 시 직전 이미지로 롤백',
      '재시작이 반복되면 의존성/리소스 설정을 우선 점검',
      'Sync 불일치가 길어지면 매니페스트 변경 사항을 재검증',
    ],
  },
  alertRuleExample: {
    caption: 'Alertmanager 규칙 예시 (swkoo-application-alerts)',
    yaml: `- alert: SwkooBackendHighErrorRate
  expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.02
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "백엔드 5xx 오류율 상승"
    runbook: "최근 배포 롤백 또는 인그레스 로그 확인"`,
  },
} as const;

export const tradeOffs = {
  title: '트레이드오프',
  subtitle: '선택하지 않은 옵션과 감수한 리스크를 명확히 기록한다.',
  items: [
    {
      title: '고가용성(HA) 미구현',
      reason: '단일 노드 환경에서 운영 복잡도 대비 효과가 낮아 제외했다.',
      risk: '노드 장애 시 서비스 중단을 감수한다.',
    },
    {
      title: 'Managed Kubernetes 미사용',
      reason: '직접 운영 범위를 명확히 하고 비용을 통제하기 위해서다.',
      risk: '업그레이드/보안 패치 책임이 운영자에게 집중된다.',
    },
    {
      title: '단일 클러스터 전략',
      reason: '리소스 제약과 운영 복잡도 최소화를 우선했다.',
      risk: '테넌트 간 자원 격리 한계가 존재한다.',
    },
    {
      title: 'Cloud Monitoring 미사용',
      reason: '관측 스택을 직접 운영해 알람 기준을 주도하기 위해서다.',
      risk: '알람 튜닝과 노이즈 감소 책임을 감수한다.',
    },
  ],
} as const;
