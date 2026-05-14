export const metadata = {
  title: '개인정보 처리방침 — swkoo.kr',
  description: 'swkoo.kr이 수집·저장하는 정보와 그 용도.',
};

export default function PrivacyPage(): JSX.Element {
  return (
    <main className="relative isolate w-full px-6 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-3 border-b border-zinc-900 pb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
            Privacy
          </p>
          <h1 className="display-tight text-balance text-3xl font-semibold text-zinc-50 sm:text-4xl">
            개인정보 처리방침
          </h1>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-zinc-400">
          <p>
            swkoo.kr은 GitHub OAuth로 사인인할 때 GitHub이 제공하는{' '}
            <code className="font-mono text-zinc-300">login</code>·
            <code className="font-mono text-zinc-300">name</code>·
            <code className="font-mono text-zinc-300">avatar_url</code>·
            <code className="font-mono text-zinc-300">id</code>만 저장합니다.
            이메일·연락처·결제 정보 등은 수집하지 않습니다.
          </p>
          <p>
            배포에 필요한 사용자 repo 권한은 GitHub App 설치 시 명시된 범위로만
            행사되며, 사용자가 GitHub 설정에서 App을 제거하면 즉시 만료됩니다.
            서버 측 토큰은 저장하지 않고 매 요청 시 short-lived installation
            token으로 발급받아 사용합니다.
          </p>
          <p>
            본격적인 처리방침은 일반 공개 시점에 확정됩니다. 베타 기간 동안의
            데이터 삭제는 운영자에게 직접 요청해주세요.
          </p>
          <p className="text-zinc-500">
            문의 — youks99@gmail.com
          </p>
        </section>
      </div>
    </main>
  );
}
