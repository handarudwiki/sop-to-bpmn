"use client";

import { useActionState, useState } from "react";
import { startWorkflowInstance } from "@/app/actions";

const initial = { instanceId: "", error: "" };

export function StartInstanceButton({ templateId }: { templateId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(startWorkflowInstance, initial);

  if (state.instanceId) {
    return (
      <a href={`/instances/${state.instanceId}`} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors">
        ✅ View Instance →
      </a>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all hover:scale-105"
      >
        ▶ Start New Instance
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="glass-card p-6 w-full max-w-md mx-4 space-y-4">
            <h2 className="text-lg font-semibold">Start Workflow Instance</h2>
            <form action={action} className="space-y-4">
              <input type="hidden" name="templateId" value={templateId} />
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Request Title</label>
                <input name="title" placeholder="e.g. Annual Leave - John Doe" className="form-input" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Initiated By</label>
                <input name="initiatedBy" placeholder="Your name" className="form-input" />
              </div>
              {state.error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">{state.error}</div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors">
                  {pending ? "Starting..." : "Start"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
