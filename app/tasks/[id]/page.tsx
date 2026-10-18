import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DynamicTaskForm } from "@/components/DynamicTaskForm";
import Link from "next/link";

async function getTask(id: string) {
  return prisma.taskInstance.findUnique({
    where: { id },
    include: {
      workflowNode: {
        include: {
          formSchema: { include: { fields: { orderBy: { position: "asc" } } } },
          outgoingFlows: { include: { targetNode: true } },
        },
      },
      workflowInstance: {
        include: {
          workflowTemplate: { select: { name: true, id: true } },
          taskInstances: {
            orderBy: { createdAt: "asc" },
            include: { workflowNode: { select: { name: true, type: true } } },
          },
        },
      },
    },
  });
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  COMPLETED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  REJECTED: "bg-rose-500/15 text-rose-300 border-rose-500/25",
  IN_PROGRESS: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  ERROR: "bg-red-500/15 text-red-300 border-red-500/25",
  CANCELLED: "bg-gray-500/15 text-gray-300 border-gray-500/25",
};

export default async function TaskPage({ params }: PageProps<"/tasks/[id]">) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

  const taskHistory = task.workflowInstance.taskInstances;
  const isCompleted = task.status !== "PENDING";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/40">
        <Link href="/inbox" className="hover:text-white/70 transition-colors">Inbox</Link>
        <span>/</span>
        <Link href={`/workflows/${task.workflowInstance.workflowTemplate.id}`} className="hover:text-white/70 transition-colors">
          {task.workflowInstance.workflowTemplate.name}
        </Link>
        <span>/</span>
        <span className="text-white/60">{task.workflowNode.name}</span>
      </div>

      {/* Task Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-1">{task.workflowNode.name}</h1>
            <p className="text-sm text-white/50">{task.workflowInstance.title}</p>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full border font-medium flex-shrink-0 ${STATUS_BADGE[task.status]}`}>
            {task.status}
          </span>
        </div>

        {/* Progress bar showing task position in instance */}
        {taskHistory.length > 1 && (
          <div className="mt-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {taskHistory.map((t, i) => (
                <div key={t.id} className="flex items-center gap-1.5 flex-shrink-0">
                  {i > 0 && <div className="w-4 h-0.5 bg-white/15" />}
                  <div className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    t.id === task.id ? "bg-violet-500/20 border-violet-500/40 text-violet-300" :
                    t.status === "COMPLETED" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" :
                    t.status === "REJECTED" ? "bg-rose-500/15 border-rose-500/30 text-rose-300" :
                    "bg-white/5 border-white/10 text-white/30"
                  }`}>
                    {t.workflowNode.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Form or Completion View */}
      {isCompleted ? (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xl ${task.status === "COMPLETED" ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>
              {task.status === "COMPLETED" ? "✅" : "❌"}
            </div>
            <div>
              <h2 className="font-semibold">Task {task.status === "COMPLETED" ? "Completed" : "Rejected"}</h2>
              <p className="text-sm text-white/50">
                {task.completedAt ? new Date(task.completedAt).toLocaleString() : ""}
              </p>
            </div>
          </div>
          {task.decision && (
            <div className="rounded-lg bg-white/3 border border-white/5 p-4">
              <div className="text-xs text-white/40 mb-1">Decision</div>
              <div className="text-sm font-medium capitalize">{task.decision}</div>
            </div>
          )}
          {task.comments && (
            <div className="rounded-lg bg-white/3 border border-white/5 p-4">
              <div className="text-xs text-white/40 mb-1">Comments</div>
              <div className="text-sm text-white/70 whitespace-pre-wrap">{task.comments}</div>
            </div>
          )}
          {task.formData && (
            <div className="rounded-lg bg-white/3 border border-white/5 p-4">
              <div className="text-xs text-white/40 mb-2">Submitted Data</div>
              <pre className="text-xs text-white/60 font-mono whitespace-pre-wrap">
                {JSON.stringify(JSON.parse(task.formData), null, 2)}
              </pre>
            </div>
          )}
          <Link href="/inbox" className="block text-center rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors">
            ← Back to Inbox
          </Link>
        </div>
      ) : (
        <DynamicTaskForm task={task} />
      )}
    </div>
  );
}
