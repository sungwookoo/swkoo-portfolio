import type { Metadata } from 'next';
import clsx from 'clsx';

import { fetchPipelines, fetchWorkflows } from '@/lib/api';
import { PipelineCard } from '@/components/PipelineCard';
import { ArchitectureDiagram } from '@/components/ArchitectureDiagram';
import {
  architecture,
  cicdScenarios,
  designPrinciples,
  emptyStates,
  hero,
  legend,
  observability,
  problemDefinition,
  statsLabels,
  tradeOffs,
} from '@/content/observatory';

export const metadata: Metadata = {
  title: 'Observatory — swkoo.kr',
  description:
    'GitOps 파이프라인과 런타임 상태를 한 화면에서 판단하도록 설계된 운영 대시보드.',
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

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={clsx('inline-flex size-2 rounded-full', color)}></span>
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
          <span className="text-4xl">{hero.emoji}</span>
          <div>
            <h1 className="text-3xl font-bold text-slate-50">{hero.title}</h1>
            <p className="text-slate-400">{hero.subtitle}</p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      {pipelinesConfigured && pipelines.length > 0 && (
        <section className="flex flex-wrap gap-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
            <p className="text-2xl font-bold text-slate-100">{pipelines.length}</p>
            <p className="text-xs text-slate-500">{statsLabels.totalPipelines}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
            <p className="text-2xl font-bold text-emerald-400">
              {pipelines.filter((p) => p.healthStatus === 'Healthy').length}
            </p>
            <p className="text-xs text-slate-500">{statsLabels.healthy}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
            <p className="text-2xl font-bold text-emerald-400">
              {pipelines.filter((p) => p.syncStatus === 'Synced').length}
            </p>
            <p className="text-xs text-slate-500">{statsLabels.synced}</p>
          </div>
          {pipelinesFetchedAt && (
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
              <p className="text-xs text-slate-500">
                {statsLabels.lastUpdatedPrefix} {pipelinesFetchedAt}
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
            <p className="font-semibold text-slate-200">{legend.title}</p>
            <div className="mt-3 space-y-4">
              {legend.sections.map((section) => (
                <div key={section.title}>
                  <p className="text-xs uppercase tracking-widest text-slate-500">
                    {section.title}
                  </p>
                  <ul className="mt-2 space-y-2 text-slate-300">
                    {section.items.map((item) => (
                      <LegendItem
                        key={`${section.title}-${item.label}`}
                        color={item.color}
                        label={item.label}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Pipeline Cards */}
        <section className="space-y-6">
          {!pipelinesConfigured ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
              <p className="text-lg text-slate-400">
                {emptyStates.unconfiguredTitle}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {emptyStates.unconfiguredHintPrefix}{' '}
                <code className="rounded bg-slate-800 px-1 py-0.5 text-xs text-slate-200">
                  {emptyStates.unconfiguredHintEnvVars[0]}
                </code>{' '}
                과{' '}
                <code className="rounded bg-slate-800 px-1 py-0.5 text-xs text-slate-200">
                  {emptyStates.unconfiguredHintEnvVars[1]}
                </code>
                {emptyStates.unconfiguredHintSuffix}
              </p>
            </div>
          ) : pipelines.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
              <p className="text-lg text-slate-400">
                {emptyStates.noPipelinesTitle}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {emptyStates.noPipelinesHint}
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
          <h2 className="text-xl font-semibold text-slate-100">
            {problemDefinition.title}
          </h2>
          <p className="text-sm text-slate-400">{problemDefinition.subtitle}</p>
        </div>
        <ul className="space-y-2 text-sm text-slate-300">
          {problemDefinition.statements.map((statement) => (
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
          <h2 className="text-xl font-semibold text-slate-100">
            {designPrinciples.title}
          </h2>
          <p className="text-sm text-slate-400">{designPrinciples.subtitle}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {designPrinciples.principles.map((principle) => (
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
            {architecture.title}
          </h2>
          <p className="text-sm text-slate-400">{architecture.subtitle}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <ArchitectureDiagram />
          </div>
          <div className="space-y-5 text-sm text-slate-300">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                {architecture.dataFlow.title}
              </h3>
              <ol className="mt-2 space-y-2 text-slate-400">
                {architecture.dataFlow.steps.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="text-emerald-400">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                {architecture.failureFlow.title}
              </h3>
              <ul className="mt-2 space-y-2 text-slate-400">
                {architecture.failureFlow.steps.map((step) => (
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
            {cicdScenarios.title}
          </h2>
          <p className="text-sm text-slate-400">{cicdScenarios.subtitle}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {cicdScenarios.scenarios.map((scenario) => (
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
          <h2 className="text-xl font-semibold text-slate-100">
            {observability.title}
          </h2>
          <p className="text-sm text-slate-400">{observability.subtitle}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h3 className="text-sm font-semibold text-emerald-400">
              {observability.metrics.title}
            </h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-300">
              {observability.metrics.items.map((metric) => (
                <li key={metric} className="flex items-start gap-2">
                  <span className="mt-2 size-1.5 rounded-full bg-emerald-400" />
                  <span>{metric}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h3 className="text-sm font-semibold text-emerald-400">
              {observability.alerts.title}
            </h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-300">
              {observability.alerts.items.map((alert) => (
                <li key={alert} className="flex items-start gap-2">
                  <span className="mt-2 size-1.5 rounded-full bg-rose-400" />
                  <span>{alert}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h3 className="text-sm font-semibold text-emerald-400">
              {observability.runbook.title}
            </h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-300">
              {observability.runbook.items.map((step) => (
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
            {observability.alertRuleExample.caption}
          </p>
          <pre className="mt-3 whitespace-pre-wrap text-xs text-slate-200">
{observability.alertRuleExample.yaml}
          </pre>
        </div>
      </section>

      {/* Trade-offs Section */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-100">
            {tradeOffs.title}
          </h2>
          <p className="text-sm text-slate-400">{tradeOffs.subtitle}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {tradeOffs.items.map((item) => (
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
