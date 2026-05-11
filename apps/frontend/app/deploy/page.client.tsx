'use client';

import { useSearchParams } from 'next/navigation';
import { useSWRConfig } from 'swr';

import { loginUrl, logout, ME_SWR_KEY, useMe } from '@/lib/auth';

const GITHUB_ICON_PATH =
  'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.111.82-.261.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12';

export function DeployPageClient(): JSX.Element {
  const { me, isLoading } = useMe();
  const params = useSearchParams();
  const { mutate } = useSWRConfig();
  const oauthError = params.get('error') === 'oauth_failed';

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
      <Shell>
        <div className="max-w-md space-y-6 text-center">
          <h1 className="text-3xl font-semibold text-slate-100">Deploy your app</h1>
          <p className="text-slate-400">
            GitHub repo만 있으면 swkoo.kr 인프라에 자동 배포합니다.
            <br />
            Next.js / Node 앱 지원 (베타).
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

  if (!me.isAllowed) {
    return (
      <Shell>
        <div className="max-w-md space-y-6 text-center">
          <ProfileBadge me={me} />
          <h1 className="text-2xl font-semibold text-slate-100">베타 액세스 대기 중</h1>
          <p className="text-slate-400">
            현재 친구·테스터 한정 베타입니다. 액세스 요청은 운영자에게 직접 문의해주세요.
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
      <div className="max-w-md space-y-6 text-center">
        <ProfileBadge me={me} />
        <h1 className="text-2xl font-semibold text-slate-100">환영합니다 ✓</h1>
        <p className="text-slate-400">
          베타 액세스 확인됨. 다음 단계(repo 선택 + 배포)는 곧 추가됩니다.
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

function Shell({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <main className="relative isolate flex min-h-[calc(100vh-12rem)] w-full flex-col items-center justify-center px-6 py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_60%)]"
      />
      {children}
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
