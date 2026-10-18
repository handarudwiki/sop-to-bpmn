import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NodeType } from "@prisma/client";
import { StartInstanceButton } from "@/components/StartInstanceButton";
import { deleteWorkflowTemplate } from "@/app/actions";

async function getTemplate(id: string) {
  return prisma.workflowTemplate.findUnique({
    where: { id },
    include: {
      nodes: {
        orderBy: { position: "asc" },
        include: { formSchema: { include: { fields: { orderBy: { position: "asc" } } } } },
      },
      sequenceFlows: { include: { sourceNode: true, targetNode: true } },
      instances: {
        orderBy: { startedAt: "desc" },
        take: 10,
        include: { _count: { select: { taskInstances: true } } },
      },
    },
  });
}

const NODE_COLORS: Record<string, string> = {
  START_EVENT: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
  END_EVENT: "bg-rose-500/15 border-rose-500/40 text-rose-300",
  USER_TASK: "bg-violet-500/15 border-violet-500/40 text-white",
  EXCLUSIVE_GATEWAY: "bg-amber-500/15 border-amber-500/40 text-amber-300",
  PARALLEL_GATEWAY: "bg-sky-500/15 border-sky-500/40 text-sky-300",
  SERVICE_TASK: "bg-indigo-500/15 border-indigo-500/40 text-indigo-300",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-white/5 text-white/50 border-white/10",
  IN_PROGRESS: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  COMPLETED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  REJECTED: "bg-rose-500/15 text-rose-300 border-rose-500/25",
  ERROR: "bg-red-500/15 text-red-300 border-red-500/25",
  CANCELLED: "bg-gray-500/15 text-gray-300 border-gray-500/25",
};

export default async function WorkflowDetailPage({ params }: PageProps<"/workflows/[id]">) {
  const { id } = await params;
  const template = await getTemplate(id);
  if (!template) notFound();

  const userTasks = template.nodes.filter(n => n.type === NodeType.USER_TASK);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/workflows" className="text-sm text-white/40 hover:text-white/70 transition-colors">Workflows</Link>
            <span className="text-white/20">/</span>
            <span className="text-sm text-white/60">{template.name}</span>
          </div>
          <h1 className="text-2xl font-bold">{template.name}</h1>
          {template.description && <p className="mt-1 text-white/50 text-sm">{template.description}</p>}
          <div className="mt-2 flex items-center gap-3 text-xs text-white/30">
            <span>Created {new Date(template.createdAt).toLocaleDateString()}</span>
            <span>·</span>
            <span>{template.nodes.length} nodes</span>
            <span>·</span>
            <span>{template.instances.length} instances</span>
          </div>
        </div>
        <div className="flex gap-3">
          <StartInstanceButton templateId={template.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Process Flow */}
        <div className="lg:col-span-2 space-y-6">
          {/* BPMN Flow Visual */}
          <div className="glass-card p-6">
            <h2 className="font-semibold mb-5">Process Flow</h2>
            <div className="flex flex-col items-start gap-0">
              {template.nodes.map((node, idx) => {
                const color = NODE_COLORS[node.type] || "bg-white/5 border-white/10 text-white";
                const outFlows = template.sequenceFlows.filter(f => f.sourceNode.id === node.id);
                return (
                  <div key={node.id} className="flex flex-col items-start w-full">
                    {idx > 0 && (
                      <div className="ml-6 flex items-center gap-2 my-1">
                        <div className="w-0.5 h-5 bg-white/15" />
                        {outFlows[0]?.name && (
                          <span className="text-xs text-white/30 italic">{outFlows[0].name}</span>
                        )}
                      </div>
                    )}
                    <div className={`bpmn-node border rounded-xl px-4 py-3 ${color} w-full max-w-md flex items-center gap-3`}>
                      <span className="text-lg flex-shrink-0">
                        {node.type === "START_EVENT" ? "🟢" :
                         node.type === "END_EVENT" ? "🔴" :
                         node.type === "USER_TASK" ? "📋" :
                         node.type === "EXCLUSIVE_GATEWAY" ? "◇" :
                         node.type === "PARALLEL_GATEWAY" ? "⊕" : "⚙️"}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{node.name}</div>
                        <div className="text-xs opacity-50 mt-0.5">{node.type.replace(/_/g, " ")}</div>
                      </div>
                      {node.formSchema && (
                        <span className="ml-auto flex-shrink-0 text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30">
                          {node.formSchema.fields.length} fields
                        </span>
                      )}
                    </div>
                    {/* Show gateway branches */}
                    {(node.type === "EXCLUSIVE_GATEWAY" || node.type === "PARALLEL_GATEWAY") && outFlows.length > 1 && (
                      <div className="ml-6 mt-1 flex flex-wrap gap-2">
                        {outFlows.map(f => (
                          <span key={f.id} className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                            → {f.name || f.targetNode.name}
                            {f.conditionValue && <span className="opacity-70 ml-1">({f.conditionValue})</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Auto-generated Forms */}
          {userTasks.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="font-semibold mb-4">Auto-Generated Task Forms</h2>
              <div className="space-y-4">
                {userTasks.map(task => (
                  <div key={task.id} className="rounded-xl border border-white/5 bg-white/2 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm">📋</span>
                      <span className="font-medium text-sm">{task.name}</span>
                      {task.formSchema && (
                        <span className="ml-auto text-xs text-white/30">{task.formSchema.fields.length} fields auto-generated</span>
                      )}
                    </div>
                    {task.formSchema?.fields.map(f => (
                      <div key={f.id} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0 text-xs">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                          f.type === "APPROVAL" ? "bg-amber-500/15 text-amber-300" :
                          f.type === "FILE" ? "bg-sky-500/15 text-sky-300" :
                          "bg-white/5 text-white/50"
                        }`}>{f.type}</span>
                        <span className="text-white/70">{f.label}</span>
                        <span className="font-mono text-white/30">({f.fieldKey})</span>
                        {f.isRequired && <span className="ml-auto text-rose-400">required</span>}
                      </div>
                    ))}
                    {!task.formSchema && (
                      <p className="text-xs text-white/30 italic">No form schema generated</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Instances + Actions */}
        <div className="space-y-6">
          {/* Recent Instances */}
          <div className="glass-card p-5">
            <h2 className="font-semibold mb-4">Recent Instances</h2>
            {template.instances.length === 0 ? (
              <div className="text-center py-8 text-white/25 text-sm">
                <div className="text-3xl mb-2">📭</div>
                No instances yet
              </div>
            ) : (
              <div className="space-y-2">
                {template.instances.map(inst => (
                  <Link key={inst.id} href={`/instances/${inst.id}`} className="block rounded-lg border border-white/5 bg-white/2 p-3 hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate text-white/80">{inst.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_BADGE[inst.status]}`}>
                        {inst.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-white/30">
                      <span>{inst.initiatedBy}</span>
                      <span>·</span>
                      <span>{new Date(inst.startedAt).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* XML Preview */}
          <div className="glass-card p-5">
            <h2 className="font-semibold mb-3 text-sm">BPMN XML</h2>
            <pre className="text-xs text-green-300/60 font-mono overflow-auto max-h-48 leading-relaxed whitespace-pre-wrap break-all">
              {template.bpmnXml.slice(0, 800)}...
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
