import { fetchOverview } from '@/lib/api';

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6 space-y-2">
      <h2 className="text-2xl font-semibold text-slate-50">{title}</h2>
      {subtitle ? <p className="text-sm text-slate-400">{subtitle}</p> : null}
    </header>
  );
}

export default async function Home() {
  const overview = await fetchOverview();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-12 px-6 py-16">
      <section className="space-y-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/40 p-10 shadow-xl shadow-slate-900/60">
        <p className="text-sm uppercase tracking-[0.4rem] text-slate-500">Sungwoo Koo</p>
        <h1 className="text-4xl font-bold text-slate-50 sm:text-5xl">
          GitOps-first Infrastructure Playground
        </h1>
        <p className="max-w-2xl text-lg text-slate-300">
          swkoo.kr은 개인 K3s 클러스터 위에서 GitOps 파이프라인을 실험하고 전시하기 위한 포트폴리오
          공간입니다. Argo CD, Portainer, Grafana, 사설 Registry로 구성된 제어면(Control Plane)을
          통해 애플리케이션을 선언형으로 운영합니다.
        </p>
        <div className="flex flex-wrap gap-3 text-sm text-slate-400">
          <span className="rounded-full border border-slate-700 px-3 py-1">K3s · OCI</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">GitOps · Argo CD</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">Observability</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">Infrastructure as Code</span>
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
          <SectionTitle
            title="Infrastructure Overview"
            subtitle="Terraform + OCI + K3s로 구축한 홈 랩 환경"
          />
          {overview ? (
            <dl className="space-y-4 text-sm text-slate-300">
              <div>
                <dt className="font-semibold text-slate-200">Cluster</dt>
                <dd className="mt-1 text-slate-400">
                  {overview.infrastructure.cluster.distribution} @ {overview.infrastructure.cluster.location}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-200">GitOps Tooling</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {overview.infrastructure.cluster.gitOpsTooling.map((tool) => (
                    <span key={tool} className="rounded-md bg-slate-800 px-2 py-1">
                      {tool}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-200">Control Plane Apps</dt>
                <dd className="mt-1 grid gap-2 sm:grid-cols-2">
                  {overview.infrastructure.controlPlane.map((app) => (
                    <span key={app} className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1">
                      {app}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-slate-500">
              인프라 개요를 불러오지 못했습니다. API 연결을 확인해주세요.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
          <SectionTitle title="GitOps Vision" subtitle="swkoo.kr을 위한 파이프라인 로드맵" />
          {overview ? (
            <div className="space-y-4 text-sm text-slate-300">
              <p className="text-slate-400">{overview.gitopsVision.description}</p>
              <ol className="space-y-3 text-slate-200">
                {overview.gitopsVision.roadmap.map((item) => (
                  <li key={item} className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              GitOps 로드맵 데이터를 준비하는 중입니다. 잠시 후 다시 시도하세요.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
        <SectionTitle
          title="Pipeline Observatory (MVP)"
          subtitle="Argo CD Application 동기화 상태를 연동해 실시간에 가까운 파이프라인 타임라인을 만들 예정입니다."
        />
        <div className="grid gap-6 md:grid-cols-[minmax(0,240px),1fr]">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
            <p className="font-semibold text-slate-200">Status Legend</p>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="mr-2 inline-flex size-2 rounded-full bg-sky-400 align-middle"></span>
                Syncing
              </li>
              <li>
                <span className="mr-2 inline-flex size-2 rounded-full bg-emerald-400 align-middle"></span>
                Healthy
              </li>
              <li>
                <span className="mr-2 inline-flex size-2 rounded-full bg-amber-400 align-middle"></span>
                Degraded
              </li>
              <li>
                <span className="mr-2 inline-flex size-2 rounded-full bg-rose-400 align-middle"></span>
                Error
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-dashed border-slate-800 p-6 text-sm text-slate-400">
            <p>
              아직 데이터 소스가 연결되어 있지 않습니다. Phase 2에서 NestJS 백엔드가 Argo CD API를
              호출하여 Application 상태를 수집하면 이 영역에 타임라인과 시각화가 표시됩니다.
            </p>
            <p className="mt-3 text-xs text-slate-600">
              제안: 15초 폴링으로 시작 → Webhook 기반 스트리밍으로 확장.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
