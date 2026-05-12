'use client';

import Link from 'next/link';

import {
  DeploymentStatus,
  StageInfo,
  StageStatus,
  useDeploymentStatus,
} from '@/lib/deploy';

interface StatusClientProps {
  login: string;
  repo: string;
}

const STAGE_ORDER: Array<{ key: keyof DeploymentStatus['stages']; label: string }> = [
  { key: 'manifests', label: '매니페스트 등록' },
  { key: 'build', label: '이미지 빌드' },
  { key: 'imageDetected', label: '새 이미지 감지' },
  { key: 'deploy', label: '클러스터 배포' },
  { key: 'live', label: '라이브 응답' },
];

export function StatusClient({ login, repo }: StatusClientProps): JSX.Element {
  const { status, isLoading, error } = useDeploymentStatus(login, repo);

  return (
    <main className="relative isolate min-h-[calc(100vh-12rem)] w-full px-6 py-16 sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_60%)]"
      />
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <Header login={login} repo={repo} status={status} />

        {isLoading && !status && <p className="text-slate-500">상태 조회 중…</p>}
        {error && (
          <p className="text-sm text-amber-400">
            상태 조회 실패: {error.message}
          </p>
        )}
        {status && <Checklist status={status} />}

        <footer className="border-t border-slate-800 pt-6">
          <Link
            href="/deploy"
            className="text-sm text-slate-500 transition-colors hover:text-slate-300"
          >
            ← 다른 repo 보기
          </Link>
        </footer>
      </div>
    </main>
  );
}

function Header({
  login,
  repo,
  status,
}: {
  login: string;
  repo: string;
  status?: DeploymentStatus;
}): JSX.Element {
  const liveReady = status?.stages.live.status === 'success';
  return (
    <header className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">deployment</p>
      <h1 className="font-mono text-2xl text-slate-100">
        {login}/{repo}
      </h1>
      {status && (
        <p className="text-sm text-slate-400">
          {liveReady ? '✓ 라이브 — ' : '⏳ 배포 진행 중 — '}
          <a
            href={status.liveUrl}
            target="_blank"
            rel="noreferrer"
            className={
              liveReady
                ? 'font-mono text-emerald-300 hover:text-emerald-200 underline-offset-2 hover:underline'
                : 'font-mono text-slate-400 hover:text-slate-200 underline-offset-2 hover:underline'
            }
          >
            {status.liveUrl}
          </a>
        </p>
      )}
    </header>
  );
}

function Checklist({ status }: { status: DeploymentStatus }): JSX.Element {
  return (
    <ol className="space-y-2">
      {STAGE_ORDER.map(({ key, label }) => (
        <StageRow key={key} label={label} stage={status.stages[key]} />
      ))}
    </ol>
  );
}

function StageRow({ label, stage }: { label: string; stage: StageInfo }): JSX.Element {
  return (
    <li className="flex items-start gap-4 rounded-md border border-slate-800 bg-slate-900/30 p-4">
      <StatusIcon status={stage.status} />
      <div className="flex-1 space-y-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-slate-200">{label}</p>
          <StatusBadge status={stage.status} />
        </div>
        <p className="text-xs text-slate-400">{stage.message}</p>
        {stage.link && (
          <a
            href={stage.link}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
          >
            {stage.link.includes('github.com/') && stage.link.includes('/actions/')
              ? 'GitHub Actions 로그 보기'
              : stage.link.startsWith('https://') && stage.link.includes('.apps.')
              ? '라이브 URL 열기'
              : '자세히 보기'}
          </a>
        )}
      </div>
    </li>
  );
}

function StatusIcon({ status }: { status: StageStatus }): JSX.Element {
  const cls =
    status === 'success'
      ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
      : status === 'failed'
      ? 'border-red-500/60 bg-red-500/20 text-red-300'
      : status === 'running'
      ? 'border-slate-500/60 bg-slate-700/40 text-slate-300'
      : 'border-slate-700 bg-slate-900/40 text-slate-600';
  const glyph =
    status === 'success' ? '✓' : status === 'failed' ? '✕' : status === 'running' ? '◐' : '·';
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm ${cls}`}
      aria-hidden
    >
      <span className={status === 'running' ? 'animate-pulse' : ''}>{glyph}</span>
    </span>
  );
}

function StatusBadge({ status }: { status: StageStatus }): JSX.Element {
  const text =
    status === 'success'
      ? '완료'
      : status === 'failed'
      ? '실패'
      : status === 'running'
      ? '진행 중'
      : '대기';
  const cls =
    status === 'success'
      ? 'text-emerald-400'
      : status === 'failed'
      ? 'text-red-400'
      : status === 'running'
      ? 'text-slate-300'
      : 'text-slate-600';
  return <span className={`text-[10px] uppercase tracking-wide ${cls}`}>{text}</span>;
}
