import Link from 'next/link';
import clsx from 'clsx';

import { fetchAlerts, fetchPipelines } from '@/lib/api';
import { hero, liveStatus } from '@/content/landing';

export default async function Home() {
  const [pipelinesEnvelope, alertsEnvelope] = await Promise.all([
    fetchPipelines(),
    fetchAlerts(),
  ]);

  const totalPipelines = pipelinesEnvelope.pipelines.length;
  const healthyCount = pipelinesEnvelope.pipelines.filter(
    (p) => p.healthStatus === 'Healthy'
  ).length;
  const activeAlerts = alertsEnvelope.alerts.length;
  const allHealthy =
    totalPipelines > 0 && healthyCount === totalPipelines && activeAlerts === 0;
  const showStatus = pipelinesEnvelope.configured && totalPipelines > 0;

  return (
    <main className="relative isolate flex min-h-[calc(100vh-12rem)] w-full flex-col items-center justify-center px-6 py-24">
      {/* Ambient gradient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_120%,rgba(15,23,42,0.6),transparent_50%)]"
      />

      <div className="flex flex-col items-center gap-10 text-center">
        {/* Status pill — also a link */}
        {showStatus && (
          <Link
            href="/observatory"
            className="group inline-flex items-center gap-2.5 rounded-full border border-slate-800 bg-slate-900/40 px-3.5 py-1.5 text-xs text-slate-400 backdrop-blur-md transition-colors hover:border-slate-700 hover:bg-slate-900/70 hover:text-slate-200"
          >
            <span className="relative flex size-2">
              <span
                className={clsx(
                  'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
                  allHealthy ? 'bg-emerald-400' : 'bg-amber-400'
                )}
              />
              <span
                className={clsx(
                  'relative inline-flex size-2 rounded-full',
                  allHealthy ? 'bg-emerald-400' : 'bg-amber-400'
                )}
              />
            </span>
            <span className="font-medium tracking-tight">
              {healthyCount}/{totalPipelines} {liveStatus.healthyLabel}
            </span>
            <span className="text-slate-700">·</span>
            <span className="tracking-tight">
              {liveStatus.alertsLabel} {activeAlerts}
            </span>
            <span className="ml-0.5 text-slate-600 transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        )}

        {/* Title */}
        <h1 className="max-w-3xl text-balance text-4xl font-bold leading-[1.08] tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
          {hero.title}
        </h1>

        {/* Description — two visual lines for rhythm */}
        <div className="max-w-xl space-y-1.5">
          {hero.description.map((line, i) => (
            <p
              key={i}
              className="text-balance text-base leading-relaxed text-slate-400 sm:text-lg"
            >
              {line}
            </p>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-2">
          <Link
            href="/observatory"
            className="group inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-medium text-slate-950 ring-1 ring-emerald-400/40 transition-all hover:bg-emerald-400 hover:shadow-[0_0_40px_-8px_rgba(16,185,129,0.5)]"
          >
            <span>{hero.ctaLabel}</span>
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
