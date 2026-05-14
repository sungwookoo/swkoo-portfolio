export const metadata = {
  title: '이용약관 — swkoo.kr',
  description: 'swkoo.kr 이용약관 (베타).',
};

export default function TermsPage(): JSX.Element {
  return (
    <main className="relative isolate w-full px-6 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-3 border-b border-zinc-900 pb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
            Terms
          </p>
          <h1 className="display-tight text-balance text-3xl font-semibold text-zinc-50 sm:text-4xl">
            이용약관
          </h1>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-zinc-400">
          <p>
            swkoo.kr은 현재 운영자(swkoo) 본인의 친구·지인을 대상으로 한
            <strong className="font-semibold text-zinc-200"> 베타 단계</strong>입니다.
            SLA·가용성 보장 없이 best-effort로 운영되며, 사용은 무상입니다.
          </p>
          <p>
            본격적인 약관은 일반 공개 시점에 확정됩니다. 그 전까지는 신뢰 기반의 친구
            한정 운영이며, 운영자가 단일 노드 장애·자원 한도·콘텐츠 정책 위반 시 사전
            통보 없이 배포를 중단할 수 있습니다.
          </p>
          <p className="text-zinc-500">
            문의 — youks99@gmail.com
          </p>
        </section>
      </div>
    </main>
  );
}
