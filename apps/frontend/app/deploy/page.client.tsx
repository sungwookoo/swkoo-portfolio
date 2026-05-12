'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSWRConfig } from 'swr';

import { loginUrl, logout, ME_SWR_KEY, useMe } from '@/lib/auth';
import {
  CurrentDeployment,
  registerDeploy,
  RepoSummary,
  StackPreview,
  useCurrent,
  useRepos,
  usePreview,
} from '@/lib/deploy';

const GITHUB_ICON_PATH =
  'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.111.82-.261.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12';

export function DeployPageClient(): JSX.Element {
  const { me, isLoading } = useMe();
  const router = useRouter();
  const params = useSearchParams();
  const { mutate } = useSWRConfig();
  const oauthError = params.get('error') === 'oauth_failed';
  const selectedRepo = params.get('repo');

  const handleLogout = async (): Promise<void> => {
    await logout();
    await mutate(ME_SWR_KEY, null, { revalidate: false });
  };

  if (isLoading) {
    return (
      <Shell>
        <p className="text-slate-500">Loading…</p>
      </Shell>
    );
  }

  if (!me) {
    return (
      <Shell narrow>
        <div className="max-w-md space-y-6 text-center">
          <h1 className="text-3xl font-semibold text-slate-100">Deploy your app</h1>
          <p className="text-slate-400">
            GitHub repo만 있으면 swkoo.kr 인프라에 자동 배포합니다.
            <br />
            Next.js / Node 앱을 지원합니다.
          </p>
          {oauthError && (
            <p className="text-sm text-amber-400">로그인 실패. 다시 시도해주세요.</p>
          )}
          <a
            href={loginUrl()}
            className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d={GITHUB_ICON_PATH} />
            </svg>
            Sign in with GitHub
          </a>
        </div>
      </Shell>
    );
  }

  if (me.requiresReauth) {
    return (
      <Shell narrow>
        <div className="max-w-md space-y-6 text-center">
          <ProfileBadge me={me} />
          <h1 className="text-2xl font-semibold text-slate-100">세션이 만료됐어요</h1>
          <p className="text-slate-400">
            보안을 위해 GitHub 인증을 다시 받아야 합니다.
          </p>
          <a
            href={loginUrl()}
            className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d={GITHUB_ICON_PATH} />
            </svg>
            Sign in again
          </a>
        </div>
      </Shell>
    );
  }

  if (!me.isAllowed) {
    return (
      <Shell narrow>
        <div className="max-w-md space-y-6 text-center">
          <ProfileBadge me={me} />
          <h1 className="text-2xl font-semibold text-slate-100">액세스 권한이 필요합니다</h1>
          <p className="text-slate-400">
            이 페이지는 등록된 사용자만 사용할 수 있습니다. 액세스 요청은 운영자에게 문의해주세요.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
          >
            로그아웃
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="w-full max-w-5xl space-y-8">
        <header className="flex items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            {me.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.avatarUrl} alt="" className="h-10 w-10 rounded-full" />
            )}
            <div>
              <p className="text-sm text-slate-300">@{me.githubLogin}</p>
              <p className="text-xs text-slate-500">액세스 확인됨</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-slate-500 transition-colors hover:text-slate-300"
          >
            로그아웃
          </button>
        </header>

        <CurrentBanner />

        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-slate-100">어떤 repo를 배포할까요?</h1>
          <p className="text-sm text-slate-500">
            본인이 owner인 GitHub repo 30개 (최근 업데이트 순). 클릭하면 swkoo.kr이 자동
            으로 스택을 감지합니다.
          </p>
        </div>

        <RepoGrid
          selectedFullName={selectedRepo}
          onSelect={(fullName) => {
            const next = new URLSearchParams(params.toString());
            next.set('repo', fullName);
            router.replace(`/deploy?${next.toString()}`, { scroll: false });
          }}
          onClear={() => router.replace('/deploy', { scroll: false })}
        />

        {selectedRepo && <PreviewPanel fullName={selectedRepo} />}
      </div>
    </Shell>
  );
}

function CurrentBanner(): JSX.Element | null {
  // Poll every 5s during the deleting window so the banner clears on its
  // own once ApplicationSet finishes pruning (~1-3 min).
  const { current, isLoading } = useCurrent(true, { refreshInterval: 5000 });
  if (isLoading || !current) return null;

  if (current.state === 'deleting') {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-amber-600/40 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-amber-400">삭제 진행 중</p>
          <p className="font-mono text-slate-200">{current.fullName}</p>
          <p className="text-xs text-slate-400">
            매니페스트는 제거됨. ArgoCD가 ~1-3분 안에 Application과 namespace를 prune
            합니다. 라이브 URL 응답이 끊기면 이 배너도 사라집니다.
          </p>
        </div>
      </div>
    );
  }

  const healthy = current.syncStatus === 'Synced' && current.healthStatus === 'Healthy';
  return (
    <div
      className={
        'flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ' +
        (healthy
          ? 'border-emerald-600/40 bg-emerald-500/5'
          : 'border-slate-800 bg-slate-900/40')
      }
    >
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-slate-500">현재 배포 중</p>
        <p className="font-mono text-slate-200">{current.fullName}</p>
        <p className="text-xs text-slate-400">
          {healthy ? '✓ Synced / Healthy — ' : '⏳ '}
          <a
            href={current.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:underline"
          >
            {current.liveUrl}
          </a>
        </p>
      </div>
      <Link
        href={`/deploy/${encodeURIComponent(current.login)}/${encodeURIComponent(current.repo)}`}
        className="inline-flex shrink-0 items-center gap-1 self-start rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800/50 sm:self-auto"
      >
        상세 보기 →
      </Link>
    </div>
  );
}

function Shell({
  children,
  narrow,
}: {
  children: React.ReactNode;
  narrow?: boolean;
}): JSX.Element {
  return (
    <main
      className={
        narrow
          ? 'relative isolate flex min-h-[calc(100vh-12rem)] w-full flex-col items-center justify-center px-6 py-24'
          : 'relative isolate min-h-[calc(100vh-12rem)] w-full px-6 py-16 sm:py-20'
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_60%)]"
      />
      {narrow ? children : <div className="mx-auto flex w-full justify-center">{children}</div>}
    </main>
  );
}

function ProfileBadge({
  me,
}: {
  me: { githubLogin: string; avatarUrl: string | null };
}): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-3">
      {me.avatarUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={me.avatarUrl} alt="" className="h-16 w-16 rounded-full" />
      )}
      <p className="text-slate-300">@{me.githubLogin}</p>
    </div>
  );
}

function RepoGrid({
  selectedFullName,
  onSelect,
  onClear,
}: {
  selectedFullName: string | null;
  onSelect: (fullName: string) => void;
  onClear: () => void;
}): JSX.Element {
  const { repos, isLoading, error } = useRepos(true);

  if (isLoading) {
    return <p className="text-slate-500">repo 목록을 가져오는 중…</p>;
  }
  if (error) {
    return (
      <p className="text-sm text-amber-400">
        repo 목록을 불러오지 못했어요: {error.message}
      </p>
    );
  }
  if (!repos || repos.length === 0) {
    return (
      <p className="text-slate-500">
        본인이 owner인 GitHub repo가 없습니다. 새 repo를 만들고 다시 와주세요.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {repos.map((repo) => (
        <RepoCard
          key={repo.fullName}
          repo={repo}
          selected={repo.fullName === selectedFullName}
          onSelect={() => onSelect(repo.fullName)}
          onClear={onClear}
        />
      ))}
    </div>
  );
}

function RepoCard({
  repo,
  selected,
  onSelect,
  onClear,
}: {
  repo: RepoSummary;
  selected: boolean;
  onSelect: () => void;
  onClear: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={selected ? onClear : onSelect}
      className={
        'group flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors ' +
        (selected
          ? 'border-emerald-500/60 bg-emerald-500/5'
          : 'border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/60')
      }
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-slate-100">{repo.name}</p>
        {repo.isFork && (
          <span className="rounded-sm bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
            fork
          </span>
        )}
      </div>
      <p className="line-clamp-2 min-h-[2.5em] text-sm text-slate-400">
        {repo.description ?? <span className="italic text-slate-600">설명 없음</span>}
      </p>
      <div className="flex items-center gap-3 text-xs text-slate-500">
        {repo.language && <LanguagePill language={repo.language} />}
        <span>{formatRelative(repo.updatedAt)}</span>
      </div>
    </button>
  );
}

function PreviewPanel({ fullName }: { fullName: string }): JSX.Element {
  const { preview, isLoading, error } = usePreview(fullName);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
      <p className="text-sm text-slate-500">선택한 repo</p>
      <p className="mt-1 font-mono text-slate-200">{fullName}</p>
      <hr className="my-4 border-slate-800" />
      {isLoading && <p className="text-sm text-slate-400">스택 감지 중…</p>}
      {error && <p className="text-sm text-amber-400">감지 실패: {error.message}</p>}
      {preview && <PreviewResult fullName={fullName} preview={preview} />}
    </div>
  );
}

function PreviewResult({
  fullName,
  preview,
}: {
  fullName: string;
  preview: StackPreview;
}): JSX.Element {
  if (preview.stack === 'unsupported') {
    return (
      <div className="space-y-2">
        <p className="text-amber-400">⚠️ 지원하지 않는 스택</p>
        <p className="text-sm text-slate-400">{preview.reason}</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-emerald-400">✓ Next.js 앱으로 감지</p>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
        {preview.packageName && (
          <>
            <dt className="text-slate-500">package.name</dt>
            <dd className="font-mono text-slate-200">{preview.packageName}</dd>
          </>
        )}
        <dt className="text-slate-500">예상 포트</dt>
        <dd className="font-mono text-slate-200">{preview.port}</dd>
        {preview.nodeEngine && (
          <>
            <dt className="text-slate-500">Node engine</dt>
            <dd className="font-mono text-slate-200">{preview.nodeEngine}</dd>
          </>
        )}
      </dl>
      <DeployTrigger fullName={fullName} />
    </div>
  );
}

type DeployState =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'error'; message: string; reason?: string };

function DeployTrigger({ fullName }: { fullName: string }): JSX.Element {
  const router = useRouter();
  const [state, setState] = useState<DeployState>({ kind: 'idle' });

  const handleDeploy = async (): Promise<void> => {
    setState({ kind: 'pending' });
    try {
      const result = await registerDeploy(fullName);
      const [owner, repo] = result.fullName.split('/');
      router.push(`/deploy/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
    } catch (err) {
      const e = err as Error & { reason?: string };
      setState({ kind: 'error', message: e.message, reason: e.reason });
    }
  };

  return (
    <div className="space-y-2 border-t border-slate-800 pt-4">
      {state.kind === 'error' && (
        <p className="text-sm text-amber-400">
          {state.reason && <span className="font-mono text-xs">[{state.reason}] </span>}
          {state.message}
        </p>
      )}
      <button
        type="button"
        onClick={handleDeploy}
        disabled={state.kind === 'pending'}
        className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {state.kind === 'pending' ? '배포 시작 중…' : 'Deploy →'}
      </button>
      <p className="text-xs text-slate-500">
        Dockerfile + GitHub Actions workflow를 본인 repo에 commit하고, swkoo-portfolio에
        매니페스트를 추가합니다. 한 사용자당 1개 앱만 등록 가능 (v0).
      </p>
    </div>
  );
}

function LanguagePill({ language }: { language: string }): JSX.Element {
  const colors: Record<string, string> = {
    TypeScript: 'bg-blue-500/15 text-blue-300',
    JavaScript: 'bg-yellow-500/15 text-yellow-300',
    Python: 'bg-green-500/15 text-green-300',
    Go: 'bg-cyan-500/15 text-cyan-300',
    Rust: 'bg-orange-500/15 text-orange-300',
  };
  const cls = colors[language] ?? 'bg-slate-700/40 text-slate-300';
  return <span className={`rounded-sm px-1.5 py-0.5 text-[10px] ${cls}`}>{language}</span>;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  return `${Math.floor(months / 12)}년 전`;
}
