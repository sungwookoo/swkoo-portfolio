import clsx from 'clsx';
import type { PipelineSummary, WorkflowsEnvelope } from '@/lib/types';
import { PipelineTimeline } from './PipelineTimeline';
import { WorkflowRunList } from './WorkflowRunList';

interface PipelineCardProps {
  pipeline: PipelineSummary;
  workflowsEnvelope: WorkflowsEnvelope;
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

function formatTimestamp(timestamp: string | null | undefined) {
  if (!timestamp) return null;

  try {
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(timestamp));
  } catch {
    return timestamp;
  }
}

export function PipelineCard({ pipeline, workflowsEnvelope }: PipelineCardProps) {
  const latestRun = workflowsEnvelope.runs[0] ?? null;

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-inner shadow-slate-900/40">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{pipeline.name}</h3>
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
            {pipeline.syncStatus}
          </span>
          <span
            className={clsx(
              'rounded-full px-3 py-1 font-medium uppercase tracking-wide',
              resolveBadgeClass(pipeline.healthStatus, 'health')
            )}
          >
            {pipeline.healthStatus}
          </span>
        </div>
      </header>

      {/* Timeline */}
      <div className="mb-6">
        <PipelineTimeline pipeline={pipeline} latestRun={latestRun} />
      </div>

      {/* Workflow Runs */}
      {workflowsEnvelope.configured && (
        <div className="mb-6">
          <WorkflowRunList runs={workflowsEnvelope.runs} workflows={workflowsEnvelope.workflows} />
        </div>
      )}

      {/* Pipeline Details */}
      <dl className="grid gap-3 text-xs text-slate-400 sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-300">Revision</dt>
          <dd className="mt-1 font-mono text-[11px] text-slate-400">
            {pipeline.revision ?? 'N/A'}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-300">Target</dt>
          <dd className="mt-1 text-slate-400">{pipeline.targetRevision ?? 'HEAD'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-300">Last Synced</dt>
          <dd className="mt-1 text-slate-400">{formatTimestamp(pipeline.lastSyncedAt) ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-300">Last Deployed</dt>
          <dd className="mt-1 text-slate-400">
            {formatTimestamp(pipeline.lastDeployedAt) ?? '—'}
          </dd>
        </div>
      </dl>

      {pipeline.repoUrl && (
        <p className="mt-4 text-xs text-slate-500">
          Repo:{' '}
          <a
            href={pipeline.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-slate-300 hover:text-slate-100"
          >
            {pipeline.repoUrl}
          </a>
        </p>
      )}
    </article>
  );
}

