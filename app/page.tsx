import Link from "next/link";
import { prisma } from "@/lib/prisma";

// Server Component — fetches live stats from DB
async function getStats() {
  try {
    const [templates, instances, pendingTasks] = await Promise.all([
      prisma.workflowTemplate.count({ where: { isDeployed: true } }),
      prisma.workflowInstance.count(),
      prisma.taskInstance.count({ where: { status: "PENDING" } }),
    ]);
    return { templates, instances, pendingTasks };
  } catch {
    return { templates: 0, instances: 0, pendingTasks: 0 };
  }
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative pt-12 text-center">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
            <span className="pulse-dot h-2 w-2 rounded-full bg-violet-400" />
            BPMN 2.0 Workflow Automation
          </div>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight lg:text-6xl">
            Turn SOPs into{" "}
            <span className="gradient-text">Executable Workflows</span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg text-white/60">
            Paste any Standard Operating Procedure, let AI convert it to BPMN 2.0,
            and instantly deploy a fully functional workflow app — no coding required.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/generator"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-105"
            >
              Start from SOP
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/workflows"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white/80 transition-all hover:bg-white/10"
            >
              View Workflows
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Deployed Workflows", value: stats.templates, icon: "⚡", color: "violet" },
          { label: "Workflow Instances", value: stats.instances, icon: "🔄", color: "indigo" },
          { label: "Pending Tasks", value: stats.pendingTasks, icon: "📋", color: "sky" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-6 glow-violet">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-3xl font-bold text-white">{s.value}</div>
            <div className="text-sm text-white/50 mt-1">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Feature Cards */}
      <section>
        <h2 className="mb-6 text-2xl font-bold">How It Works</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Paste Your SOP",
              desc: "Write or paste any Standard Operating Procedure. Our engine parses numbered steps and detects approval gates automatically.",
              color: "from-violet-600 to-purple-600",
            },
            {
              step: "02",
              title: "AI Generates BPMN",
              desc: "The system converts your SOP into a compliant BPMN 2.0 XML — complete with User Tasks, Gateways, and Sequence Flows.",
              color: "from-indigo-600 to-blue-600",
            },
            {
              step: "03",
              title: "Deploy & Execute",
              desc: "Click Deploy. The engine parses the XML, creates dynamic forms, routing logic, and your workflow is live instantly.",
              color: "from-sky-600 to-cyan-600",
            },
          ].map((f) => (
            <div key={f.step} className="glass-card p-6 transition-transform hover:-translate-y-1">
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${f.color} text-sm font-bold text-white`}>
                {f.step}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
              <p className="text-sm text-white/55 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Ready to start?</h2>
            <p className="text-sm text-white/50 mt-1">Check your task inbox or create a new workflow.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/inbox" className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors">
              Open Inbox ({stats.pendingTasks})
            </Link>
            <Link href="/generator" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500 transition-colors">
              New Workflow
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
