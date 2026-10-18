import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { InstanceStatus } from "@prisma/client";

async function getPendingTasks() {
  try {
    return await prisma.taskInstance.findMany({
      where: { status: InstanceStatus.PENDING },
      orderBy: { createdAt: "asc" },
      include: {
        workflowNode: { include: { formSchema: { include: { fields: { orderBy: { position: "asc" } } } } } },
        workflowInstance: { include: { workflowTemplate: { select: { name: true, id: true } } } },
      },
    });
  } catch { return []; }
}

async function getRecentCompleted() {
  try {
    return await prisma.taskInstance.findMany({
      where: { status: { in: [InstanceStatus.COMPLETED, InstanceStatus.REJECTED] } },
      orderBy: { completedAt: "desc" },
      take: 5,
      include: {
        workflowNode: { select: { name: true } },
        workflowInstance: { select: { title: true } },
      },
    });
  } catch { return []; }
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  IN_PROGRESS: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  COMPLETED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  REJECTED: "bg-rose-500/15 text-rose-300 border-rose-500/25",
  ERROR: "bg-red-500/15 text-red-300 border-red-500/25",
};

export default async function InboxPage() {
  const [pending, completed] = await Promise.all([getPendingTasks(), getRecentCompleted()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Task Inbox</h1>
        <p className="mt-1 text-white/50">
          {pending.length > 0
            ? `You have ${pending.length} pending task${pending.length > 1 ? "s" : ""} awaiting action.`
            : "No pending tasks. You're all caught up! 🎉"}
        </p>
      </div>

      {/* Pending Tasks */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400 pulse-dot" />
          Pending Tasks ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-white/40">All tasks completed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map(task => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="glass-card p-5 block transition-all hover:-translate-y-0.5 hover:border-violet-500/30 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">📋</span>
                      <span className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                        {task.workflowNode.name}
                      </span>
                    </div>
                    <p className="text-sm text-white/50 truncate">
                      {task.workflowInstance.title} — {task.workflowInstance.workflowTemplate.name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/30">
                      <span>Received {new Date(task.createdAt).toLocaleDateString()}</span>
                      {task.workflowNode.formSchema && (
                        <span className="text-violet-400">· {task.workflowNode.formSchema.fields.length} form fields</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_BADGE.PENDING}`}>Pending</span>
                    <span className="text-xs text-violet-400 group-hover:text-violet-300 transition-colors">Open task →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Activity */}
      {completed.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 text-white/60">Recent Activity</h2>
          <div className="glass-card divide-y divide-white/5">
            {completed.map(task => (
              <div key={task.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm text-white/70">{task.workflowNode.name}</span>
                  <p className="text-xs text-white/35 mt-0.5">{task.workflowInstance.title}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {task.completedAt && (
                    <span className="text-xs text-white/25">{new Date(task.completedAt).toLocaleDateString()}</span>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_BADGE[task.status]}`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
