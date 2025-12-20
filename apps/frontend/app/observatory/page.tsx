import type { Metadata } from 'next';
import clsx from 'clsx';

import { fetchPipelines, fetchWorkflows } from '@/lib/api';
import { PipelineCard } from '@/components/PipelineCard';

export const metadata: Metadata = {
  title: 'Observatory — swkoo.kr',
  description:
    'Real-time pipeline monitoring dashboard. Watch your GitOps workflows from commit to deploy.',
};

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
              어항처럼 투명하게, 모든 파이프라인을 실시간으로 관찰합니다.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      {pipelinesConfigured && pipelines.length > 0 && (
        <section className="flex flex-wrap gap-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
            <p className="text-2xl font-bold text-slate-100">{pipelines.length}</p>
            <p className="text-xs text-slate-500">Total Pipelines</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
            <p className="text-2xl font-bold text-emerald-400">
              {pipelines.filter((p) => p.healthStatus === 'Healthy').length}
            </p>
            <p className="text-xs text-slate-500">Healthy</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
            <p className="text-2xl font-bold text-emerald-400">
              {pipelines.filter((p) => p.syncStatus === 'Synced').length}
            </p>
            <p className="text-xs text-slate-500">Synced</p>
          </div>
          {pipelinesFetchedAt && (
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
              <p className="text-xs text-slate-500">
                Last updated: {pipelinesFetchedAt}
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
            <p className="font-semibold text-slate-200">Status Legend</p>
            <div className="mt-3 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">
                  Pipeline
                </p>
                <ul className="mt-2 space-y-2 text-slate-300">
                  {[
                    buildLegendItem('bg-emerald-400', 'Success'),
                    buildLegendItem('bg-rose-400', 'Failure'),
                    buildLegendItem('bg-sky-400', 'Running'),
                    buildLegendItem('bg-slate-500', 'Pending'),
                  ]}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">
                  Sync
                </p>
                <ul className="mt-2 space-y-2 text-slate-300">
                  {[
                    buildLegendItem('bg-emerald-400/90', 'Synced'),
                    buildLegendItem('bg-amber-400/90', 'OutOfSync'),
                  ]}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">
                  Health
                </p>
                <ul className="mt-2 space-y-2 text-slate-300">
                  {[
                    buildLegendItem('bg-emerald-400/90', 'Healthy'),
                    buildLegendItem('bg-amber-400/90', 'Degraded'),
                    buildLegendItem('bg-rose-400/90', 'Missing'),
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
                🐟 어항이 비어있습니다
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
    </main>
  );
}

