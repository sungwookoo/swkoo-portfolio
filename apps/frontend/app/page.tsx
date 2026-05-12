import Link from 'next/link';
import clsx from 'clsx';

import { fetchAlerts, fetchPipelines } from '@/lib/api';
import { builders, hero, liveStatus, steps, trust } from '@/content/landing';

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
    <main className="relative isolate w-full">
      {/* Ambient gradient backdrop — anchored to hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_50%_120%,rgba(15,23,42,0.6),transparent_50%)]"
      />

      <Hero />

      <Section>
        <SectionHeader
          eyebrow="How it works"
          title="세 단계로 라이브"
          subtitle="등록부터 배포까지 운영자 개입 없이 사용자가 처음부터 끝까지 진행합니다."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {steps.map((step) => (
            <StepCard key={step.n} {...step} />
          ))}
        </div>
      </Section>

      <Section variant="muted">
        <SectionHeader
          eyebrow="Transparency"
          title={trust.title}
          subtitle={trust.description}
        />
        <LiveStatusCard
          showStatus={showStatus}
          totalPipelines={totalPipelines}
          healthyCount={healthyCount}
          activeAlerts={activeAlerts}
          allHealthy={allHealthy}
        />
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Under the hood"
          title={builders.title}
          subtitle={builders.description}
        />
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {builders.bullets.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/30 px-4 py-3 text-sm text-slate-300"
            >
              <span className="mt-0.5 inline-block size-1.5 shrink-0 rounded-full bg-emerald-400/70" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a
            href="https://github.com/sungwookoo/swkoo-portfolio/blob/main/VISION.md"
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 underline-offset-4 transition-colors hover:text-emerald-300 hover:underline"
          >
            VISION.md →
          </a>
          <a
            href="https://github.com/sungwookoo/swkoo-portfolio/blob/main/BIZ_READINESS.md"
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 underline-offset-4 transition-colors hover:text-emerald-300 hover:underline"
          >
            BIZ_READINESS.md →
          </a>
          <a
            href="https://github.com/sungwookoo/swkoo-portfolio/blob/main/docs/deploy-vision.md"
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 underline-offset-4 transition-colors hover:text-emerald-300 hover:underline"
          >
            deploy-vision →
          </a>
        </div>
      </Section>
    </main>
  );
}

function Hero(): JSX.Element {
  return (
    <section className="flex min-h-[calc(100vh-12rem)] w-full flex-col items-center justify-center px-6 py-24">
      <div className="flex flex-col items-center gap-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          <span className="inline-block size-1.5 rounded-full bg-emerald-400" />
          Phase 2 · 친구·테스터 한정 베타
        </span>

        <h1 className="max-w-3xl whitespace-pre-line text-balance text-4xl font-bold leading-[1.08] tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
          {hero.title}
        </h1>

        <p className="text-balance text-base italic text-emerald-300/80 sm:text-lg">
          {hero.tagline}
        </p>

        <p className="max-w-xl text-balance text-base leading-relaxed text-slate-400 sm:text-lg">
          {hero.description}
        </p>

        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href={hero.primaryCta.href}
            className="group inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-medium text-slate-950 ring-1 ring-emerald-400/40 transition-all hover:bg-emerald-400 hover:shadow-[0_0_40px_-8px_rgba(16,185,129,0.5)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.111.82-.261.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            <span>{hero.primaryCta.label}</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <Link
            href={hero.secondaryCta.href}
            className="group inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-slate-500 hover:bg-slate-900/50 hover:text-slate-100"
          >
            <span>{hero.secondaryCta.label}</span>
            <span className="text-slate-500 transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Section({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'muted';
}): JSX.Element {
  return (
    <section
      className={clsx(
        'w-full px-6 py-20',
        variant === 'muted' && 'border-y border-slate-900/80 bg-slate-950/40'
      )}
    >
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}): JSX.Element {
  return (
    <div className="max-w-2xl space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-400/70">
        {eyebrow}
      </p>
      <h2 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-slate-100 sm:text-3xl">
        {title}
      </h2>
      <p className="text-balance text-sm leading-relaxed text-slate-400 sm:text-base">
        {subtitle}
      </p>
    </div>
  );
}

function StepCard({ n, title, body }: { n: number; title: string; body: string }): JSX.Element {
  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/30 p-5 transition-colors hover:border-slate-700 hover:bg-slate-900/60">
      <span className="inline-flex size-7 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-300">
        {n}
      </span>
      <h3 className="text-base font-medium text-slate-100">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}

function LiveStatusCard({
  showStatus,
  totalPipelines,
  healthyCount,
  activeAlerts,
  allHealthy,
}: {
  showStatus: boolean;
  totalPipelines: number;
  healthyCount: number;
  activeAlerts: number;
  allHealthy: boolean;
}): JSX.Element {
  if (!showStatus) {
    return (
      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <p className="text-sm text-slate-500">{liveStatus.fetchFailed}</p>
        <Link
          href="/observatory"
          className="mt-3 inline-flex items-center gap-1 text-sm text-emerald-300 hover:text-emerald-200"
        >
          Observatory 열기 <span>→</span>
        </Link>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'mt-8 flex flex-col gap-6 rounded-xl border p-6 sm:flex-row sm:items-center sm:justify-between',
        allHealthy
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-amber-500/30 bg-amber-500/5'
      )}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Metric
          label={liveStatus.healthyLabel}
          value={`${healthyCount}/${totalPipelines}`}
          tone={allHealthy ? 'emerald' : 'amber'}
        />
        <span className="text-slate-700">·</span>
        <Metric
          label={liveStatus.alertsLabel}
          value={String(activeAlerts)}
          tone={activeAlerts === 0 ? 'emerald' : 'amber'}
        />
      </div>
      <Link
        href="/observatory"
        className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-slate-500 hover:bg-slate-900/50 hover:text-slate-100"
      >
        Observatory 열기
        <span className="text-slate-500 transition-transform group-hover:translate-x-0.5">→</span>
      </Link>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'emerald' | 'amber';
}): JSX.Element {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={clsx(
          'font-mono text-2xl font-semibold',
          tone === 'emerald' ? 'text-emerald-300' : 'text-amber-300'
        )}
      >
        {value}
      </span>
      <span className="text-xs uppercase tracking-wider text-slate-500">{label}</span>
    </div>
  );
}
