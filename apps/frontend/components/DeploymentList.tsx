import clsx from 'clsx';

import type { DeploymentLifecycle } from '@/lib/types';
import { deployments as content } from '@/content/observatory';

interface DeploymentListProps {
  configured: boolean;
  pipeline: string;
  deployments: DeploymentLifecycle[];
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

function formatDuration(startIso: string, endIso: string | null): string | null {
  if (!endIso) return null;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) return `${seconds}초`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
  return `${Math.floor(seconds / 3600)}시간 ${Math.floor((seconds % 3600) / 60)}분`;
}

export function DeploymentList({ configured, pipeline, deployments }: DeploymentListProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">
            📦 {content.title}
            {configured && deployments.length > 0 && (
              <span className="ml-2 rounded-full bg-slate-700/60 px-2 py-0.5 text-sm text-slate-300">
                {deployments.length}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-400">{content.subtitle}</p>
        </div>
        <span className="text-xs text-slate-500 font-mono">{pipeline}</span>
      </div>

      {!configured ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center">
          <p className="text-slate-400">{content.unconfigured}</p>
          <p className="mt-2 text-sm text-slate-500">{content.unconfiguredHint}</p>
        </div>
      ) : deployments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center">
          <p className="text-slate-400">{content.empty}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {deployments.map((d) => {
            const duration = formatDuration(d.startedAt, d.endedAt);
            const relative = formatRelative(d.endedAt ?? d.startedAt);
            return (
              <li
                key={`${d.commitSha}-${d.startedAt}`}
                className="rounded-xl border-l-2 border-emerald-500/60 bg-slate-950 p-4"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {d.commitAuthorAvatar && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={d.commitAuthorAvatar}
                      alt=""
                      className="size-5 rounded-full"
                    />
                  )}
                  {d.commitHref ? (
                    <a
                      href={d.commitHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-sky-300 hover:text-sky-200"
                    >
                      {d.commitShort}
                    </a>
                  ) : (
                    <span className="font-mono text-xs text-slate-400">{d.commitShort}</span>
                  )}
                  <span className="text-sm text-slate-100 truncate" title={d.commitMessage}>
                    {d.commitMessage}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>@{d.commitAuthor}</span>
                  {relative && <span>· {relative}</span>}
                  {duration && (
                    <span>· {content.buildDuration} <span className="text-slate-300">{duration}</span></span>
                  )}
                </div>

                {d.events.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {d.events.map((e, i) => {
                      const stageLabel = content.stageLabel[e.stage] ?? e.label;
                      const durationText =
                        e.durationSeconds && e.durationSeconds > 0
                          ? e.durationSeconds < 60
                            ? `${e.durationSeconds}s`
                            : `${Math.floor(e.durationSeconds / 60)}m ${e.durationSeconds % 60}s`
                          : null;
                      return (
                        <span key={i} className="inline-flex items-center gap-1">
                          <span
                            className={clsx(
                              'inline-flex size-1.5 rounded-full',
                              e.status === 'success' && 'bg-emerald-400',
                              e.status === 'failure' && 'bg-rose-400',
                              e.status === 'in_progress' && 'bg-amber-400 animate-pulse'
                            )}
                          />
                          {e.href ? (
                            <a
                              href={e.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={clsx(
                                'hover:text-slate-200',
                                e.status === 'failure' ? 'text-rose-300' : 'text-slate-400'
                              )}
                            >
                              {stageLabel}
                              {durationText && (
                                <span className="ml-1 text-slate-500">({durationText})</span>
                              )}
                            </a>
                          ) : (
                            <span
                              className={clsx(
                                e.status === 'failure' ? 'text-rose-300' : 'text-slate-400'
                              )}
                            >
                              {stageLabel}
                              {durationText && (
                                <span className="ml-1 text-slate-500">({durationText})</span>
                              )}
                            </span>
                          )}
                          {i < d.events.length - 1 && (
                            <span className="text-slate-700">→</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
