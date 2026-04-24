import clsx from "clsx";
import type { Alert, AlertSeverity, PipelineSummary, WorkflowsEnvelope } from "@/lib/types";
import { alerts as alertsContent } from "@/content/observatory";
import { PipelineTimeline } from "./PipelineTimeline";
import { WorkflowRunList } from "./WorkflowRunList";

interface PipelineCardProps {
  pipeline: PipelineSummary;
  workflowsEnvelope: WorkflowsEnvelope;
  relatedAlerts?: Alert[];
}

function alertBadgeClass(topSeverity: AlertSeverity): string {
  switch (topSeverity) {
    case "critical":
      return "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30";
    case "warning":
      return "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30";
    case "info":
      return "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30";
    default:
      return "bg-slate-600/20 text-slate-300 ring-1 ring-slate-600/30";
  }
}

function highestSeverity(alerts: Alert[]): AlertSeverity {
  const order: AlertSeverity[] = ["critical", "warning", "info", "unknown"];
  for (const sev of order) {
    if (alerts.some((a) => a.severity === sev)) return sev;
  }
  return "unknown";
}

function resolveBadgeClass(status: string, type: "sync" | "health"): string {
  const normalized = status.toLowerCase();

  if (type === "sync") {
    if (normalized === "synced") return "bg-emerald-400/90 text-emerald-950";
    if (normalized === "outofsync") return "bg-amber-400/90 text-amber-950";
    if (normalized === "unknown") return "bg-slate-500/80 text-slate-900";
    return "bg-sky-400/90 text-sky-950";
  }

  if (normalized === "healthy") return "bg-emerald-400/90 text-emerald-950";
  if (normalized === "degraded") return "bg-amber-400/90 text-amber-950";
  if (normalized === "progressing") return "bg-sky-400/90 text-sky-950";
  if (normalized === "missing") return "bg-rose-400/90 text-rose-950";
  return "bg-slate-500/80 text-slate-900";
}

function formatTimestamp(timestamp: string | null | undefined) {
  if (!timestamp) return null;

  try {
    return new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(timestamp));
  } catch {
    return timestamp;
  }
}

export function PipelineCard({
  pipeline,
  workflowsEnvelope,
  relatedAlerts = [],
}: PipelineCardProps) {
  const latestRun = workflowsEnvelope.runs[0] ?? null;
  const alertCount = relatedAlerts.length;
  const topSeverity = alertCount > 0 ? highestSeverity(relatedAlerts) : "unknown";

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-inner shadow-slate-900/40">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">
            {pipeline.name}
          </h3>
          <p className="text-xs uppercase tracking-widest text-slate-500">
            {pipeline.project}
            {pipeline.namespace ? ` · ${pipeline.namespace}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span
            className={clsx(
              "rounded-full px-3 py-1 font-medium uppercase tracking-wide",
              resolveBadgeClass(pipeline.syncStatus, "sync")
            )}
          >
            {pipeline.syncStatus}
          </span>
          <span
            className={clsx(
              "rounded-full px-3 py-1 font-medium uppercase tracking-wide",
              resolveBadgeClass(pipeline.healthStatus, "health")
            )}
          >
            {pipeline.healthStatus}
          </span>
          {alertCount > 0 && (
            <span
              className={clsx(
                "rounded-full px-3 py-1 font-medium uppercase tracking-wide",
                alertBadgeClass(topSeverity)
              )}
              title={relatedAlerts.map((a) => a.alertname).join(", ")}
            >
              ⚠ {alertCount} {alertsContent.pipelineCardBadge}
            </span>
          )}
        </div>
      </header>

      {/* Timeline */}
      <div className="mb-6">
        <PipelineTimeline pipeline={pipeline} latestRun={latestRun} />
      </div>

      {/* Workflow Runs */}
      {workflowsEnvelope.configured && (
        <div className="mb-6">
          <WorkflowRunList
            runs={workflowsEnvelope.runs}
            workflows={workflowsEnvelope.workflows}
          />
        </div>
      )}

      {/* Pipeline Details */}
      <dl className="grid gap-3 text-xs text-slate-400 sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-300">Revision</dt>
          <dd className="mt-1 font-mono text-[11px] text-slate-400">
            {pipeline.revision ?? "N/A"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-300">Target</dt>
          <dd className="mt-1 text-slate-400">
            {pipeline.targetRevision ?? "HEAD"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-300">Last Synced</dt>
          <dd className="mt-1 text-slate-400">
            {formatTimestamp(pipeline.lastSyncedAt) ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-300">Last Deployed</dt>
          <dd className="mt-1 text-slate-400">
            {formatTimestamp(pipeline.lastDeployedAt) ?? "—"}
          </dd>
        </div>
      </dl>

      {pipeline.repoUrl && (
        <p className="mt-4 text-xs text-slate-500">
          Repo:{" "}
          <a
            href={pipeline.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-slate-300 hover:text-slate-100"
          >
            {pipeline.repoUrl}
          </a>
        </p>
      )}
    </article>
  );
}
