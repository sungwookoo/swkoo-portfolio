'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';

import {
  CURRENT_SWR_KEY,
  deleteCurrentDeployment,
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

        {status && <DeleteCard login={login} repo={repo} />}

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

type DeleteState =
  | { kind: 'idle' }
  | { kind: 'confirming' }
  | { kind: 'pending' }
  | { kind: 'error'; message: string };

function DeleteCard({ login, repo }: { login: string; repo: string }): JSX.Element {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [state, setState] = useState<DeleteState>({ kind: 'idle' });

  const handleConfirm = async (): Promise<void> => {
    setState({ kind: 'pending' });
    try {
      await deleteCurrentDeployment();
      await mutate(CURRENT_SWR_KEY, null, { revalidate: false });
      router.push('/deploy?removed=1');
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message });
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/30 p-4">
      <p className="text-sm font-medium text-slate-300">위험 영역</p>
      {state.kind === 'idle' && (
        <button
          type="button"
          onClick={() => setState({ kind: 'confirming' })}
          className="text-sm text-red-400 underline-offset-2 hover:text-red-300 hover:underline"
        >
          이 앱 제거하기
        </button>
      )}
      {state.kind === 'confirming' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            <span className="font-mono">{login}/{repo}</span>의 매니페스트가 swkoo-portfolio에서
            삭제되고 ~1-3분 안에 라이브 URL이 다운됩니다.
          </p>
          <p className="text-xs text-slate-500">
            본인 repo의 Dockerfile + workflow는 그대로 남습니다 — 필요하면 GitHub에서 직접 삭제하세요.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-500"
            >
              제거 확정
            </button>
            <button
              type="button"
              onClick={() => setState({ kind: 'idle' })}
              className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800/50"
            >
              취소
            </button>
          </div>
        </div>
      )}
      {state.kind === 'pending' && <p className="text-sm text-slate-400">제거 중…</p>}
      {state.kind === 'error' && (
        <div className="space-y-2">
          <p className="text-sm text-amber-400">제거 실패: {state.message}</p>
          <button
            type="button"
            onClick={() => setState({ kind: 'idle' })}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            돌아가기
          </button>
        </div>
      )}
    </div>
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
