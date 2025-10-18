import clsx from 'clsx';

import { fetchOverview, fetchPipelines } from '@/lib/api';

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6 space-y-2">
      <h2 className="text-2xl font-semibold text-slate-50">{title}</h2>
      {subtitle ? <p className="text-sm text-slate-400">{subtitle}</p> : null}
    </header>
  );
}

function formatTimestamp(timestamp: string | null | undefined) {
  if (!timestamp) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(timestamp));
  } catch (error) {
    console.warn('Failed to format timestamp', error);
    return timestamp;
  }
}

function resolveBadgeClass(status: string, type: 'sync' | 'health'): string {
  const normalized = status.toLowerCase();

  if (type === 'sync') {
    if (normalized === 'synced') return 'bg-emerald-400/90 text-emerald-950';
    if (normalized === 'outofsync') return 'bg-amber-400/90 text-amber-950';
    if (normalized === 'unknown') return 'bg-slate-500/80 text-slate-900';
    return 'bg-sky-400/90 text-sky-950';
  }

  if (normalized === 'healthy') return 'bg-emerald-400/90 text-emerald-950';
  if (normalized === 'degraded') return 'bg-amber-400/90 text-amber-950';
  if (normalized === 'progressing') return 'bg-sky-400/90 text-sky-950';
  if (normalized === 'missing') return 'bg-rose-400/90 text-rose-950';
  return 'bg-slate-500/80 text-slate-900';
}

function buildLegendItem(colorClass: string, label: string) {
  return (
    <li key={label} className="flex items-center gap-2">
      <span className={clsx('inline-flex size-2 rounded-full', colorClass)}></span>
      {label}
    </li>
  );
}

export default async function Home() {
  const [overview, pipelinesEnvelope] = await Promise.all([fetchOverview(), fetchPipelines()]);
  const pipelinesConfigured = pipelinesEnvelope.configured;
  const pipelines = pipelinesEnvelope.pipelines;
  const pipelinesFetchedAt = formatTimestamp(pipelinesEnvelope.fetchedAt);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-12 px-6 py-16">
      <section className="space-y-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/40 p-10 shadow-xl shadow-slate-900/60">
        <p className="text-sm uppercase tracking-[0.4rem] text-slate-500">Sungwoo Koo</p>
        <h1 className="text-4xl font-bold text-slate-50 sm:text-5xl">
          GitOps-first Infrastructure Playground
        </h1>
        <p className="max-w-2xl text-lg text-slate-300">
          swkoo.kr은 개인 K3s 클러스터 위에서 GitOps 파이프라인을 실험하고 전시하기 위한 포트폴리오
          공간입니다. Argo CD, Portainer, Grafana, 사설 Registry로 구성된 제어면(Control Plane)을
          통해 애플리케이션을 선언형으로 운영합니다.
        </p>
        <div className="flex flex-wrap gap-3 text-sm text-slate-400">
          <span className="rounded-full border border-slate-700 px-3 py-1">K3s · OCI</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">GitOps · Argo CD</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">Observability</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">Infrastructure as Code</span>
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
          <SectionTitle
            title="Infrastructure Overview"
            subtitle="Terraform + OCI + K3s로 구축한 홈 랩 환경"
          />
          {overview ? (
            <dl className="space-y-4 text-sm text-slate-300">
              <div>
                <dt className="font-semibold text-slate-200">Cluster</dt>
                <dd className="mt-1 text-slate-400">
                  {overview.infrastructure.cluster.distribution} @ {overview.infrastructure.cluster.location}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-200">GitOps Tooling</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {overview.infrastructure.cluster.gitOpsTooling.map((tool) => (
                    <span key={tool} className="rounded-md bg-slate-800 px-2 py-1">
                      {tool}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-200">Control Plane Apps</dt>
                <dd className="mt-1 grid gap-2 sm:grid-cols-2">
                  {overview.infrastructure.controlPlane.map((app) => (
                    <span key={app} className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1">
                      {app}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-slate-500">
              인프라 개요를 불러오지 못했습니다. API 연결을 확인해주세요.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
          <SectionTitle title="GitOps Vision" subtitle="swkoo.kr을 위한 파이프라인 로드맵" />
          {overview ? (
            <div className="space-y-4 text-sm text-slate-300">
              <p className="text-slate-400">{overview.gitopsVision.description}</p>
              <ol className="space-y-3 text-slate-200">
                {overview.gitopsVision.roadmap.map((item) => (
                  <li key={item} className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              GitOps 로드맵 데이터를 준비하는 중입니다. 잠시 후 다시 시도하세요.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
        <SectionTitle
          title="Pipeline Observatory (MVP)"
          subtitle="Argo CD Application 동기화 상태를 연동해 실시간에 가까운 파이프라인 타임라인을 만들 예정입니다."
        />
        <div className="grid gap-6 md:grid-cols-[minmax(0,240px),1fr]">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
            <p className="font-semibold text-slate-200">Status Legend</p>
            <div className="mt-3 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">Sync</p>
                <ul className="mt-2 space-y-2 text-slate-300">
                  {[
                    buildLegendItem('bg-emerald-400/90', 'Synced'),
                    buildLegendItem('bg-amber-400/90', 'OutOfSync'),
                    buildLegendItem('bg-sky-400/90', 'Progressing'),
                    buildLegendItem('bg-slate-500/80', 'Unknown')
                  ]}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">Health</p>
                <ul className="mt-2 space-y-2 text-slate-300">
                  {[
                    buildLegendItem('bg-emerald-400/90', 'Healthy'),
                    buildLegendItem('bg-amber-400/90', 'Degraded'),
                    buildLegendItem('bg-sky-400/90', 'Progressing'),
                    buildLegendItem('bg-rose-400/90', 'Missing')
                  ]}
                </ul>
              </div>
            </div>
            {pipelinesFetchedAt ? (
              <p className="mt-4 text-xs text-slate-500">최근 갱신: {pipelinesFetchedAt}</p>
            ) : null}
          </div>

          <div className="rounded-xl border border-dashed border-slate-800 p-6 text-sm text-slate-300">
            {!pipelinesConfigured ? (
              <div className="space-y-3 text-slate-400">
                <p>
                  아직 Argo CD 자격 증명이 설정되지 않았습니다. 백엔드 환경 변수
                  <code className="mx-1 rounded bg-slate-800 px-1 py-0.5 text-xs text-slate-200">
                    ARGOCD_BASE_URL
                  </code>
                  과
                  <code className="mx-1 rounded bg-slate-800 px-1 py-0.5 text-xs text-slate-200">
                    ARGOCD_AUTH_TOKEN
                  </code>
                  을 지정하면 파이프라인이 표시됩니다.
                </p>
                <p className="text-xs text-slate-500">
                  (Terraform/Argo CD에서 서비스 계정을 발급한 뒤 Kubernetes Secret로 주입하세요.)
                </p>
              </div>
            ) : pipelines.length === 0 ? (
              <div className="space-y-3 text-slate-400">
                <p>아직 추적 중인 Argo CD Application이 없습니다.</p>
                <p className="text-xs text-slate-500">
                  첫 애플리케이션을 GitOps 파이프라인에 연결하면 여기에서 실시간 상태를 볼 수 있습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pipelines.map((pipeline) => (
                  <article
                    key={pipeline.name}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-4 shadow-inner shadow-slate-900/40"
                  >
                    <header className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-100">{pipeline.name}</h3>
                        <p className="text-xs uppercase tracking-widest text-slate-500">
                          {pipeline.project}
                          {pipeline.namespace ? ` · ${pipeline.namespace}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span
                          className={clsx(
                            'rounded-full px-3 py-1 font-medium uppercase tracking-wide',
                            resolveBadgeClass(pipeline.syncStatus, 'sync')
                          )}
                        >
                          Sync: {pipeline.syncStatus}
                        </span>
                        <span
                          className={clsx(
                            'rounded-full px-3 py-1 font-medium uppercase tracking-wide',
                            resolveBadgeClass(pipeline.healthStatus, 'health')
                          )}
                        >
                          Health: {pipeline.healthStatus}
                        </span>
                      </div>
                    </header>
                    <dl className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-2">
                      <div>
                        <dt className="font-semibold text-slate-300">Revision</dt>
                        <dd className="mt-1 font-mono text-[11px] text-slate-400">
                          {pipeline.revision ?? 'N/A'}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-300">Target</dt>
                        <dd className="mt-1 text-slate-400">
                          {pipeline.targetRevision ?? 'HEAD'}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-300">Last Synced</dt>
                        <dd className="mt-1 text-slate-400">
                          {formatTimestamp(pipeline.lastSyncedAt) ?? '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-300">Last Deployed</dt>
                        <dd className="mt-1 text-slate-400">
                          {formatTimestamp(pipeline.lastDeployedAt) ?? '—'}
                        </dd>
                      </div>
                    </dl>
                    {pipeline.repoUrl ? (
                      <p className="mt-4 text-xs text-slate-500">
                        Repo: <span className="font-mono text-slate-300">{pipeline.repoUrl}</span>
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
