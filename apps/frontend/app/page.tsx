import Link from 'next/link';

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
  const allHealthy = totalPipelines > 0 && healthyCount === totalPipelines && activeAlerts === 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-20">
      {/* Hero */}
      <section className="space-y-6">
        <h1 className="text-4xl font-bold leading-tight text-slate-50 sm:text-5xl">
          {hero.title}
        </h1>
        <p className="text-lg leading-relaxed text-slate-300">
          {hero.description}
        </p>
        <div>
          <Link
            href="/observatory"
            className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-medium text-slate-950 transition-all hover:bg-emerald-400"
          >
            <span className="text-lg">🐟</span>
            <span>{hero.ctaLabel}</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>

      {/* Live Status Strip */}
      {pipelinesEnvelope.configured && totalPipelines > 0 && (
        <section className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-3 text-sm">
          <span
            className={
              allHealthy
                ? 'inline-block size-2 rounded-full bg-emerald-400'
                : 'inline-block size-2 rounded-full bg-amber-400'
            }
            aria-hidden
          />
          <span className="text-slate-200">
            {healthyCount}/{totalPipelines} {liveStatus.healthyLabel}
          </span>
          <span className="text-slate-600">·</span>
          <span className={activeAlerts > 0 ? 'text-amber-300' : 'text-slate-400'}>
            {liveStatus.alertsLabel} {activeAlerts}
          </span>
          <span className="ml-auto text-xs text-slate-500">
            <Link href="/observatory" className="hover:text-emerald-400">
              자세히 →
            </Link>
          </span>
        </section>
      )}
    </main>
  );
}
