import clsx from 'clsx';

import type {
  Alert,
  AlertSeverity,
  DeploymentLifecycle,
  DeploymentsEnvelope,
  DeploymentStage,
  EventSummary,
  PipelineSummary,
  WorkflowsEnvelope,
} from '@/lib/types';
import { alerts as alertsContent } from '@/content/observatory';

import { DeploymentList } from './DeploymentList';
import { PipelineCard } from './PipelineCard';

interface PipelineSectionProps {
  pipeline: PipelineSummary;
  workflowsEnvelope: WorkflowsEnvelope;
  deploymentsEnvelope: DeploymentsEnvelope | undefined;
  eventSummary: EventSummary | null;
  relatedAlerts: Alert[];
}

function highestSeverity(alerts: Alert[]): AlertSeverity {
  const order: AlertSeverity[] = ['critical', 'warning', 'info', 'unknown'];
  for (const sev of order) {
    if (alerts.some((a) => a.severity === sev)) return sev;
  }
  return 'unknown';
}

function alertBadgeClass(topSeverity: AlertSeverity): string {
  switch (topSeverity) {
    case 'critical':
      return 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30';
    case 'warning':
      return 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30';
    case 'info':
      return 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30';
    default:
      return 'bg-slate-600/20 text-slate-300 ring-1 ring-slate-600/30';
  }
}

function statusBadgeClass(status: string, kind: 'sync' | 'health'): string {
  const normalized = status.toLowerCase();
  if (kind === 'sync') {
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

function formatRelative(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const delta = Math.floor((Date.now() - t) / 1000);
  if (delta < 60) return `${delta}초 전`;
  if (delta < 3600) return `${Math.floor(delta / 60)}분 전`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}시간 전`;
  return `${Math.floor(delta / 86400)}일 전`;
}

function formatDuration(seconds: number | null): string | null {
  if (seconds === null || seconds < 0) return null;
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

function shouldDefaultOpen(
  pipeline: PipelineSummary,
  alerts: Alert[],
  latest: DeploymentLifecycle | undefined
): boolean {
  if (alerts.length > 0) return true;
  if (pipeline.syncStatus.toLowerCase() !== 'synced') return true;
  if (pipeline.healthStatus.toLowerCase() !== 'healthy') return true;
  if (latest && latest.events.some((e) => e.status === 'failure')) return true;
  return false;
}

function MiniTimeline({ deployment }: { deployment: DeploymentLifecycle | undefined }) {
  const stages: { id: DeploymentStage; label: string }[] = [
    { id: 'commit', label: 'commit' },
    { id: 'build', label: 'build' },
    { id: 'sync', label: 'sync' },
  ];
  return (
    <span
      className="inline-flex items-center gap-1.5"
      aria-label="latest deployment stages"
    >
      {stages.map((s, i) => {
        const event = deployment?.events.find((e) => e.stage === s.id);
        const color = !event
          ? 'bg-slate-700'
          : event.status === 'failure'
          ? 'bg-rose-400'
          : event.status === 'in_progress'
          ? 'bg-amber-400 animate-pulse'
          : 'bg-emerald-400';
        return (
          <span key={s.id} className="inline-flex items-center gap-1.5">
            <span
              className={clsx('size-1.5 rounded-full', color)}
              title={`${s.label}: ${event?.status ?? 'pending'}`}
            />
            {i < stages.length - 1 && (
              <span className="h-px w-3 bg-slate-700" aria-hidden />
            )}
          </span>
        );
      })}
    </span>
  );
}

export function PipelineSection({
  pipeline,
  workflowsEnvelope,
  deploymentsEnvelope,
  eventSummary,
  relatedAlerts,
}: PipelineSectionProps) {
  const latestDeployment = deploymentsEnvelope?.deployments[0];
  const open = shouldDefaultOpen(pipeline, relatedAlerts, latestDeployment);
  const alertCount = relatedAlerts.length;
  const topSeverity = alertCount > 0 ? highestSeverity(relatedAlerts) : 'unknown';
  const relative = formatRelative(
    latestDeployment?.endedAt ?? latestDeployment?.startedAt ?? pipeline.lastDeployedAt
  );
  const lastEventRelative = formatRelative(eventSummary?.lastEventAt);
  const avgInterval = formatDuration(eventSummary?.avgIntervalSeconds ?? null);
  const mttr = formatDuration(eventSummary?.mttrSeconds ?? null);
  const hasEventSignal =
    eventSummary !== null &&
    (eventSummary.deployCount > 0 ||
      eventSummary.failureCount > 0 ||
      eventSummary.lastEventAt !== null);

  return (
    <details
      open={open}
      className="group rounded-xl border border-slate-800 bg-slate-900/60 transition-colors open:bg-slate-900/80 [&>summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-5 py-4 hover:bg-slate-900/40">
        <span
          className="text-slate-500 transition-transform group-open:rotate-90"
          aria-hidden
        >
          ▶
        </span>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-base font-semibold text-slate-100">
            {pipeline.name}
          </span>
          <span className="text-[11px] uppercase tracking-widest text-slate-500">
            {pipeline.project}
            {pipeline.namespace ? ` · ${pipeline.namespace}` : ''}
          </span>
        </div>

        <MiniTimeline deployment={latestDeployment} />

        <span className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={clsx(
              'rounded-full px-2.5 py-0.5 font-medium uppercase tracking-wide',
              statusBadgeClass(pipeline.syncStatus, 'sync')
            )}
          >
            {pipeline.syncStatus}
          </span>
          <span
            className={clsx(
              'rounded-full px-2.5 py-0.5 font-medium uppercase tracking-wide',
              statusBadgeClass(pipeline.healthStatus, 'health')
            )}
          >
            {pipeline.healthStatus}
          </span>
          {alertCount > 0 && (
            <span
              className={clsx(
                'rounded-full px-2.5 py-0.5 font-medium uppercase tracking-wide',
                alertBadgeClass(topSeverity)
              )}
              title={relatedAlerts.map((a) => a.alertname).join(', ')}
            >
              ⚠ {alertCount} {alertsContent.pipelineCardBadge}
            </span>
          )}
          {relative && (
            <span className="text-slate-500">· {relative}</span>
          )}
          {hasEventSignal && eventSummary && (
            <span
              className="text-slate-500"
              title={`최근 ${eventSummary.windowDays}일 이벤트 스토어 기록`}
            >
              ·{' '}
              <span className="text-slate-300">
                {eventSummary.windowDays}일 {eventSummary.deployCount}회
              </span>
              {eventSummary.failureCount > 0 && (
                <>
                  {' '}
                  <span className="text-rose-300">
                    ⚠ {eventSummary.failureCount} 실패
                  </span>
                </>
              )}
              {avgInterval && (
                <>
                  {' · ⌀ '}
                  <span className="text-slate-300">{avgInterval}</span>
                </>
              )}
              {lastEventRelative && (
                <>
                  {' · 마지막 '}
                  <span className="text-slate-300">{lastEventRelative}</span>
                </>
              )}
            </span>
          )}
        </span>
      </summary>

      <div className="space-y-6 px-5 pb-5">
        {mttr && eventSummary && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-xs text-slate-400">
            <span aria-hidden>🛠</span>
            <span>
              최근 {eventSummary.windowDays}일 복구 평균{' '}
              <span className="text-slate-200">{mttr}</span>
              <span className="ml-2 text-slate-600">
                (실패 → 다음 성공까지)
              </span>
            </span>
          </div>
        )}
        <PipelineCard
          pipeline={pipeline}
          workflowsEnvelope={workflowsEnvelope}
          relatedAlerts={relatedAlerts}
        />
        {deploymentsEnvelope && (
          <DeploymentList
            configured={deploymentsEnvelope.configured}
            pipeline={pipeline.name}
            namespace={pipeline.namespace}
            deployments={deploymentsEnvelope.deployments}
            alerts={relatedAlerts}
          />
        )}
      </div>
    </details>
  );
}
