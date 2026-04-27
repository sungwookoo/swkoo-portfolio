import clsx from 'clsx';

import type { Alert, AlertSeverity } from '@/lib/types';
import { alerts as alertsContent } from '@/content/observatory';

interface AlertListProps {
  configured: boolean;
  alerts: Alert[];
}

function severityStyle(severity: AlertSeverity): {
  bar: string;
  pill: string;
  icon: string;
} {
  switch (severity) {
    case 'critical':
      return {
        bar: 'border-rose-500/60',
        pill: 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30',
        icon: '🔴',
      };
    case 'warning':
      return {
        bar: 'border-amber-500/60',
        pill: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30',
        icon: '🟡',
      };
    case 'info':
      return {
        bar: 'border-sky-500/60',
        pill: 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30',
        icon: '🔵',
      };
    default:
      return {
        bar: 'border-slate-600/60',
        pill: 'bg-slate-600/20 text-slate-300 ring-1 ring-slate-600/30',
        icon: '⚪',
      };
  }
}

function formatRelativeTime(isoString: string | null): string | null {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return null;

  const deltaSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (deltaSeconds < 60) return `${deltaSeconds}초 전`;
  if (deltaSeconds < 3600) return `${Math.floor(deltaSeconds / 60)}분 전`;
  if (deltaSeconds < 86400) return `${Math.floor(deltaSeconds / 3600)}시간 전`;
  return `${Math.floor(deltaSeconds / 86400)}일 전`;
}

export function AlertList({ configured, alerts }: AlertListProps) {
  const count = alerts.length;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">
            🚨 {alertsContent.title}
            {configured && count > 0 && (
              <span className="ml-2 rounded-full bg-rose-500/20 px-2 py-0.5 text-sm text-rose-300 ring-1 ring-rose-500/30">
                {count}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-400">{alertsContent.subtitle}</p>
        </div>
        {configured && (
          <a
            href={alertsContent.consoleLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            {alertsContent.consoleLink.label} ↗
          </a>
        )}
      </div>

      {!configured ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center">
          <p className="text-slate-400">{alertsContent.unconfigured}</p>
          <p className="mt-2 text-sm text-slate-500">{alertsContent.unconfiguredHint}</p>
        </div>
      ) : count === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center">
          <p className="text-slate-400">{alertsContent.empty}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => {
            const style = severityStyle(alert.severity);
            const relative = formatRelativeTime(alert.startsAt);
            return (
              <li
                key={alert.fingerprint}
                className={clsx(
                  'rounded-xl border-l-2 bg-slate-950 p-4',
                  style.bar
                )}
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className={clsx('rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide', style.pill)}>
                    {alertsContent.severityLabel[alert.severity]}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-100">{alert.alertname}</h3>
                  {alert.associatedPipeline ? (
                    <span className="text-xs text-slate-400">
                      · <span className="font-mono">{alert.associatedPipeline}</span>
                    </span>
                  ) : alert.namespace ? (
                    <span className="text-xs text-slate-500">
                      · {alertsContent.namespaceLabel}=<span className="font-mono">{alert.namespace}</span>
                    </span>
                  ) : null}
                  {relative && <span className="text-xs text-slate-500">· {relative}</span>}
                </div>
                {alert.summary && (
                  <p className="mt-2 text-sm text-slate-300">{alert.summary}</p>
                )}
                {alert.description && alert.description !== alert.summary && (
                  <p className="mt-1 text-xs text-slate-500">{alert.description}</p>
                )}
                {alert.runbook && (
                  <p className="mt-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-400">Runbook:</span> {alert.runbook}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
