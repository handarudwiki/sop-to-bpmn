"use client";

import { useActionState, useState, useEffect } from "react";
import { generateBpmnFromSop, deployBpmnXml } from "@/app/actions";

const SOP_EXAMPLES = [
  `1. Employee submits leave request with dates and reason
2. Manager reviews and approves the leave request
3. HR verifies remaining leave balance and verifies eligibility
4. HR updates the leave calendar and notifies payroll
5. Notification sent to employee with confirmation`,

  `Step 1: Customer submits complaint via online form
Step 2: Support team reviews and classifies the complaint
Step 3: Technical team investigates the issue
Step 4: Manager approves resolution proposal
Step 5: Resolution implemented and customer notified
Step 6: Customer confirms issue resolved and closes ticket`,
];

const initialGenState = { xml: "", error: "" };
const initialDeployState = { templateId: "", error: "" };

export default function GeneratorPage() {
  const [zoom, setZoom] = useState(1); // Zoom factor for the small preview
  const [fsZoom, setFsZoom] = useState(1.8); // Zoom factor for the fullscreen view
  const [isFullScreen, setIsFullScreen] = useState(false); // Fullscreen toggle

  function openFullScreen() {
    setFsZoom(1.8); // start large every time fullscreen opens
    setIsFullScreen(true);
  }
  const [genState, genAction, genPending] = useActionState(generateBpmnFromSop, initialGenState);
  const [deployState, deployAction, deployPending] = useActionState(deployBpmnXml, initialDeployState);
  const [sopText, setSopText] = useState("");
  const [processName, setProcessName] = useState("");
  const [activeTab, setActiveTab] = useState<"sop" | "xml">("sop");

  // Close fullscreen with the Escape key
  useEffect(() => {
    if (!isFullScreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullScreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullScreen]);

  function loadExample(idx: number) {
    setSopText(SOP_EXAMPLES[idx]);
    setProcessName(idx === 0 ? "Employee Leave Request" : "Customer Complaint Resolution");
  }

  // Derived: parse step count from XML for display
  const taskCount = genState.xml ? (genState.xml.match(/<userTask/g) || []).length : 0;
  const gatewayCount = genState.xml ? (genState.xml.match(/<exclusiveGateway/g) || []).length : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-violet-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
          AI-Powered Conversion
        </div>
        <h1 className="text-3xl font-bold">SOP to Executable BPMN</h1>
        <p className="mt-2 text-white/50">
          Paste your Standard Operating Procedure and we&apos;ll convert it to a deployable BPMN 2.0 workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: SOP Input */}
        <div className="space-y-4">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">SOP Input</h2>
              <div className="flex gap-2">
                <button onClick={() => loadExample(0)} className="rounded-md bg-white/5 px-3 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                  Example 1
                </button>
                <button onClick={() => loadExample(1)} className="rounded-md bg-white/5 px-3 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                  Example 2
                </button>
              </div>
            </div>

            <form action={genAction} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Process Name</label>
                <input
                  name="processName"
                  value={processName}
                  onChange={e => setProcessName(e.target.value)}
                  placeholder="e.g. Employee Leave Approval"
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">SOP Text</label>
                <textarea
                  name="sopText"
                  value={sopText}
                  onChange={e => setSopText(e.target.value)}
                  rows={12}
                  placeholder={`Paste your SOP here...\n\n1. First step of the process\n2. Second step\n3. Manager approves the request\n...`}
                  className="form-input resize-none font-mono text-xs leading-relaxed"
                />
              </div>
              {genState.error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
                  {genState.error}
                </div>
              )}
              <button
                type="submit"
                disabled={genPending || !sopText.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {genPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating BPMN...
                  </span>
                ) : "Generate BPMN 2.0 →"}
              </button>
            </form>
          </div>
        </div>

        {/* Right: BPMN Output + Deploy */}
        <div className="space-y-4">
          {/* BPMN Preview Tabs */}
          <div className="glass-card overflow-hidden">
            <div className="flex border-b border-white/5">
              <button
                onClick={() => setActiveTab("sop")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "sop" ? "bg-violet-500/10 text-violet-300 border-b-2 border-violet-500" : "text-white/40 hover:text-white/70"}`}
              >
                BPMN Diagram
              </button>
              <button
                onClick={() => setActiveTab("xml")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "xml" ? "bg-violet-500/10 text-violet-300 border-b-2 border-violet-500" : "text-white/40 hover:text-white/70"}`}
              >
                XML Source
              </button>
            </div>

            <div className="p-4 min-h-[320px]">
              {!genState.xml ? (
  <div className="flex flex-col items-center justify-center h-64 text-white/20">
    <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
    </svg>
    <p className="text-sm">Generate BPMN from your SOP to see the diagram</p>
  </div>
) : activeTab === "sop" ? (
  <div className="relative">
    <button type="button" onClick={openFullScreen} className="absolute top-2 left-2 z-10 rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20">Full screen</button>
    <div className="absolute top-2 right-2 flex gap-2 z-10">
      <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20">+</button>
      <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.4))} className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20">−</button>
    </div>
    <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }} className="overflow-auto">
      <BpmnDiagram xml={genState.xml} />
    </div>
  </div>
) : (
  <div className="relative">
    <button onClick={async () => {
      try {
        await navigator.clipboard.writeText(genState.xml);
        alert('XML copied to clipboard');
      } catch (e) {
        console.error(e);
        alert('Failed to copy XML');
      }
    }} className="absolute top-2 right-2 rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20">Copy XML</button>
    <pre className="text-xs text-green-300/80 font-mono overflow-auto max-h-72 leading-relaxed whitespace-pre-wrap p-4">{genState.xml}</pre>
  </div>
)}
            </div>

            {/* Stats bar */}
            {genState.xml && (
              <div className="border-t border-white/5 bg-white/2 px-4 py-2.5 flex gap-6 text-xs text-white/40">
                <span><span className="text-violet-400 font-semibold">{taskCount}</span> User Tasks</span>
                <span><span className="text-indigo-400 font-semibold">{gatewayCount}</span> Gateways</span>
                <span><span className="text-sky-400 font-semibold">{genState.xml.match(/<sequenceFlow/g)?.length || 0}</span> Flows</span>
              </div>
            )}
          </div>

          {/* Deploy Card */}
          {genState.xml && (
            <div className="glass-card p-6 border-violet-500/20">
              <h3 className="font-semibold mb-1">🚀 Deploy as Executable App</h3>
              <p className="text-xs text-white/50 mb-4">
                This will parse the BPMN XML, create User Task forms, gateway routing logic, and make the workflow ready to run instantly.
              </p>
              <form action={deployAction} className="space-y-3">
                <input type="hidden" name="bpmnXml" value={genState.xml} />
                <input
                  name="name"
                  defaultValue={processName}
                  placeholder="Workflow name"
                  className="form-input"
                />
                <input
                  name="description"
                  placeholder="Short description (optional)"
                  className="form-input"
                />
                {deployState.error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
                    {deployState.error}
                  </div>
                )}
                {deployState.templateId && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-300">
                    ✅ Workflow deployed! <a href={`/workflows/${deployState.templateId}`} className="underline font-medium">View workflow →</a>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={deployPending}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 disabled:opacity-50"
                >
                  {deployPending ? "Deploying..." : "⚡ Deploy Workflow App"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen BPMN overlay */}
      {isFullScreen && genState.xml && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-medium text-white/80">BPMN Diagram — Fullscreen</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFsZoom(z => Math.max(z - 0.2, 0.6))}
                className="rounded bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
                aria-label="Zoom out"
              >−</button>
              <span className="text-xs text-white/50 w-12 text-center">{Math.round(fsZoom * 100)}%</span>
              <button
                onClick={() => setFsZoom(z => Math.min(z + 0.2, 4))}
                className="rounded bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
                aria-label="Zoom in"
              >+</button>
              <button
                onClick={() => setFsZoom(1.8)}
                className="rounded bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
              >Reset</button>
              <button
                onClick={() => setIsFullScreen(false)}
                className="ml-2 rounded bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
              >Close ✕</button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8">
            <div className="flex justify-center">
              <div style={{ transform: `scale(${fsZoom})`, transformOrigin: "top center" }}>
                <BpmnDiagram xml={genState.xml} fullHeight />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Simplified BPMN Diagram Renderer (pure CSS/SVG, no external library)
// ---------------------------------------------------------------------------
function BpmnDiagram({ xml, fullHeight = false }: { xml: string; fullHeight?: boolean }) {
  // scaling handled by parent container
  const tasks = [...xml.matchAll(/<userTask[^>]*name="([^"]+)"/g)].map(m => m[1]);
  const gateways = [...xml.matchAll(/<exclusiveGateway[^>]*name="([^"]+)"/g)].map(m => m[1]);

  const elements: Array<{ type: "start" | "task" | "gateway" | "end"; label: string }> = [
    { type: "start", label: "Start" },
    ...tasks.flatMap((t, i) => {
      const items: Array<{ type: "start" | "task" | "gateway" | "end"; label: string }> = [
        { type: "task", label: t }
      ];
      if (gateways[i]) items.push({ type: "gateway", label: gateways[i] });
      return items;
    }),
    { type: "end", label: "End" },
  ];

  return (
    <div className={`flex flex-col items-center gap-0 py-2 ${fullHeight ? "" : "overflow-y-auto max-h-72"}`}>
      {elements.map((el, i) => (
        <div key={i} className="flex flex-col items-center">
          {i > 0 && <div className="w-0.5 h-4 bg-white/20" />}
          <div className={`bpmn-node text-xs font-medium text-center px-3 py-2 rounded-lg border max-w-[240px] ${
            el.type === "start" ? "rounded-full px-5 bg-emerald-500/20 border-emerald-500/40 text-emerald-300 text-xs" :
            el.type === "end" ? "rounded-full px-5 bg-rose-500/20 border-rose-500/40 text-rose-300 text-xs" :
            el.type === "gateway" ? "rotate-0 bg-amber-500/15 border-amber-500/40 text-amber-300" :
            "bg-violet-500/15 border-violet-500/40 text-white/90 w-52"
          }`}>
            {el.type === "gateway" && <span className="mr-1">◇</span>}
            {el.label}
          </div>
        </div>
      ))}
    </div>
  );
}
