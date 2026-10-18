import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getInstance(id: string) {
  return prisma.workflowInstance.findUnique({
    where: { id },
    include: {
      workflowTemplate: { select: { name: true, id: true, nodes: { orderBy: { position: "asc" } } } },
      taskInstances: {
        orderBy: { createdAt: "asc" },
        include: { workflowNode: { select: { name: true, type: true } } },
      },
    },
  });
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  IN_PROGRESS: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  COMPLETED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  REJECTED: "bg-rose-500/15 text-rose-300 border-rose-500/25",
  ERROR: "bg-red-500/15 text-red-300 border-red-500/25",
  CANCELLED: "bg-gray-500/15 text-gray-300 border-gray-500/25",
};

export default async function InstancePage({ params }: PageProps<"/instances/[id]">) {
  const { id } = await params;
  const instance = await getInstance(id);
  if (!instance) notFound();

  const ctx = instance.contextData ? JSON.parse(instance.contextData) : {};

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/40">
        <Link href="/workflows" className="hover:text-white/70 transition-colors">Workflows</Link>
        <span>/</span>
        <Link href={`/workflows/${instance.workflowTemplate.id}`} className="hover:text-white/70 transition-colors">
          {instance.workflowTemplate.name}
        </Link>
        <span>/</span>
        <span className="text-white/60">{instance.title}</span>
      </div>

      {/* Instance Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{instance.title}</h1>
            <p className="text-sm text-white/50 mt-1">{instance.workflowTemplate.name}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-white/30">
              <span>Started by {instance.initiatedBy || "Unknown"}</span>
              <span>·</span>
              <span>{new Date(instance.startedAt).toLocaleString()}</span>
              {instance.completedAt && (
                <>
                  <span>·</span>
                  <span>Completed {new Date(instance.completedAt).toLocaleString()}</span>
                </>
              )}
            </div>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full border font-medium flex-shrink-0 ${STATUS_COLOR[instance.status]}`}>
            {instance.status}
          </span>
        </div>
      </div>

      {/* Task History Timeline */}
      <div className="glass-card p-6">
        <h2 className="font-semibold mb-5">Task History</h2>
        {instance.taskInstances.length === 0 ? (
          <p className="text-white/30 text-sm">No tasks have been executed yet.</p>
        ) : (
          <div className="space-y-0">
            {instance.taskInstances.map((t, i) => (
              <div key={t.id} className="flex gap-4">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 border ${
                    t.status === "COMPLETED" ? "bg-emerald-500/20 border-emerald-500/40" :
                    t.status === "REJECTED" ? "bg-rose-500/20 border-rose-500/40" :
                    t.status === "PENDING" ? "bg-amber-500/20 border-amber-500/40" :
                    "bg-white/5 border-white/10"
                  }`}>
                    {t.status === "COMPLETED" ? "✓" : t.status === "REJECTED" ? "✗" : t.status === "PENDING" ? "⋯" : "?"}
                  </div>
                  {i < instance.taskInstances.length - 1 && (
                    <div className="w-0.5 h-6 bg-white/10 mt-1" />
                  )}
                </div>
                <div className="pb-6 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{t.workflowNode.name}</span>
                    <span className="text-xs text-white/30 flex-shrink-0">
                      {t.completedAt ? new Date(t.completedAt).toLocaleDateString() : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLOR[t.status]}`}>{t.status}</span>
                    {t.decision && <span className="text-xs text-white/40 capitalize">· {t.decision}</span>}
                  </div>
                  {t.status === "PENDING" && (
                    <Link href={`/tasks/${t.id}`} className="mt-2 inline-block text-xs text-violet-400 hover:text-violet-300 transition-colors">
                      Open task →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Data */}
      {Object.keys(ctx).length > 0 && (
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-3 text-sm">Collected Data</h2>
          <div className="space-y-2">
            {Object.entries(ctx).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 text-sm">
                <span className="font-mono text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded">{k}</span>
                <span className="text-white/60">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
