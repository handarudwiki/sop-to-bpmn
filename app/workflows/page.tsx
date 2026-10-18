import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NodeType } from "@prisma/client";

async function getWorkflows() {
  try {
    return await prisma.workflowTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { instances: true, nodes: true } },
        nodes: { where: { type: NodeType.USER_TASK }, select: { id: true } },
      },
    });
  } catch { return []; }
}

export default async function WorkflowsPage() {
  const workflows = await getWorkflows();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Library</h1>
          <p className="mt-1 text-white/50">All deployed BPMN workflow templates.</p>
        </div>
        <Link
          href="/generator"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 font-semibold text-sm text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all hover:scale-105"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Workflow
        </Link>
      </div>

      {workflows.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="text-5xl mb-4">🗂️</div>
          <h2 className="text-xl font-semibold mb-2">No workflows yet</h2>
          <p className="text-white/40 mb-6">Get started by generating a workflow from an SOP.</p>
          <Link href="/generator" className="inline-flex rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold hover:bg-violet-500 transition-colors">
            Create First Workflow
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {workflows.map((wf) => (
            <Link key={wf.id} href={`/workflows/${wf.id}`} className="glass-card p-6 block transition-all hover:-translate-y-1 hover:border-violet-500/30 group">
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-lg">
                  ⚡
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${wf.isDeployed ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25" : "bg-amber-500/15 text-amber-300 border border-amber-500/25"}`}>
                  {wf.isDeployed ? "Deployed" : "Draft"}
                </span>
              </div>
              <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors line-clamp-1">{wf.name}</h3>
              {wf.description && <p className="mt-1 text-xs text-white/40 line-clamp-2">{wf.description}</p>}
              <div className="mt-4 flex items-center gap-4 text-xs text-white/35">
                <span>{wf.nodes.length} tasks</span>
                <span>·</span>
                <span>{wf._count.instances} instances</span>
                <span>·</span>
                <span>{new Date(wf.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
