'use client';

import clsx from 'clsx';
import type { PipelineSummary, WorkflowRun } from '@/lib/types';

interface PipelineTimelineProps {
  pipeline: PipelineSummary;
  latestRun: WorkflowRun | null;
}

type StageStatus = 'pending' | 'running' | 'success' | 'failure';

interface TimelineStage {
  id: string;
  label: string;
  status: StageStatus;
  detail: string;
  timestamp: string | null;
}

function formatShortTimestamp(timestamp: string | null): string {
  if (!timestamp) return '—';
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  } catch {
    return '—';
  }
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function getStageStatusColor(status: StageStatus): string {
  switch (status) {
    case 'success':
      return 'bg-emerald-400';
    case 'failure':
      return 'bg-rose-400';
    case 'running':
      return 'bg-sky-400 animate-pulse';
    default:
      return 'bg-slate-500';
  }
}

function getStageStatusIcon(status: StageStatus): string {
  switch (status) {
    case 'success':
      return '✓';
    case 'failure':
      return '✗';
    case 'running':
      return '◌';
    default:
      return '○';
  }
}

export function PipelineTimeline({ pipeline, latestRun }: PipelineTimelineProps) {
  // Build timeline stages
  const stages: TimelineStage[] = buildTimelineStages(pipeline, latestRun);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
      <h4 className="mb-4 text-sm font-semibold text-slate-200">📍 Pipeline Timeline</h4>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-700" />

        {/* Stages */}
        <div className="relative flex justify-between">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className={clsx(
                'flex flex-col items-center',
                index === 0 && 'items-start',
                index === stages.length - 1 && 'items-end'
              )}
            >
              {/* Stage dot */}
              <div
                className={clsx(
                  'relative z-10 flex size-8 items-center justify-center rounded-full text-xs font-bold text-slate-900',
                  getStageStatusColor(stage.status)
                )}
              >
                {getStageStatusIcon(stage.status)}
              </div>

              {/* Stage label */}
              <div className="mt-2 text-center">
                <p className="text-xs font-medium text-slate-300">{stage.label}</p>
                <p className="mt-1 text-[10px] text-slate-500">{stage.detail}</p>
                {stage.timestamp && (
                  <p className="mt-0.5 text-[10px] text-slate-600">
                    {formatShortTimestamp(stage.timestamp)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildTimelineStages(
  pipeline: PipelineSummary,
  latestRun: WorkflowRun | null
): TimelineStage[] {
  const stages: TimelineStage[] = [];

  // 1. Commit stage
  stages.push({
    id: 'commit',
    label: 'Commit',
    status: pipeline.revision ? 'success' : 'pending',
    detail: pipeline.revision ? pipeline.revision.substring(0, 7) : '—',
    timestamp: null
  });

  // 2. Build stage (from GitHub Actions)
  if (latestRun) {
    let buildStatus: StageStatus = 'pending';
    if (latestRun.status === 'completed') {
      buildStatus = latestRun.conclusion === 'success' ? 'success' : 'failure';
    } else if (latestRun.status === 'in_progress') {
      buildStatus = 'running';
    }

    stages.push({
      id: 'build',
      label: 'Build',
      status: buildStatus,
      detail: formatDuration(latestRun.runDurationSeconds),
      timestamp: latestRun.createdAt
    });

    // 3. Push stage
    stages.push({
      id: 'push',
      label: 'Push',
      status: buildStatus === 'success' ? 'success' : buildStatus,
      detail: buildStatus === 'success' ? 'OCIR' : '—',
      timestamp: latestRun.status === 'completed' ? latestRun.updatedAt : null
    });
  } else {
    stages.push({
      id: 'build',
      label: 'Build',
      status: 'pending',
      detail: '—',
      timestamp: null
    });

    stages.push({
      id: 'push',
      label: 'Push',
      status: 'pending',
      detail: '—',
      timestamp: null
    });
  }

  // 4. Sync stage (from Argo CD)
  const syncStatus: StageStatus =
    pipeline.syncStatus.toLowerCase() === 'synced'
      ? 'success'
      : pipeline.syncStatus.toLowerCase() === 'outofsync'
        ? 'failure'
        : 'running';

  stages.push({
    id: 'sync',
    label: 'Sync',
    status: syncStatus,
    detail: pipeline.syncStatus,
    timestamp: pipeline.lastSyncedAt
  });

  // 5. Deploy/Run stage (from Argo CD health)
  const healthStatus: StageStatus =
    pipeline.healthStatus.toLowerCase() === 'healthy'
      ? 'success'
      : pipeline.healthStatus.toLowerCase() === 'degraded'
        ? 'failure'
        : 'running';

  stages.push({
    id: 'run',
    label: 'Run',
    status: healthStatus,
    detail: pipeline.healthStatus,
    timestamp: pipeline.lastDeployedAt
  });

  return stages;
}

