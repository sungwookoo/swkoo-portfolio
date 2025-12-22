import Link from "next/link";
import { fetchOverview, fetchPipelines } from "@/lib/api";

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-6 space-y-2">
      <h2 className="text-2xl font-semibold text-slate-50">{title}</h2>
      {subtitle ? <p className="text-sm text-slate-400">{subtitle}</p> : null}
    </header>
  );
}

const skills = [
  {
    category: "Infrastructure",
    items: ["Kubernetes", "K3s", "Terraform", "Docker"],
  },
  {
    category: "GitOps & CI/CD",
    items: ["Argo CD", "GitHub Actions", "Helm", "Kustomize"],
  },
  { category: "Cloud", items: ["OCI", "AWS", "GCP"] },
  { category: "Observability", items: ["Prometheus", "Grafana", "Loki"] },
  { category: "Backend", items: ["NestJS", "Node.js", "Python"] },
  { category: "Frontend", items: ["React", "Next.js", "TypeScript"] },
];

export default async function Home() {
  const [overview, pipelinesEnvelope] = await Promise.all([
    fetchOverview(),
    fetchPipelines(),
  ]);

  const healthyCount = pipelinesEnvelope.pipelines.filter(
    (p) => p.healthStatus === "Healthy"
  ).length;
  const totalPipelines = pipelinesEnvelope.pipelines.length;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-16">
      {/* Hero Section */}
      <section className="space-y-8">
        <div className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.3rem] text-emerald-400">
            DevOps Engineer
          </p>
          <h1 className="text-4xl font-bold leading-tight text-slate-50 sm:text-5xl lg:text-6xl">
            안녕하세요,
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              구성우
            </span>
            입니다.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
            GitOps와 Infrastructure as Code를 통해 안정적이고 확장 가능한
            인프라를 구축합니다. 개인 K3s 클러스터에서 실제 운영 환경을
            실험하고, 모든 과정을 투명하게 공유합니다.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-4">
          <Link
            href="/observatory"
            className="group flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-medium text-slate-950 transition-all hover:bg-emerald-400"
          >
            <span className="text-lg">🐟</span>
            <span>Live Observatory</span>
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
          <a
            href="https://github.com/sungwookoo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-6 py-3 font-medium text-slate-200 transition-all hover:border-slate-600 hover:bg-slate-800"
          >
            GitHub
            <span className="text-slate-400">↗</span>
          </a>
          <a
            href="mailto:sungwookoo.dev@gmail.com"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-6 py-3 font-medium text-slate-200 transition-all hover:border-slate-600 hover:bg-slate-800"
          >
            Contact
          </a>
        </div>
      </section>

      {/* Live Status Banner */}
      {pipelinesEnvelope.configured && totalPipelines > 0 && (
        <section className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/80 to-emerald-950/20 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-2xl">
                🐟
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-100">
                  {healthyCount}/{totalPipelines} Pipelines Healthy
                </p>
                <p className="text-sm text-slate-400">
                  실시간으로 운영 중인 파이프라인 상태
                </p>
              </div>
            </div>
            <Link
              href="/observatory"
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
            >
              View Observatory →
            </Link>
          </div>
        </section>
      )}

      {/* Skills Section */}
      <section>
        <SectionTitle
          title="Skills & Technologies"
          subtitle="인프라 구축과 DevOps에 사용하는 기술 스택"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <div
              key={skill.category}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-400">
                {skill.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {skill.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-md bg-slate-800 px-2.5 py-1 text-sm text-slate-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Infrastructure Section */}
      <section className="grid gap-8 lg:grid-cols-2">
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
                  {overview.infrastructure.cluster.distribution} @{" "}
                  {overview.infrastructure.cluster.location}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-200">GitOps Tooling</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {overview.infrastructure.cluster.gitOpsTooling.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-md bg-slate-800 px-2 py-1"
                    >
                      {tool}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-200">
                  Control Plane Apps
                </dt>
                <dd className="mt-1 grid gap-2 sm:grid-cols-2">
                  {overview.infrastructure.controlPlane.map((app) => (
                    <span
                      key={app}
                      className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1"
                    >
                      {app}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-slate-500">
              인프라 개요를 불러오지 못했습니다.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
          <SectionTitle
            title="GitOps Vision"
            subtitle="swkoo.kr을 위한 파이프라인 로드맵"
          />
          {overview ? (
            <div className="space-y-4 text-sm text-slate-300">
              <p className="text-slate-400">
                {overview.gitopsVision.description}
              </p>
              <ol className="space-y-3 text-slate-200">
                {overview.gitopsVision.roadmap.map((item, index) => (
                  <li
                    key={item}
                    className="flex gap-3 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              GitOps 로드맵 데이터를 준비하는 중입니다.
            </p>
          )}
        </div>
      </section>

      {/* Featured Project - Observatory */}
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/40 p-8">
        <SectionTitle
          title="Featured: Pipeline Observatory"
          subtitle="어항처럼 투명하게 — 모든 파이프라인을 실시간으로 관찰"
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-slate-300">
              OCI 인스턴스에서 실행 중인 모든 애플리케이션의 상태를 어항처럼
              투명하게 모니터링할 수 있는 대시보드입니다.
            </p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                Commit → Build → Push → Sync → Deploy 전체 파이프라인 추적
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                GitHub Actions 워크플로 상태 실시간 연동
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                Argo CD Application 동기화 및 헬스 상태 모니터링
              </li>
              <li className="flex items-center gap-2">
                <span className="text-slate-500">○</span>
                <span className="text-slate-500">
                  Phase 3: 실시간 이벤트 스트리밍 (예정)
                </span>
              </li>
            </ul>
            <Link
              href="/observatory"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
            >
              <span className="text-lg">🐟</span>
              Observatory 보러가기 →
            </Link>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-medium text-slate-300">Live Status</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-400">
                  Online
                </span>
              </div>
              {pipelinesEnvelope.pipelines.slice(0, 3).map((pipeline) => (
                <div
                  key={pipeline.name}
                  className="flex items-center justify-between"
                >
                  <span className="text-slate-400">{pipeline.name}</span>
                  <div className="flex gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 ${
                        pipeline.syncStatus === "Synced"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {pipeline.syncStatus}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 ${
                        pipeline.healthStatus === "Healthy"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {pipeline.healthStatus}
                    </span>
                  </div>
                </div>
              ))}
              {pipelinesEnvelope.pipelines.length === 0 && (
                <p className="text-center text-slate-500">No pipelines yet</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="text-center">
        <SectionTitle
          title="Let's Connect"
          subtitle="협업이나 질문이 있으시면 언제든 연락주세요"
        />
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="mailto:sungwookoo.dev@gmail.com"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-6 py-3 font-medium text-slate-200 transition-all hover:border-emerald-500/50 hover:bg-slate-800"
          >
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            sungwookoo.dev@gmail.com
          </a>
          <a
            href="https://www.linkedin.com/in/sungwookoo/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-6 py-3 font-medium text-slate-200 transition-all hover:border-emerald-500/50 hover:bg-slate-800"
          >
            <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </a>
          <a
            href="https://github.com/sungwookoo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-6 py-3 font-medium text-slate-200 transition-all hover:border-emerald-500/50 hover:bg-slate-800"
          >
            <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            GitHub
          </a>
        </div>
      </section>
    </main>
  );
}
