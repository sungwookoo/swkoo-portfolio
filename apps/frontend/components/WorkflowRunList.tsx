'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { WorkflowRun } from '@/lib/types';

interface WorkflowRunListProps {
  runs: WorkflowRun[];
  workflows: string[];
  onFilterChange?: (workflow: string | null) => void;
}

function formatTimestamp(timestamp: string): string {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  } catch {
    return timestamp;
  }
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function getStatusIcon(run: WorkflowRun): { icon: string; colorClass: string } {
  if (run.status === 'in_progress') {
    return { icon: '◌', colorClass: 'text-sky-400 animate-pulse' };
  }
  if (run.status === 'queued') {
    return { icon: '○', colorClass: 'text-slate-400' };
  }

  switch (run.conclusion) {
    case 'success':
      return { icon: '✓', colorClass: 'text-emerald-400' };
    case 'failure':
      return { icon: '✗', colorClass: 'text-rose-400' };
    case 'cancelled':
      return { icon: '⊘', colorClass: 'text-amber-400' };
    default:
      return { icon: '○', colorClass: 'text-slate-400' };
  }
}

export function WorkflowRunList({ runs, workflows, onFilterChange }: WorkflowRunListProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || null;
    setSelectedWorkflow(value);
    onFilterChange?.(value);
  };

  const filteredRuns = selectedWorkflow
    ? runs.filter((run) => run.name === selectedWorkflow)
    : runs;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-200">📜 Recent Workflow Runs</h4>
        {workflows.length > 0 && (
          <select
            value={selectedWorkflow ?? ''}
            onChange={handleFilterChange}
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300 focus:border-slate-600 focus:outline-none"
          >
            <option value="">All Workflows</option>
            {workflows.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        )}
      </div>

      {filteredRuns.length === 0 ? (
        <p className="text-sm text-slate-500">No workflow runs found.</p>
      ) : (
        <div className="space-y-2">
          {filteredRuns.map((run) => {
            const { icon, colorClass } = getStatusIcon(run);
            return (
              <a
                key={run.id}
                href={run.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5 transition-colors hover:border-slate-700 hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className={clsx('text-lg', colorClass)}>{icon}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{run.name}</p>
                    <p className="text-xs text-slate-500">
                      <span className="font-mono">{run.headSha.substring(0, 7)}</span>
                      <span className="mx-1.5">·</span>
                      <span>{run.headBranch}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{formatTimestamp(run.createdAt)}</p>
                  <p className="text-xs text-slate-500">{formatDuration(run.runDurationSeconds)}</p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

