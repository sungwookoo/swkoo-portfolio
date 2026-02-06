import type { Metadata } from 'next';
import clsx from 'clsx';

import { fetchPipelines, fetchWorkflows } from '@/lib/api';
import { PipelineCard } from '@/components/PipelineCard';
import { ArchitectureDiagram } from '@/components/ArchitectureDiagram';

export const metadata: Metadata = {
  title: 'Observatory — swkoo.kr',
  description:
    'GitOps 파이프라인과 런타임 상태를 한 화면에서 판단하도록 설계된 운영 대시보드.',
};

const problemStatements = [
  '서비스 수가 늘면서 CI/CD 파이프라인이 분산되어 전체 상태 파악이 느려진다.',
  '장애 발생 시 배포 상태와 런타임 지표가 분리되어 원인 추적 시간이 길어진다.',
  '단일 운영자 환경에서 수동 확인이 늘어나면 운영 리스크가 커진다.',
];

const designPrinciples = [
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
];

const dataFlow = [
  '코드 변경이 GitHub Actions를 트리거해 테스트와 빌드를 수행한다.',
  '이미지는 OCI Container Registry로 푸시되고 태그가 갱신된다.',
  'Argo CD가 Git 상태를 감시해 동기화한다.',
  'k3s 클러스터의 Deployment가 업데이트되고 런타임이 변경된다.',
  'Prometheus가 지표를 수집하고 Grafana에서 운영 지표를 시각화한다.',
];

const failureFlow = [
  'CI 실패 시 이미지가 생성되지 않아 배포가 진행되지 않는다.',
  '동기화 실패 또는 헬스 저하 시 Alertmanager가 Discord로 알림을 전달한다.',
  '알림 수신 후 최근 배포를 롤백하거나 로그/지표를 기반으로 원인을 판단한다.',
];

const cicdScenarios = [
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
];

const observabilityMetrics = [
  'API 5xx 오류율과 P95 응답 지연',
  'Pod 재시작 횟수, CPU/메모리 사용률',
  'Argo CD Sync/Health 상태와 이미지 태그',
];

const observabilityAlerts = [
  '5xx 오류율 2% 이상 2분 지속',
  'Pod 재시작 10분 내 3회 이상',
  'Argo CD OutOfSync 5분 이상 지속',
];

const runbookDecisions = [
  '배포 직후 오류율 상승 시 직전 이미지로 롤백',
  '재시작이 반복되면 의존성/리소스 설정을 우선 점검',
  'Sync 불일치가 길어지면 매니페스트 변경 사항을 재검증',
];

const tradeOffs = [
  {
    title: '고가용성(HA) 미구현',
    reason:
      '단일 노드 환경에서 운영 복잡도 대비 효과가 낮아 제외했다.',
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
];

function formatTimestamp(timestamp: string | null | undefined) {
  if (!timestamp) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(timestamp));
  } catch (error) {
    console.warn('Failed to format timestamp', error);
    return timestamp;
  }
}

function buildLegendItem(colorClass: string, label: string) {
  return (
    <li key={label} className="flex items-center gap-2">
      <span
        className={clsx('inline-flex size-2 rounded-full', colorClass)}
      ></span>
      {label}
    </li>
  );
}

export default async function ObservatoryPage() {
  const pipelinesEnvelope = await fetchPipelines();
  const pipelinesConfigured = pipelinesEnvelope.configured;
  const pipelines = pipelinesEnvelope.pipelines;
  const pipelinesFetchedAt = formatTimestamp(pipelinesEnvelope.fetchedAt);

  // Fetch workflows for each pipeline
  const workflowsMap = new Map<
    string,
    Awaited<ReturnType<typeof fetchWorkflows>>
  >();
  if (pipelinesConfigured && pipelines.length > 0) {
    const workflowsResults = await Promise.all(
      pipelines.map((p) => fetchWorkflows(p.name, { perPage: 5 }))
    );
    pipelines.forEach((p, i) => {
      workflowsMap.set(p.name, workflowsResults[i]);
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
      {/* Hero */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🐟</span>
          <div>
            <h1 className="text-3xl font-bold text-slate-50">
              Pipeline Observatory
            </h1>
            <p className="text-slate-400">
              GitOps 파이프라인과 런타임 상태를 한 화면에서 판단하는 운영 콘솔
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      {pipelinesConfigured && pipelines.length > 0 && (
        <section className="flex flex-wrap gap-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
            <p className="text-2xl font-bold text-slate-100">{pipelines.length}</p>
            <p className="text-xs text-slate-500">총 파이프라인</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
            <p className="text-2xl font-bold text-emerald-400">
              {pipelines.filter((p) => p.healthStatus === 'Healthy').length}
            </p>
            <p className="text-xs text-slate-500">정상</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
            <p className="text-2xl font-bold text-emerald-400">
              {pipelines.filter((p) => p.syncStatus === 'Synced').length}
            </p>
            <p className="text-xs text-slate-500">동기화 완료</p>
          </div>
          {pipelinesFetchedAt && (
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
              <p className="text-xs text-slate-500">
                마지막 업데이트: {pipelinesFetchedAt}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,200px),1fr]">
        {/* Sidebar - Legend */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
            <p className="font-semibold text-slate-200">상태 범례</p>
            <div className="mt-3 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">
                  파이프라인
                </p>
                <ul className="mt-2 space-y-2 text-slate-300">
                  {[
                    buildLegendItem('bg-emerald-400', '성공'),
                    buildLegendItem('bg-rose-400', '실패'),
                    buildLegendItem('bg-sky-400', '실행 중'),
                    buildLegendItem('bg-slate-500', '대기'),
                  ]}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">
                  동기화
                </p>
                <ul className="mt-2 space-y-2 text-slate-300">
                  {[
                    buildLegendItem('bg-emerald-400/90', '동기화 완료'),
                    buildLegendItem('bg-amber-400/90', '동기화 필요'),
                  ]}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">
                  헬스
                </p>
                <ul className="mt-2 space-y-2 text-slate-300">
                  {[
                    buildLegendItem('bg-emerald-400/90', '정상'),
                    buildLegendItem('bg-amber-400/90', '저하'),
                    buildLegendItem('bg-rose-400/90', '미확인'),
                  ]}
                </ul>
              </div>
            </div>
          </div>
        </aside>

        {/* Pipeline Cards */}
        <section className="space-y-6">
          {!pipelinesConfigured ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
              <p className="text-lg text-slate-400">
                Argo CD 자격 증명이 설정되지 않았습니다.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                백엔드 환경 변수{' '}
                <code className="rounded bg-slate-800 px-1 py-0.5 text-xs text-slate-200">
                  ARGOCD_BASE_URL
                </code>{' '}
                과{' '}
                <code className="rounded bg-slate-800 px-1 py-0.5 text-xs text-slate-200">
                  ARGOCD_AUTH_TOKEN
                </code>
                을 지정해주세요.
              </p>
            </div>
          ) : pipelines.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
              <p className="text-lg text-slate-400">
                파이프라인이 아직 없습니다
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Argo CD에 Application을 추가하면 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            pipelines.map((pipeline) => (
              <PipelineCard
                key={pipeline.name}
                pipeline={pipeline}
                workflowsEnvelope={
                  workflowsMap.get(pipeline.name) ?? {
                    configured: false,
                    repoUrl: null,
                    workflows: [],
                    runs: [],
                    pagination: { page: 1, perPage: 10, total: 0 },
                  }
                }
              />
            ))
          )}
        </section>
      </div>

      {/* Problem Definition */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-100">문제 정의</h2>
          <p className="text-sm text-slate-400">
            운영 판단 속도를 떨어뜨리는 실무 문제를 기준으로 설계했다.
          </p>
        </div>
        <ul className="space-y-2 text-sm text-slate-300">
          {problemStatements.map((statement) => (
            <li key={statement} className="flex items-start gap-2">
              <span className="mt-2 size-1.5 rounded-full bg-emerald-400" />
              <span>{statement}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Design Principles */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-100">설계 원칙</h2>
          <p className="text-sm text-slate-400">
            단일 운영자 환경에서 실제로 유지 가능한 기준을 선택했다.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {designPrinciples.map((principle) => (
            <div
              key={principle.title}
              className="rounded-xl border border-slate-800 bg-slate-950 p-4"
            >
              <h3 className="text-sm font-semibold text-emerald-400">
                {principle.title}
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture Section */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-100">
            아키텍처 및 데이터 흐름
          </h2>
          <p className="text-sm text-slate-400">
            코드 변경부터 운영 알람까지 이어지는 흐름을 기준으로 설명한다.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <ArchitectureDiagram />
          </div>
          <div className="space-y-5 text-sm text-slate-300">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                데이터/이벤트 흐름
              </h3>
              <ol className="mt-2 space-y-2 text-slate-400">
                {dataFlow.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="text-emerald-400">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                실패/알림 흐름
              </h3>
              <ul className="mt-2 space-y-2 text-slate-400">
                {failureFlow.map((step) => (
                  <li key={step} className="flex items-start gap-2">
                    <span className="mt-2 size-1.5 rounded-full bg-rose-400" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CI/CD Section */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-100">
            CI/CD 운영 시나리오
          </h2>
          <p className="text-sm text-slate-400">
            운영 시나리오 중심으로 자동화 범위를 정의했다.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {cicdScenarios.map((scenario) => (
            <div
              key={scenario.title}
              className="rounded-xl border border-slate-800 bg-slate-950 p-4"
            >
              <h3 className="text-sm font-semibold text-emerald-400">
                {scenario.title}
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                {scenario.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Observability Section */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-100">관측</h2>
          <p className="text-sm text-slate-400">
            Prometheus/Grafana 기반으로 알람 기준을 직접 정의하고, Alertmanager
            → Discord로 전달한다.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h3 className="text-sm font-semibold text-emerald-400">주요 지표</h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-300">
              {observabilityMetrics.map((metric) => (
                <li key={metric} className="flex items-start gap-2">
                  <span className="mt-2 size-1.5 rounded-full bg-emerald-400" />
                  <span>{metric}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h3 className="text-sm font-semibold text-emerald-400">알람 기준</h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-300">
              {observabilityAlerts.map((alert) => (
                <li key={alert} className="flex items-start gap-2">
                  <span className="mt-2 size-1.5 rounded-full bg-rose-400" />
                  <span>{alert}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h3 className="text-sm font-semibold text-emerald-400">운영 판단</h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-300">
              {runbookDecisions.map((step) => (
                <li key={step} className="flex items-start gap-2">
                  <span className="mt-2 size-1.5 rounded-full bg-sky-400" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Alertmanager 규칙 예시 (swkoo-application-alerts)
          </p>
          <pre className="mt-3 whitespace-pre-wrap text-xs text-slate-200">
{`- alert: SwkooBackendHighErrorRate
  expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.02
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "백엔드 5xx 오류율 상승"
    runbook: "최근 배포 롤백 또는 인그레스 로그 확인"`}
          </pre>
        </div>
      </section>

      {/* Trade-offs Section */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-100">트레이드오프</h2>
          <p className="text-sm text-slate-400">
            선택하지 않은 옵션과 감수한 리스크를 명확히 기록한다.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {tradeOffs.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-800 bg-slate-950 p-4"
            >
              <h3 className="text-sm font-semibold text-emerald-400">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-300">{item.reason}</p>
              <p className="mt-2 text-sm text-slate-500">리스크: {item.risk}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
